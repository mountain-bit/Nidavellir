const { app, BrowserWindow } = require('electron')
const { initI18n } = require('./Utils/i18n')
const { createStartWindow } = require('./main/windowManager')
const { registerAllIpc } = require('./main/ipc')
const {
    registerAssetScheme,
    registerAssetProtocol,
} = require('./main/services/AssetProtocolService')

registerAssetScheme()

app.whenReady().then(async () => {
    registerAssetProtocol()
    await initI18n()
    registerAllIpc()
    createStartWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createStartWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
