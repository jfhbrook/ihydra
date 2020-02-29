/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2020, Josh Holbrook
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 */

import React from "react";
import {
  faHourglassStart,
  faHourglassHalf,
  faHourglassEnd
} from "@fortawesome/free-solid-svg-icons";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";

import UI from "../UI";
import Panel from "../Panel";
import PanelMessage from "../PanelMessage";

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
      <Panel>
        <PanelMessage
          icon={icon}
          iconStyle={{ transform: `rotate(${rotate}deg)` }}
        >
          {message}
        </PanelMessage>
      </Panel>
    </UI>
  );
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired
};
