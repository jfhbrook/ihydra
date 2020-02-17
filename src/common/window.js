import * as path from "path";

import isDev from "electron-is-dev";
import window from "electron-window";
import { dehydrateConfig } from "./config";

export default function createWindow(config, callback) {
  const win = window.createWindow({
    title: "IHydra",
    webPreferences: { nodeIntegration: true }
  });

  if (isDev) {
    win.webContents.openDevTools();
    win.showURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`,
      dehydrateConfig(config),
      callback
    );
  } else {
    win.showURL(
      path.join(__dirname, "index.html"),
      dehydrateConfig(config),
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
