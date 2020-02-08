const path = require("path");

const electron = require("electron");

const { app, ipcMain } = electron;
const isDev = require("electron-is-dev");
const window = require("electron-window");
const { createWindow } = require("../../lib/window");

function launcher(config) {
  let launcher = null;

  function createLauncher(callback) {
    const panel = createWindow(config, callback);

    panel.on("closed", () => {
      launcher = null;
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
      if (launcher === null) {
        launcher = createLauncher();
      }
    });

    ipcMain.on("bail", (event, code) => resolve(code));

    if (app.isReady()) {
      launcher = createLauncher();
    } else {
      app.on("ready", () => {
        launcher = createLauncher();
      });
    }
  });
}

module.exports = launcher;
