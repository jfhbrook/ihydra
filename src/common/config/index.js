/* eslint no-param-reassign: ["error", { "props": false }] */

import * as path from "path";

import argsMixin, { hydrateArgs } from "./args";
import jupyterMixin from "./jupyter";
import kernelMixin from "./kernel";
import uiMixin from "./ui";
import versionsMixin from "./versions";
import Logger, { consoleObserver } from "../logger";

const root = path.resolve(
  path.dirname(require.resolve("../../../package.json"))
);

export function cloneConfig(old) {
  return {
    ...old
  };
}

export function hydrateConfig(old) {
  const config = {
    ...old,
    setLogger(logger) {
      const cfg = cloneConfig(this);

      cfg.logger = logger;

      return cfg;
    }
  };

  [
    argsMixin,
    versionsMixin,
    jupyterMixin,
    kernelMixin,
    uiMixin
  ].forEach(mixin => Object.assign(config, mixin));

  if (old.logger.namespace) {
    config.logger = new Logger(old.logger.namespace);
  }

  hydrateArgs(config);

  return config;
}

export function dehydrateConfig(old) {
  // TODO: This should intentionally and explicitly create a new object
  // instead of cheesing it like we are now

  return JSON.parse(JSON.stringify(old));
}

export function createDehydratedConfig() {
  const logger = new Logger("ihydra.common.config");

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

export function createConfig() {
  return hydrateConfig(createDehydratedConfig());
}
