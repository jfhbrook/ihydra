import { FitAddon } from "xterm-addon-fit";
import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";

import css from "./index.css";
import { prop as processProp } from "../../../common/process";

export default function Terminal({ process }) {
  const { stdout, stderr, scrollback } = process;
  const divRef = useRef();
  const termRef = useRef();

  useEffect(() => {
    const div = divRef.current;
    const term = new XTerm({ fontFamily: "Source Code Pro" });

    const fitter = new FitAddon();
    term.loadAddon(fitter);

    termRef.current = term;

    term.open(div);

    function onData(buf) {
      term.write(buf.toString());
    }

    scrollback.forEach(l => term.write(`${l}\n`));

    stdout.on("data", onData);
    stderr.on("data", onData);

    // This has strange behavior during early loading and
    // I'm not sure what event to listen to in order to avoid
    // these issues, so shrug
    const iv = setInterval(() => fitter.fit(), 200);

    return () => {
      stdout.removeListener("data", onData);
      stderr.removeListener("data", onData);
      clearInterval(iv);
    };
  });

  return <div className={css.xterm} ref={divRef} />;
}

Terminal.propTypes = {
  process: processProp.isRequired
};
