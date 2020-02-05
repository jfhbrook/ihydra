/* eslint no-param-reassign: ["error", { "props": false }] */

const fs = require("fs");
const path = require("path");

const commander = require("commander");

const isDev = require("electron-is-dev");
const { quote } = require("shell-quote");
const which = require("which");

const Argv = require("./argv");
const { exec } = require("./process");
const packageJson = require("../../package.json");
const { readFile } = require("./fs");

const root = path.resolve(path.dirname(require.resolve("../../package.json")));

const { Logger, consoleObserver } = require("./logger");

function getMajorVersion(fullVersion) {
  // Cheesing it a little here. This should check if the version
  // matches some regexp or other - but in this codebase "unknown"
  // is used as a sentinel value so it's fine
  if (fullVersion === "unknown") {
    return Infinity;
  }
  return parseInt(fullVersion.split(".")[0], 10);
}

function getVersionTuple(fullVersion) {
  return fullVersion.split(".").map(v => parseInt(v, 10));
}

function cloneConfig(old) {
  return {
    ...old
  };
}

function kernelCommand(parser) {
  let action;
  let protocolVersion;
  let connectionFile;
  let sessionWorkingDir;
  let debug;

  parser
    .command("kernel <connection_file>")
    .option(
      "--protocol <version>",
      "Set the Jupyter protocol version (format: Major[.minor[.patch]]])",
      "5.1"
    )
    .option(
      "--session-working-dir <dir>",
      "The working directory for this kernel session",
      process.cwd()
    )
    .action((f, opts) => {
      action = "kernel";
      protocolVersion = opts.protocol;
      connectionFile = f;
      sessionWorkingDir = opts.sessionWorkingDir;
      debug = opts.debug;
    });

  return config => {
    if (action === "kernel") {
      return {
        ...config,
        action,
        protocolVersion,
        connectionFile,
        sessionWorkingDir,
        debug: isDev || debug
      };
    }
    return config;
  };
}

function launcherCommand(parser) {
  let action;
  let debug;

  // We use a catch-all to direct anything that isn't either
  // the root or "launcher"
  parser.command("*").action((opts, args) => {
    debug = opts.debug;
    action = args[0];
  });

  return config => {
    if (
      (!action && config.action === "default") ||
      config.action === "launcher"
    ) {
      return {
        ...config,
        action: "launcher",
        name: isDev ? "ihydra-dev" : "ihydra",
        displayName: isDev ? "IHydra (development)" : "IHydra",
        localInstall: true,
        debug: isDev || debug
      };
    }

    if (config.action !== "default") {
      return config;
    }

    return { ...config, action };
  };
}

function hydrateConfig(old) {
  const config = {
    ...old,
    parseArgs(argv) {
      let config = cloneConfig(this);
      config.argv = new Argv(argv, this.paths.root);

      const hooks = [];

      const parser = new commander.Command();

      const attachCommand = command => {
        hooks.push(command(parser));
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(launcherCommand);

      const parsed = parser.parse(config.argv.commanderArgv);

      hooks.forEach(hook => (config = hook(config)));

      return config;
    },

    setLogger(logger) {
      const config = cloneConfig(this);

      config.logger = logger;

      return config;
    },

    loadVersionInfo() {
      const config = cloneConfig(this);

      config.versions = Object.assign(config.versions, {
        jmp: require("jmp/package.json").version,
        nel: require("nel/package.json").version,
        uuid: require("uuid/package.json").version,
        zeromq: require("zeromq/package.json").version,
        node: process.versions.node,
        v8: process.versions.v8,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        ihydra: require("../../package.json").version
      });

      return config;
    },

    async searchForJupyter() {
      const config = cloneConfig(this);

      let command = config.jupyterCommand;

      if (!command) {
        command = [await which("jupyter")];
      }

      if (command) {
        config.jupyterCommand = command;
        return config;
      }

      throw new Error("could not find Jupyter");
    },

    async loadJupyterInfo() {
      const config = cloneConfig(this);

      const command = config.jupyterCommand;

      if (!command) {
        throw new Error("don't know how to run Jupyter");
      }

      const { stdout } = await exec(quote(command.concat(["--version"])));

      config.jupyterCommand = command;

      let version;
      let majorVersion;

      // Parse version number before Jupyter 4.5.0
      version = stdout.toString().trim();
      majorVersion = getMajorVersion(version);

      if (Number.isNaN(majorVersion)) {
        // Parse version number after Jupyter 4.5.0
        const match = stdout.match(/^jupyter core\s+: (\d+\.\d+\.\d+)/m);
        if (match) {
          // eslint-disable-next-line prefer-destructuring
          version = match[1];
          majorVersion = getMajorVersion(version);
        } else {
          // Failed to parse the output of "jupyter --version"
          console.warn("Warning: Unable to parse Jupyter version:", stdout);
          version = "unknown";
          majorVersion = Infinity;
        }
      }

      config.versions.jupyter = version;

      return config;
    },

    ensureSupportedJupyterVersion() {
      if (getMajorVersion(this.versions.jupyter) < 3) {
        throw new Error("frontend major version must be >= 3");
      }
    },

    async loadConnectionFile() {
      const config = cloneConfig(this);

      config.connection = JSON.parse(await readFile(config.connectionFile));

      return config;
    },

    async loadKernelInfoReply() {
      let config = cloneConfig(this);

      if (getMajorVersion(config.protocolVersion) <= 4) {
        config.kernelInfoReply = {
          language: "javascript",
          language_version: getVersionTuple(process.versions.node),
          protocol_version: getVersionTuple(protocolVersion)
        };
      } else {
        config = config.loadVersionInfo();

        config.kernelInfoReply = {
          protocol_version: config.protocolVersion,
          implementation: "ihydra",
          implementation_version: config.versions.ihydra,
          language_info: {
            name: "javascript",
            version: config.versions.node,
            mimetype: "application/javascript",
            file_extension: ".js"
          },
          banner: `IHydra v${config.versions.ihydra}
  https://github.com/jfhbrook/ihydra
  `,
          help_links: [
            {
              text: "IHydra Homepage",
              url: "https://github.com/jfhbrook/ihydra"
            }
          ]
        };
      }
      return config;
    },

    async loadConnectionInfo() {
      const config = cloneConfig(this);
      config.connection = JSON.parse(await readFile(this.connectionFile));
      return config;
    }
  };

  if (old.argv) {
    config.argv = new Argv(old.argv.argv, old.argv.root);
  }

  if (old.logger.namespace) {
    config.logger = new Logger(old.logger.namespace);
  }

  return config;
}

function dehydrateConfig(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
}

function createDehydratedConfig() {
  const logger = new Logger("ihydra.lib.config");

  logger.observe("warning", consoleObserver);

  return {
    action: "default",
    paths: {
      root,
      images: path.join(root, "images")
    },
    jupyterCommand: null,
    versions: {},
    logger
  };
}

function createConfig() {
  return hydrateConfig(createDehydratedConfig());
}

module.exports = {
  createConfig,
  createDehydratedConfig,
  hydrateConfig,
  dehydrateConfig,
  cloneConfig
};
