import isPromise from "./is-promise";

export function errorType(code) {
  return message => {
    const err = new Error(message);
    err.code = code;
    return err;
  };
}

export const configError = errorType("ECONFIG");
export const noShellError = errorType("ENOSHELL");
export const jupyterNotFoundError = errorType("ENOJUPYTER");
export const jupyterVersionError = errorType("EJUPYTERVERSION");
export const tmpDirError = errorType("ETMPDIR");
export const kernelError = errorType("EKERNEL");

export function capturer(errorHandler) {
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
