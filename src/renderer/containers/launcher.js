const electron = require("electron");

const { app, ipcRenderer } = electron;
const React = require("react");

const { useState } = React;
const PropTypes = require("prop-types");

const About = require("../components/About");
const LoadingScreen = require("../components/LoadingScreen");
const JupyterCommandFinder = require("../components/JupyterCommandFinder");
const MainMenu = require("../components/MainMenu");
const JupyterRuntime = require("../components/JupyterRuntime");
const Alert = require("../components/Alert");
const StackTrace = require("../components/StackTrace");
const { installKernel } = require("../../lib/install");
const { spawnJupyter } = require("../../lib/process");

const { capturer } = require("../../lib/errors");

const { cloneConfig } = require("../../lib/config");

function useLauncherState(config) {
  const [state, rawSetState] = useState({
    status: "loading",
    tab: "launcher",
    config
  });
  const { status } = state;
  const cfg = state.config;
  const { tab } = state;

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

  function errorHandler(error, config, status) {
    setState({ status, config: cfg, tab, error });
  }

  function setStatusOnError(status) {
    return capturer(err => errorHandler(err, cfg, status));
  }

  const confusedIfError = setStatusOnError("confused");
  const failedIfError = setStatusOnError("install_failed");
  const invalidJupyterIfError = setStatusOnError("registration_failed");

  function init() {
    const config = cfg.loadVersionInfo();
    if (config.jupyterCommand) {
      return setState({ status: "registering", config, tab });
    }
    return setState({ status: "searching", config, tab });
  }

  const searchForJupyter = confusedIfError(async () => {
    const config = await cfg.setJupyterCommand(null).searchForJupyter();
    setState({ status: "registering", config, tab });
  });

  // TODO: Interstitial error state that displays the error
  // and allows us to bail
  const loadJupyterInfo = invalidJupyterIfError(async () => {
    const config = await (await cfg.loadJupyterInfo()).getKernelCommand();
    config.ensureSupportedJupyterVersion();
    setState({ status: "ready", config, tab });
  });

  function useJupyterCommand(command) {
    const config = cfg.setJupyterCommand(command);
    setState({ status: "registering", config, tab });
  }

  const install = failedIfError(async () => {
    await installKernel(cfg);
    setStatus("install_succeeded");
  });

  const runJupyter = confusedIfError(async () => {
    const jupyterProcess = await spawnJupyter(cfg);
    setState({ status: "running", config: cfg, tab, jupyterProcess });
  });

  // TODO: Do this *gracefully*!
  function stopJupyter() {
    const jupyter = state.jupyterProcess;
    jupyter.kill();
    jupyter.on("exit", () => {
      setState({ status: "ready", config: cfg, tab });
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

  function setTab(tab) {
    setState({ ...state, tab });
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
    helpTab() {
      setTab("help");
    },
    launcherTab() {
      setTab("launcher");
    },
    startOver() {
      setStatus("loading");
    },
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
    helpTab,
    launcherTab,
    startOver,
    exit
  } = useLauncherState(config);
  return (
    <div>
      <Button onClick={launcherTab}>Launcher</Button>
      <Button onClick={helpTab}>About</Button>
      {{
        help: () => <About />,
        launcher: () =>
          ({
            loading: () => <LoadingScreen message="Loading..." />,
            searching: () => (
              <LoadingScreen message="Searching for Jupyter..." />
            ),
            which: () => (
              <JupyterCommandFinder
                config={state.config}
                trySearching={trySearching}
                useJupyterCommand={useJupyterCommand}
                exit={exit}
              />
            ),
            registering: () => (
              <LoadingScreen message="Gathering Information on Jupyter..." />
            ),
            registration_failed: () => (
              <Alert
                hed="Having Trouble Registering Jupyter"
                buttons={{
                  "Search Automatically": trySearching,
                  "Find Manually": goBackToWhich
                }}
              />
            ),
            ready: () => (
              <MainMenu
                config={state.config}
                tryInstall={tryInstall}
                goBackToWhich={goBackToWhich}
                launchJupyter={launchJupyter}
                exit={exit}
              />
            ),
            installing: () => <LoadingScreen message="Installing IHydra..." />,
            launching: () => <LoadingScreen message="Launching Jupyter..." />,
            running: () => (
              <JupyterRuntime
                process={state.jupyterProcess}
                stopJupyter={stopJupyter}
              />
            ),
            install_failed: () => (
              <Alert
                hed="Install Failed"
                buttons={{ "Back to Main Menu": goBackToMain }}
              />
            ),
            install_succeeded: () => (
              <Alert
                hed="Install Succeeded"
                buttons={{ "Cool Beans!": goBackToMain }}
              />
            ),
            confused: () => (
              <StackTrace error={state.error} retry={startOver} fail={exit} />
            )
          }[state.status]())
      }[state.tab]()}
    </div>
  );

  return (
    <div>
      <Button onClick={launcherTab}>Launcher</Button>
      <Button onClick={helpTab}>About</Button>
      {tabs[state.tab]()}
    </div>
  );
}

Launcher.propTypes = {
  config: PropTypes.shape({
    action: PropTypes.oneOf(["launcher"]).isRequired,
    logger: PropTypes.object.isRequired
  }).isRequired
};

module.exports = Launcher;
