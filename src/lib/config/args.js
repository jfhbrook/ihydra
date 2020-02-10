/* eslint no-param-reassign: ["error", { "props": false }] */

const path = require("path");

const isDev = require("electron-is-dev");
const commander = require("commander");

const {
  noShellError
} = require("../errors");


class Argv {
  constructor(argv, root) {
    this.argv = argv;
    this.root = root;
  }

  get args() {
    if (this.cachedArgs) {
      return this.cachedArgs;
    }

    const args = this.argv.slice();

    if (isDev) {
      // First line is electron.exe
      args.shift();

      // Many arguments can be passed to electron before the
      // script so we shift args off until we get one that looks like a
      // script.
      //
      // This may or may not end up being super brittle.
      let maybeScript = null;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!args.length) {
          break;
        }
        maybeScript = args.shift();
        if (path.extname(path.basename(maybeScript)) === ".js") {
          break;
        }
      }
    } else {
      // This program is running in a bundled form so it shouldn't
      // have a script argument
      args.shift();
    }

    this.cachedArgs = args;

    return args;
  }

  get commanderArgv() {
    return ["dummy.exe", "dummy.js"].concat(this.args);
  }

  async getKernelPrefix() {
    if (this.cachedKernelPrefix) {
      return this.cachedKernelPrefix;
    }

    let prefix;

    if (isDev) {
      // In development mode we're running our app using electron-webpack's
      // HMR server and we can't naively run "electron.exe ./dev-bundle.js"
      // because the bundle depends on HMR socket information passed by env
      // variable.

      // So we construct args for running electron-webpack - but note that
      // without setting the cwd to the project root somehow this won't do
      // the right thing. :)
      prefix = [await which("electron-webpack"), "dev"];
    } else {
      // In production, we should be able to run the command naively
      prefix = this.argv[0];
    }

    this.cachedKernelPrefix = prefix;

    return prefix;
  }

  async getShell() {
    if (this.cachedShell) {
      return this.cachedShell;
    }

    let shells;

    if (process.platform === "win32") {
      shells = ["powershell"];
    } else {
      shells = ["bash", "sh"];
    }

    async function* finder() {
      let i = 0;
      while (i < shells.length) {
        try {
          const shell = shells[i];
          const resolved = await which(shells[i]);
          if (resolved) {
            yield shell;
          }
        } catch (err) {
          if (err.code === "ENOENT") {
            continue;
          }
          throw err;
        } finally {
          i++;
        }
      }
    }

    for await (const shell of finder()) {
      this.cachedShell = shell;
      return shell;
    }

    throw noShellError("Could not find a supported shell");
  }
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

const argsMixin = {
  parseArgs(argv) {
    let config = { ...this };
    config.argv = new Argv(argv, this.paths.root);

    const hooks = [];

    const parser = new commander.Command();

    function attachCommand(command) {
      hooks.push(command(parser));
    }

    parser.version(require('../../../package.json')).version;

    parser.option("--debug", "Log debug messages");

    attachCommand(kernelCommand);
    attachCommand(launcherCommand);

    const parsed = parser.parse(config.argv.commanderArgv);

    hooks.forEach(hook => (config = hook(config)));

    return config;
  }
};

function hydrateArgs(config) {
  if (config.argv) {
    config.argv = new Argv(config.argv.argv, config.argv.root);
  }
}

module.exports = { argsMixin, hydrateArgs };
