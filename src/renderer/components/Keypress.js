import PropTypes from "prop-types";
import React from "react";

import Code from "./Code";

export default function Keypress({ children }) {
  return <Code>{children}</Code>;
}

Keypress.propTypes = {
  children: PropTypes.node
};
