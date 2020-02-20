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

import * as path from "path";
import { homedir } from "os";

import { quote } from "shell-quote";
import which from "which";

import {
  configError,
  jupyterNotFoundError,
  jupyterVersionError
} from "../errors";
import { exec } from "../process";
import { access } from "../fs";
import { getMajorVersion } from "./versions";

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
        config.logger.warn("Unable to parse Jupyter version:", stdout);
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

export default jupyterMixin;
