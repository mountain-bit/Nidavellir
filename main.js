const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { initI18n, t, getTranslations, setLocale, getLocale } = require('./Utils/i18n')
const { slugifyEntityName, generateUniqueSlug } = require('./Utils/pathSanitizer')

const recentProjectsPath = path.join(app.getPath('userData'), 'recent-projects.json')

function resolveProjectDir(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') return null
    if (!fs.existsSync(projectPath)) return null
    try {
        const stat = fs.statSync(projectPath)
        return stat.isDirectory() ? projectPath : path.dirname(projectPath)
    } catch {
        return null
    }
}

function isPathInsideBase(basePath, targetPath) {
    const resolvedBase = path.resolve(basePath)
    const resolvedTarget = path.resolve(targetPath)
    return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase
}

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
        minWidth: 800,
        minHeight: 600,
        frame: true,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Silnik Gier Paragrafowych',
        backgroundColor: '#18181b',
    })

    mainWindow.maximize()
    mainWindow.loadFile('View/MainWindow.html')
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
            console.error('Error creating project structure:', err)
            return {
                success: false,
                error: err.message || 'Wystąpił błąd podczas zapisu struktury projektu.',
            }
        }
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

        const projectDir = resolveProjectDir(targetPath)
        if (!projectDir) {
            return { success: false, error: t('error.project_not_found') }
        }

        try {
            const stat = fs.statSync(targetPath)
            if (stat.isDirectory()) {
                targetPath = path.join(targetPath, 'project.json')
            }
        } catch {
            return { success: false, error: t('error.project_not_found') }
        }

        if (!fs.existsSync(targetPath)) {
            return { success: false, error: t('error.project_not_found') }
        }

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
                            console.warn(`Skipped unauthorized element path: ${element}`)
                            continue
                        }

                        if (!fs.existsSync(elementPath)) {
                            console.warn(`Skipped missing element file: ${elementPath}`)
                            continue
                        }

                        let elementData
                        try {
                            const elementContent = fs.readFileSync(elementPath, 'utf8')
                            elementData = JSON.parse(elementContent)
                        } catch {
                            console.warn(`Could not parse element file: ${elementPath}`)
                            continue
                        }

                        if (typeof elementData !== 'object' || elementData === null) {
                            console.warn(`Invalid element data structure: ${elementPath}`)
                            continue
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

    ipcMain.handle('create-entity', async (_event, options) => {
        const {
            projectPath,
            category,
            entityData,
            folderName,
            createDescriptionPaths = true,
        } = options || {}

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }
        if (!category || typeof category !== 'string') {
            return { success: false, error: 'Brak podanej kategorii elementu.' }
        }

        const categoryDir = path.join(projectDir, category)
        if (!isPathInsideBase(projectDir, categoryDir)) {
            return { success: false, error: 'Niedozwolona ścieżka kategorii.' }
        }

        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true })
        }

        const metaPath = path.join(categoryDir, 'meta.json')
        let metaData = {
            opis: `Folder na ${category}`,
            sciezka: `./${category}`,
            sciezkiOpisow: [],
            sciezkiZdjec: [],
            elementy: [],
        }

        if (fs.existsSync(metaPath)) {
            try {
                metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
                if (!Array.isArray(metaData.elementy)) metaData.elementy = []
            } catch (err) {
                console.error(`Error reading meta.json in ${categoryDir}:`, err)
            }
        }

        const nameSource =
            folderName ||
            entityData?.id ||
            entityData?.nazwa ||
            entityData?.tytul ||
            `nowy_${category.toLowerCase()}`

        const rawSlug = slugifyEntityName(String(nameSource))
        const entityFolderSlug = generateUniqueSlug(rawSlug, candidate =>
            fs.existsSync(path.join(categoryDir, candidate))
        )
        const entityDir = path.join(categoryDir, entityFolderSlug)

        if (!isPathInsideBase(projectDir, entityDir)) {
            return { success: false, error: 'Niedozwolona ścieżka encji.' }
        }

        const elementJsonPath = path.join(entityDir, 'element.json')
        if (!isPathInsideBase(projectDir, elementJsonPath)) {
            return { success: false, error: 'Niedozwolona ścieżka zapisu encji.' }
        }

        try {
            fs.mkdirSync(entityDir, { recursive: true })

            if (createDescriptionPaths) {
                const sciezkaTekst = `./${category}/${entityFolderSlug}/tekst.md`
                const sciezkaTekstDlaAutora = `./${category}/${entityFolderSlug}/autor.md`

                const existingOpis =
                    typeof entityData?.opis === 'object' && entityData.opis !== null
                        ? entityData.opis
                        : {}

                entityData.opis = {
                    tekst: existingOpis.tekst || '',
                    streszczenie: existingOpis.streszczenie || '',
                    tekstDlaAutora: existingOpis.tekstDlaAutora || '',
                    sciezkaTekst: sciezkaTekst,
                    sciezkaTekstDlaAutora: sciezkaTekstDlaAutora,
                }
            }

            const tempElementPath = `${elementJsonPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempElementPath, JSON.stringify(entityData, null, 2), 'utf8')
            fs.renameSync(tempElementPath, elementJsonPath)

            const relativeElementPath = `./${entityFolderSlug}/element.json`
            if (!metaData.elementy.includes(relativeElementPath)) {
                metaData.elementy.push(relativeElementPath)
                const tempMetaPath = `${metaPath}.${Date.now()}.tmp`
                fs.writeFileSync(tempMetaPath, JSON.stringify(metaData, null, 2), 'utf8')
                fs.renameSync(tempMetaPath, metaPath)
            }

            return {
                success: true,
                entity: entityData,
                entityPath: elementJsonPath,
            }
        } catch (err) {
            console.error('Error creating element on disk:', err)
            return {
                success: false,
                error: err.message || 'Wystąpił błąd podczas tworzenia elementu na dysku.',
            }
        }
    })

    ipcMain.handle('save-entity', async (_event, payload) => {
        const { projectPath, category, entityFolder, entityData } = payload || {}
        if (!projectPath || !category || !entityFolder || !entityData) {
            return { success: false, error: 'Brak wymaganych parametrów do zapisu encji.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }

        const entityJsonPath = path.join(projectDir, category, entityFolder, 'element.json')
        if (!isPathInsideBase(projectDir, entityJsonPath)) {
            return { success: false, error: 'Niedozwolona ścieżka zapisu encji.' }
        }

        try {
            const entityDir = path.dirname(entityJsonPath)
            if (!fs.existsSync(entityDir)) {
                fs.mkdirSync(entityDir, { recursive: true })
            }
            const tempPath = `${entityJsonPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempPath, JSON.stringify(entityData, null, 2), 'utf8')
            fs.renameSync(tempPath, entityJsonPath)
            return { success: true }
        } catch (err) {
            console.error('Error saving entity:', err)
            return { success: false, error: err.message || 'Nie udało się zapisać pliku encji.' }
        }
    })

    ipcMain.handle('read-markdown-file', async (_event, payload) => {
        const { projectPath, relativePath } = payload || {}
        if (!projectPath || !relativePath) {
            return { success: false, error: 'Brak ścieżki projektu lub pliku.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }

        const fullPath = path.resolve(projectDir, relativePath)
        if (!isPathInsideBase(projectDir, fullPath)) {
            return { success: false, error: 'Niedozwolona ścieżka pliku.' }
        }

        if (!fs.existsSync(fullPath)) {
            return { success: true, content: '', isVirtual: true }
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf8')
            return { success: true, content: content, isVirtual: false }
        } catch (err) {
            console.error('Error reading markdown file:', err)
            return { success: false, error: err.message || 'Błąd odczytu pliku.' }
        }
    })

    ipcMain.handle('save-markdown-file', async (_event, payload) => {
        const { projectPath, relativePath, content } = payload || {}
        if (!projectPath || !relativePath) {
            return { success: false, error: 'Brak ścieżki projektu lub pliku.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Nieprawidłowa ścieżka projektu.' }
        }

        const fullPath = path.resolve(projectDir, relativePath)
        if (!isPathInsideBase(projectDir, fullPath)) {
            return { success: false, error: 'Niedozwolona ścieżka pliku.' }
        }

        try {
            const existed = fs.existsSync(fullPath)
            const parentDir = path.dirname(fullPath)
            if (!fs.existsSync(parentDir)) {
                fs.mkdirSync(parentDir, { recursive: true })
            }

            const tempPath = `${fullPath}.${Date.now()}.tmp`
            fs.writeFileSync(tempPath, content || '', 'utf8')
            fs.renameSync(tempPath, fullPath)

            return {
                success: true,
                recreated: !existed,
                warning: !existed ? 'recreated' : undefined,
            }
        } catch (err) {
            console.error('Error saving markdown file:', err)
            return { success: false, error: err.message || 'Błąd zapisu pliku markdown.' }
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
