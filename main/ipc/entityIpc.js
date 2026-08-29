const { ipcMain } = require('electron')
const EntityService = require('../services/EntityService')

function registerEntityIpc() {
    ipcMain.handle('create-entity', async (_event, options) => {
        return await EntityService.createEntity(options)
    })

    ipcMain.handle('save-entity', async (_event, payload) => {
        return await EntityService.saveEntity(payload)
    })
}

module.exports = { registerEntityIpc }
