const React = require("react");

const { useState } = React;

function useInstaller(context) {
  const [settings, setSettings] = useState({
    name: context.name,
    displayName: context.displayName,
    kernelCommand: context.kernel,
    localInstall: context.localInstall,
    jupyter: context.jupyter
  });


}

exports.userInstaller = useInstaller;