const React = require("react");
const { render } = require("react-dom");

const { createContext, hydrateContext } = require("../lib/context");
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

  getHandler(context) {
    const { action } = context;
    let handler;

    if (this.handlers.has(action)) {
      return this.handlers.get(action);
    }
    return this.handlers.get("default");
  }

  async run(context) {
    const handler = this.getHandler(context);
    return await handler(context);
  }
}

class AppLoader extends BaseLoader {
  async run() {
    let context = createContext().parseArgs(process.argv);
    const logger = new Logger(`ihydra.main.${context.action}`);

    context = context.setLogger(logger);

    logger.observe(context.debug ? "debug" : "info", consoleObserver);
    rendererThreadAdopter(logger);

    logger.info(`Loading ${context.action}...`);

    return await super.run(context);
  }
}

class ComponentLoader extends BaseLoader {
  // TODO: Pass exit hook to components
  async run(dehydrated) {
    let context = hydrateContext(dehydrated);
    const logger = new Logger(`ihydra.renderer.containers.${context.action}`);

    logger.observe(context.debug ? "debug" : "info", consoleObserver);
    logger.observe("debug", mainThreadObserver);

    context = context.setLogger(logger);

    const Component = this.getHandler(context);

    logger.info(`Rendering ${context.action}...`);

    render(<Component context={context} />, document.getElementById("app"));
  }
}

module.exports = { AppLoader, ComponentLoader };
