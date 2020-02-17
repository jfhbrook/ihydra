import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Button({ onClick, icon, children }) {
  return (
    <button className={css.button} type="button" onClick={onClick}>
      {icon ? (
        <>
          <FontAwesomeIcon icon={icon} />{" "}
        </>
      ) : (
        ""
      )}
      {children}
    </button>
  );
}

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.object,
  children: PropTypes.node.isRequired
};
