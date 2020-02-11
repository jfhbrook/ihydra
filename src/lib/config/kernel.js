/* eslint no-param-reassign: ["error", { "props": false }] */

const isDev = require("electron-is-dev");
const shellQuote = require("shell-quote").quote;

const { readFile } = require("../fs");
const { noShellError } = require("../errors");

function quote(xs) {
  if (process.platform !== "win32") {
    // shell-quote quotes the curlies, which breaks the templating
    return shellQuote(xs)
      .replace("\\{", "{")
      .replace("\\}", "}");
  }

  // I cheese this really hard here, doing the bare minimum to make
  // quoting work in the powershell case.

  // For more info, see: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules
  return xs
    .map(s => {
      // If double quotes and spaces but no single quotes,
      // naively add single-quotes to either side and
      // quote single-quotes
      if (/["\s]/.test(s) && !/'/.test(s)) {
        return `'${s.replace(/'/g, "''")}'`;
      }

      // If a case where we have to double-quote, do so
      // and naively escape dollar signs and double-quotes
      if (/["'\s]/.test(s)) {
        return `"${s.replace(/([$"])/g, "`$1")}"`;
      }

      return s;
    })
    .join(" ");
}

const kernelMixin = {
  async loadConnectionFile() {
    const config = { ...this };

    config.connection = JSON.parse(await readFile(config.connectionFile));

    return config;
  },

  async loadKernelInfoReply() {
    let config = { ...this };

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
    const config = { ...this };
    config.connection = JSON.parse(await readFile(this.connectionFile));
    return config;
  },

  async getKernelCommand() {
    const config = { ...this };
    const prefix = await this.argv.getKernelPrefix();

    let command = prefix.concat(["kernel", "{connection_file}"]);

    if (!isDev) {
      config.kernelCommand = command;
      return config;
    }

    command = quote(command);

    const root = quote([config.argv.root]);
    const shell = await config.argv.getShell();

    let shimScript;

    if (["bash", "sh"].includes(shell)) {
      shimScript = [shell, "-c", `cd ${root} && exec ${command}`];
    } else if (shell === "powershell") {
      shimScript = [shell, "-Command", `cd ${root}; ${command}`];
    } else {
      throw noShellError("No supported shell for development install");
    }

    config.kernelCommand = shimScript;
    return config;
  }
};

module.exports = {
  kernelMixin
};
