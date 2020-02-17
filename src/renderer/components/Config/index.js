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
    <div className={css.container}>
      <dl className={css.dict}>
        <div className={css.pair}>
          <dt className={css.key}>Kernel Display Name</dt>
          <dd className={css.value}>{config.displayName}</dd>
        </div>
        <div className={css.pair}>
          <dt className={css.key}>Kernel Install Folder Name</dt>
          <dd className={css.value}>{config.name}</dd>
        </div>
        <div className={css.pair}>
          <dt className={css.key} onClick={toggleCommands}>
            <FontAwesomeIcon
              icon={showCommands ? faChevronDown : faChevronRight}
            />{" "}
            Commands
          </dt>
          <dd className={css.value}>
            {showCommands ? (
              <dl className={css.dict}>
                <div className={css.pair}>
                  <dt className={css.key}>Kernel Command</dt>
                  <dd className={css.value}>
                    <Command command={config.kernelCommand} />
                  </dd>
                </div>
                <div className={css.pair}>
                  <dt className={css.key}>Jupyter Launch Command</dt>
                  <dd className={css.value}>
                    <Command
                      command={config.jupyterCommand.concat("notebook")}
                    />
                  </dd>
                </div>
              </dl>
            ) : (
              ""
            )}
          </dd>
        </div>
        <div className={css.pair}>
          <dt className={css.key} onClick={toggleVersions}>
            <FontAwesomeIcon
              icon={showCommands ? faChevronDown : faChevronRight}
            />{" "}
            Library Versions
          </dt>
          <dd className={css.value}>
            {showVersions ? (
              <dl className={css.dict}>
                {Object.entries(config.versions).map(([lib, v]) => (
                  <div className={css.pair} key={lib}>
                    <dt className={css.key}>
                      <Code>{lib}</Code>
                    </dt>
                    <dd className={css.value}>
                      <Code>v{v}</Code>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              ""
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}

Config.propTypes = {
  config: PropTypes.object.isRequired
};
