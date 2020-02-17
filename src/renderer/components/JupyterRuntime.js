import PropTypes from "prop-types";
import React from "react";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { prop as processProp } from "../../common/process";

import Terminal from "./Terminal";
import Button from "./Button";

export default function JupyterRuntime({ process, stopJupyter }) {
  return (
    <>
      <Terminal process={process} />
      <Button icon={faSignOutAlt} onClick={stopJupyter}>
        Stop Jupyter
      </Button>
    </>
  );
}

JupyterRuntime.propTypes = {
  process: processProp.isRequired,
  stopJupyter: PropTypes.func.isRequired
};
