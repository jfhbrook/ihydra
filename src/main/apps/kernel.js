/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2015, Nicolas Riesco and others as credited in the AUTHORS file
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

import { EventEmitter } from "events";
import * as vm from "vm";

import { ipcMain } from "electron";
import Kernel from "jp-kernel";
import { Session } from "nel";

import createWindow from "../../lib/window";

export default async function kernel(cfg) {
  const config = await (
    await cfg.loadVersionInfo().loadKernelInfoReply()
  ).loadConnectionInfo();

  const logger = config.logger.child("ihydra.main.apps.kernel");

  return new Promise((resolve, _) => {
    function sessionFactory(sessionConfig) {
      return new Session({
        cwd: sessionConfig.cwd,
        transpile: sessionConfig.transpile,
        serverFactory() {
          const window = createWindow(sessionConfig);

          const server = Object.assign(new EventEmitter(), {
            send(payload) {
              logger.debug(
                `Sending a message to the kernel: ${JSON.stringify(payload)}`,
                { payload }
              );
              window.webContents.send("kernel-send-message", payload);
            },

            kill(signal) {
              logger.debug(`Received a kill signal: ${signal} - exiting`, {
                signal
              });
              window.close();
              server.emit("exit", 0, signal);
              resolve();
            }
          });

          ipcMain.on("kernel-receive-message", (event, payload) => {
            logger.debug(
              `Received a message from the kernel: ${JSON.stringify(payload)}`,
              { ipcEvent: event, payload }
            );
            server.emit("message", payload);
          });

          return server;
        }
      });
    }

    config.sessionFactory = sessionFactory;

    const krnl = new Kernel(config);

    // WORKAROUND: Fixes https://github.com/n-riesco/ijavascript/issues/97
    // eslint-disable-next-line camelcase
    krnl.handlers.is_complete_request = function is_complete_request(request) {
      request.respond(this.iopubSocket, "status", {
        execution_state: "busy"
      });

      let content;
      try {
        // eslint-disable-next-line no-new
        new vm.Script(request.content.code);
        content = {
          status: "complete"
        };
      } catch (err) {
        content = {
          status: "incomplete",
          indent: ""
        };
      }

      request.respond(
        this.shellSocket,
        "is_complete_reply",
        content,
        {},
        this.protocolVersion
      );

      request.respond(this.iopubSocket, "status", {
        execution_state: "idle"
      });
    };

    // Interpret a SIGINT signal as a request to interrupt the kernel
    process.on("SIGINT", () => {
      logger.debug("Received a SIGINT; Interrupting kernel");
      krnl.restart(); // TODO(NR) Implement kernel interruption
    });
  });
}
