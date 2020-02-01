const React = require("react");
const { render } = require("react-dom");

const { hydrateContext } = require("../lib/context");

class Loader {
  constructor() {
    this.handlers = new Map();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  async run(context) {
    const action = context.action;
    let handler;

    if (this.handlers.has(action)) {
      handler = this.handlers.get(action);
    } else {
      handler = this.handlers.get("default");
    }

    return await handler(context);
  }
}

module.exports = { Loader };
