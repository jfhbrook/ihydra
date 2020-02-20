/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
 * Based on IJavascript, Copyright (c) 2015, Nicolas Riesco and others as
 * credited in the AUTHORS file
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */

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
