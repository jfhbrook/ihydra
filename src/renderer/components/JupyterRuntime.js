import PropTypes from "prop-types";
import React from "react";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { prop as processProp } from "../../common/process";

import UI from "./UI";
import Terminal from "./Terminal";
import Button from "./Button";
import ButtonBar from "./ButtonBar";

export default function JupyterRuntime({ process, stopJupyter }) {
  return (
    <UI>
      <Terminal process={process} />
      <ButtonBar>
        <Button icon={faSignOutAlt} onClick={stopJupyter}>
          Stop Jupyter
        </Button>
      </ButtonBar>
    </UI>
  );
}

JupyterRuntime.propTypes = {
  process: processProp.isRequired,
  stopJupyter: PropTypes.func.isRequired
};
