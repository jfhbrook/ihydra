const React = require("react");
const { render } = require("react-dom");

const { hydrateContext } = require("../lib/context");

class Loader {
  constructor() {
    this.containers = new Map();
  }

  register(type, component) {
    this.containers.set(type, component);
  }

  load(context) {
    const type = context.action;
    let Component;

    if (this.containers.has(type)) {
      Component = this.containers.get(type);
    } else {
      Component = this.containers.get("default");
    }

    render(
      <Component context={hydrateContext(context)} />,
      document.getElementById("app")
    );
  }
}

module.exports = { Loader };
