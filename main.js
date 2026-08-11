const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { initI18n, t, getTranslations, setLocale, getLocale } = require('./Utils/i18n')
const recentProjectsPath = path.join(app.getPath('userData'), 'recent-projects.json')

function getRecentProjects() {
    if (fs.existsSync(recentProjectsPath)) {
        try {
            const data = fs.readFileSync(recentProjectsPath, 'utf8')
            return JSON.parse(data)
        } catch (err) {
            console.error('Error reading recent projects:', err)
        }
    }
    return []
}

function saveRecentProject(projectPath, projectName) {
    let projects = getRecentProjects()
    projects = projects.filter(p => p.path !== projectPath)
    projects.unshift({
        name: projectName,
        path: projectPath,
        lastOpened: new Date().toISOString(),
    })
    if (projects.length > 10) projects = projects.slice(0, 10)

    try {
        fs.writeFileSync(recentProjectsPath, JSON.stringify(projects, null, 2))
    } catch (err) {
        console.error('Error saving recent projects:', err)
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Silnik Gier Paragrafowych',
        backgroundColor: '#00000000',
    })

    mainWindow.loadFile('View/StartWindow.html')
}

app.whenReady().then(async () => {
    await initI18n()

    ipcMain.handle('get-translations', () => {
        return getTranslations()
    })

    ipcMain.handle('get-locale', () => {
        return getLocale()
    })

    ipcMain.handle('set-locale', async (_event, locale) => {
        return await setLocale(locale)
    })

    ipcMain.handle('get-recent-projects', () => {
        return getRecentProjects()
    })

    ipcMain.handle('create-project', async event => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: t('dialog.choose_new_project_folder'),
            properties: ['openDirectory', 'createDirectory'],
        })

        if (!canceled && filePaths.length > 0) {
            const projectPath = filePaths[0]
            const projectName = path.basename(projectPath)
            const projectFile = path.join(projectPath, 'project.json')
            const existing = fs.existsSync(projectFile)

            if (!existing) {
                fs.writeFileSync(
                    projectFile,
                    JSON.stringify({ name: projectName, version: '1.0.0' }, null, 2)
                )
            }

            saveRecentProject(projectPath, projectName)
            const win = BrowserWindow.fromWebContents(event.sender)
            if (win) win.loadFile('index.html')
            return { success: true, path: projectPath, existing }
        }
        return { success: false }
    })

    ipcMain.handle('open-project', async (event, projectPath = null) => {
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

        if (fs.existsSync(targetPath)) {
            const projectName = path.basename(targetPath)
            saveRecentProject(targetPath, projectName)
            const win = BrowserWindow.fromWebContents(event.sender)
            if (win) win.loadFile('index.html')
            return { success: true, path: targetPath }
        }
        return { success: false, error: t('error.project_not_found') }
    })

    ipcMain.handle('close-app', () => {
        app.quit()
    })

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
