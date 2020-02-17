import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function UI({ children }) {
  return (
    <div className={css.outer}>
      <div className={css.inner}>{children}</div>
    </div>
  );
}

UI.propTypes = {
  children: PropTypes.node.isRequired
};
