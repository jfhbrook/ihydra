import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as stream from "stream";
import { promisify } from "util";

import rimraf from "rimraf";

import { tmpDirError } from "./errors";

export const mkdir = promisify(fs.mkdir);
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const access = promisify(fs.access);

export const rmrf = promisify(rimraf);

export async function makeTmpdir(maxAttempts) {
  const max = maxAttempts || 10;
  let attempts = 0;

  let tmpdir;
  while (!tmpdir && attempts < max) {
    attempts += 1;
    try {
      tmpdir = path.join(os.tmpdir(), crypto.randomBytes(16).toString("hex"));
      // eslint-disable-next-line no-await-in-loop
      await mkdir(tmpdir);
    } catch (err) {
      if (attempts >= maxAttempts) {
        throw err;
      }
      tmpdir = null;
    }
  }

  if (!tmpdir) {
    throw tmpDirError("Could not create a temporary directory");
  }

  return tmpdir;
}

export const finished = promisify(stream.finished);

export async function copy(src, dst) {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dst);

  readStream.pipe(writeStream);

  await finished(readStream);
}
