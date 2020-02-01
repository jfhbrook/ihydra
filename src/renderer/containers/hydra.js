const React = require("react");
const init = require("../../kernel");

module.exports = ({ context }) => {
  console.log(context);
  init(context);

  return <h1>this is the hydra part</h1>;
};
