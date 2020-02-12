import PropTypes from "prop-types";
import React from "react";

export default function Keypress({ children }) {
  return <code>{children}</code>;
}

Keypress.propTypes = {
  children: PropTypes.node
};
