const React = require("react");
const Hydra = require("../components/Hydra");

// TODO: This should have loading screen logic kinda like the launcher
module.exports = ({ config }) => {
  return <Hydra config={config} />;
};
