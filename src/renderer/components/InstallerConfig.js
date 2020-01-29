const React = require("react");
const { quote } = require("shell-quote");

const Table = require("@material-ui/core/Table").default;
const TableBody = require("@material-ui/core/TableBody").default;
const TableCell = require("@material-ui/core/TableCell").default;
const TableContainer = require("@material-ui/core/TableContainer").default;
const TableHead = require("@material-ui/core/TableHead").default;
const TableRow = require("@material-ui/core/TableRow").default;
const Paper = require("@material-ui/core/Paper").default;

module.exports = function InstallerConfig({ context }) {
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
            <TableCell>{context.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Kernel Display Name</TableCell>
            <TableCell>{context.displayName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Instaling locally?</TableCell>
            <TableCell>{context.localInstall ? "yup" : "nah"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jupyter Command</TableCell>
            <TableCell>{quote(context.jupyterCommand)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jupyter Version</TableCell>
            <TableCell>{context.versions.jupyter}</TableCell>
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
