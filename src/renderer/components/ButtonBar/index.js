import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

// TODO: Left and right justified buttons
export default function ButtonBar({ children }) {
  return <div className={css.bar}>{children}</div>;
}

ButtonBar.propTypes = {
  children: PropTypes.node.isRequired
};
