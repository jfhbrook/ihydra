import * as path from "path";
import { homedir } from "os";

import { remote } from "electron";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { quote } from "shell-quote";

import Button from "./WizardButton";

const { dialog } = remote;

export default function JupyterCommandFinder({
  config,
  trySearching,
  useJupyterCommand,
  exit
}) {
  const [state, setState] = useState({ command: config.jupyterCommand });

  function selectFile() {
    dialog
      .showOpenDialog({
        defaultPath: state.command ? path.dirname(state.command[0]) : homedir(),
        properties: ["openFile"]
      })
      .then(result => {
        if (!result.canceled) {
          setState({ command: result.filePaths });
        }
      });
  }

  function submit() {
    useJupyterCommand(state.command);
  }

  return (
    <>
      <h1>wo ist die jupyter??</h1>
      <Button onClick={selectFile}>
        {state.command ? quote(state.command) : "???"}
      </Button>
      <Button onClick={trySearching}>detect jupyter automatically</Button>
      <Button onClick={submit}>use this command</Button>
      <Button onClick={exit}>exit</Button>
    </>
  );
}

JupyterCommandFinder.propTypes = {
  config: PropTypes.object.isRequired,
  trySearching: PropTypes.func.isRequired,
  useJupyterCommand: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
