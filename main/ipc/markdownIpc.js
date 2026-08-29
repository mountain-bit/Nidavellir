const { ipcMain } = require('electron')
const MarkdownService = require('../services/MarkdownService')

function registerMarkdownIpc() {
    ipcMain.handle('read-markdown-file', async (_event, payload) => {
        return await MarkdownService.readMarkdownFile(payload)
    })

    ipcMain.handle('save-markdown-file', async (_event, payload) => {
        return await MarkdownService.saveMarkdownFile(payload)
    })
}

module.exports = { registerMarkdownIpc }
