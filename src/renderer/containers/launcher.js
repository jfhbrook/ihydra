const electron = require("electron");

const { app } = electron;
const React = require("react");

const { useState } = React;
const Button = require("../components/WizardButton");
// TODO: Overhaul the "installer config" component, it is currently dumb and wrong
const InstallerConfig = require("../components/InstallerConfig");
// TODO: This didn't end up being a "service" really, should this be moved elsewhere?
const { installKernel } = require("../../services/installer");

// TODO: Move props to lib/context and make good instead of bad :)
const contextProp = require("../context").prop;
const { cloneContext } = require("../../lib/context");

function useLauncherState(context) {
  const [state, rawSetState] = useState({
    status: "loading",
    context
  });
  const { status } = state;
  const ctx = state.context;

  function setState(newState) {
    if (newState.status !== status) {
      ctx.logger.debug(
        `Launcher status change: ${status} -> ${newState.status}`
      );
    }
    rawSetState(newState);
  }

  function setStatus(status) {
    setState({ ...state, status });
  }

  function checkInitialState() {
    if (ctx.jupyterCommand) {
      return setStatus("registering");
    }
    return setStatus("searching");
  }

  // TODO: DRY this try/catch pattern out w/ a "capture" helper of some kind
  async function searchForJupyter() {
    let c;
    try {
      c = ctx.loadVersionInfo();
      c = await ctx.searchForJupyter();
    } catch (err) {
      c = cloneContext(ctx);
      c.error = err;
      setState({ status: "confused", context: c });
      return;
    }

    try {
      c.ensureSupportedJupyterVersion();
    } catch (err) {
      c.error = err;
      setState({ status: "confused", context: c });
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

  async function install() {
    let c = ctx;
    try {
      await installKernel(ctx);
    } catch (err) {
      ctx.logger.exception(err);
      c = cloneContext(ctx);
      c.error = err;
      setState({ status: "install_failed", context: c });
      return;
    }

    setStatus("install_succeeded");
  }

  switch (status) {
    case "loading":
      checkInitialState();
      break;
    case "searching":
      searchForJupyter();
      break;
    case "registering":
      loadJupyterInfo();
      break;
    case "installing":
      install();
      break;
    default:
      break;
  }

  return {
    state,
    trySearching() {
      setStatus("search");
    },
    tryRegistering() {
      setStatus("registering");
    },
    goBackToWhich() {
      setStatus("which");
    },
    goBackToMain() {
      setStatus("ready");
    },
    tryInstall() {
      setStatus("installing");
    },
    launchJupyter() {
      // TODO: Launch jupyter notebook
    },
    exit() {
      // TODO: Write actual exit logic
    }
  };
}

function Launcher({ context }) {
  const {
    state,
    trySearching,
    tryRegistering,
    goBackToWhich,
    goBackToMain,
    tryInstall,
    launchJupyter,
    exit
  } = useLauncherState(context);

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
          <Button onClick={trySearching}>detect jupyter automatically</Button>
          <Button onClick={tryRegistering}>use this command</Button>
          <Button onClick={exit}>exit</Button>
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
          <InstallerConfig context={state.context} />
          <Button onClick={tryInstall}>install</Button>
          <Button onClick={goBackToWhich}>
            set command for starting jupyter
          </Button>
          <Button onClick={launchJupyter}>LAUNCH JUPYTER</Button>
          <Button onClick={exit}>exit</Button>
        </div>
      );
    case "installing":
      return <h1>installing...</h1>;
    case "install_failed":
      return (
        <div>
          <h1>install failed!</h1>
          <Button onClick={goBackToMain}>ugh crap</Button>
        </div>
      );
    case "install_succeeded":
      return (
        <div>
          <h1>install succeeded!</h1>
          <Button onClick={goBackToMain}>cool beans!</Button>
        </div>
      );
    default:
      return <h1>confused!</h1>;
  }
}

Launcher.propTypes = {
  context: contextProp.isRequired
};

module.exports = Launcher;
