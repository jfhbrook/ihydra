const path = require("path");

const { app } = require("electron");
const isDev = require("electron-is-dev");
const window = require("electron-window");

const { dehydrateContext } = require("./context");

function createWindow(context, callback) {
  const win = window.createWindow({
    webPreferences: { nodeIntegration: true }
  });

  if (isDev) {
    win.webContents.openDevTools();
    win.showURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`,
      dehydrateContext(context),
      callback
    );
  } else {
    win.showURL(
      path.join(__dirname, "index.html"),
      dehydrateContext(context),
      callback
    );
  }

  win.webContents.on("devtools-opened", () => {
    win.focus();
    setImmediate(() => {
      win.focus();
    });
  });

  return win;
}

module.exports = { createWindow };
