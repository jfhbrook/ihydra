const debounce = require("debounce");
const Hydra = require("hydra-synth");
const React = require("react");

const { useEffect, useRef } = React;

const hydraCss = require("./index.css");

// TODO: This should have loading screen logic kinda like the launcher
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
