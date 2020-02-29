/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
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

import argsMixin, { hydrateArgs } from "./args";
import jupyterMixin from "./jupyter";
import kernelMixin from "./kernel";
import uiMixin from "./ui";
import versionsMixin from "./versions";
import Logger, { consoleObserver } from "../logger";

const root = path.resolve(
  path.dirname(require.resolve("../../../package.json"))
);

export function cloneConfig(old) {
  return {
    ...old
  };
}

export function hydrateConfig(old) {
  const config = {
    ...old,
    setLogger(logger) {
      const cfg = cloneConfig(this);

      cfg.logger = logger;

      return cfg;
    }
  };

  [
    argsMixin,
    versionsMixin,
    jupyterMixin,
    kernelMixin,
    uiMixin
  ].forEach(mixin => Object.assign(config, mixin));

  if (old.logger.namespace) {
    config.logger = new Logger(old.logger.namespace);
  }

  hydrateArgs(config);

  return config;
}

export function dehydrateConfig(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
}

export function createDehydratedConfig() {
  const logger = new Logger("ihydra.common.config");

  logger.observe("warning", consoleObserver);

  return {
    action: "default",
    paths: {
      root,
      images: path.join(root, "images")
    },
    jupyterCommand: null,
    versions: {},
    logger
  };
}

export function createConfig() {
  return hydrateConfig(createDehydratedConfig());
}
