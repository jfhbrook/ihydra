import PropTypes from "prop-types";
import React from "react";

export default function ExternalLink({ href, children }) {
  return <a href={href}>{children}</a>;
}

ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
