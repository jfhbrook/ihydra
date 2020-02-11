const React = require("react");
const PropTypes = require("prop-types");

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
  process: PropTypes.shape({
    stdout: PropTypes.object.isRequired,
    stderr: PropTypes.object.isRequired,
    scrollback: PropTypes.arrayOf(PropTypes.string).isRequired
  }),
  stopJupyter: PropTypes.func.isRequired
};
