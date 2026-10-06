const { ipcMain, BrowserWindow } = require('electron')
const AssetService = require('../services/AssetService')

function registerAssetIpc() {
    ipcMain.handle('asset-import-image', async (event, payload) => {
        const parentWindow =
            event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null
        return await AssetService.chooseAndImportImage(payload, parentWindow)
    })

    ipcMain.handle('asset-list-images', async (_event, payload) => {
        return await AssetService.listProjectAssets(payload)
    })
}

module.exports = { registerAssetIpc }
