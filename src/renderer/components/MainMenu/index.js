import PropTypes from "prop-types";
import React from "react";

import Config from "../Config";
import Button from "../Button";

import css from "./index.css";

export default function MainMenu({
  config,
  tryInstall,
  goBackToWhich,
  launchJupyter,
  exit
}) {
  return (
    <div className={css.menu}>
      <h1>IHydra Launcher</h1>
      <Config config={config} />
      <Button onClick={tryInstall}>Install IHydra</Button>
      <Button onClick={goBackToWhich}>Find Jupyter</Button>
      <Button onClick={launchJupyter}>Launch Jupyter</Button>
      <Button onClick={exit}>Exit</Button>
    </div>
  );
}

MainMenu.propTypes = {
  tryInstall: PropTypes.func.isRequired,
  goBackToWhich: PropTypes.func.isRequired,
  launchJupyter: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
