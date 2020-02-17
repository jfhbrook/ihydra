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
  const [state, setState] = useState(0);

  return {
    ...HOURGLASS_STATES[state],
    tick() {
      let nextState = state + 1;
      if (nextState >= HOURGLASS_STATES.length - 1) {
        nextState = 0;
      }
      setState(nextState);
    }
  };
}

export default function LoadingScreen({ message }) {
  const { icon, rotate, tick } = useHourglassState();

  useEffect(() => {
    const iv = setInterval(tick, 200);
    return () => {
      clearInterval(iv);
    };
  });

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
