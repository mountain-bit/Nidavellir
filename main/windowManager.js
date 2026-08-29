const { BrowserWindow } = require('electron')
const path = require('path')

/**
 * Creates and configures the main Electron application window.
 *
 * @returns {BrowserWindow}
 */
function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: true,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Silnik Gier Paragrafowych',
        backgroundColor: '#18181b',
    })

    mainWindow.maximize()
    mainWindow.loadFile('View/MainWindow.html')

    return mainWindow
}

module.exports = { createMainWindow }
