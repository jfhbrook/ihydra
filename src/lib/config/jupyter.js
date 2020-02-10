/* eslint no-param-reassign: ["error", { "props": false }] */

const { quote } = require("shell-quote");
const which = require("which");

const { readFile } = require("../fs");
const {
  configError,
  jupyterNotFoundError,
  jupyterVersionError
} = require("../errors");

const { getMajorVersion, getVersionTuple } = require("./versions");

const { exec } = require("../process");

const jupyterMixin = {
  async searchForJupyter() {
    const config = { ...this };

    let command = config.jupyterCommand;

    if (command) {
      return config;
    }

    config.logger.info("Looking for Jupyter on the PATH...");

    command = [await which("jupyter")];

    if (command) {
      config.logger.info("Found Jupyter on the PATH");
      config.jupyterCommand = command;
      return config;
    }

    config.logger.info("Searching for Jupyter in an Anaconda install...");

    const maybeCommand = path.join(
      homedir(),
      "Anaconda3",
      "Scripts",
      process.platform === "win32" ? "jupyter.exe" : "jupyter"
    );

    let found = true;

    try {
      await access(maybeCommand);
    } catch (err) {
      found = false;
    }

    if (found) {
      config.logger.info("Found Jupyter in an Anaconda install");
      config.jupyterCommand = [maybeCommand];
      return config;
    }

    throw jupyterNotFoundError("Could not find an installed copy of Jupyter");
  },

  setJupyterCommand(command) {
    const config = { ...this };
    config.jupyterCommand = command;
    return config;
  },

  async loadJupyterInfo() {
    const config = { ...this };

    const command = config.jupyterCommand;

    if (!command) {
      throw configError("Don't know how to run Jupyter to load version info");
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
      throw jupyterVersionError(
        "Only versions of Jupyter greater than 3.0 are supported"
      );
    }
  }
};

module.exports = { jupyterMixin };
