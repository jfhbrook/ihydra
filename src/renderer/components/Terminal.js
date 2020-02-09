const debounce = require("debounce");
const React = require("react");

const { useEffect, useRef } = React;
const XTerm = require("xterm").Terminal;

require("xterm/css/xterm.css");

module.exports = function Terminal({ process }) {
  const { stdout, stderr, scrollback } = process;
  const divRef = useRef();
  const termRef = useRef();

  useEffect(() => {
    const div = divRef.current;
    const term = new XTerm();

    termRef.current = term;

    term.open(div);

    function onData(buf) {
      term.write(buf.toString());
    }

    scrollback.forEach(l => term.write(`${l}\n`));

    stdout.on("data", onData);
    stderr.on("data", onData);

    return () => {
      stdout.removeListener("data", onData);
      stderr.removeListener("data", onData);
    };
  });

  return <div ref={divRef} />;
};
