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

    const validateProjectData = data => {
        if (typeof data !== 'object' || data === null) return false
        if (typeof data.nazwa !== 'string') return false
        if (!Array.isArray(data.sciezkiOpisow)) return false
        if (!Array.isArray(data.sciezkiDanych)) return false
        return true
    }

    ipcMain.handle('create-project', async (event, projectDetails) => {
        const { id, nazwa, autor } = projectDetails || {}

        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: t('dialog.choose_new_project_folder'),
            properties: ['openDirectory', 'createDirectory'],
        })

        if (!canceled && filePaths.length > 0) {
            const projectPath = filePaths[0]
            const projectFile = path.join(projectPath, 'project.json')

            try {
                const folders = [
                    'NPC',
                    'Paragrafy',
                    'Przedmioty',
                    'Lokacje',
                    'Templates',
                    'KlasyPostaci',
                    'Zasady',
                    'PostacGracza',
                ]
                const sciezkiDanych = []

                // Create subfolders and meta.json
                for (const folder of folders) {
                    const dirPath = path.join(projectPath, folder)
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true })
                    }

                    const metaPath = path.join(dirPath, 'meta.json')
                    const metaData = {
                        opis: `Folder na ${folder}`,
                        sciezka: `./${folder}`,
                        sciezkiOpisow: [],
                        sciezkiZdjec: [],
                        elementy: [],
                    }
                    fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2))
                    sciezkiDanych.push(`./${folder}/meta.json`)
                }

                // Create main project file
                const projectData = {
                    id: id || 'nowy_projekt',
                    nazwa: nazwa || path.basename(projectPath),
                    autor: autor || '',
                    wersja: '1.0.0',
                    sciezkiOpisow: [],
                    sciezkiDanych: sciezkiDanych,
                }

                fs.writeFileSync(projectFile, JSON.stringify(projectData, null, 2))

                saveRecentProject(projectFile, projectData.nazwa)
                // We won't load index.html immediately so the user can see the Toast,
                // we'll let the renderer handle the navigation.
                return { success: true, path: projectFile }
            } catch (err) {
                console.error(err)
                return {
                    success: false,
                    error: err.message || 'Wystąpił błąd podczas zapisu struktury projektu.',
                }
            }
        }
        return { success: false }
    })

    ipcMain.handle('open-project', async (event, projectPath = null) => {
        let targetPath = projectPath

        if (!targetPath) {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                title: t('dialog.open_project'),
                properties: ['openFile'],
                filters: [{ name: 'Project Files', extensions: ['json'] }],
            })

            if (canceled || filePaths.length === 0) {
                return { success: false }
            }
            targetPath = filePaths[0]
        }

        if (fs.existsSync(targetPath)) {
            try {
                const fileContent = fs.readFileSync(targetPath, 'utf8')
                const projectData = JSON.parse(fileContent)

                if (!validateProjectData(projectData)) {
                    return {
                        success: false,
                        error: 'Nieprawidłowa struktura pliku projektu. Plik musi zawierać: nazwa (string), sciezkiOpisow (tablica), sciezkiDanych (tablica).',
                    }
                }

                const projectName = projectData.nazwa || path.basename(targetPath)
                saveRecentProject(targetPath, projectName)

                // Implementacje otwarcia okna (win.loadFile) będzie później.
                // Na razie zwracamy dane projektu do widoku.
                return { success: true, path: targetPath, data: projectData }
            } catch (err) {
                return { success: false, error: 'Nie można odczytać lub sparsować pliku JSON.' }
            }
        }
        return { success: false, error: t('error.project_not_found') }
    })

    ipcMain.handle('close-app', () => {
        app.quit()
    })

    ipcMain.handle('load-main-window', event => {
        const win = BrowserWindow.fromWebContents(event.sender)
        if (win) {
            win.loadFile('index.html')
        }
    })

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
