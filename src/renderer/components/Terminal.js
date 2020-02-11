import debounce from "debounce";
import { FitAddon } from "xterm-addon-fit";
import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";

// eslint-disable-next-line no-unused-vars
import css from "xterm/css/xterm.css";
import { prop as processProp } from "../../lib/process";

export default function Terminal({ process }) {
  const { stdout, stderr, scrollback } = process;
  const divRef = useRef();
  const termRef = useRef();

  useEffect(() => {
    const div = divRef.current;
    const term = new XTerm();

    const fitter = new FitAddon();
    term.loadAddon(fitter);

    termRef.current = term;

    term.open(div);

    const resizeTerminal = debounce(() => fitter.fit(), 100);

    function onData(buf) {
      term.write(buf.toString());
    }

    scrollback.forEach(l => term.write(`${l}\n`));

    stdout.on("data", onData);
    stderr.on("data", onData);

    resizeTerminal();

    window.addEventListener("resize", resizeTerminal);

    return () => {
      stdout.removeListener("data", onData);
      stderr.removeListener("data", onData);
      window.removeEventListener("resize", resizeTerminal);
    };
  });

  return <div ref={divRef} />;
}

Terminal.propTypes = {
  process: processProp.isRequired
};
