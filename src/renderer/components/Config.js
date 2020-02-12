import PropTypes from "prop-types";
import React from "react";

import Command from "./Command";
import Versions from "./Versions";

export default function Config({ config }) {
  const viewModel = [
    ["Kernel Display Name", () => <Command command={config.displayName} />],
    ["Kernel Internal Name", config.name],
    ["Kernel Command", () => <Command command={config.kernelCommand} />],
    [
      "Jupyter Launch Command",
      () => <Command command={config.jupyterCommand.concat("notebook")} />
    ]
  ];

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.map(([k, v]) => {
            return (
              <tr key={k}>
                <td>{k}</td>
                <td>{typeof v === "function" ? v() : v}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Versions versions={config.versions} />
    </>
  );
}

Config.propTypes = {
  config: PropTypes.object.isRequired
};
