const React = require("react");
const { render } = require("react-dom");

const { createConfig, hydrateConfig } = require("../lib/config");
const {
  Logger,
  consoleObserver,
  mainThreadObserver,
  rendererThreadAdopter
} = require("../lib/logger");

class BaseLoader {
  constructor() {
    this.handlers = new Map();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  getHandler(config) {
    const { action } = config;
    let handler;

    if (this.handlers.has(action)) {
      return this.handlers.get(action);
    }
    return this.handlers.get("default");
  }

  async run(config) {
    const handler = this.getHandler(config);
    return await handler(config);
  }
}

class AppLoader extends BaseLoader {
  async run() {
    let config = createConfig().parseArgs(process.argv);
    const logger = new Logger(`ihydra.main.${config.action}`);

    config = config.setLogger(logger);

    logger.observe(config.debug ? "debug" : "info", consoleObserver);
    rendererThreadAdopter(logger);

    logger.info(`Loading ${config.action}...`);

    return await super.run(config);
  }
}

class ComponentLoader extends BaseLoader {
  // TODO: Pass exit hook to components
  async run(dehydrated) {
    let config = hydrateConfig(dehydrated);
    const logger = new Logger(`ihydra.renderer.containers.${config.action}`);

    logger.observe(config.debug ? "debug" : "info", consoleObserver);
    logger.observe("debug", mainThreadObserver);

    config = config.setLogger(logger);

    const Component = this.getHandler(config);

    logger.info(`Rendering ${config.action}...`);

    render(<Component config={config} />, document.getElementById("app"));
  }
}

module.exports = { AppLoader, ComponentLoader };
