const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
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

    ipcMain.handle('get-system-username', () => {
        try {
            const userInfo = os.userInfo()
            if (userInfo && userInfo.username) {
                return userInfo.username
            }
        } catch (err) {
            console.error('Error getting system username:', err)
        }
        return process.env.USERNAME || process.env.USER || ''
    })

    const validateProjectData = data => {
        if (typeof data !== 'object' || data === null) return false
        if (typeof data.nazwa !== 'string') return false
        if (!Array.isArray(data.sciezkiOpisow)) return false
        if (!Array.isArray(data.sciezkiDanych)) return false
        return true
    }

    ipcMain.handle('choose-folder', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: t('dialog.choose_new_project_folder'),
            properties: ['openDirectory', 'createDirectory'],
        })
        if (canceled || filePaths.length === 0) return { canceled: true }
        return { canceled: false, path: filePaths[0] }
    })

    ipcMain.handle('create-project', async (event, projectDetails) => {
        const { id, nazwa, autor, projectPath } = projectDetails || {}

        if (!projectPath) {
            return { success: false, error: 'Nie wybrano ścieżki projektu.' }
        }

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
            return { success: true, path: projectFile }
        } catch (err) {
            console.error(err)
            return {
                success: false,
                error: err.message || 'Wystąpił błąd podczas zapisu struktury projektu.',
            }
        }
    })

    function isPathInsideBase(basePath, targetPath) {
        const resolvedBase = path.resolve(basePath)
        const resolvedTarget = path.resolve(targetPath)
        return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase
    }

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
            const chosen = filePaths[0]
            const stat = fs.statSync(chosen)
            if (stat.isDirectory()) {
                targetPath = path.join(chosen, 'project.json')
            } else {
                targetPath = chosen
            }
        } else {
            if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
                targetPath = path.join(targetPath, 'project.json')
            }
        }

        if (!fs.existsSync(targetPath)) {
            return { success: false, error: t('error.project_not_found') }
        }

        const projectDir = path.dirname(targetPath)

        try {
            let projectData
            try {
                const fileContent = fs.readFileSync(targetPath, 'utf8')
                projectData = JSON.parse(fileContent)
            } catch {
                return {
                    success: false,
                    error: 'Nie można odczytać lub sparsować pliku project.json.',
                }
            }

            if (!validateProjectData(projectData)) {
                return {
                    success: false,
                    error: 'Nieprawidłowa struktura pliku projektu. Plik musi zawierać: nazwa (string), sciezkiOpisow (tablica), sciezkiDanych (tablica).',
                }
            }

            const entities = {}

            for (const sciezka of projectData.sciezkiDanych) {
                const metaPath = path.resolve(projectDir, sciezka)
                if (!isPathInsideBase(projectDir, metaPath)) {
                    return {
                        success: false,
                        error: `Niedozwolona ścieżka meta.json: ${sciezka}`,
                    }
                }

                if (!fs.existsSync(metaPath)) {
                    return {
                        success: false,
                        error: `Brak pliku meta.json: ${metaPath}`,
                    }
                }

                let metaData
                try {
                    const metaContent = fs.readFileSync(metaPath, 'utf8')
                    metaData = JSON.parse(metaContent)
                } catch {
                    return {
                        success: false,
                        error: `Nie można sparsować meta.json: ${metaPath}`,
                    }
                }

                const metaDir = path.dirname(metaPath)
                const folderName = path.basename(metaDir)

                if (!entities[folderName]) {
                    entities[folderName] = []
                }

                if (Array.isArray(metaData.elementy)) {
                    for (const element of metaData.elementy) {
                        const elementPath = path.resolve(metaDir, element)
                        if (!isPathInsideBase(projectDir, elementPath)) {
                            return {
                                success: false,
                                error: `Niedozwolona ścieżka elementu: ${element}`,
                            }
                        }

                        if (!fs.existsSync(elementPath)) {
                            return {
                                success: false,
                                error: `Brak pliku elementu: ${elementPath}`,
                            }
                        }

                        let elementData
                        try {
                            const elementContent = fs.readFileSync(elementPath, 'utf8')
                            elementData = JSON.parse(elementContent)
                        } catch {
                            return {
                                success: false,
                                error: `Nie można sparsować pliku elementu: ${elementPath}`,
                            }
                        }

                        if (typeof elementData !== 'object' || elementData === null) {
                            return {
                                success: false,
                                error: `Nieprawidłowa struktura danych w pliku: ${elementPath}`,
                            }
                        }

                        entities[folderName].push(elementData)
                    }
                }
            }

            const projectName = projectData.nazwa || path.basename(projectDir)
            saveRecentProject(targetPath, projectName)

            return {
                success: true,
                path: targetPath,
                project: projectData,
                entities: entities,
            }
        } catch (err) {
            console.error('Unexpected error while opening project:', err)
            return {
                success: false,
                error: 'Wystąpił nieoczekiwany błąd podczas otwierania projektu.',
            }
        }
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
