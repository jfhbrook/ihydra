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

import { EventEmitter } from "events";
import { inspect } from "util";

import { app, ipcMain, ipcRenderer } from "electron";

export const LEVELS = Object.fromEntries(
  ["debug", "info", "warning", "exception"].map((level, severity) => [
    level,
    severity
  ])
);

export default class Logger extends EventEmitter {
  constructor(namespace) {
    super();
    this.namespace = namespace;
  }

  log(event) {
    this.emit(event.level, event);
  }

  observe(level, observer) {
    const minimum = LEVELS[level];
    Object.entries(LEVELS).forEach(([lvl, severity]) => {
      if (severity >= minimum) {
        this.on(lvl, observer);
      }
    });
  }

  adopt(child) {
    child.observe("debug", event => this.log(event));
  }

  debug(message, metadata = {}) {
    this.log({
      level: "debug",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  info(message, metadata = {}) {
    this.log({
      level: "info",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  warn(message, metadata = {}) {
    this.log({
      level: "warning",
      message,
      namespace: this.namespace,
      ...metadata
    });
  }

  error(err, metadata = {}) {
    this.log({
      level: "exception",
      error: err,
      namespace: this.namespace,
      ...metadata
    });
  }

  fatal(err, metadata = {}) {
    this.error(err, metadata);
    this.warn("Fatal error; exiting", { error: err });

    if (app.exit) {
      app.exit(1);
    } else {
      ipcRenderer.send("bail", 1);
    }
  }

  child(namespace) {
    const child = new Logger(namespace);

    this.adopt(child);

    return child;
  }
}

export function formatEvent(event) {
  let { message } = event;

  if (typeof message === "function") {
    message = message(event);
  }

  if (message && typeof message !== "string") {
    try {
      message = inspect(message);
    } catch (err) {
      message = String(message);
    }
  }

  if (event.error) {
    if (!message) {
      message = String(event.error.stack);
    } else {
      message = `== FLAGRANT SYSTEM ERROR ==\n${event.error.stack}`;
    }
  }

  if (!message) {
    try {
      message = inspect(event);
    } catch (err) {
      message = "???";
    }
  }

  return message;
}

export function consoleObserver(event) {
  formatEvent(event)
    .split("\n")
    .forEach(l => {
      // eslint-disable-next-line no-console
      console.log(`${event.level} - ${event.namespace} - ${l}\n`);
    });
}

export function mainThreadObserver(event) {
  const unstructured = { ...event };
  if (event.error) {
    unstructured.error = {
      message: event.error.message,
      stack: String(event.error.stack)
    };
  }
  ipcRenderer.send("log-message", unstructured);
}

export function rendererThreadAdopter(logger) {
  ipcMain.on("log-message", (event, payload) => {
    logger.log({ ipcEvent: event, ...payload });
  });

  return logger;
}
