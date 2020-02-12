import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function ExternalLink({ href, children }) {
  return <a className={css.link} href={href}>{children}</a>;
}

ExternalLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
