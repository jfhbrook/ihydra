const debounce = require("debounce");
const { FitAddon } = require("xterm-addon-fit");
const React = require("react");
const PropTypes = require("prop-types");

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
};

module.exports.propTypes = {
  action: PropTypes.shape({
    stdout: PropTypes.object.isRequired,
    stderr: PropTypes.object.isRequired,
    scrollback: PropTypes.arrayOf(PropTypes.string).isRequired
  })
};
