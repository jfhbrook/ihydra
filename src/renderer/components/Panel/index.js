import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Panel({ children }) {
  return <div className={css.panel}>{children}</div>;
}

Panel.propTypes = {
  children: PropTypes.node.isRequired
};
