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
