const React = require("react");
const { render } = require("react-dom");

const { hydrateContext } = require("../lib/context");

const { Loader } = require("../lib/loader");

const Admin = require("./containers/admin");
const Hydra = require("./containers/hydra");

// TODO: Subclass Loader
function runContainer(Component) {
  return context => render(
    <Component context={hydrateContext(context)} />,
    document.getElementById("app")
  );
}

const loader = new Loader();

loader.register("admin", runContainer(Admin));
loader.register("hydra", runContainer(Hydra));

loader.run(__args__);
