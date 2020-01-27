const React = require("react");
const { useState } = React;

const contextProp = require("../context").prop;
const cloneContext = require("../../lib/context").cloneContext;

function useAdminState(context) {
  const [state, rawSetState] = useState({
    status: "loading",
    context
  });
  const status = state.status;
  const ctx = state.context;

  function setState(newState) {
    // TODO: Better logging lmao
    console.log(newState);
    if (newState.status !== status) {
      console.log(`${status} -> ${newState.status}`);
    }
    rawSetState(newState);
  }

  function setStatus(status) {
    setState({...state, status});
  }

  function checkInitialState() {
    if (ctx.jupyter.command) {
      return setStatus("registering");
    } else {
      return setStatus("searching");
    }
  }

  // TODO: dry these out
  async function searchForJupyter() {
    let c;
    try {
      c = await ctx.searchForJupyter();
    } catch (err) {
      c = cloneContext(ctx);
      c.error = err;
      setState({ status: "confused", context: c });
      return;
    }
    setState({ status: "registering", context: c });
  }

  async function loadJupyterInfo() {
    let c;
    try {
      c = await ctx.loadJupyterInfo();
    } catch (err) {
      c = cloneContext(ctx);
      c.error = err;
      setState({ status: "which", context: c });
      return;
    }
    setState({ status: "ready", context: c });
  }

  function tick() {
    switch (state.status) {
      case "loading":
        return checkInitialState();
      case "searching":
        return searchForJupyter();
      case "registering":
        return loadJupyterInfo();
      case "which":
        return;
      case "ready":
        return;
      case "confused":
        break;
    }
  }

  return [state, tick];
}

function Admin({ context }) {

  const [state, tick] = useAdminState(context);

  tick();

  switch (state.status) {
    case "loading":
      return <h1>loading...</h1>;
    case "searching":
      return <h1>searching...</h1>;
    case "which":
      // TODO: Need to be able to select a jupyter "manually"
      // TODO: Need to be able to try searching again
      // TODO: Need exit button
      return <h1>which jupyter?</h1>;
    case "registering":
      return <h1>registering...</h1>;
    case "ready":
      // TODO: Need to be able to go back to the "which" panel
      // TODO: Need to be able to click a launcher
      // TODO: Need to show installer configs
      // TODO: Need install button
      // TODO: Need exit button
      return <h1>ready</h1>;
    case "installing":
      return <h1>installing...</h1>;
    case "install_failed":
      // TODO: button to "ready"
      return <h1>install failed!</h1>;
    case "install_succeeded":
      // TODO: button to "ready"
      return <h1>install succeeded!</h1>;
    default:
      return <h1>confused!</h1>;
  }
}

Admin.propTypes = {
  context: contextProp.isRequired
};

module.exports = Admin;
