const childProcess = require("child_process");

const { spawn } = childProcess;
const { promisify } = require("util");
const split2 = require("split2");

const { PropTypes } = require("prop-types");

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

const MAX_BUFFER = 500;

function spawnJupyter(config) {
  let argv = config.jupyterCommand;
  const command = argv.shift();

  argv = argv.concat(["notebook"]);

  if (isDev) {
    argv = argv.concat(["--debug"]);
  }
  const child = spawn(command, argv);

  child.scrollback = [];

  function addToScrollback(line) {
    child.scrollback.push(line);
    while (child.scrollback.length > MAX_BUFFER) {
      child.scrollback.shift();
    }
  }

  child.stdout.pipe(split2()).on("data", addToScrollback);
  child.stderr.pipe(split2()).on("data", addToScrollback);

  return child;
}

exports.exec = exec;
exports.spawnJupyter = spawnJupyter;

exports.processProp = PropTypes.shape({
  stdout: PropTypes.shape({
    on: PropTypes.func.isRequired,
    removeListener: PropTypes.func.isRequired
  }),
  stderr: PropTypes.shape({
    on: PropTypes.func.isRequired,
    removeListener: PropTypes.func.isRequired
  }).isRequired,
  scrollback: PropTypes.arrayOf(PropTypes.string).isRequired
});
