const { ipcMain } = require('electron')
const ExportService = require('../services/ExportService')

function registerExportIpc() {
    ipcMain.handle('export-project-zip', async (_event, payload) => {
        return await ExportService.exportProjectZip(payload || {})
    })

    ipcMain.handle('export-project-docx', async (_event, payload) => {
        return await ExportService.exportProjectDocx(payload || {})
    })

    ipcMain.handle('export-project-pdf', async (_event, payload) => {
        return await ExportService.exportProjectPdf(payload || {})
    })
}

module.exports = { registerExportIpc }
