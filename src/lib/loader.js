class Loader {
  constructor() {
    this.handlers = new Map();
  }

  register(action, handler) {
    this.handlers.set(action, handler);
  }

  load(context, handler) {
    return handler(context);
  }

  run(context) {
    const action = context.action;
    let handler;

    if (this.handlers.has(action)) {
      handler = this.handlers.get(action);
    } else {
      handler = this.handlers.get("default");
    }

    return this.load(context, handler);
  }
}

module.exports = { Loader };
