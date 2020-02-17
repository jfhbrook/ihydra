import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHourglassStart,
  faHourglassHalf,
  faHourglassEnd
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";

import UI from "../UI";

import css from "./index.css";

const HOURGLASS_STATES = [
  { icon: faHourglassStart, rotate: 0 },
  { icon: faHourglassHalf, rotate: 0 },
  { icon: faHourglassEnd, rotate: 0 },
  { icon: faHourglassEnd, rotate: 45 },
  { icon: faHourglassEnd, rotate: 90 },
  { icon: faHourglassEnd, rotate: 135 }
];

function useHourglassState() {
  const [state, setState] = useState({ running: false, state: 0 });
  if (state.running) {
    setTimeout(() => {
      if (state.running) {
        let nextState = state.state + 1;
        if (state.state >= HOURGLASS_STATES.length - 1) {
          nextState = 0;
        }
        setState({ running: state.running, state: nextState });
      }
    }, 200);
  }

  return {
    ...HOURGLASS_STATES[state.state],
    start() {
      setState({ state: state.state, running: true });
    },
    stop() {
      setState({ state: state.state, running: false });
    },
    running: state.running
  };
}

export default function LoadingScreen({ message }) {
  const { icon, rotate, start, stop, running } = useHourglassState();
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  return (
    <UI>
      <div className={css.panel}>
        <h1 className={css.message}>
          <FontAwesomeIcon
            style={{ transform: `rotate(${rotate}deg)` }}
            icon={icon}
          />{" "}
          {message}
        </h1>
      </div>
    </UI>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired
};
