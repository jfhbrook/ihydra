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

import debounce from "debounce";
import HydraSynth from "hydra-synth";
import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

// eslint-disable-next-line no-unused-vars
import css from "./index.css";

export default function Hydra({ config, onLoad }) {
  const canvasRef = useRef();
  const hydraRef = useRef();

  useEffect(() => {
    config.logger.debug("Setting up Hydra...");
    const canvas = canvasRef.current;

    const hydra = new HydraSynth({ canvas });
    hydraRef.current = hydra;

    const resizeHydra = debounce(
      () => hydra.resize(window.innerWidth, window.innerHeight),
      100
    );

    resizeHydra();

    window.addEventListener("resize", resizeHydra);

    onLoad(hydra);

    return () => {
      window.removeEventListener("resize", resizeHydra);
    };
  });

  return <canvas className={css.hydra} ref={canvasRef} />;
}

Hydra.propTypes = {
  config: PropTypes.shape({}).isRequired,
  onLoad: PropTypes.func.isRequired
};
