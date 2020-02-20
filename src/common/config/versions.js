/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
 * Based on IJavascript, Copyright (c) 2015, Nicolas Riesco and others as
 * credited in the AUTHORS file
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */

/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint global-require: "off" */
/* eslint import/no-extraneous-dependencies: "off" */

export function getMajorVersion(fullVersion) {
  // Cheesing it a little here. This should check if the version
  // matches some regexp or other - but in this codebase "unknown"
  // is used as a sentinel value so it's fine
  if (fullVersion === "unknown") {
    return Infinity;
  }
  return parseInt(fullVersion.split(".")[0], 10);
}

export function getVersionTuple(fullVersion) {
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

export default versionsMixin;
