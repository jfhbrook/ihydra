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
