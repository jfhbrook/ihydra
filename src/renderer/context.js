const PropTypes = require("prop-types");

const prop = PropTypes.shape({
  action: PropTypes.string.isRequired,
  commanderAfterHooks: PropTypes.array,
  paths: PropTypes.shape({
    root: PropTypes.string.isRequired,
    images: PropTypes.string.isRequired
  }).required,
  kernel: PropTypes.arrayOf(PropTypes.string),
  jupyter: PropTypes.shape({
    version: PropTypes.string.isRequired,
    majorVersion: PropTypes.number.isRequired
  }).isRequired,
  args: PropTypes.arrayOf(PropTypes.string),
  name: PropTypes.string,
  displayName: PropTypes.string,
  localInstall: PropTypes.boolean
});

module.exports = { prop };
