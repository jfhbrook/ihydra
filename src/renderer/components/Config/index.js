import {
  faChevronRight,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Code from "../Code";
import Command from "../Command";

import css from "./index.css";

export default function Config({ config }) {
  const [{ showCommands, showVersions }, setState] = useState({
    showCommands: false,
    showVersions: false
  });

  function toggleCommands() {
    setState({ showCommands: !showCommands, showVersions });
  }

  function toggleVersions() {
    setState({ showCommands, showVersions: !showVersions });
  }

  return (
    <div className={css.config}>
      <dl>
        <dt>Kernel Display Name</dt>
        <dd>{config.displayName}</dd>
        <dt>Kernel Install Folder Name</dt>
        <dd>{config.name}</dd>
        <dt onClick={toggleCommands}>
          <FontAwesomeIcon
            icon={showCommands ? faChevronDown : faChevronRight}
          />{" "}
          Commands
        </dt>
        <dd>
          {showCommands ? (
            <dl>
              <dt>Kernel Command</dt>
              <dd>
                <Command command={config.kernelCommand} />
              </dd>
              <dt>Jupyter Launch Command</dt>
              <dd>
                <Command command={config.jupyterCommand.concat("notebook")} />
              </dd>
            </dl>
          ) : (
            ""
          )}
        </dd>
        <dt onClick={toggleVersions}>
          <FontAwesomeIcon
            icon={showCommands ? faChevronDown : faChevronRight}
          />{" "}
          Library Versions
        </dt>
        <dd>
          {showVersions ? (
            <div>
              {Object.entries(config.versions).map(([lib, v]) => (
                <>
                  <dt>
                    <Code>{lib}</Code>
                  </dt>
                  <dd>
                    <Code>v{v}</Code>
                  </dd>
                </>
              ))}
            </div>
          ) : (
            ""
          )}
        </dd>
      </dl>
    </div>
  );
}

Config.propTypes = {
  config: PropTypes.object.isRequired
};
