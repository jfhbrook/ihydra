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

    config = config.getWindowDimensions();

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
