import * as path from "path";

import { copy, mkdir, makeTmpdir, rmrf, writeFile } from "./fs";
import { exec } from "./process";

export default async function installKernel(config) {
  const logger = config.logger.child("ihydra.common.install");

  logger.info("Creating temporary directory...");
  const tmpdir = await makeTmpdir();

  const specDir = path.join(tmpdir, config.name);

  await mkdir(specDir);

  logger.info("Generating spec file...");

  const specFile = path.join(specDir, "kernel.json");
  const spec = {
    argv: config.kernelCommand,
    display_name: config.displayName,
    language: "javascript"
  };

  await writeFile(specFile, JSON.stringify(spec, null, 2));

  logger.info("Copying assets...");

  const logoDir = path.join(config.paths.images, "nodejs");
  const logo32Src = path.join(logoDir, "js-green-32x32.png");
  const logo32Dst = path.join(specDir, "logo-32x32.png");
  const logo64Src = path.join(logoDir, "js-green-64x64.png");
  const logo64Dst = path.join(specDir, "logo-64x64.png");

  await Promise.all([copy(logo32Src, logo32Dst), copy(logo64Src, logo64Dst)]);

  logger.info("Registering kernel with Jupyter...");

  const args = config.jupyterCommand.concat([
    "kernelspec install --replace",
    specDir
  ]);
  if (config.localInstall) {
    args.push("--user");
  }
  const cmd = args.join(" ");

  const { stdout, stderr } = await exec(cmd);

  logger.debug(stdout);
  logger.debug(stderr);

  logger.info("Cleaning up temporary directory...");

  await Promise.all([specDir, tmpdir].map(d => rmrf(d)));

  logger.info("Done.");
}
