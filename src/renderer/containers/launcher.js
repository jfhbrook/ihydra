const electron = require("electron");

const { app, ipcRenderer } = electron;
const React = require("react");

const { useState } = React;
const Button = require("../components/WizardButton");
const LoadingScreen = require("../components/LoadingScreen");
// TODO: Overhaul the "installer config" component, it is currently dumb and wrong
const InstallerConfig = require("../components/InstallerConfig");
// TODO: This didn't end up being a "service" really, should this be moved elsewhere?
const { installKernel } = require("../../services/installer");

const { capturer } = require("../../lib/errors");

// TODO: Move props to lib/config and make good instead of bad :)
const configProp = require("../config").prop;
const { cloneConfig } = require("../../lib/config");

function useLauncherState(config) {
  const [state, rawSetState] = useState({
    status: "loading",
    config
  });
  const { status } = state;
  const cfg = state.config;

  function setState(newState) {
    if (newState.status !== status) {
      cfg.logger.debug(
        `Launcher status change: ${status} -> ${newState.status}`
      );
    }
    rawSetState(newState);
  }

  function setStatus(status) {
    setState({ ...state, status });
  }

  function createErrorHandler(status) {
    const wrapper = capturer((err, [cfg]) => {
      let config = cloneConfig(cfg);
      config.error = err;
      config.logger.error(err);
      setState({status, config});
    });

    return fn => {
      const wrapped = wrapper(fn);
      return () => wrapped(cfg);
    };
  }

  const confusedIfError = createErrorHandler("confused");
  const whichIfError = createErrorHandler("which");
  const failedIfError = createErrorHandler("install_failed");

  function checkInitialState() {
    if (cfg.jupyterCommand) {
      return setStatus("registering");
    }
    return setStatus("searching");
  }

  const searchForJupyter = confusedIfError(async cfg => {
    const config = await (await cfg.loadVersionInfo().searchForJupyter()).loadJupyterInfo();
    config.ensureSupportedJupyterVersion();
    setState({ status: "registering", config });
  });

  const loadJupyterInfo = whichIfError(async cfg => {
    const config = await cfg.loadJupyterInfo();
    setState({ status: "ready", config });
  });

  const install = failedIfError(async cfg => {
    await installKernel(cfg);
    setStatus("install_succeeded");
  });

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
      ipcRenderer.send('bail');
    }
  };
}

function Launcher({ config }) {
  const {
    state,
    trySearching,
    tryRegistering,
    goBackToWhich,
    goBackToMain,
    tryInstall,
    launchJupyter,
    exit
  } = useLauncherState(config);

  switch (state.status) {
    case "loading":
      return <LoadingScreen message="loading..." />;
    case "searching":
      return <LoadingScreen message="searching..." />;
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
      return <LoadingScreen message="registering..." />
    case "ready":
      // TODO: Need to be able to go back to the "which" panel
      // TODO: Need to be able to click a launcher
      // TODO: Need to show installer configs
      // TODO: Need install button
      // TODO: Need exit button
      return (
        <div>
          <h1>ready</h1>
          <InstallerConfig config={state.config} />
          <Button onClick={tryInstall}>install</Button>
          <Button onClick={goBackToWhich}>
            set command for starting jupyter
          </Button>
          <Button onClick={launchJupyter}>LAUNCH JUPYTER</Button>
          <Button onClick={exit}>exit</Button>
        </div>
      );
    case "installing":
      return <LoadingScreen message="installing..." />;
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
  config: configProp.isRequired
};

module.exports = Launcher;
