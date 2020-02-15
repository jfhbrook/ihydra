import React from "react";
import PropTypes from "prop-types";

import UI from "../UI";

import css from "./index.css";

export default function LoadingScreen({ message }) {
  return (
    <UI>
      <div className={css.panel}>
        <h1 className={css.message}>{message}</h1>
      </div>
    </UI>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired
};
