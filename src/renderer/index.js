const React = require("react");
const { render } = require("react-dom");

const { hydrateContext } = require("../lib/context");

const { Loader } = require("../lib/loader");

const Launcher = require("./containers/launcher");
const Kernel = require("./containers/kernel");

// TODO: Subclass Loader
function runContainer(Component) {
  return context =>
    render(
      <Component context={hydrateContext(context)} />,
      document.getElementById("app")
    );
}

const loader = new Loader();

loader.register("launcher", runContainer(Launcher));
loader.register("kernel", runContainer(Kernel));

loader.run(__args__);
