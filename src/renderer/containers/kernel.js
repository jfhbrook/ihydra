const Hydra = require('hydra-synth')
const React = require("react");
const { useEffect, useRef } = React;

const hydraCss = require("./hydra.css");

const Server = require("../../lib/kernel");

// TODO: This should have loading screen logic kinda like the launcher
module.exports = ({ config }) => {
  const canvasRef = useRef();
  const hydraRef = useRef();
  const serverRef = useRef();

  useEffect(() => {
    config.logger.debug('Setting up Hydra...');
    const canvas = canvasRef.current;

    const hydra = new Hydra({ canvas });
    hydraRef.current = hydra;

    const server = new Server(config, canvasRef.current);
    serverRef.current = server;

    server.listen();
  });

  return <canvas ref={canvasRef} />;
};
