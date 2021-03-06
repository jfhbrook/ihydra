/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
 * Based on IJavascript, Copyright (c) 2015, Nicolas Riesco and others as
 * credited in the AUTHORS file
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

/* eslint no-underscore-dangle: "off" */
/* eslint no-empty: "off" */
/* eslint no-console: "off" */

import * as util from "util";

import createDisplay from "./display";
import isPromise from "../is-promise";

function formatError(error) {
  return {
    ename: error && error.name ? error.name : typeof error,
    evalue: error && error.message ? error.message : util.inspect(error),
    traceback: error && error.stack ? error.stack.split("\n") : ""
  };
}

export function defaultMimer(result) {
  // eslint-disable-line complexity
  if (typeof result === "undefined") {
    return {
      "text/plain": "undefined"
    };
  }

  if (result === null) {
    return {
      "text/plain": "null"
    };
  }

  let mime;
  if (result._toMime) {
    try {
      mime = result._toMime();
    } catch (error) {}
  }
  if (typeof mime !== "object") {
    mime = {};
  }

  if (!("text/plain" in mime)) {
    try {
      mime["text/plain"] = util.inspect(result);
    } catch (error) {}
  }

  if (result._toHtml && !("text/html" in mime)) {
    try {
      mime["text/html"] = result._toHtml();
    } catch (error) {}
  }

  if (result._toSvg && !("image/svg+xml" in mime)) {
    try {
      mime["image/svg+xml"] = result._toSvg();
    } catch (error) {}
  }

  if (result._toPng && !("image/png" in mime)) {
    try {
      mime["image/png"] = result._toPng();
    } catch (error) {}
  }

  if (result._toJpeg && !("image/jpeg" in mime)) {
    try {
      mime["image/jpeg"] = result._toJpeg();
    } catch (error) {}
  }

  return mime;
}

function toMime(result) {
  const mimer =
    typeof window.$$mimer$$ === "function" ? window.$$mimer$$ : defaultMimer;
  return mimer(result);
}

export default class Context {
  constructor(server, id) {
    this.channel = server.channel;
    this.request = server.requester;
    this.request = server.requester;
    this.logger = server.logger;
    this.id = id;

    this.logger.debug(`Creating context #${id || "<initial>"}`);

    this._async = false;
    this._done = false;

    this._consoleReleaseHooks = [];

    // `$$` provides an interface for users to access the execution context
    this.$$ = Object.create(null);

    this.$$.async = value => {
      this._async = arguments.length === 0 ? true : !!value;
      return this._async;
    };

    this.$$.done = result => {
      this.send(
        arguments.length === 0
          ? {
              end: true
            }
          : {
              mime: toMime(result),
              end: true
            }
      );
    };

    const resolvePromise = outputHandler => {
      return async (output, keepAlive) => {
        let resolved = output;
        let error;
        if (isPromise(output)) {
          this.$$.async();

          try {
            resolved = await output;
          } catch (err) {
            error = err;
            this.send({
              error: formatError(err),
              end: true
            });
          }
        }

        if (!error) {
          outputHandler(resolved, keepAlive);
        }
      };
    };

    this.$$.sendResult = resolvePromise((result, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: toMime(result),
        end: !keepAlive
      });
    });

    this.$$.sendError = resolvePromise((error, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        error: formatError(error),
        end: !keepAlive
      });
    });

    this.$$.mime = resolvePromise((mimeBundle, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: mimeBundle,
        end: !keepAlive
      });
    });

    this.$$.text = resolvePromise((text, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "text/plain": text
        },
        end: !keepAlive
      });
    });

    this.$$.html = resolvePromise((html, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "text/html": html
        },
        end: !keepAlive
      });
    });

    this.$$.svg = resolvePromise((svg, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "image/svg+xml": svg
        },
        end: !keepAlive
      });
    });

    this.$$.png = resolvePromise((png, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "image/png": png
        },
        end: !keepAlive
      });
    });

    this.$$.jpeg = resolvePromise((jpeg, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "image/jpeg": jpeg
        },
        end: !keepAlive
      });
    });

    this.$$.json = resolvePromise((json, keepAlive) => {
      if (keepAlive) this.$$.async();

      this.send({
        mime: {
          "application/json": json
        },
        end: !keepAlive
      });
    });

    this.$$.input = (options, callback) => {
      this.$$.async();

      const inputRequest = {
        input: options
      };

      let inputCallback;
      if (typeof callback === "function") {
        inputCallback = (error, reply) => {
          callback(error, reply.input);
        };
      }

      const promise = this.requester.send(this, inputRequest, inputCallback);
      if (promise) {
        return promise.then(reply => {
          return reply.input;
        });
      }
      return promise;
    };

    this.$$.display = displayId => {
      return arguments.length === 0
        ? createDisplay(this.channel, this.id)
        : createDisplay(this.channel, this.id, displayId);
    };

    this.$$.clear = options => {
      this.send({
        request: {
          clear: options || {}
        }
      });
    };
  }

  send(message) {
    // eslint-disable-next-line no-param-reassign
    message.id = this.id;

    if (this._done) {
      this.logger.warning(
        `Message dropped because context is marked as done: ${JSON.stringify(
          message
        )}`
      );
      return;
    }

    if (message.end) {
      this._done = true;
      this._async = false;
    }

    this.channel.send(message);
  }

  captureGlobalContext() {
    this.logger.debug(`Capturing global context #${this.id || "<initial>"}`);

    this._consoleReleaseHooks = [];

    ["info", "log", "warn", "error"].forEach(level => {
      const captured = console[level];

      console[level] = (...args) => {
        const response = {
          id: this.id
        };

        if (["info", "log"].includes(level)) {
          response.stdout = `${util.format(...args)}\n`;
        } else {
          response.stderr = `${util.format(...args)}\n`;
        }

        this.channel.send(response);

        captured(...args);
      };

      this._consoleReleaseHooks.push(() => {
        console[level] = captured;
      });
    });

    delete window.$$;
    window.$$ = this.$$;

    if (typeof window.$$mimer$$ !== "function") {
      window.$$mimer$$ = defaultMimer;
    }

    delete window.$$mime$$;
    Object.defineProperty(window, "$$mime$$", {
      set: this.$$.mime,
      configurable: true,
      enumerable: false
    });

    delete window.$$html$$;
    Object.defineProperty(window, "$$html$$", {
      set: this.$$.html,
      configurable: true,
      enumerable: false
    });

    delete window.$$svg$$;
    Object.defineProperty(window, "$$svg$$", {
      set: this.$$.svg,
      configurable: true,
      enumerable: false
    });

    delete window.$$png$$;
    Object.defineProperty(window, "$$png$$", {
      set: this.$$.png,
      configurable: true,
      enumerable: false
    });

    delete window.$$jpeg$$;
    Object.defineProperty(window, "$$jpeg$$", {
      set: this.$$.jpeg,
      configurable: true,
      enumerable: false
    });

    delete window.$$async$$;
    Object.defineProperty(window, "$$async$$", {
      get: () => {
        return this._async;
      },
      set: value => {
        this._async = !!value;
      },
      configurable: true,
      enumerable: false
    });

    window.$$done$$ = this.$$.done.bind(this);

    // eslint-disable-next-line no-prototype-builtins
    if (!window.hasOwnProperty("$$defaultMimer$$")) {
      Object.defineProperty(window, "$$defaultMimer$$", {
        value: defaultMimer,
        configurable: false,
        writable: false,
        enumerable: false
      });
    }
  }

  releaseGlobalContext() {
    this.logger.debug(`Releasing global context #${this.id || "<initial>"}`);

    this._consoleReleaseHooks.forEach(hook => hook());
    this._consoleReleaseHooks = [];
  }
}
