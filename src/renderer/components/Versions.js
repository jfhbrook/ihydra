import PropTypes from "prop-types";
import React, { useState } from "react";

import Button from "./Button";
import Code from "./Code";

export default function Versions({ versions }) {
  const [isOpen, setOpen] = useState(false);

  function expand() {
    setOpen(true);
  }

  function collapse() {
    setOpen(false);
  }

  let viewModel = Object.entries(versions);

  viewModel.sort(([a], [b]) => b > a);

  viewModel = viewModel.map(([k, v]) => [k, `v${v}`]);

  if (!isOpen) {
    return (
      <>
        <Button onClick={expand}>Expand</Button> Library Versions
      </>
    );
  }

  return (
    <>
      <Button onClick={collapse}>Collapse</Button>
      <table>
        <thead>
          <tr>
            <th>Library</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.map(([k, v]) => {
            return (
              <tr key={k}>
                <td><Code>{k}</Code></td>
                <td><Code>{v}</Code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

Versions.propTypes = {
  versions: PropTypes.objectOf(PropTypes.string).isRequired
};
