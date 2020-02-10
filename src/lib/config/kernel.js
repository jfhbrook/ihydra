/* eslint no-param-reassign: ["error", { "props": false }] */
const { readFile } = require("../fs");

const kernelMixin = {
  async loadConnectionFile() {
    const config = { ...this };

    config.connection = JSON.parse(await readFile(config.connectionFile));

    return config;
  },

  async loadKernelInfoReply() {
    let config = { ...this };

    if (getMajorVersion(config.protocolVersion) <= 4) {
      config.kernelInfoReply = {
        language: "javascript",
        language_version: getVersionTuple(process.versions.node),
        protocol_version: getVersionTuple(protocolVersion)
      };
    } else {
      config = config.loadVersionInfo();

      config.kernelInfoReply = {
        protocol_version: config.protocolVersion,
        implementation: "ihydra",
        implementation_version: config.versions.ihydra,
        language_info: {
          name: "javascript",
          version: config.versions.node,
          mimetype: "application/javascript",
          file_extension: ".js"
        },
        banner: `IHydra v${config.versions.ihydra}
https://github.com/jfhbrook/ihydra
`,
        help_links: [
          {
            text: "IHydra Homepage",
            url: "https://github.com/jfhbrook/ihydra"
          }
        ]
      };
    }
    return config;
  },

  async loadConnectionInfo() {
    const config = { ...this };
    config.connection = JSON.parse(await readFile(this.connectionFile));
    return config;
  }
};

module.exports = {
  kernelMixin
};
