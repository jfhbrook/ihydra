const React = require("react");
const PropTypes = require("prop-types");

const Button = require("./WizardButton");

module.exports = function StackTrace({ error, retry, fail }) {
  return (
    <>
      <h1>FLAGRANT SYSTEM ERROR</h1>
      {error.stack.split("\n").map(l => (
        <p>{l}</p>
      ))}
      <Button onClick={retry}>Try Again</Button>
      <Button onClick={fail}>Exit</Button>
    </>
  );
};

module.exports.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  retry: PropTypes.func.isRequired,
  fail: PropTypes.func.isRequired
};
