const { BrowserWindow } = require('electron')
const path = require('path')

/**
 * Creates and configures the start launcher Electron application window.
 *
 * @returns {BrowserWindow}
 */
function createStartWindow() {
    const startWindow = new BrowserWindow({
        width: 1000,
        height: 640,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        transparent: true,
        resizable: false,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Silnik Gier Paragrafowych',
        backgroundColor: '#00000000',
    })

    startWindow.loadFile('View/StartWindow.html')

    return startWindow
}

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

module.exports = { createStartWindow, createMainWindow }
