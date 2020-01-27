const React = require("react");
const Button = require("@material-ui/core/Button").default;

module.exports = function WizardButton({onClick, children}) {
  return (
    <Button variant="contained" color="primary" onClick={onClick}>
      {children}
    </Button>
  );
};