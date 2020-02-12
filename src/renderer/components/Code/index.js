import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Code({ children }) {
  return <code className={css.code}>{children}</code>;
}

Code.propTypes = {
  children: PropTypes.node
};
