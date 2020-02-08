const path = require("path");
const { homedir } = require("os");

const { remote } = require("electron");

const { quote } = require("shell-quote");

const { dialog } = remote;
const React = require("react");

const { useState } = React;

const Button = require("./WizardButton");

module.exports = function JupyterCommandFinder({
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
};
