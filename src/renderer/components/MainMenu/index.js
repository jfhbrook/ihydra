import PropTypes from "prop-types";
import React from "react";
import {
  faHdd,
  faRocket,
  faSearch,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";

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
        <Button icon={faHdd} onClick={tryInstall}>
          Install IHydra
        </Button>
        <Button icon={faSearch} onClick={goBackToWhich}>
          Find Jupyter
        </Button>
        <Button icon={faRocket} onClick={launchJupyter}>
          Launch Jupyter
        </Button>
        <Button icon={faSignOutAlt} onClick={exit}>
          Exit
        </Button>
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
