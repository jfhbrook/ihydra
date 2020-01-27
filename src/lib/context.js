/* eslint no-param-reassign: ["error", { "props": false }] */

const execCb = require("child_process").exec;
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const commander = require("commander");

const isDev = require("electron-is-dev");
const { quote } = require("shell-quote");
const which = require("which");

const packageJson = require("../../package.json");

const root = path.resolve(path.dirname(require.resolve("../../package.json")));

const exec = promisify((cmd, callback) => {
  execCb(cmd, (err, stdout, stderr) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { stdout, stderr });
    }
  });
});

function electronArgv(argv) {
  const raw = argv.slice();
  const kernel = [];

  const cmd = argv.shift();

  if (isDev) {
    // This script *should* be running using the electron bin
    kernel.push(cmd);

    // Many arguments can be passed to electron before the
    // script by electron-webpack, so we throw them out until
    // we get one that looks like a script. This is both so
    // that we don't confuse commander and so that we can
    // use this information to reliably run the kernel.
    //
    // This may or may not end up being super brittle.
    let script = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (!raw.length) {
        break;
      }
      script = raw.shift();
      if (path.extname(path.basename(script)) === ".js") {
        kernel.push(script);
        break;
      }
    }
  } else {
    // This program is running in a bundled form and should be
    // executed directly
    kernel.push(cmd);
  }

  return { kernel, args: raw };
}

function commanderArgv({ kernel, args }) {
  if (kernel.length === 2) {
    return kernel.concat(args);
  }
  return [kernel[0], "dummy.js"].concat(args);
}

function cloneContext(old) {
  return {
    ...old
  };
}

function kernelAction(context) {
  return (connectionFile, opts) => {
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
    .option("--debug", "Debug flag for jp-kernel")
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

  return [context, () => {
    // If we're the admin then we can safely do admin-specific data loading
    if (context.action === "admin") {
      return {
        ...context,
        action: "admin",
        name: "hydra",
        displayName: "IHydra",
        localInstall: true
      };
    } else {
      return cloneContext(context);
    }
  }];
}

function hydrateContext(old) {
  return {
     ...old,
    parseArgs(argv) {
      let context = cloneContext(this);

      const afterHooks = [];
      const eArgv = electronArgv(argv);

      context.kernel = eArgv.kernel;
      context.args = eArgv.args;

      const parser = new commander.Command();

      const attachCommand = (command) => {
        let afterHook;
        [context, afterHook] = command(context, parser);

        if (afterHook) {
          afterHooks.push(afterHook);
        }
      };

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      attachCommand(kernelCommand);
      attachCommand(adminCommand);

      parser.parse(commanderArgv(eArgv));

      afterHooks.forEach(hook => hook(context));

      context.debug = parser.debug;

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
      else {
        throw new Error("could not find Jupyter");
      }
    },

    async loadJupyterInfo() {
      const context = cloneContext(this);

      let command = context.jupyter && context.jupyter.command;
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
    }
  };
}

function dehydrateContext(old) {
  // TODO: This should create a new object that
  // whitelists expected properties instead of
  // cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
};

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
};

module.exports = {
  createContext,
  createDehydratedContext,
  hydrateContext,
  dehydrateContext,
  cloneContext
};
