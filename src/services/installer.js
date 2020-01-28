const path = require("path");

const { makeTmpdir, mkdir, writeFile, copy, rmrf } = require("../lib/fs");
const { exec } = require("../lib/process");

async function installKernel(context) {
  // Create temporary spec folder

  console.log("making a tmpdir");

  const tmpdir = await makeTmpdir();

  console.log("+1");

  const specDir = path.join(tmpdir, "hydra");

  console.log("making spec dir");

  await mkdir(specDir);

  console.log("check");

  // Create spec file
  const specFile = path.join(specDir, "kernel.json");
  const spec = {
    argv: context.args.kernel,
    display_name: "IHydra (Electron)",
    language: "javascript"
  };

  console.log("writing spec file");

  await writeFile(specFile, JSON.stringify(spec));

  console.log("spec file written");

  // Copy logo files
  const logoDir = path.join(context.paths.images, "nodejs");
  const logo32Src = path.join(logoDir, "js-green-32x32.png");
  const logo32Dst = path.join(specDir, "logo-32x32.png");
  const logo64Src = path.join(logoDir, "js-green-64x64.png");
  const logo64Dst = path.join(specDir, "logo-64x64.png");

  console.log("copying graphics over");

  await Promise.all([copy(logo32Src, logo32Dst), copy(logo64Src, logo64Dst)]);

  console.log("copied");

  // Install kernel spec
  const args = context.jupyter.command.concat([
    "kernelspec install --replace",
    specDir
  ]);
  if (context.localInstall) {
    args.push("--user");
  }
  const cmd = args.join(" ");

  console.log(`execing ${cmd}`);

  const { stdout, stderr } = await exec(cmd);

  console.log("exec is execed");

  // Remove temporary spec folder
  await Promise.all([specDir, tmpdir].map(d => rmrf(d)));
  console.log("cool that worked");
}

module.exports = {
  installKernel
};
