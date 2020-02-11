import debounce from "debounce";
import HydraSynth from "hydra-synth";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

// eslint-disable-next-line no-unused-vars
import css from "./index.css";

export default function Hydra({ config, onLoad }) {
  const canvasRef = useRef();
  const hydraRef = useRef();

  useEffect(() => {
    config.logger.debug("Setting up Hydra...");
    const canvas = canvasRef.current;

    const hydra = new HydraSynth({ canvas });
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
}

Hydra.propTypes = {
  config: PropTypes.shape({}).isRequired,
  onLoad: PropTypes.func.isRequired
};
