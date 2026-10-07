const { ipcMain, dialog } = require('electron')
const { t } = require('../../Utils/i18n')
const ProjectService = require('../services/ProjectService')

function registerProjectIpc() {
    ipcMain.handle('choose-folder', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: t('dialog.choose_new_project_folder'),
            properties: ['openDirectory', 'createDirectory'],
        })
        if (canceled || filePaths.length === 0) return { canceled: true }
        return { canceled: false, path: filePaths[0] }
    })

    ipcMain.handle('get-current-project', () => {
        return ProjectService.getCurrentProjectDir()
    })

    ipcMain.handle('create-project', async (_event, projectDetails) => {
        return await ProjectService.createProject(projectDetails)
    })

    ipcMain.handle('open-project', async (_event, projectPath = null) => {
        let targetPath = projectPath

        if (!targetPath) {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: t('dialog.open_project'),
                properties: ['openDirectory'],
            })

            if (canceled || filePaths.length === 0) {
                return { success: false }
            }
            targetPath = filePaths[0]
        }

        return await ProjectService.openProject(targetPath)
    })

    ipcMain.handle('save-project', async (_event, payload) => {
        const { projectPath, projectData } = payload || {}
        return await ProjectService.saveProject(projectPath, projectData)
    })
}

module.exports = { registerProjectIpc }
