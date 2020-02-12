import React from "react";
import quote from "../../lib/quote";

export default function Config({ config }) {
  const viewModel = [
    ["Jupyter Command", quote(config.jupyterCommand)],
    ["Kernel Display Name", config.displayName],
    ["Kernel Internal Name", config.name],
    ["Kernel Command", quote(config.kernelCommand)]
  ];

  Object.entries(config.versions).forEach(([lib, version]) => {
    viewModel.push([`\`${lib}\` Version`, `v${version}`]);
  });

  config.logger.info(config.jupyterCommand);

  return (
    <table>
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
      {viewModel.map(([k, v]) => {
        return (
          <tr key={k}>
            <td>{k}</td>
            <td>{v}</td>
          </tr>
        );
      })}
    </table>
  );
}
