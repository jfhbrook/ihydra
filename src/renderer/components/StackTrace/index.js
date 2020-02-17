import PropTypes from "prop-types";
import React from "react";
import {
  faRedo,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";


import Button from "../Button";
import ButtonBar from "../ButtonBar";

import css from "./index.css";

export default function StackTrace({ error, retry, fail }) {
  return (
    <div className={css.outer}>
      <div className={css.inner}>
        <div className={css.stack}>
          <h1 className={css.hed}>FLAGRANT SYSTEM ERROR</h1>
          {error.stack.split("\n").map(l => (
            <p className={css.line}>{l}</p>
          ))}
        </div>
        <ButtonBar>
        <Button icon={faRedo} onClick={retry}>Try Again</Button>
          <Button icon={faSignOutAlt} onClick={fail}>Exit</Button>
        </ButtonBar>
      </div>
    </div>
  );
}

StackTrace.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  retry: PropTypes.func.isRequired,
  fail: PropTypes.func.isRequired
};
