const debounce = require("debounce");
const Hydra = require("hydra-synth");
const React = require("react");
const { PropTypes } = require("prop-types");

const { useEffect, useRef } = React;

require("./index.css");

module.exports = ({ config, onLoad }) => {
  const canvasRef = useRef();
  const hydraRef = useRef();

  useEffect(() => {
    config.logger.debug("Setting up Hydra...");
    const canvas = canvasRef.current;

    const hydra = new Hydra({ canvas });
    hydraRef.current = hydra;

    const resizeHydra = debounce(
      () => hydra.resize(window.innerWidth, window.innerHeight),
      100
    );

    resizeHydra();

    window.addEventListener("resize", resizeHydra);

    onLoad(hydra);

    return () => {
      window.removeEventListener("resize", resizeHydra);
    };
  });

  return <canvas id="hydra-canvas" ref={canvasRef} />;
};

module.exports.propTypes = {
  config: PropTypes.shape({}).isRequired,
  onLoad: PropTypes.func.isRequired
};
