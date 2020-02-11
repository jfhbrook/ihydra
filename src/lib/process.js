import { exec as processExec, spawn } from "child_process";
import { promisify } from "util";

import isDev from "electron-is-dev";
import PropTypes from "prop-types";
import split2 from "split2";

export const exec = promisify((cmd, callback) => {
  processExec(cmd, (err, stdout, stderr) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { stdout, stderr });
    }
  });
});

const MAX_BUFFER = 500;

export function spawnJupyter(config) {
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

export const prop = PropTypes.shape({
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
