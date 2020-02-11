/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2017, Nicolas Riesco and others as credited in the AUTHORS file
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

// eslint-disable-next-line camelcase
module.exports = function createDisplay(ipc, context_id, display_id) {
  // eslint-disable-line no-unused-vars
  let send;

  if (arguments.length < 3) {
    // case: without a display_id
    send = mime => {
      ipc.send({
        id: context_id,
        display: {
          mime
        }
      });
    };
  } else {
    // case: with a display_id
    send = mime => {
      ipc.send({
        id: context_id,
        display: {
          display_id,
          mime
        }
      });
    };

    // open the display_id
    ipc.send({
      id: context_id,
      display: {
        open: display_id
      }
    });
  }

  return {
    mime(mimeBundle) {
      send(mimeBundle);
    },

    text(text) {
      send({ "text/plain": text });
    },

    html(html) {
      send({ "text/html": html });
    },

    svg(svg) {
      send({ "image/svg+xml": svg });
    },

    png(png) {
      send({ "image/png": png });
    },

    jpeg(jpeg) {
      send({ "image/jpeg": jpeg });
    },

    json(json) {
      send({ "application/json": json });
    },

    close() {
      process.send({
        id: context_id,
        display: {
          close: display_id
        }
      });
    }
  };
};
