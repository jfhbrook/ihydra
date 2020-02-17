import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Button({ onClick, children }) {
  return (
    <button className={css.button} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired
};
