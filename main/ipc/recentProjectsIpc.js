const { ipcMain } = require('electron')
const RecentProjectsService = require('../services/RecentProjectsService')

function registerRecentProjectsIpc() {
    ipcMain.handle('get-recent-projects', () => {
        return RecentProjectsService.getRecentProjects()
    })
}

module.exports = { registerRecentProjectsIpc }
