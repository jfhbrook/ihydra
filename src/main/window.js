var electron = require('electron');
var app = electron.app;
var isDev = require('electron-is-dev');
var window = require('electron-window');

module.exports = function createWindow(type, options, callback) {
    var win = window.createWindow({
        webPreferences: {nodeIntegration: true}
    });

    if (isDev) {
        win.webContents.openDevTools();
        win.showURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`, {type, options}, callback);
    } else {
        win.showURL(path.join(__dirname, "index.html"), options, callback);
    }

    win.webContents.on('devtools-opened', function() {
        win.focus();
        setImmediate(function() {
            win.focus();
        });
    });

    return win;
};