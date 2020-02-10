/* eslint no-param-reassign: ["error", { "props": false }] */

function getMajorVersion(fullVersion) {
  // Cheesing it a little here. This should check if the version
  // matches some regexp or other - but in this codebase "unknown"
  // is used as a sentinel value so it's fine
  if (fullVersion === "unknown") {
    return Infinity;
  }
  return parseInt(fullVersion.split(".")[0], 10);
}

function getVersionTuple(fullVersion) {
  return fullVersion.split(".").map(v => parseInt(v, 10));
}

const versionsMixin = {
  loadVersionInfo() {
    const config = { ...this };

    config.versions = Object.assign(config.versions, {
      jmp: require("jmp/package.json").version,
      nel: require("nel/package.json").version,
      uuid: require("uuid/package.json").version,
      zeromq: require("zeromq/package.json").version,
      node: process.versions.node,
      v8: process.versions.v8,
      chrome: process.versions.chrome,
      electron: process.versions.electron,
      ihydra: require("../../../package.json").version
    });

    return config;
  }
};

module.exports = { getMajorVersion, getVersionTuple, versionsMixin };
