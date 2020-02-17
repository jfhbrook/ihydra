import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Hed({ children }) {
  return <h1 className={css.hed}>{children}</h1>;
}

Hed.propTypes = {
  children: PropTypes.node.isRequired
};
