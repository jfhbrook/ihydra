const React = require("react");
const PropTypes = require("prop-types");
const { processProp } = require("../../lib/process");

const Terminal = require("./Terminal");

const Button = require("./WizardButton");

module.exports = function JupyterRuntime({ process, stopJupyter }) {
  return (
    <>
      <Terminal process={process} />
      <Button onClick={stopJupyter}>Stop Jupyter</Button>
    </>
  );
};

module.exports.propTypes = {
  process: processProp.isRequired,
  stopJupyter: PropTypes.func.isRequired
};
