const { ipcMain, BrowserWindow } = require('electron')
const AssetService = require('../services/AssetService')

function registerAssetIpc() {
    ipcMain.handle('asset-import-image', async (event, payload) => {
        const parentWindow =
            event && event.sender ? BrowserWindow.fromWebContents(event.sender) : null
        return await AssetService.chooseAndImportImage(payload, parentWindow)
    })

    ipcMain.handle('asset-import-file', async (_event, payload) => {
        const { projectPath, filePath, prefix = 'img' } = payload || {}
        return await AssetService.importFileFromSource(projectPath, filePath, prefix)
    })

    ipcMain.handle('asset-list-images', async (_event, payload) => {
        return await AssetService.listProjectAssets(payload)
    })

    ipcMain.handle('asset-save-edited-image', async (_event, payload) => {
        return await AssetService.saveEditedImage(payload)
    })
}

module.exports = { registerAssetIpc }
