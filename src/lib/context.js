/* eslint no-param-reassign: ["error", { "props": false }] */

const fs = require("fs");
const path = require("path");

const commander = require("commander");

const isDev = require("electron-is-dev");
const { quote } = require("shell-quote");
const which = require("which");

const Argv = require("./argv");
const exec = require("./process").exec;
const packageJson = require("../../package.json");

const root = path.resolve(path.dirname(require.resolve("../../package.json")));

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

function kernelAction(context) {
  console.log('kernelAction is getting created');
  return (connectionFile, opts) => {
    console.log('kernelAction is being called');
    // Adopted from kernel.js
    const action = "kernel";
    const config = {
      debug: opts.debug || false,
      hideExecutionResult: false,
      hideUndefined: false,
      protocolVersion: opts.protocol,
      connection: JSON.parse(fs.readFileSync(connectionFile)),
      cwd: opts.sessionWorkingDir,
      startupCallback() {
        console.error("startupCallback:", this.startupCallback);
      }
    };

    let nodeVersion;
    let protocolVersion;
    let ihydraVersion;
    const majorVersion = getMajorVersion(config.protocolVersion);

    if (majorVersion <= 4) {
      nodeVersion = getVersionTuple(process.versions.node);
      protocolVersion = getVersionTuple(config.protocolVersion);
      config.kernelInfoReply = {
        language: "javascript",
        language_version: nodeVersion,
        protocol_version: protocolVersion
      };
    } else {
      nodeVersion = process.versions.node;
      protocolVersion = config.protocolVersion;
      ihydraVersion = packageJson.version;
      config.kernelInfoReply = {
        protocol_version: protocolVersion,
        implementation: "ihydra",
        implementation_version: ihydraVersion,
        language_info: {
          name: "javascript",
          version: nodeVersion,
          mimetype: "application/javascript",
          file_extension: ".js"
        },
        banner: `IHydra v${ihydraVersion}\nhttps://github.com/jfhbrook/ihydra\n`,
        help_links: [
          {
            text: "IHydra Homepage",
            url: "https://github.com/jfhbrook/ihydra"
          }
        ]
      };
    }

    context.action = action;
    context.config = config;
  };
}

function kernelCommand(parser) {
  let action;
  let protocolVersion;
  let connectionFile;
  let sessionWorkingDir;

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
    });

  return context => {
    if (action === "kernel") {
      return {
        ...context,
        action,
        protocolVersion,
        connectionFile,
        sessionWorkingDir
      };
    }
    return context;
  };
}

function adminCommand(parser) {
  let action;

  // We use a catch-all to direct anything that isn't either
  // the root or "admin"
  parser.command("*").action((cmd, args) => {
    action = args[0];
  });

  return context => {
    if (
      (!action && context.action === "default") ||
      context.action === "admin"
    ) {
      return {
        ...context,
        action: "admin",
        name: isDev ? "ihydra-dev" : "ihydra",
        displayName: isDev ? "IHydra (development)" : "IHydra",
        localInstall: true
      };
    }

    if (context.action !== "default") {
      return context;
    }
    return { ...context, action };
  };
}

function hydrateContext(old) {
  let context = {
     ...old,
    parseArgs(argv) {
      let context = cloneContext(this);
      context.argv = new Argv(argv, this.paths.root);

      const hooks = [];

      const parser = new commander.Command();

      const attachCommand = (command) => {
        hooks.push(command(parser));
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(adminCommand);

      console.log(context.argv);
      console.log(context.argv.commanderArgv);

      parser.parse(context.argv.commanderArgv);

      hooks.forEach(hook => context = hook(context));

      context.debug = parser.debug;

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
      else {
        throw new Error("could not find Jupyter");
      }
    },

    async loadJupyterInfo() {
      const context = cloneContext(this);

      let command = context.jupyterCommand;
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

    async loadKernelInfoReply() {
      let context = cloneContext(this);

      const protocolVersion = context.protocoVersion;

      if (getMajorVersion(context.protocolVersion) <= 4) {
        context.kernelInfoReply = {
          language: "javascript",
          language_version: getVersionTuple(process.versions.node),
          protocol_version: getVersionTuple(protocolVersion)
        };
      } else {
        context = context.loadVersionInfo();

        context.kernelInfoReply = {
          protocol_version: protocolVersion,
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

        return context;
      }
    }

  };

  if (old.argv) {
    context = context.parseArgs(old.argv.argv);
  }

  return context;
}

function dehydrateContext(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
};

function createDehydratedContext() {
  return {
    action: "default",
    paths: {
      root,
      images: path.join(root, "images")
    },
    jupyterCommand: null,
    versions: {}
  };
}

function createContext() {
  return hydrateContext(createDehydratedContext());
};

module.exports = {
  createContext,
  createDehydratedContext,
  hydrateContext,
  dehydrateContext,
  cloneContext
};
