/* eslint no-param-reassign: ["error", { "props": false }] */

const execCb = require("child_process").exec;
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const commander = require("commander");
const electron = require("electron");

const { app } = electron;
const isDev = require("electron-is-dev");
const { quote } = require("shell-quote");
const which = require("which");

const packageJson = require("../../package.json");

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

function kernelCommand(context, parser) {
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
}

function adminCommand(context, parser) {
  // Admin is the default action
  context.action = "admin";

  // We use a catch-all to direct anything that isn't either
  // the root or "admin"
  parser.command("*").action((cmd, args) => {
    [context.action] = args;
  });

  return () => {
    // If we're the admin then we can safely do admin-specific data loading
    if (context.action === "admin") {
      context.name = "hydra";
      context.displayName = "IHydra";
      context.localInstall = true;
    }
  };
}

function createContext() {
  // TODO: See if this is right
  const root = app.getPath("exe");

  const context = {
    action: "default",
    commanderAfterHooks: [],

    paths: {
      root,
      images: path.join(root, "images")
    },

    attachCommand(parser, command) {
      const afterHook = command(this, parser);
      if (afterHook) {
        this.commanderAfterHooks.push(afterHook);
      }
    },

    parseArgs(argv) {
      const eArgv = electronArgv(argv);

      this.kernel = eArgv.kernel;
      this.args = eArgv.args;

      const parser = new commander.Command();

      parser.version(packageJson.version);

      parser.option("--debug", "Log debug messages");

      this.attachCommand(parser, kernelCommand);
      this.attachCommand(parser, adminCommand);

      parser.parse(commanderArgv(eArgv));

      this.commanderAfterHooks.forEach(hook => hook(this));

      this.debug = parser.debug;
    },

    async loadJupyterInfo() {
      let cmd = this.jupyter;
      if (!cmd) {
        cmd = [await which("jupyter")];
      }

      cmd = quote(cmd.concat(["--version"]));

      // TODO: IJavascript attempts to fall back to IPython
      const { stdout } = exec(cmd);

      this.jupyter = { cmd };

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

      this.jupyter.version = version;
      this.jupyter.majorVersion = majorVersion;
    }
  };

  return context;
}

module.exports = createContext;
