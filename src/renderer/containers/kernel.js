const React = require("react");
const { useRef } = React;
const PropTypes = require("prop-types");
const Hydra = require("../components/Hydra");

const Kernel = require("../../lib/kernel");

module.exports = ({ config }) => {
  const kernelRef = useRef();

  function onLoad() {
    const kernel = new Kernel(config);
    kernelRef.current = kernel;

    kernel.listen();
  }

  return <Hydra config={config} onLoad={onLoad} />;
};

module.exports.propTypes = {
  config: PropTypes.shape({
    action: PropTypes.oneOf(['kernel']).isRequired,
    logger: PropTypes.object.isRequired
  }).isRequired
};
