const React = require("react");
const PropTypes = require("prop-types");

module.exports = function LoadingScreen({ message }) {
  return <h1>{message}</h1>;
};

module.exports.propTypes = {
  message: PropTypes.string
};
