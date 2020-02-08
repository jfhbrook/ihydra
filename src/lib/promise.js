function isPromise(maybeP) {
  return maybeP && maybeP.then && typeof maybeP.then === "function";
}

exports.isPromise = isPromise;
