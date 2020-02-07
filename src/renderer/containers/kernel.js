const React = require("react");

const { useRef } = React;
const Hydra = require("../components/Hydra");

const Kernel = require("../../lib/kernel");

// TODO: This should have loading screen logic kinda like the launcher
module.exports = ({ config }) => {
  const kernelRef = useRef();

  function onLoad() {
    const kernel = new Kernel(config);
    kernelRef.current = kernel;

    kernel.listen();
  }

  return <Hydra config={config} onLoad={onLoad} />;
};
