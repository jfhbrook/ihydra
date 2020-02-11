const React = require("react");
const PropTypes = require("prop-types");

const Button = require("./WizardButton");

module.exports = function Alert({ hed, dek, buttons }) {
  return (
    <>
      <h1>{hed}</h1>
      {dek ? <h2>{dek}</h2> : ""}
      {Object.entries(buttons).map(([label, hook], i) => (
        <Button key={i} onClick={hook}>
          {label}
        </Button>
      ))}
    </>
  );
};

module.exports.propTypes = {
  hed: PropTypes.string.isRequired,
  dek: PropTypes.string,
  buttons: PropTypes.objectOf(PropTypes.func)
};
