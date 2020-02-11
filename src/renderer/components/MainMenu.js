const React = require("react");
const PropTypes = require("prop-types");

const InstallerConfig = require("./InstallerConfig");
const Button = require("./WizardButton");

module.exports = function MainMenu({
  config,
  tryInstall,
  goBackToWhich,
  launchJupyter,
  exit
}) {
  return (
    <>
      <h1>IHydra Launcher</h1>
      <InstallerConfig config={config} />
      <Button onClick={tryInstall}>Install IHydra</Button>
      <Button onClick={goBackToWhich}>Find Jupyter</Button>
      <Button onClick={launchJupyter}>Launch Jupyter</Button>
      <Button onClick={exit}>Exit</Button>
    </>
  );
};

module.exports.propTypes = {
  config: PropTypes.object.isRequired,
  tryInstall: PropTypes.func.isRequired,
  goBackToWhich: PropTypes.func.isRequired,
  launchJupyter: PropTypes.func.isRequired,
  exit: PropTypes.func.isRequired
};
