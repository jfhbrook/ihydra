import PropTypes from "prop-types";
import React from "react";
import { prop as processProp } from "../../lib/process";

import Terminal from "./Terminal";
import Button from "./WizardButton";

export default function JupyterRuntime({ process, stopJupyter }) {
  return (
    <>
      <Terminal process={process} />
      <Button onClick={stopJupyter}>Stop Jupyter</Button>
    </>
  );
}

JupyterRuntime.propTypes = {
  process: processProp.isRequired,
  stopJupyter: PropTypes.func.isRequired
};
