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

import { EventEmitter } from "events";
import * as util from "util";
import * as vm from "vm";

import { ipcRenderer } from "electron";

import Context, { defaultMimer } from "./context";
import Requester from "./requester";
import { kernelError } from "../errors";
import isPromise from "../is-promise";

function getAllPropertyNames(object) {
  const propertyList = [];

  if (object === undefined) {
    return [];
  }

  if (object === null) {
    return [];
  }

  let prototype;
  if (typeof object === "boolean") {
    prototype = Boolean.prototype;
  } else if (typeof object === "number") {
    prototype = Number.prototype;
  } else if (typeof object === "string") {
    prototype = String.prototype;
  } else {
    prototype = object;
  }

  const prototypeList = [prototype];

  function pushToPropertyList(e) {
    if (propertyList.indexOf(e) === -1) {
      propertyList.push(e);
    }
  }

  while (prototype) {
    const names = Object.getOwnPropertyNames(prototype).sort();
    names.forEach(pushToPropertyList);

    prototype = Object.getPrototypeOf(prototype);
    if (prototype === null) {
      break;
    }

    if (prototypeList.indexOf(prototype) === -1) {
      prototypeList.push(prototype);
    }
  }

  return propertyList;
}

function inspect(object) {
  if (object === undefined) {
    return {
      string: "undefined",
      type: "Undefined"
    };
  }

  if (object === null) {
    return {
      string: "null",
      type: "Null"
    };
  }

  if (typeof object === "boolean") {
    return {
      string: object ? "true" : "false",
      type: "Boolean",
      constructorList: ["Boolean", "Object"]
    };
  }

  if (typeof object === "number") {
    return {
      string: util.inspect(object),
      type: "Number",
      constructorList: ["Number", "Object"]
    };
  }

  if (typeof object === "string") {
    return {
      string: object,
      type: "String",
      constructorList: ["String", "Object"],
      length: object.length
    };
  }

  if (typeof object === "function") {
    return {
      string: object.toString(),
      type: "Function",
      constructorList: ["Function", "Object"],
      length: object.length
    };
  }

  function toString(obj) {
    try {
      return util.inspect(obj.valueOf());
    } catch (e) {
      return util.inspect(obj);
    }
  }

  function getConstructorList(obj) {
    const constructorList = [];

    for (
      let prototype = Object.getPrototypeOf(obj);
      prototype && prototype.constructor;
      prototype = Object.getPrototypeOf(prototype)
    ) {
      constructorList.push(prototype.constructor.name);
    }

    return constructorList;
  }

  const constructorList = getConstructorList(object);
  const result = {
    string: toString(object),
    type: constructorList[0] || "",
    constructorList
  };

  if ("length" in object) {
    result.length = object.length;
  }

  return result;
}

function run(code) {
  return vm.runInThisContext(code);
}

export default class Server {
  constructor(config) {
    const logger = config.logger.child("ihydra.common.kernel.Server");
    const channel = Object.assign(new EventEmitter(), {
      send(payload) {
        logger.debug(
          `Sending payload to main thread: ${JSON.stringify(payload)}`,
          { payload }
        );
        ipcRenderer.send("kernel-receive-message", payload);
      }
    });

    this.logger = logger;
    this.channel = channel;
  }

  listen() {
    ipcRenderer.on("kernel-send-message", (event, payload) =>
      this.onMessage(payload)
    );
    this.channel.on("uncaughtException", (event, err) =>
      this.onUncaughtException(err)
    );

    // Create instance to send requests
    const requester = new Requester();

    this.requester = requester;

    // Capture the initial context
    // (id left undefined to indicate this is the initial context)
    const initialContext = new Context(this);

    this.initialContext = initialContext;

    Object.defineProperty(global, "$$defaultMimer$$", {
      value: defaultMimer,
      configurable: false,
      writable: false,
      enumerable: false
    });

    this.logger.info("Kernel is online");
    this.channel.send({
      status: "online"
    });
  }

  onUncaughtException(error) {
    this.logger.exception(error);
    this.logger.debug(`Sending error to main thread: ${error.message}`);
    this.channel.send({
      stderr: error.stack.toString()
    });
  }

  onMessage(message) {
    this.logger.debug(
      `Received a message from main thread: ${JSON.stringify(message)}`
    );

    const action = message[0];
    const code = message[1];
    const id = message[2];

    this.initialContext.releaseGlobalContext();
    const context = new Context(this, id);
    context.captureGlobalContext();

    try {
      if (action === "getAllPropertyNames") {
        this.onNameRequest(code, context);
      } else if (action === "inspect") {
        this.onInspectRequest(code, context);
      } else if (action === "run") {
        this.onRunRequest(code, context);
      } else if (action === "reply") {
        this.onReply(message);
      } else {
        throw kernelError(`Unhandled kernel action: ${action}`);
      }
    } catch (error) {
      context.$$.sendError(error);
    }

    context.releaseGlobalContext();
    this.initialContext.captureGlobalContext();
    // eslint-disable-next-line no-underscore-dangle
    this.initialContext._done = false;
  }

  // eslint-disable-next-line class-methods-use-this
  onReply(message) {
    const reply = message[1];
    const id = message[3];
    this.requester.receive(id, reply);
  }

  // eslint-disable-next-line class-methods-use-this
  onNameRequest(code, context) {
    context.send({
      id: context.id,
      names: getAllPropertyNames(run(code)),
      end: true
    });
  }

  // eslint-disable-next-line class-methods-use-this
  onInspectRequest(code, context) {
    context.send({
      id: context.id,
      inspection: inspect(run(code)),
      end: true
    });
  }

  onRunRequest(code, context) {
    const result = run(code);

    this.logger.debug(`Ran ${JSON.stringify(code)} with result ${result}`);

    // If a result has already been sent, do not send this result.
    // eslint-disable-next-line no-underscore-dangle
    if (context._done) {
      this.logger.warning(
        `Finished running ${JSON.stringify(
          code
        )} but its context is already marked as done!`
      );
      return;
    }

    // If the result is a Promise, send the result fulfilled by the promise
    if (isPromise(result)) {
      context.$$.sendResult(result);
      return;
    }

    // If async mode has been enabled (and the result is not a Promise),
    // do not send this result.
    // eslint-disable-next-line no-underscore-dangle
    if (context._async) {
      this.logger.warning(
        `Context for ${JSON.stringify(
          code
        )} is marked as async but the result is a non-promise!`
      );
      return;
    }

    // If no result has been sent yet and async mode has not been enabled,
    // send this result.
    context.$$.sendResult(result);
  }
}
