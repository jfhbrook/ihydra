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
    const majorVersion = parseInt(config.protocolVersion.split(".")[0], 10);

    if (majorVersion <= 4) {
      nodeVersion = process.versions.node.split(".").map(v => parseInt(v, 10));
      protocolVersion = config.protocolVersion
        .split(".")
        .map(v => parseInt(v, 10));
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

function kernelCommand(old, parser) {
  const context = cloneContext(old);

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
    .action(kernelAction(context));

  return [context];
}

function adminCommand(old, parser) {
  let context = cloneContext(old);

  // Admin is the default action
  context.action = "admin";

  // We use a catch-all to direct anything that isn't either
  // the root or "admin"
  parser.command("*").action((cmd, args) => {
    [context.action] = args;
  });

  return [context, (ctx) => {
    // If we're the admin then we can safely do admin-specific data loading
    if (ctx.action === "admin") {
      return {
        ...ctx,
        action: "admin",
        name: isDev ? "ihydra-dev" : "ihydra",
        displayName: isDev ? "IHydra (development)" : "IHydra",
        localInstall: true
      };
    } else {
      return cloneContext(ctx);
    }
  }];
}

function hydrateContext(old) {
  let context = {
     ...old,
    parseArgs(argv) {
      let context = cloneContext(this);
      context.argv = new Argv(argv, this.paths.root);

      const afterHooks = [];

      const parser = new commander.Command();

      const attachCommand = (command) => {
        let afterHook;
        [ctx, afterHook] = command(context, parser);

        context = ctx;

        if (afterHook) {
          afterHooks.push(afterHook);
        }
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(adminCommand);

      console.log(context.argv);
      console.log(context.argv.commanderArgv);

      parser.parse(context.argv.commanderArgv);

      afterHooks.forEach(hook => context = hook(context));

      context.debug = parser.debug;

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
      majorVersion = parseInt(version.split(".")[0], 10);

      if (Number.isNaN(majorVersion)) {
        // Parse version number after Jupyter 4.5.0
        const match = stdout.match(/^jupyter core\s+: (\d+\.\d+\.\d+)/m);
        if (match) {
          // eslint-disable-next-line prefer-destructuring
          version = match[1];
          majorVersion = parseInt(version.split(".")[0], 10);
        } else {
          // Failed to parse the output of "jupyter --version"
          console.warn("Warning: Unable to parse Jupyter version:", stdout);
          version = "unknown";
          majorVersion = Infinity;
        }
      }

      context.versions.jupyter = version;
      context.jupyterMajorVersion = majorVersion;

      return context;
    },

    ensureSupportedJupyterVersion() {
      if (this.jupyterMajorVersion < 3) {
        throw new Error("frontend major version must be >= 3");
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
    jupyterMajorVersion: null,
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
