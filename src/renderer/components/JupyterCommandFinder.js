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

import * as path from "path";
import { homedir } from "os";

import { remote } from "electron";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { quote } from "shell-quote";

import Button from "./Button";

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
    <>
      <h1>wo ist die jupyter??</h1>
      <Button onClick={selectFile}>
        {state.command ? quote(state.command) : "???"}
      </Button>
      <Button onClick={trySearching}>detect jupyter automatically</Button>
      <Button onClick={submit}>use this command</Button>
      <Button onClick={exit}>exit</Button>
    </>
  );
}

JupyterCommandFinder.propTypes = {
  config: PropTypes.object.isRequired,
  trySearching: PropTypes.func.isRequired,
  useJupyterCommand: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
