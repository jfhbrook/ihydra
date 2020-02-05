const React = require("react");
const { quote } = require("shell-quote");

const Table = require("@material-ui/core/Table").default;
const TableBody = require("@material-ui/core/TableBody").default;
const TableCell = require("@material-ui/core/TableCell").default;
const TableContainer = require("@material-ui/core/TableContainer").default;
const TableHead = require("@material-ui/core/TableHead").default;
const TableRow = require("@material-ui/core/TableRow").default;
const Paper = require("@material-ui/core/Paper").default;

module.exports = function InstallerConfig({ config }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Installer Config">
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Kernel Name</TableCell>
            <TableCell>{config.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Kernel Display Name</TableCell>
            <TableCell>{config.displayName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Instaling locally?</TableCell>
            <TableCell>{config.localInstall ? "yup" : "nah"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jupyter Command</TableCell>
            <TableCell>{quote(config.jupyterCommand)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jupyter Version</TableCell>
            <TableCell>{config.versions.jupyter}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Kernel Command</TableCell>
            <TableCell>TODO</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
