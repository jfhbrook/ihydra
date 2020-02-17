import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Emph({ children }) {
  return <strong className={css.emph}>{children}</strong>;
}

Emph.propTypes = {
  children: PropTypes.node.isRequired
};
