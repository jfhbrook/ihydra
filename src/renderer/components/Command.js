import { inspect } from "util";

import PropTypes from "prop-types";
import React from "react";
import quote from "../../lib/quote";

export default function Command({ command }) {
  let stringified;

  if (typeof command === "string") {
    stringified = command;
  } else if (Array.isArray(command)) {
    stringified = quote(command);
  } else {
    stringified = inspect(command);
  }

  return <code>{stringified}</code>;
}

Command.propTypes = {
  command: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]).isRequired
};
