const childProcess = require("child_process");

const { spawn } = childProcess;
const { promisify } = require("util");

const isDev = require("electron-is-dev");

const exec = promisify((cmd, callback) => {
  childProcess.exec(cmd, (err, stdout, stderr) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { stdout, stderr });
    }
  });
});

function spawnJupyter(config) {
  let argv = config.jupyterCommand;
  const command = argv.shift();

  argv = argv.concat(["notebook"]);

  if (isDev) {
    argv = argv.concat(["--debug"]);
  }
  return spawn(command, argv);
}

exports.exec = exec;
exports.spawnJupyter = spawnJupyter;
