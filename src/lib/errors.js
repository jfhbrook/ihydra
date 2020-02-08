const { isPromise } = require("./promise");

function errorType(code) {
  return message => {
    const err = new Error(message);
    err.code = code;
    return error;
  };
}

const configError = errorType("ECONFIG");
const noShellError = errorType("ENOSHELL");
const jupyterNotFoundError = errorType("ENOJUPYTER");
const jupyterVersionError = errorType("EJUPYTERVERSION");
const tmpDirError = errorType("ETMPDIR");
const kernelError = errorType("EKERNEL");

function capturer(errorHandler) {
  return fn => (...args) => {
    let res;
    try {
      res = fn(...args);
    } catch (err) {
      errorHandler(err, args);
    }

    if (isPromise(res)) {
      res = res.catch(err => errorHandler(err, args));
    }

    return res;
  };
}

exports.errorType = errorType;

exports.noShellError = noShellError;
exports.jupyterNotFoundError = jupyterNotFoundError;
exports.jupyterVersionError = jupyterVersionError;
exports.tmpDirError = tmpDirError;
exports.kernelError = kernelError;

exports.capturer = capturer;
