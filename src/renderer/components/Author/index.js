import PropTypes from "prop-types";
import React from "react";

import css from "./index.css";

export default function Author({href, children}) {
  return <a className={css.author} href={href}>{children}</a>;
}

Author.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
