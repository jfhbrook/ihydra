import { ipcRenderer } from "electron";
import PropTypes from "prop-types";
import React, { useState } from "react";

import About from "../components/About";
import Alert from "../components/Alert";
import JupyterCommandFinder from "../components/JupyterCommandFinder";
import JupyterRuntime from "../components/JupyterRuntime";
import LoadingScreen from "../components/LoadingScreen";
import MainMenu from "../components/MainMenu";
import { Tabs, TabList, Tab, TabPanel } from "../components/Tabs";
import StackTrace from "../components/StackTrace";

import { capturer } from "../../common/errors";
import installKernel from "../../common/install";
import { spawnJupyter } from "../../common/process";

function useLauncherState(config) {
  const [state, rawSetState] = useState({
    status: "loading",
    config
  });
  const currentStatus = state.status;
  const cfg = state.config;

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
      return setState({ status: "registering", config: newConfig });
    }
    return setState({ status: "searching", config: newConfig });
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
    setState({ status: "registering", config: newConfig });
  }

  const installFailedIfError = setStatusOnError("install_failed");
  const install = installFailedIfError(async () => {
    await installKernel(cfg);
    setStatus("install_succeeded");
  });

  const runJupyter = confusedIfError(async () => {
    const jupyterProcess = await spawnJupyter(cfg);
    setState({ status: "running", config: cfg, jupyterProcess });
  });

  function stopJupyter() {
    const jupyter = state.jupyterProcess;
    jupyter.kill();
    jupyter.on("exit", () => {
      setState({ status: "ready", config: cfg });
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
    startOver() {
      setStatus("loading");
    },
    exit() {
      ipcRenderer.send("bail");
    }
  };
}

export default function Launcher({ config }) {
  const {
    state,
    trySearching,
    useJupyterCommand,
    goBackToWhich,
    goBackToMain,
    tryInstall,
    launchJupyter,
    stopJupyter,
    startOver,
    exit
  } = useLauncherState(config);

  function route(routes) {
    return routes[state.status]();
  }

  return (
    <Tabs>
      <TabList>
        <Tab>Launcher</Tab>
        <Tab>About</Tab>
      </TabList>
      <TabPanel>
        {route({
          loading: () => <LoadingScreen message="Loading..." />,
          searching: () => <LoadingScreen message="Searching for Jupyter..." />,
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
        })}
      </TabPanel>
      <TabPanel>
        <About />
      </TabPanel>
    </Tabs>
  );
}

Launcher.propTypes = {
  config: PropTypes.shape({
    action: PropTypes.oneOf(["launcher"]).isRequired,
    logger: PropTypes.object.isRequired
  }).isRequired
};
