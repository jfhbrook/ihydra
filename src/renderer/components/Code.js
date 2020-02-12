import PropTypes from "prop-types";
import React from "react";

export default function Code({ children }) {
  return <code>{children}</code>;
}

Code.propTypes = {
  children: PropTypes.node
};
