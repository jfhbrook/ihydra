import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHourglassStart } from '@fortawesome/free-solid-svg-icons'
import PropTypes from "prop-types";
import React from "react";

import UI from "../UI";

import css from "./index.css";

export default function LoadingScreen({ message }) {
  return (
      <UI>
      <div className={css.panel}>
        <h1 className={css.message}><FontAwesomeIcon icon={faHourglassStart}/> {message}</h1>
      </div>
    </UI>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired
};
