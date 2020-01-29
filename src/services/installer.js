const path = require("path");
const shellQuote = require("shell-quote").quote;
const isDev = require("electron-is-dev");

const { makeTmpdir, mkdir, writeFile, copy, rmrf } = require("../lib/fs");
const { exec } = require("../lib/process");

function quote(xs) {
  if (process.platform !== "win32") {
    return shellQuote(xs);
  }

  // I cheese this really hard here, doing the bare minimum to make
  // quoting work in the powershell case.

  // For more info, see: https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules
  return xs
    .map(s => {
      // If double quotes and spaces but no single quotes,
      // naively add single-quotes to either side and
      // quote single-quotes
      if (/["\s]/.test(s) && !/'/.test(s)) {
        return `'${s.replace(/'/g, "''")}'`;
      }

      // If a case where we have to double-quote, do so
      // and naively escape dollar signs and double-quotes
      if (/["'\s]/.test(s)) {
        return `"${s.replace(/([$"])/g, "`$1")}"`;
      }

      return s;
    })
    .join(" ");
}

async function getKernelCommand(context) {
  const prefix = await context.argv.getKernelPrefix();

  let command = prefix.concat(["kernel", "{connection_file}"]);

  if (!isDev) {
    return command;
  }

  command = quote(command);

  const root = quote([context.argv.root]);
  const shell = await context.argv.getShell();

  let shimScript;

  if (["bash", "sh"].includes(shell)) {
    shimScript = [shell, "-c", `cd ${root} && exec ${command}`];
  } else if (shell === "powershell") {
    shimScript = [shell, "-Command", `cd ${root}; ${command}`];
  } else {
    throw new Error("dont know how to do this shell");
  }

  return shimScript;
}

async function installKernel(context) {
  // Create temporary spec folder

  console.log("making a tmpdir");

  const tmpdir = await makeTmpdir();

  console.log("+1");

  const specDir = path.join(tmpdir, context.name);

  console.log("making spec dir");

  await mkdir(specDir);

  console.log("check");

  // Create spec file
  const specFile = path.join(specDir, "kernel.json");
  const spec = {
    argv: await getKernelCommand(context),
    display_name: context.displayName,
    language: "javascript"
  };

  console.log("writing spec file");

  await writeFile(specFile, JSON.stringify(spec, null, 2));

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
