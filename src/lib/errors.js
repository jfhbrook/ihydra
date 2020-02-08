function errorType(code) {
  return message => {
    const err = new Error(message);
    err.code = code;
    return error;
  };
}

const configError = errorType('ECONFIG');
const noShellError = errorType('ENOSHELL');
const jupyterNotFoundError = errorType('ENOJUPYTER');
const jupyterVersionError = errorType('EJUPYTERVERSION');
const tmpDirError = errorType('ETMPDIR');
const kernelError = errorType('EKERNEL');

exports.errorType = errorType;
exports.noShellError = noShellError;
