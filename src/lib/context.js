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

function cloneContext(old) {
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

  return context => {
    if (action === "kernel") {
      return {
        ...context,
        action,
        protocolVersion,
        connectionFile,
        sessionWorkingDir,
        debug: isDev || debug
      };
    }
    return context;
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

  return context => {
    if (
      (!action && context.action === "default") ||
      context.action === "launcher"
    ) {
      return {
        ...context,
        action: "launcher",
        name: isDev ? "ihydra-dev" : "ihydra",
        displayName: isDev ? "IHydra (development)" : "IHydra",
        localInstall: true,
        debug: isDev || debug
      };
    }

    if (context.action !== "default") {
      return context;
    }

    return { ...context, action };
  };
}

function hydrateContext(old) {
  const context = {
    ...old,
    parseArgs(argv) {
      let context = cloneContext(this);
      context.argv = new Argv(argv, this.paths.root);

      const hooks = [];

      const parser = new commander.Command();

      const attachCommand = command => {
        hooks.push(command(parser));
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(launcherCommand);

      const parsed = parser.parse(context.argv.commanderArgv);

      hooks.forEach(hook => (context = hook(context)));

      return context;
    },

    setLogger(logger) {
      const context = cloneContext(this);

      context.logger = logger;

      return context;
    },

    loadVersionInfo() {
      const context = cloneContext(this);

      context.versions = Object.assign(context.versions, {
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

      return context;
    },

    async searchForJupyter() {
      const context = cloneContext(this);

      let command = context.jupyterCommand;

      if (!command) {
        command = [await which("jupyter")];
      }

      if (command) {
        context.jupyterCommand = command;
        return context;
      }

      throw new Error("could not find Jupyter");
    },

    async loadJupyterInfo() {
      const context = cloneContext(this);

      const command = context.jupyterCommand;

      if (!command) {
        throw new Error("don't know how to run Jupyter");
      }

      const { stdout } = await exec(quote(command.concat(["--version"])));

      context.jupyterCommand = command;

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

      context.versions.jupyter = version;

      return context;
    },

    ensureSupportedJupyterVersion() {
      if (getMajorVersion(this.versions.jupyter) < 3) {
        throw new Error("frontend major version must be >= 3");
      }
    },

    async loadConnectionFile() {
      const context = cloneContext(this);

      context.connection = JSON.parse(await readFile(context.connectionFile));

      return context;
    },

    async loadKernelInfoReply() {
      let context = cloneContext(this);

      if (getMajorVersion(context.protocolVersion) <= 4) {
        context.kernelInfoReply = {
          language: "javascript",
          language_version: getVersionTuple(process.versions.node),
          protocol_version: getVersionTuple(protocolVersion)
        };
      } else {
        context = context.loadVersionInfo();

        context.kernelInfoReply = {
          protocol_version: context.protocolVersion,
          implementation: "ihydra",
          implementation_version: context.versions.ihydra,
          language_info: {
            name: "javascript",
            version: context.versions.node,
            mimetype: "application/javascript",
            file_extension: ".js"
          },
          banner: `IHydra v${context.versions.ihydra}
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
      return context;
    },

    async loadConnectionInfo() {
      const context = cloneContext(this);
      context.connection = JSON.parse(await readFile(this.connectionFile));
      return context;
    }
  };

  if (old.argv) {
    context.argv = new Argv(old.argv.argv, old.argv.root);
  }

  if (old.logger.namespace) {
    context.logger = new Logger(old.logger.namespace);
  }

  return context;
}

function dehydrateContext(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
}

function createDehydratedContext() {
  const logger = new Logger("ihydra.lib.context");

  logger.observe('warning', consoleObserver);

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

function createContext() {
  return hydrateContext(createDehydratedContext());
}

module.exports = {
  createContext,
  createDehydratedContext,
  hydrateContext,
  dehydrateContext,
  cloneContext
};
