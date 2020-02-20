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
