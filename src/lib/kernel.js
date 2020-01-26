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

var console = require("console");
var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var vm = require("vm");

var app = require("electron").app;
var dbug = require("debug");
var JpKernel = require("jp-kernel");
var Session = require("nel").Session;

var server = require("./server/index");

// Add app exit to destroy hooks
class Kernel extends JpKernel {
    destroy(destroyCB) {
        super.destroy(function(code, signal) {
            destroyCB(code, signal);
        });
    }
}

module.exports = function run(config, callback) {
  // Setup logging helpers
  var log;
  var dontLog = function dontLog() {};
  var doLog = function doLog() {
      process.stderr.write("KERNEL: ");
      console.error.apply(this, arguments);
  };

  if (process.env.DEBUG) {
      global.DEBUG = true;

      try {
          doLog = debug("KERNEL:");
      } catch (err) {}
  }

  log = global.DEBUG ? doLog : dontLog;

  function sessionFactory(config) {
      return new Session({
          cwd: config.cwd,
          transpile: config.transpile,
          serverFactory: function() {
              return spawn(Session._command, ["--eval", server], {
                  cwd: config.cwd,
                  stdio: global.DEBUG ?
                      [process.stdin, process.stdout, process.stderr, "ipc"] :
                      ["ignore", "ignore", "ignore", "ipc"],
              });
          }
      });
  }

  config.sessionFactory = sessionFactory;

  // Start kernel
  var kernel = new Kernel(config);

  // WORKAROUND: Fixes https://github.com/n-riesco/ijavascript/issues/97
  kernel.handlers.is_complete_request = function is_complete_request(request) {
      request.respond(this.iopubSocket, "status", {
          execution_state: "busy"
      });

      var content;
      try {
          new vm.Script(request.content.code);
          content = {
              status: "complete",
          };
      } catch (err) {
          content = {
              status: "incomplete",
              indent: "",
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
  process.on("SIGINT", function() {
      log("Interrupting kernel");
      kernel.restart(); // TODO(NR) Implement kernel interruption
  });

  return kernel;
};