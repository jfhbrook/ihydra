import * as path from "path";
import { homedir } from "os";

import { remote } from "electron";
import {
  faCheckCircle,
  faFolderOpen,
  faSearch,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import React, { useState } from "react";
import quote from "../../../common/quote";

import Button from "../Button";
import ButtonBar from "../ButtonBar";
import Hed from "../Hed";
import UI from "../UI";

import css from "./index.css";

const { dialog } = remote;

export default function JupyterCommandFinder({
  config,
  trySearching,
  useJupyterCommand,
  exit
}) {
  const [state, setState] = useState({ command: config.jupyterCommand });

  function selectFile() {
    dialog
      .showOpenDialog({
        defaultPath: state.command ? path.dirname(state.command[0]) : homedir(),
        properties: ["openFile"]
      })
      .then(result => {
        if (!result.canceled) {
          setState({ command: result.filePaths });
        }
      });
  }

  function submit() {
    useJupyterCommand(state.command);
  }

  return (
    <UI>
      <Hed>Find Jupyter</Hed>
      <div className={css.container}>
        <form className={css.finder}>
          <input
            className={css.filename}
            type="text"
            value={state.command ? quote(state.command) : "???"}
          />
          <Button icon={faFolderOpen} onClick={selectFile}>
            Browse...
          </Button>
        </form>
      </div>
      <ButtonBar>
        <Button icon={faSearch} onClick={trySearching}>
          Detect Jupyter Automatically
        </Button>
        <Button icon={faCheckCircle} onClick={submit}>
          Use This Command
        </Button>
        <Button icon={faSignOutAlt} onClick={exit}>
          Exit
        </Button>
      </ButtonBar>
    </UI>
  );
}

JupyterCommandFinder.propTypes = {
  config: PropTypes.object.isRequired,
  trySearching: PropTypes.func.isRequired,
  useJupyterCommand: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
