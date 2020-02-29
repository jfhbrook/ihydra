/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */

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
