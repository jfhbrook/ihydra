import PropTypes from "prop-types";
import React from "react";

import Button from "./Button";

export default function StackTrace({ error, retry, fail }) {
  return (
    <>
      <h1>FLAGRANT SYSTEM ERROR</h1>
      {error.stack.split("\n").map(l => (
        <p>{l}</p>
      ))}
      <Button onClick={retry}>Try Again</Button>
      <Button onClick={fail}>Exit</Button>
    </>
  );
}

StackTrace.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  retry: PropTypes.func.isRequired,
  fail: PropTypes.func.isRequired
};
