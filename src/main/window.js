var electron = require('electron');
var app = electron.app;
var isDev = require('electron-is-dev');
var window = require('electron-window');

function createWindow(context, callback) {
    var win = window.createWindow({
        webPreferences: {nodeIntegration: true}
    });

    if (isDev) {
        win.webContents.openDevTools();
        win.showURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`, context, callback);
    } else {
        win.showURL(path.join(__dirname, "index.html"), context, callback);
    }

    win.webContents.on('devtools-opened', function() {
        win.focus();
        setImmediate(function() {
            win.focus();
        });
    });

    return win;
};


function adminWindowManager(context, callback) {
    var adminPanel = null;

    function createAdminPanel() {
        var panel = createWindow(context);

        panel.on('closed', function() {
            adminPanel = null;
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

module.exports = {createWindow, adminWindowManager};