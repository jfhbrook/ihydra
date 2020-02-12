import PropTypes from "prop-types";
import React, { useRef } from "react";
import Hydra from "../components/Hydra";
import Server from "../../common/kernel";

export default function Kernel({ config }) {
  const kernelRef = useRef();

  function onLoad() {
    const kernel = new Server(config);
    kernelRef.current = kernel;

    kernel.listen();
  }

  return <Hydra config={config} onLoad={onLoad} />;
}

Kernel.propTypes = {
  config: PropTypes.shape({
    action: PropTypes.oneOf(["kernel"]).isRequired,
    logger: PropTypes.object.isRequired
  }).isRequired
};
