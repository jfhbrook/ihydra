/* eslint no-param-reassign: ["error", { "props": false }] */

const path = require("path");

const { argsMixin, hydrateArgs } = require("./args");
const { versionsMixin } = require("./versions");
const { jupyterMixin } = require("./jupyter");
const { kernelMixin } = require("./kernel");

const root = path.resolve(
  path.dirname(require.resolve("../../../package.json"))
);

const { Logger, consoleObserver } = require("../logger");

function cloneConfig(old) {
  return {
    ...old
  };
}

function hydrateConfig(old) {
  const config = {
    ...old,
    setLogger(logger) {
      const cfg = cloneConfig(this);

      cfg.logger = logger;

      return cfg;
    }
  };

  [argsMixin, versionsMixin, jupyterMixin, kernelMixin].forEach(mixin =>
    Object.assign(config, mixin)
  );

  if (old.logger.namespace) {
    config.logger = new Logger(old.logger.namespace);
  }

  hydrateArgs(config);

  return config;
}

function dehydrateConfig(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
}

function createDehydratedConfig() {
  const logger = new Logger("ihydra.lib.config");

  logger.observe("warning", consoleObserver);

  return {
    action: "default",
    paths: {
      root,
      images: path.join(root, "images")
    },
    jupyterCommand: null,
    versions: {},
    logger
  };
}

function createConfig() {
  return hydrateConfig(createDehydratedConfig());
}

module.exports = {
  createConfig,
  createDehydratedConfig,
  hydrateConfig,
  dehydrateConfig,
  cloneConfig
};
