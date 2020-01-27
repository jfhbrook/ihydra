const React = require("react");
const { useState } = React;
const Button = require("@material-ui/core/Button").default;

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
      return (
        <div>
          <h1>which jupyter?</h1>
          <h2>TODO: file picker widget here</h2>
          <Button variant="contained" color="primary">
            detect jupyter automatically
          </Button>
          <Button variant="contained" color="primary">
            use this command
          </Button>          
          <Button variant="contained" color="primary">
            f this!
          </Button>
        </div>
      );
    case "registering":
      return <h1>registering...</h1>;
    case "ready":
      // TODO: Need to be able to go back to the "which" panel
      // TODO: Need to be able to click a launcher
      // TODO: Need to show installer configs
      // TODO: Need install button
      // TODO: Need exit button
      return (
        <div>
          <h1>ready</h1>
          <h2>{JSON.stringify(state.context)}</h2>
          <Button variant="contained" color="primary">
            install
          </Button>
          <Button variant="contained" color="primary">
            set command for starting jupyter
          </Button>
          <Button variant="contained" color="primary">
            LAUNCH JUPYTER
          </Button>
          <Button variant="contained" color="primary">
            bail!
          </Button>
        </div>
      );
    case "installing":
      return <h1>installing...</h1>;
    case "install_failed":
      return (
        <div>
          <h1>install failed!</h1>
          <Button variant="contained" color="primary">
            ugh crap
          </Button>
        </div>
      );
    case "install_succeeded":
      return (
        <div>
          <h1>install failed!</h1>
          <Button variant="contained" color="primary">
            cool beans!
          </Button>
        </div>
      );
    default:
      return <h1>confused!</h1>;
  }
}

Admin.propTypes = {
  context: contextProp.isRequired
};

module.exports = Admin;
