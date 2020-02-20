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

/* eslint max-classes-per-file: "off" */
import React from "react";
import { render } from "react-dom";

import { app } from "electron";

import { createConfig, hydrateConfig } from "./config";
import Logger, {
  consoleObserver,
  mainThreadObserver,
  rendererThreadAdopter
} from "./logger";

class BaseLoader {
  constructor() {
    this.handlers = new Map();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  getHandler(config) {
    const { action } = config;

    if (this.handlers.has(action)) {
      return this.handlers.get(action);
    }
    return this.handlers.get("default");
  }

  async run(config) {
    const handler = this.getHandler(config);
    return handler(config);
  }
}

export class AppLoader extends BaseLoader {
  async run() {
    let config = createConfig().parseArgs(process.argv);
    const logger = new Logger(`ihydra.main.${config.action}`);

    config = config.setLogger(logger);

    logger.observe(config.debug ? "debug" : "info", consoleObserver);
    rendererThreadAdopter(logger);

    logger.info(`Loading ${config.action}...`);

    try {
      await super.run(config);
    } catch (err) {
      logger.fatal(err);
    }

    logger.info("Bye!");
    app.quit();
  }
}

export class ComponentLoader extends BaseLoader {
  async run(dehydrated) {
    let config = hydrateConfig(dehydrated);
    const logger = new Logger(`ihydra.renderer.containers.${config.action}`);

    // The kernel does unspeakable things to console.log so we need to be
    // very careful here
    // TODO: Double check to make sure this guard is still necessary
    if (config.action !== "kernel") {
      logger.observe(config.debug ? "debug" : "info", consoleObserver);
    }
    logger.observe("debug", mainThreadObserver);

    config = config.setLogger(logger);

    const Component = this.getHandler(config);

    logger.info(`Rendering ${config.action}...`);

    render(<Component config={config} />, document.getElementById("app"));
  }
}
