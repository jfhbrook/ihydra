const path = require("path");

const electron = require("electron");

const { app } = electron;
const isDev = require("electron-is-dev");
const window = require("electron-window");

function createWindow(context, callback) {
  const win = window.createWindow({
    webPreferences: { nodeIntegration: true }
  });

  if (isDev) {
    win.webContents.openDevTools();
    win.showURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`,
      context,
      callback
    );
  } else {
    win.showURL(path.join(__dirname, "index.html"), context, callback);
  }

  win.webContents.on("devtools-opened", () => {
    win.focus();
    setImmediate(() => {
      win.focus();
    });
  });

  return win;
}

function adminWindowManager(context) {
  let adminPanel = null;

  function createAdminPanel(callback) {
    const panel = createWindow(context, callback);

    panel.on("closed", () => {
      adminPanel = null;
    });

    return panel;
  }

  return new Promise((resolve, _) => {
    app.on("window-all-closed", () => {
      if (process.platform !== "darwin") {
        resolve();
      }
    });

    app.on("activate", () => {
      if (adminPanel === null) {
        adminPanel = createAdminPanel();
      }
    });

    app.on("ready", () => {
      adminPanel = createAdminPanel();
    });
  });
}

module.exports = { createWindow, adminWindowManager };
