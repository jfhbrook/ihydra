const childProcess = require("child_process");
const { promisify } = require("util");

const exec = promisify((cmd, callback) => {
  childProcess.exec(cmd, (err, stdout, stderr) => {
    if (err) {
      callback(err);
    } else {
      callback(null, { stdout, stderr });
    }
  });
});

exports.exec = exec;