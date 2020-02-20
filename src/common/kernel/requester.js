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

export default class Requester {
  constructor() {
    // id for next request
    this.id = 0;

    // callback associated with a request (indexed by id)
    this.callbacks = {};

    // the Promise resolve callback associated with a request (indexed by id)
    this.resolves = {};

    // the Promise reject callback associated with a request (indexed by id)
    this.rejects = {};

    // the string to be returned to a request (indexed by id)
    this.responses = {};
  }

  // send a request
  send(context, request, callback) {
    const { id } = this;
    this.id += 1;

    if (callback) {
      this.callbacks[id] = callback;
    }

    const promise = new Promise((resolve, reject) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!this.responses.hasOwnProperty(id)) {
        this.resolves[id] = resolve;
        this.rejects[id] = reject;
        return;
      }

      const response = this.responses[id];
      delete this.responses[id];
      resolve(response);
    });

    request.id = id;

    context.send({
      request
    });

    return promise;
  }

  // pass reply to the callbacks associated with a request
  receive(id, reply) {
    const callback = this.callbacks[id];
    if (callback) {
      delete this.callbacks[id];
      callback(null, reply);
    }

    const resolve = this.resolves[id];
    if (resolve) {
      delete this.resolves[id];
      delete this.rejects[id];
      resolve(reply);
    }
  }
}
