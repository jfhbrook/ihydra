/* eslint no-param-reassign: ["error", { "props": false }] */

import isDev from "electron-is-dev";

import { getMajorVersion, getVersionTuple } from "./versions";
import { noShellError } from "../errors";
import { readFile } from "../fs";
import quote from "../quote";

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
        protocol_version: getVersionTuple(config.protocolVersion)
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

export default kernelMixin;
