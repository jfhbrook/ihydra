import PropTypes from "prop-types";
import React from "react";

import InstallerConfig from "./InstallerConfig";
import Button from "./Button";

export default function MainMenu({
  config,
  tryInstall,
  goBackToWhich,
  launchJupyter,
  exit
}) {
  return (
    <>
      <h1>IHydra Launcher</h1>
      <InstallerConfig config={config} />
      <Button onClick={tryInstall}>Install IHydra</Button>
      <Button onClick={goBackToWhich}>Find Jupyter</Button>
      <Button onClick={launchJupyter}>Launch Jupyter</Button>
      <Button onClick={exit}>Exit</Button>
    </>
  );
}

MainMenu.propTypes = {
  tryInstall: PropTypes.func.isRequired,
  goBackToWhich: PropTypes.func.isRequired,
  launchJupyter: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
