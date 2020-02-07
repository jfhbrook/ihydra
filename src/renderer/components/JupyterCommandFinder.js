const path = require("path");
const { homedir } = require("os");

const { remote } = require("electron");

const { dialog } = remote;
const React = require("react");

const { useState } = React;

const Button = require("./WizardButton");

module.exports = function JupyterCommandFinder({
  config,
  trySearching,
  tryRegistering,
  exit
}) {
  const [state, setState] = useState({ selectedFile: null });

  function selectFile() {
    dialog
      .showOpenDialog({
        defaultPath: state.selectedFile
          ? path.dirname(state.selectedFile)
          : homedir(),
        properties: ["openFile"]
      })
      .then(result => {
        if (!result.canceled) {
          setState({ selectedFile: result.filePaths[0] });
        }
      });
  }

  return (
    <>
      <h1>wo ist die jupyter??</h1>
      <Button onClick={selectFile}>{state.selectedFile || "???"}</Button>
      <Button onClick={trySearching}>detect jupyter automatically</Button>
      <Button onClick={tryRegistering}>use this command</Button>
      <Button onClick={exit}>exit</Button>
    </>
  );
};
