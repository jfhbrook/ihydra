import PropTypes from "prop-types";
import React from "react";

import Config from "../Config";
import Button from "../Button";
import ButtonBar from "../ButtonBar";
import Hed from "../Hed";
import UI from "../UI";

import css from "./index.css";

export default function MainMenu({
  config,
  tryInstall,
  goBackToWhich,
  launchJupyter,
  exit
}) {
  return (
    <UI>
      <Hed>IHydra Launcher</Hed>
      <Config config={config} />
      <ButtonBar>
        <Button onClick={tryInstall}>Install IHydra</Button>
        <Button onClick={goBackToWhich}>Find Jupyter</Button>
        <Button onClick={launchJupyter}>Launch Jupyter</Button>
        <Button onClick={exit}>Exit</Button>
      </ButtonBar>
    </UI>
  );
}

MainMenu.propTypes = {
  tryInstall: PropTypes.func.isRequired,
  goBackToWhich: PropTypes.func.isRequired,
  launchJupyter: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
