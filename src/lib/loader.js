const React = require("react");
const { render } = require("react-dom");

const { createContext, hydrateContext } = require("../lib/context");

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
    return await super.run(createContext().parseArgs(process.argv));
  }
}

class ComponentLoader extends BaseLoader {
  // TODO: Pass exit hook to components
  async run(context) {
    const Component = this.getHandler(context);
    render(
        <Component context={hydrateContext(context)} />,
      document.getElementById("app")
    );
  }
}

module.exports = { AppLoader, ComponentLoader };
