import React from "react";
import PropTypes from "prop-types";

export default function LoadingScreen({ message }) {
  return <h1>{message}</h1>;
}

LoadingScreen.propTypes = {
  message: PropTypes.string.isRequired
};
