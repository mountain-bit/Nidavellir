const { app, BrowserWindow } = require('electron')
const { initI18n } = require('./Utils/i18n')
const { createMainWindow } = require('./main/windowManager')
const { registerAllIpc } = require('./main/ipc')

app.whenReady().then(async () => {
    await initI18n()
    registerAllIpc()
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
