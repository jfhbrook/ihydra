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
var fs = require("fs");
var path = require("path");

var commander = require("commander");
var electron = require("electron");
var app = electron.app;

var packageJson = require("../../package.json");

var admin = require("./apps/admin");
var kernel = require("../lib/kernel");

var rc = require("../lib/rc.js");
var context = rc.context;
var installKernelAsync = rc.installKernelAsync;
var log = rc.log;
var readPackageJson = rc.readPackageJson;
var parseCommandArgs = rc.parseCommandArgs;
var setJupyterInfoAsync = rc.setJupyterInfoAsync;
var setPaths = rc.setPaths;
var setProtocol = rc.setProtocol;
var spawnFrontend = rc.spawnFrontend;

setPaths(context);

readPackageJson(context);

var parser = new commander.Command();

var argv = {
    action: 'admin',
    config: {}
};

parser.version(packageJson.version);

parser
    .command("kernel <connection_file>")
    .option(
        "--debug",
        "Debug flag for jp-kernel"
    )
    .option(
        "--protocol <version>",
        "Set the Jupyter protocol version (format: Major[.minor[.patch]]])",
        "5.1"
    )
    .option(
        "--session-working-dir <dir>",
        "The working directory for this kernel session",
        process.cwd()
    )
    .action(function(connectionFile, opts) {
        // Adopted from kernel.js
        var action = 'kernel';
        var config = {
            debug: opts.debug || false,
            hideExecutionResult: false,
            hideUndefined: false,
            protocolVersion: opts.protocol,
            connection: JSON.parse(fs.readFileSync(connectionFile)),
            cwd: opts.sessionWorkingDir,
            startupCallback: function() {
                console.error("startupCallback:", this.startupCallback);
            }
        };

        var nodeVersion;
        var protocolVersion;
        var ihydraVersion;
        var majorVersion = parseInt(config.protocolVersion.split(".")[0]);

        if (majorVersion <= 4) {
            nodeVersion = process.versions.node.split(".")
                .map(function(v) {
                    return parseInt(v, 10);
                });
            protocolVersion = config.protocolVersion.split(".")
                .map(function(v) {
                    return parseInt(v, 10);
                });
            config.kernelInfoReply = {
                "language": "javascript",
                "language_version": nodeVersion,
                "protocol_version": protocolVersion,
            };
        } else {
            nodeVersion = process.versions.node;
            protocolVersion = config.protocolVersion;
            ihydraVersion = JSON.parse(
                fs.readFileSync(path.join(__dirname, "..", "..", "package.json"))
            ).version;
            config.kernelInfoReply = {
                "protocol_version": protocolVersion,
                "implementation": "ihydra",
                "implementation_version": ihydraVersion,
                "language_info": {
                    "name": "javascript",
                    "version": nodeVersion,
                    "mimetype": "application/javascript",
                    "file_extension": ".js",
                },
                "banner": (
                    "IHydra v" + ihydraVersion + "\n" +
                    "https://github.com/jfhbrook/ihydra\n"
                ),
                "help_links": [{
                    "text": "IHydra Homepage",
                    "url": "https://github.com/jfhbrook/ihydra",
                }],
            };
        }

        argv.action = action;
        argv.config = config;
    });

parser.command("*").action(function(self, args) {
    argv.action = args[0];
});

// if argv is of form ...electron[possible extension], ...args.., foo.js
// then we can drop the first 3 and replace w/ our own
// in production this will be different

function normalizeArgv(argv) {
    var raw = argv.slice();
    var normalized = [];

    var cmd = raw.shift();
    if (path.basename(cmd).split('.')[0] === 'electron') {
        // Appears to be running with "electron.exe"...
        normalized.push(cmd);

        // Many arguments can be passed to electron before the
        // script by electron-webpack, so we throw them out until
        // we get one that looks like a script. That way, they don't
        // confuse commander.
        //
        // This may or may not end up being super brittle.
        var script = null;
        while (true) {
            if (!raw.length) {
                break;
            }
            script = raw.shift();
            if (path.extname(path.basename(script)) === '.js') {
                normalized.push(script);
                break;
            }
        }
    } else {
        normalized.push(cmd);
    }

    return normalized.concat(raw);
}

try {
    parser.parse(normalizeArgv(process.argv));
} catch (err) {
    console.log(err);
    app.exit();
}

// TODO: object access?
switch (argv.action) {
  case 'kernel':
    console.log('running the kernel');
    kernel(argv.config);
  break;
  case 'admin':
    console.log('running the admin');
    admin(argv.config, function(err) {
      if (err) console.error(err);
      console.log('done running the admin');
      app.exit();
    });
  break;
  default:
    console.log('unknown command');
    app.exit();
}