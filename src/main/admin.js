var path = require('path');
var formatUrl = require('url').format;


var electron = require("electron");
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var isDev = require('electron-is-dev');

module.exports = function(config, callback) {
    var adminPanel = null;

    function createAdminPanel() {
        var panel = new BrowserWindow({
            webPreferences: {nodeIntegration: true}
        });

        if (isDev) {
            panel.webContents.openDevTools();
            panel.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
        } else {
            panel.loadURL(formatUrl({
                pathname: path.join(__dirname, "index.html").replace(/\\/g, '/', 'g'),
                protocol: "file",
                slashes: true
            }));
        }

        panel.on('closed', function() {
            adminPanel = null;
        });

        panel.webContents.on('devtools-opened', function() {
            panel.focus();
            setImmediate(function() {
                panel.focus();
            });
        });

        return panel;
    }

    app.on('window-all-closed', function() {
        if (process.platform !== 'darwin') {
            callback(null);
        }
    });

    app.on('activate', function() {
        if (adminPanel === null) {
            adminPanel = createAdminPanel();
        }
    });

    app.on('ready', function() {
        adminPanel = createAdminPanel();
    });
}