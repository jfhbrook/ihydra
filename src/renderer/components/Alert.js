import PropTypes from "prop-types";
import React from "react";

import Button from "./Button";

export default function Alert({ hed, dek, buttons }) {
  return (
    <>
      <h1>{hed}</h1>
      {dek ? <h2>{dek}</h2> : ""}
      {Object.entries(buttons).map(([label, hook]) => (
        <Button key={label} onClick={hook}>
          {label}
        </Button>
      ))}
    </>
  );
}

Alert.propTypes = {
  hed: PropTypes.string.isRequired,
  dek: PropTypes.string,
  buttons: PropTypes.objectOf(PropTypes.func).isRequired
};

Alert.defaultProps = { dek: "" };
