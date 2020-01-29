/* eslint no-param-reassign: ["error", { "props": false }] */

const fs = require("fs");
const path = require("path");

const commander = require("commander");

const isDev = require("electron-is-dev");
const { quote } = require("shell-quote");
const which = require("which");

const Argv = require("./argv");
const { readFile } = require("./fs");
const { exec } = require("./process");
const packageJson = require("../../package.json");

const root = path.resolve(path.dirname(require.resolve("../../package.json")));

function cloneContext(old) {
  return {
    ...old
  };
}

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
  return fullVersion.split('.').map(v => parseInt(v, 10));
}

function kernelCommand(parser) {
  let action = null;
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
  let action = null;

  // We use a catch-all to direct anything that isn't either
  // the root or "admin"
  parser.command("*").action((cmd, args) => {
    action = args[0];
  });

  return context => {
    // In these cases, we intended it to be admin
    // no action + default for ctx means no matched args
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

    // This means it's already been set by something - leave it alone
    if (context.action !== "default") {
      return context;
    }

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

    async loadVersionInfo() {
      const context = cloneContext(this);

      async function getPackageInfo(pkg) {
        let p;
        let j;
        let v;
        try {
          p = path.dirname(require.resolve(pkg));
          j = JSON.parse(await readFile(path.join(p, "package.json")));
          v = j.version;
        } catch (err) {
          console.log(err);
          v = "unknown";
        }

        return [pkg, v];
      }

      context.versions = Object.fromEntries(
        (
          await Promise.all(
            [
              'jmp',
              'jmp-kernel',
              'nel',
              'uuid',
              'zeromq'
            ].map(getPackageInfo)
          )
        ).concat([
          [
            'node',
            'v8',
            'chrome',
            'electron'
          ].map(k => process.versions[k])
        ]).concat([['ihydra', packageJson.version]])
      );

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
        } else {
          // Failed to parse the output of "jupyter --version"
          console.warn("Warning: Unable to parse Jupyter version:", stdout);
          version = "unknown";
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

      // Set by the cli parser for the kernel
      const protocolVersion = context.protocolVersion;

      if (getMajorVersion(context.protocolVersion) <= 4) {
        context.kernelInfoReply = {
          language: "javascript",
          language_version: getVersionTuple(process.versions.node),
          protocol_version: getVersionTuple(context.protocolVersion)
        };

      } else {
        context = await context.loadVersionInfo();

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
          banner: `IHydra v${context.versions.ihydra}\nhttps://github.com/jfhbrook/ihydra\n`,
          help_links: [
            {
              text: "IHydra Homepage",
              url: "https://github.com/jfhbrook/ihydra"
            }
          ]
        };
      }

      return context;
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
    jupyter: null
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
