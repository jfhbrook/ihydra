const path = require('path');

const {makeTmpdir, mkdir, writeFile, copy, unlink, rmdir} = require("../lib/fs");
const {exec} = require("../lib/process");

function checkSupportedJupyterVersion(context) {
  if (context.frontend.majorVersion < 3) {
    throw new Error("frontend major version must be >= 3");
  }
}

async function installKernel(context) {
  // Create temporary spec folder
  const tmpdir = makeTmpdir();
  const specDir = path.join(tmpdir, "hydra");

  await mkdir(specDir);

  // Create spec file
  const specFile = path.join(specDir, "kernel.json");
  const spec = {
    argv: context.args.kernel,
    display_name: "IHydra (Electron)",
    language: "javascript"
  };
  await writeFile(specFile, JSON.stringify(spec));

  // Copy logo files
  const logoDir = path.join(context.path.images, "nodejs");
  const logo32Src = path.join(logoDir, "js-green-32x32.png");
  const logo32Dst = path.join(specDir, "logo-32x32.png");
  const logo64Src = path.join(logoDir, "js-green-64x64.png");
  const logo64Dst = path.join(specDir, "logo-64x64.png");

  await Promise.all([
    copy(logo32Src, logo32Dst).
    copy(logo64Src, logo64Dst)
  ]);

  // Install kernel spec
  const args = context.jupyter.command.concat([
    "kernelspec install --replace",
    specDir
  ]);
  if (context.flag.install !== "global") {
    args.push("--user");
  }
  const cmd = args.join(" ");
  const {stdout, stderr} = await exec(cmd);

  // Remove temporary spec folder
  await Promise.all([specFile, logo32Dst, logo64Dst].map(unlink));
  await Promise.all([specDir, tmpdir]).map(rmdir);
}

module.exports = {
  checkSupportedJuptyerVersion,
  installKernel
};
