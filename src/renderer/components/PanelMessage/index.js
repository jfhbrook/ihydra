import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";

import css from "./index.css";

export default function PanelMessage({ children, icon, iconStyle }) {
  return (
    <h1 className={css.message}>
      <FontAwesomeIcon style={iconStyle} icon={icon} /> {children || ""}
    </h1>
  );
}

PanelMessage.propTypes = {
  children: PropTypes.node.isRequired
};
