const React = require("react");
const init = require("../../kernel");

// TODO: This should have loading screen logic kinda like the launcher
module.exports = ({ context }) => {
  init(context);

  return <h1>this is the hydra part</h1>;
};
