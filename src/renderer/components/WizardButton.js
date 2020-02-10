const React = require("react");
const PropTypes = require("prop-types");
const Button = require("@material-ui/core/Button").default;

module.exports = function WizardButton({ onClick, children }) {
  return (
    <Button variant="contained" color="primary" onClick={onClick}>
      {children}
    </Button>
  );
};

module.exports.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};
