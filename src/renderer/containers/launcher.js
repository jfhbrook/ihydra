const electron = require("electron");

const { app, ipcRenderer } = electron;
const React = require("react");

const { useState } = React;
const Button = require("../components/WizardButton");
const LoadingScreen = require("../components/LoadingScreen");
const InstallerConfig = require("../components/InstallerConfig");
const JupyterCommandFinder = require("../components/JupyterCommandFinder");
const Terminal = require("../components/Terminal");
const { installKernel } = require("../../lib/install");
const { spawnJupyter } = require("../../lib/process");

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

  function errorHandler(err, cfg, status) {
    const config = cloneConfig(cfg);
    config.error = err;
    config.logger.error(err);
    setState({ status, config });
  }

  function setStatusOnError(status) {
    return capturer(err => errorHandler(err, cfg, status));
  }

  const confusedIfError = setStatusOnError("confused");
  const failedIfError = setStatusOnError("install_failed");

  const retrySearchIfError = capturer(err => {
    let config = cloneConfig(cfg);
    cfg.logger.error(err);
    cfg.logger.warn(
      "Configured Jupyter version appears invalid; Attempting an automatic search"
    );
    config = cfg.setJupyterCommand(null);
    setState({ status: "searching", config });
  });

  function init() {
    const config = cfg.loadVersionInfo();
    if (config.jupyterCommand) {
      return setState({ status: "registering", config });
    }
    return setState({ status: "searching", config });
  }

  const searchForJupyter = confusedIfError(async () => {
    const config = await cfg.searchForJupyter();
    setState({ status: "registering", config });
  });

  // TODO: Interstitial error state that displays the error
  // and allows us to bail
  const loadJupyterInfo = retrySearchIfError(async () => {
    const config = await cfg.loadJupyterInfo();
    config.ensureSupportedJupyterVersion();
    setState({ status: "ready", config });
  });

  function useJupyterCommand(command) {
    const config = cfg.setJupyterCommand(command);
    setState({ status: "registering", config });
  }

  const install = failedIfError(async () => {
    await installKernel(cfg);
    setStatus("install_succeeded");
  });

  const runJupyter = confusedIfError(async () => {
    const jupyterProcess = await spawnJupyter(cfg);
    setState({ status: "running", config: cfg, jupyterProcess });
  });

  // TODO: Do this *gracefully*!
  function stopJupyter() {
    const jupyter = state.jupyterProcess;
    jupyter.kill();
    jupyter.on("exit", () => {
      setState({ status: "ready", config: cfg });
    });
  }

  switch (status) {
    case "loading":
      init();
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
    case "launching":
      runJupyter();
    default:
      break;
  }

  return {
    state,
    trySearching() {
      setStatus("searching");
    },
    tryRegistering() {
      setStatus("registering");
    },
    useJupyterCommand,
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
      setStatus("launching");
    },
    stopJupyter,
    exit() {
      ipcRenderer.send("bail");
    }
  };
}

function Launcher({ config }) {
  const {
    state,
    trySearching,
    tryRegistering,
    useJupyterCommand,
    goBackToWhich,
    goBackToMain,
    tryInstall,
    launchJupyter,
    stopJupyter,
    exit
  } = useLauncherState(config);

  switch (state.status) {
    case "loading":
      return <LoadingScreen message="loading..." />;
    case "searching":
      return <LoadingScreen message="searching..." />;
    case "which":
      return (
        <JupyterCommandFinder
          config={state.config}
          trySearching={trySearching}
          useJupyterCommand={useJupyterCommand}
          exit={exit}
        />
      );
    case "registering":
      return <LoadingScreen message="registering..." />;
    case "ready":
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
    case "launching":
      return <LoadingScreen message="launching..." />;
    case "running":
      return (
        <div>
          <Terminal process={state.jupyterProcess} />
          <Button onClick={stopJupyter}>Stop Jupyter</Button>
        </div>
      );
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
