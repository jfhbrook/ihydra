var execCb = require("child_process").exec;
var path = require("path");
var promisify = require("util").promisify;

var commander = require("commander");
var electron = require("electron");
var app = electron.app;
var isDev = require("electron-is-dev");
var quote = require("shell-quote").quote;
var which = require("which");

var packageJson = require("../../package.json");

var exec = promisify((cmd, callback) => {
    execCb(cmd, (err, stdout, stderr) => {
        if (err) return callback(err);
        callback(null, {stdout, stderr});
    });
});

function electronArgv(argv) {
    var raw = argv.slice();
    var kernel = [];

    if (isDev) {
        // This script *should* be running using the electron bin
        kernel.push(argv.shift());

        // Many arguments can be passed to electron before the
        // script by electron-webpack, so we throw them out until
        // we get one that looks like a script. This is both so
        // that we don't confuse commander and so that we can
        // use this information to reliably run the kernel.
        //
        // This may or may not end up being super brittle.
        var script = null;
        while (true) {
            if (!raw.length) {
                break;
            }
            script = raw.shift();
            if (path.extname(path.basename(script)) === '.js') {
                kernel.push(script);
                break;
            }
        }
    } else {
        // This program is running in a bundled form and should be
        // executed directly
        kernel.push(cmd);
    }

    return {kernel, args: raw};
}

function commanderArgv({ kernel, args }) {
    if (kernel.length === 2) {
        return kernel.concat(args);
    } else {
        return [kernel[0], 'dummy.js'].concat(args);
    }
}

function kernelAction(context) {
    return function(connectionFile, opts) {
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
            ihydraVersion = packageJson.version;
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

        context.action = action;
        context.config = config;
    };
}

function kernelCommand(context, parser) {
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
        .action(kernelAction(context));
}

function adminCommand(context, parser) {
    // Admin is the default action
    context.action = 'admin';

    // We use a catch-all to direct anything that isn't either
    // the root or "admin"
    parser
        .command("*")
        .action(function(cmd, args) {
            context.action = args[0];
        });

    return function() {
        // If we're the admin then we can safely do admin-specific data loading
        if (context.action === 'admin') {
            context.name = 'hydra';
            context.displayName = 'IHydra';
            context.localInstall = true;
        }
    };
}

function createContext(argv) {
    // TODO: See if this is right
    const root = app.getPath('exe');

    const context = {
        action: 'default',
        _commanderAfterHooks: [],

        paths: {
            root: root,
            images: path.join(root, "images")
        },

        attachCommand(parser, command) {
            var afterHook = command(this, parser);
            if (afterHook) {
                this._commanderAfterHooks.push(afterHook);
            }
        },

        parseArgs(argv) {
            const eArgv = electronArgv(argv);

            this.kernel = eArgv.kernel;
            this.args = eArgv.args;

            var parser = new commander.Command();

            parser.version(packageJson.version);

            parser.option(
                "--debug",
                "Log debug messages"
            );

            this.attachCommand(parser, kernelCommand);
            this.attachCommand(parser, adminCommand);

            parser.parse(commanderArgv(eArgv));

            this._commanderAfterHooks.forEach(hook => hook(this));

            this.debug = parser.debug;
        },
        
        async loadJupyterInfo() {
            let cmd = this.jupyter;
            if (!cmd) {
                cmd = [await which('jupyter')];
            }

            cmd = quote(cmd.concat(['--version']));

            // TODO: IJavascript attempts to fall back to IPython
            let {stdout, stderr} = exec(cmd);

            this.jupyter = { cmd };

            var version;
            var majorVersion;

            // Parse version number before Jupyter 4.5.0
            version = stdout.toString().trim();
            majorVersion = parseInt(version.split(".")[0]);

            if (isNaN(majorVersion)) {
                // Parse version number after Jupyter 4.5.0
                var match = stdout.match(/^jupyter core\s+: (\d+\.\d+\.\d+)/m);
                if (match) {
                    version = match[1];
                    majorVersion = parseInt(version.split(".")[0]);
                } else {
                    // Failed to parse the output of "jupyter --version"
                    console.warn(
                        "Warning: Unable to parse Jupyter version:",
                        stdout
                    );
                    version = "unknown";
                    majorVersion = Infinity;
                }
            }

            this.jupyter.version = version;
            this.jupyter.majorVersion = majorVersion;            
        }
    };

    return context;
}

module.exports = createContext;