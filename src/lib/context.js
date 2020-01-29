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

const root = path.resolve(path.dirname(require.resolve("../../package.json")));

function cloneContext(old) {
  return {
    ...old
  };
}

function kernelAction(config) {
  console.log("kernelAction is getting created");
  return (connectionFile, opts) => {
    console.log("kernelAction is being called");
    // Adopted from kernel.js
    const action = "kernel";
    Object.assign(config, {
      debug: opts.debug || false,
      hideExecutionResult: false,
      hideUndefined: false,
      protocolVersion: opts.protocol,
      connection: JSON.parse(fs.readFileSync(connectionFile)),
      cwd: opts.sessionWorkingDir,
      startupCallback() {
        console.error("startupCallback:", this.startupCallback);
      }
    });

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
  };
}

function kernelCommand(parser) {
  const config = {};

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
    .action(kernelAction(config));

  return context => {
    return {
      action: "kernel",
      config
    };
  };
}

function adminCommand(parser) {
  let action = null;

  // We use a catch-all to direct anything that isn't either
  // the root or "admin"
  parser.command("*").action((cmd, args) => {
    action = args[0];
  });

  return context => {
    console.log("trying to detect the admin call");
    console.log(context);
    console.log(action);

    // In these cases, we intended it to be admin
    // no action + default for ctx means no matched args
    if (
      (!action && context.action === "default") ||
      context.action === "admin"
    ) {
      console.log("yeah man its admin");
      return {
        ...context,
        action: "admin",
        name: isDev ? "ihydra-dev" : "ihydra",
        displayName: isDev ? "IHydra (development)" : "IHydra",
        localInstall: true
      };
    }

    // This means it's already been set by something - leave it alone
    if (context.action !== "default") {
      console.log("not changing");
      return context;
    }

    console.log(`tryna override the action with ${action}`);
    // Otherwise, at least set the action
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

      const attachCommand = command => {
        hooks.push(command(parser));
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(adminCommand);

      const parsed = parser.parse(context.argv.commanderArgv);

      hooks.forEach(hook => (context = hook(context)));

      context.debug = parsed.debug;

      return context;
    },

    async searchForJupyter() {
      const context = cloneContext(this);

      let command = context.jupyter && context.jupyter.command;

      if (!command) {
        command = [await which("jupyter")];
      }

      if (command) {
        context.jupyter.command = command;
        return context;
      }

      throw new Error("could not find Jupyter");
    },

    async loadJupyterInfo() {
      const context = cloneContext(this);

      const command = context.jupyter && context.jupyter.command;
      if (!command) {
        throw new Error("don't know how to run Jupyter");
      }

      const { stdout } = await exec(quote(command.concat(["--version"])));

      context.jupyter = { command };

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

      context.jupyter.version = version;
      context.jupyter.majorVersion = majorVersion;

      return context;
    },

    ensureSupportedJupyterVersion() {
      if (this.jupyter.majorVersion < 3) {
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
}

function createDehydratedContext() {
  return {
    action: "default",
    paths: {
      root,
      images: path.join(root, "images")
    },
    jupyter: {}
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
