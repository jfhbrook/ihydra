const React = require("react");
const init = require("../../kernel");

module.exports = ({ context }) => {
  console.log("trying to init the kernel");
  console.log("init");
  init(context);

  return <h1>this is the hydra part</h1>;
};
