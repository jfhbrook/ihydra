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

/* window console */
/* window stream */
/* window util */

const console = require("console");
const stream = require("stream");
const util = require("util");

const createDisplay = require("./display");

class Context {
  constructor(ipc, requester, id) {
    this.ipc = ipc;
    this.requester = requester;
    this.id = id;

    // TODO
    //this.console = new console.Console();

    //this._capturedConsole = null;

    this._async = false;
    this._done = false;

    // `$$` provides an interface for users to access the execution context
    this.$$ = Object.create(null);

    this.$$.setAsync = value => {
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

    function isPromise(output) {
      return output.then && typeof output.then === "function";
    }

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
        return promise.then(function(reply) {
          return reply.input;
        });
      }
    };

    this.$$.display = id => {
      return arguments.length === 0
        ? createDisplay(this.ipc, this.id)
        : createDisplay(this.ipc, this.id, id);
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
    message.id = this.id;

    if (this._done) {
      log("SEND: DROPPED:", message);
      return;
    }

    if (message.end) {
      this._done = true;
      this._async = false;
    }

    log("SEND:", message);

    this.ipc.send(message);
  }

  captureGlobalContext() {
    /*this._capturedConsole = console;

    this.console.Console = this._capturedConsole.Console;

    delete window.console;
    window.console = this.console;
    */

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
      get: function() {
        return this._async;
      }.bind(this),
      set: function(value) {
        this._async = !!value;
      }.bind(this),
      configurable: true,
      enumerable: false
    });

    window.$$done$$ = this.$$.done.bind(this);

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
    if (window.console === this.console) {
      delete window.console;
      window.console = this._capturedConsole;

      this._capturedConsole = null;
    }
  }
}

function formatError(error) {
  return {
    ename: error && error.name ? error.name : typeof error,
    evalue: error && error.message ? error.message : util.inspect(error),
    traceback: error && error.stack ? error.stack.split("\n") : ""
  };
}

function toMime(result) {
  const mimer =
    typeof window.$$mimer$$ === "function" ? window.$$mimer$$ : defaultMimer;
  return mimer(result);
}

function defaultMimer(result) {
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

module.exports = { Context, defaultMimer };
