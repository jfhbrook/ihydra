const React = require("react");
const Server = require("../../lib/kernel");

// TODO: This should have loading screen logic kinda like the launcher
module.exports = ({ context }) => {
  const server = new Server(context);
  server.listen();

  return <h1>this is the hydra part</h1>;
};
