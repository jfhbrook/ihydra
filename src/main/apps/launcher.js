import { app, ipcMain } from "electron";
import createWindow from "../../common/window";

export default function launcher(config) {
  let launcherWindow = null;

  function createLauncher(callback) {
    const panel = createWindow(config, callback);

    panel.on("closed", () => {
      launcherWindow = null;
    });

    return panel;
  }

  // TODO: Flesh out this exit hook so that window button can exit app
  return new Promise((resolve, _) => {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        resolve(0);
      }
    });

    app.on("activate", () => {
      if (launcherWindow === null) {
        launcherWindow = createLauncher();
      }
    });

    ipcMain.on("bail", (event, code) => resolve(code));

    if (app.isReady()) {
      launcherWindow = createLauncher();
    } else {
      app.on("ready", () => {
        launcherWindow = createLauncher();
      });
    }
  });
}
