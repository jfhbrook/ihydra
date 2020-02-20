/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
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

/* eslint no-param-reassign: ["error", { "props": false }] */

import { quote as shellQuote } from "shell-quote";

export default function quote(xs) {
  if (process.platform !== "win32") {
    // shell-quote quotes the curlies, which breaks the templating
    return shellQuote(xs)
      .replace("\\{", "{")
      .replace("\\}", "}");
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
