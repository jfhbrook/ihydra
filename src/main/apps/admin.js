var electron = require("electron");
var app = electron.app;

var createWindow = require('../window');

module.exports = function(config, callback) {
    var adminPanel = null;

    function createAdminPanel() {
        var panel = createWindow('admin', {});

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