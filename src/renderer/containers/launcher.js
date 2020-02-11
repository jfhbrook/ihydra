const electron = require("electron");

const { ipcRenderer } = electron;
const React = require("react");

const { useState } = React;
const PropTypes = require("prop-types");

const About = require("../components/About");
const Button = require("../components/WizardButton");
const LoadingScreen = require("../components/LoadingScreen");
const JupyterCommandFinder = require("../components/JupyterCommandFinder");
const MainMenu = require("../components/MainMenu");
const JupyterRuntime = require("../components/JupyterRuntime");
const Alert = require("../components/Alert");
const StackTrace = require("../components/StackTrace");
const { installKernel } = require("../../lib/install");
const { spawnJupyter } = require("../../lib/process");

const { capturer } = require("../../lib/errors");

function useLauncherState(config) {
  const [state, rawSetState] = useState({
    status: "loading",
    tab: "launcher",
    config
  });
  const currentStatus = state.status;
  const cfg = state.config;
  const { tab } = state;

  function setState(newState) {
    if (newState.status !== currentStatus) {
      cfg.logger.debug(
        `Launcher status change: ${currentStatus} -> ${newState.status}`
      );
    }
    rawSetState(newState);
  }

  function setStatus(status) {
    setState({ ...state, status });
  }

  function setStatusOnError(status) {
    return capturer(error => {
      cfg.logger.error(error);
      setState({ ...state, status, error });
    });
  }

  const confusedIfError = setStatusOnError("confused");

  function init() {
    const newConfig = cfg.loadVersionInfo();
    if (newConfig.jupyterCommand) {
      return setState({ status: "registering", config: newConfig, tab });
    }
    return setState({ status: "searching", config: newConfig, tab });
  }

  const searchForJupyter = confusedIfError(async () => {
    const newConfig = await cfg.setJupyterCommand(null).searchForJupyter();
    setState({ ...state, status: "registering", config: newConfig });
  });

  const registrationFailedIfError = setStatusOnError("registration_failed");
  const loadJupyterInfo = registrationFailedIfError(async () => {
    const newConfig = await (await cfg.loadJupyterInfo()).getKernelCommand();
    newConfig.ensureSupportedJupyterVersion();
    setState({ ...state, status: "ready", config: newConfig });
  });

  function useJupyterCommand(command) {
    const newConfig = cfg.setJupyterCommand(command);
    setState({ status: "registering", config: newConfig, tab });
  }

  const installFailedIfError = setStatusOnError("install_failed");
  const install = installFailedIfError(async () => {
    await installKernel(cfg);
    setStatus("install_succeeded");
  });

  const runJupyter = confusedIfError(async () => {
    const jupyterProcess = await spawnJupyter(cfg);
    setState({ status: "running", config: cfg, tab, jupyterProcess });
  });

  function stopJupyter() {
    const jupyter = state.jupyterProcess;
    jupyter.kill();
    jupyter.on("exit", () => {
      setState({ status: "ready", config: cfg, tab });
    });
  }

  switch (currentStatus) {
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
      break;
    default:
      break;
  }

  function setTab(newTab) {
    setState({ ...state, tab: newTab });
  }

  return {
    state,
    trySearching() {
      setStatus("searching");
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
                  "Find Manually": goBackToWhich,
                  Exit: exit
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
}

Launcher.propTypes = {
  config: PropTypes.shape({
    action: PropTypes.oneOf(["launcher"]).isRequired,
    logger: PropTypes.object.isRequired
  }).isRequired
};

module.exports = Launcher;
