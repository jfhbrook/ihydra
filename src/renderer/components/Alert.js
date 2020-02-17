import PropTypes from "prop-types";
import React from "react";

import Button from "./Button";

export default function Alert({ hed, dek, buttons }) {
  return (
    <>
      <h1>{hed}</h1>
      {dek ? <h2>{dek}</h2> : ""}
      {Object.entries(buttons).map(([label, { icon, onClick }]) => (
        <Button key={label} icon={icon} onClick={onClick}>
          {label}
        </Button>
      ))}
    </>
  );
}

Alert.propTypes = {
  hed: PropTypes.string.isRequired,
  dek: PropTypes.string,
  buttons: PropTypes.objectOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.object
    })
  ).isRequired
};

Alert.defaultProps = { dek: "" };
