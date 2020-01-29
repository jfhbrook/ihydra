const { promisify } = require("util");
const fs = require("fs");
const stream = require("stream");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const rimraf = require("rimraf");

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const rmrf = promisify(rimraf);

async function makeTmpdir(maxAttempts) {
  const max = maxAttempts || 10;
  let attempts = 0;

  let tmpdir;
  while (!tmpdir) {
    attempts++;
    try {
      tmpdir = path.join(os.tmpdir(), crypto.randomBytes(16).toString("hex"));
      await mkdir(tmpdir);
    } catch (err) {
      if (attempts >= maxAttempts) {
        throw e;
      }
      tmpdir = null;
    }
  }

  if (!tmpdir) {
    throw new Error("did not find a tmpdir");
  }

  return tmpdir;
}

const finished = promisify(stream.finished);

async function copy(src, dst) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dst);

  readStream.pipe(writeStream);

  await finished(readStream);
}

module.exports = {
  makeTmpdir,
  copy,
  mkdir,
  writeFile,
  rmrf
};
