const fs = require('fs')
const path = require('path')
const os = require('os')
const {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
    atomicWriteJsonSync,
    atomicWriteStringSync,
} = require('../../Utils/fsSecurity')
const { t } = require('../../Utils/i18n')
const { ASSETS_IMAGES_DIR } = require('../../Utils/assetConstants')
const {
    slugifyEntityName,
    generateUniqueSlug,
    formatDescriptionFileName,
} = require('../../Utils/pathSanitizer')
const RecentProjectsService = require('./RecentProjectsService')

const DEFAULT_PROJECT_FOLDERS = [
    'NPC',
    'Paragraphs',
    'Items',
    'Locations',
    'Templates',
    'CharacterClasses',
    'Rules',
    'PlayerCharacter',
]

let currentProjectDir = null

/**
 * Ensures the project's image assets directory exists (non-entity folder, no meta.json).
 *
 * @param {string} projectDir
 */
function ensureAssetsDirectory(projectDir) {
    const imagesDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
    }
}

class ProjectService {
    /**
     * Resolves the default workspace directory in Electron userData or temp.
     *
     * @returns {string}
     */
    static getDefaultWorkspaceDir() {
        let baseDir = null
        try {
            const electron = require('electron')
            if (electron && electron.app && typeof electron.app.getPath === 'function') {
                baseDir = electron.app.getPath('userData')
            }
        } catch {
            baseDir = null
        }
        if (!baseDir) {
            baseDir = path.join(os.tmpdir(), 'sgp-workspace')
        }
        return path.join(baseDir, 'DefaultProject')
    }

    /**
     * Returns the currently active project directory path.
     * If no active project is set, attempts to restore the most recent valid project
     * or ensures an initial default workspace directory.
     *
     * @returns {string|null}
     */
    static getCurrentProjectDir() {
        if (currentProjectDir && fs.existsSync(currentProjectDir)) {
            return currentProjectDir
        }

        // 1. Try to find the most recent valid project on disk
        const recents = RecentProjectsService.getRecentProjects()
        for (const recent of recents) {
            if (recent && recent.path && fs.existsSync(recent.path)) {
                try {
                    const stat = fs.statSync(recent.path)
                    const dir = stat.isDirectory() ? recent.path : path.dirname(recent.path)
                    if (fs.existsSync(dir)) {
                        this.setCurrentProjectDir(dir)
                        return currentProjectDir
                    }
                } catch {
                    // ignore invalid path and check next
                }
            }
        }

        // 2. Fall back to a default project workspace in userData
        const defaultDir = this.getDefaultWorkspaceDir()
        if (defaultDir) {
            try {
                if (!fs.existsSync(defaultDir)) {
                    fs.mkdirSync(defaultDir, { recursive: true })
                }
                const projectFile = path.join(defaultDir, 'project.json')
                if (!fs.existsSync(projectFile)) {
                    const defaultProjectData = {
                        name: 'Domyślny Projekt',
                        descriptionPaths: [],
                        dataPaths: [],
                    }
                    fs.writeFileSync(projectFile, JSON.stringify(defaultProjectData, null, 2))
                }
                ensureAssetsDirectory(defaultDir)
                this.setCurrentProjectDir(defaultDir)
                return currentProjectDir
            } catch (err) {
                console.error('Error initializing default project dir:', err)
            }
        }

        return currentProjectDir
    }

    /**
     * Sets the currently active project directory path.
     *
     * @param {string|null} dir
     */
    static setCurrentProjectDir(dir) {
        currentProjectDir = dir ? resolveProjectDir(dir) : null
    }
    /**
     * Creates a new gamebook project directory structure with default folders and metadata.
     *
     * @param {Object} projectDetails
     * @returns {Promise<{ success: boolean, path?: string, error?: string }>}
     */
    static async createProject(projectDetails) {
        const { id, name, author, projectPath } = projectDetails || {}

        if (!projectPath) {
            return { success: false, error: 'No project path selected.' }
        }

        const projectFile = path.join(projectPath, 'project.json')

        try {
            const dataPaths = []

            for (const folder of DEFAULT_PROJECT_FOLDERS) {
                const dirPath = path.join(projectPath, folder)
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true })
                }

                const metaPath = path.join(dirPath, 'meta.json')
                const metaData = {
                    description: `Folder for ${folder}`,
                    path: `./${folder}`,
                    descriptionPaths: [],
                    imagePaths: [],
                    elements: [],
                }
                fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2))
                dataPaths.push(`./${folder}/meta.json`)
            }

            const projectName = name || path.basename(projectPath)
            const projectAuthor = author || ''

            const projectData = {
                id: id || 'new_project',
                name: projectName,
                author: projectAuthor,
                version: '1.0.0',
                descriptionPaths: [],
                dataPaths: dataPaths,
            }

            ensureAssetsDirectory(projectPath)

            fs.writeFileSync(projectFile, JSON.stringify(projectData, null, 2))
            RecentProjectsService.saveRecentProject(projectFile, projectData.name)
            this.setCurrentProjectDir(projectPath)

            return { success: true, path: projectFile }
        } catch (err) {
            console.error('Error creating project structure:', err)
            return {
                success: false,
                error: err.message || 'An error occurred while saving the project structure.',
            }
        }
    }

    /**
     * Opens and loads a project, validating files and loading all entity records.
     *
     * @param {string} targetPath
     * @returns {Promise<{ success: boolean, path?: string, project?: any, entities?: any, error?: string }>}
     */
    static async openProject(targetPath) {
        const defaultNotFoundError = 'Project not found.'

        if (!targetPath) {
            return { success: false, error: t('error.project_not_found') || defaultNotFoundError }
        }

        const projectDir = resolveProjectDir(targetPath)
        if (!projectDir) {
            return { success: false, error: t('error.project_not_found') || defaultNotFoundError }
        }

        let resolvedProjectFile = targetPath
        try {
            const stat = fs.statSync(targetPath)
            if (stat.isDirectory()) {
                resolvedProjectFile = path.join(targetPath, 'project.json')
            }
        } catch {
            return { success: false, error: t('error.project_not_found') || defaultNotFoundError }
        }

        if (!fs.existsSync(resolvedProjectFile)) {
            return { success: false, error: t('error.project_not_found') || defaultNotFoundError }
        }

        try {
            let projectData
            try {
                const fileContent = fs.readFileSync(resolvedProjectFile, 'utf8')
                projectData = JSON.parse(fileContent)
            } catch {
                return {
                    success: false,
                    error: 'Could not read or parse project.json file.',
                }
            }

            if (!validateProjectData(projectData)) {
                return {
                    success: false,
                    error: 'Invalid project file structure. The file must contain: name (string), descriptionPaths (array), dataPaths (array).',
                }
            }

            const entities = {}
            const dataPaths = projectData.dataPaths || projectData.sciezkiDanych || []

            for (const sciezka of dataPaths) {
                const metaPath = path.resolve(projectDir, sciezka)
                if (!isPathInsideBase(projectDir, metaPath)) {
                    return {
                        success: false,
                        error: `Unauthorized meta.json path: ${sciezka}`,
                    }
                }

                if (!fs.existsSync(metaPath)) {
                    return {
                        success: false,
                        error: `Missing meta.json file: ${metaPath}`,
                    }
                }

                let metaData
                try {
                    const metaContent = fs.readFileSync(metaPath, 'utf8')
                    metaData = JSON.parse(metaContent)
                } catch {
                    return {
                        success: false,
                        error: `Could not parse meta.json: ${metaPath}`,
                    }
                }

                const metaDir = path.dirname(metaPath)
                const folderName = path.basename(metaDir)

                if (!entities[folderName]) {
                    entities[folderName] = []
                }

                const elementList = Array.isArray(metaData.elements)
                    ? metaData.elements
                    : Array.isArray(metaData.elementy)
                      ? metaData.elementy
                      : []

                for (const element of elementList) {
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

            const projectName = projectData.name || path.basename(projectDir)
            RecentProjectsService.saveRecentProject(resolvedProjectFile, projectName)

            if (projectData.editor) {
                if (!projectData.customStyles && Array.isArray(projectData.editor.customStyles)) {
                    projectData.customStyles = projectData.editor.customStyles
                }
                if (!projectData.customFonts && Array.isArray(projectData.editor.customFonts)) {
                    projectData.customFonts = projectData.editor.customFonts
                }
            }

            ensureAssetsDirectory(projectDir)
            this.setCurrentProjectDir(projectDir)

            return {
                success: true,
                path: resolvedProjectFile,
                project: projectData,
                entities: entities,
            }
        } catch (err) {
            console.error('Unexpected error while opening project:', err)
            return {
                success: false,
                error: 'An unexpected error occurred while opening the project.',
            }
        }
    }

    /**
     * Updates and saves project manifest (project.json).
     *
     * @param {string} projectPath - Path to project folder or project.json
     * @param {Object} projectData - Project metadata to persist
     * @returns {Promise<{ success: boolean, path?: string, error?: string }>}
     */
    static async saveProject(projectPath, projectData) {
        if (!projectPath) {
            return { success: false, error: 'No project path specified.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Project folder not found.' }
        }

        const projectFile = path.join(projectDir, 'project.json')

        try {
            let existingData = {}
            if (fs.existsSync(projectFile)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(projectFile, 'utf8'))
                } catch {
                    existingData = {}
                }
            }

            const incoming = projectData || {}
            const updatedData = {
                ...existingData,
                ...incoming,
                id: incoming.id || existingData.id || 'project',
                name: incoming.name || existingData.name || path.basename(projectDir),
                author: incoming.author ?? existingData.author ?? '',
                version: incoming.version ?? existingData.version ?? '1.0.0',
                descriptionPaths: incoming.descriptionPaths ?? existingData.descriptionPaths ?? [],
                dataPaths: incoming.dataPaths ?? existingData.dataPaths ?? [],
            }

            if (incoming.editor) {
                updatedData.editor = incoming.editor
            } else if (incoming.customStyles || incoming.customFonts) {
                updatedData.editor = {
                    customStyles: incoming.customStyles || [],
                    customFonts: incoming.customFonts || [],
                }
            }

            atomicWriteJsonSync(projectFile, updatedData)
            RecentProjectsService.saveRecentProject(projectFile, updatedData.name)
            this.setCurrentProjectDir(projectDir)

            return { success: true, path: projectFile }
        } catch (err) {
            console.error('Error saving project manifest:', err)
            return {
                success: false,
                error: err.message || 'An error occurred while saving project.json.',
            }
        }
    }

    /**
     * Atomically saves the entire project state including paragraphs, scenes,
     * worldbuilding entities, markdown files, and project.json manifest.
     *
     * @param {string} projectPath - Path to project folder or project.json
     * @param {Object} payload - Complete project data payload to persist
     * @returns {Promise<{ success: boolean, path?: string, error?: string }>}
     */
    static async saveFullProject(projectPath, payload) {
        if (!projectPath) {
            return { success: false, error: 'No project path specified.' }
        }

        if (!payload || typeof payload !== 'object') {
            return { success: false, error: 'Invalid project payload.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Project folder not found.' }
        }

        try {
            const projectFile = path.join(projectDir, 'project.json')
            let existingProject = {}
            if (fs.existsSync(projectFile)) {
                try {
                    existingProject = JSON.parse(fs.readFileSync(projectFile, 'utf8'))
                } catch {
                    existingProject = {}
                }
            }

            const incomingProject = payload?.project || {}
            const updatedProject = {
                ...existingProject,
                ...incomingProject,
                id: incomingProject.id || existingProject.id || 'project',
                name: incomingProject.name || existingProject.name || path.basename(projectDir),
                author: incomingProject.author ?? existingProject.author ?? '',
                version: incomingProject.version ?? existingProject.version ?? '1.0.0',
                descriptionPaths:
                    incomingProject.descriptionPaths ?? existingProject.descriptionPaths ?? [],
                dataPaths: [...(incomingProject.dataPaths ?? existingProject.dataPaths ?? [])],
            }

            // Sync Editor settings
            if (incomingProject.editor) {
                updatedProject.editor = incomingProject.editor
            } else if (incomingProject.customStyles || incomingProject.customFonts) {
                updatedProject.editor = {
                    customStyles: incomingProject.customStyles || [],
                    customFonts: incomingProject.customFonts || [],
                }
            }

            // Sync Graph & Scenes in project.json
            const incomingScenes = payload?.scenes || incomingProject.scenes || []
            const incomingGraph = payload?.graph || incomingProject.graph || {}
            updatedProject.graph = {
                ...incomingGraph,
                scenes: Array.isArray(incomingScenes) ? incomingScenes : incomingGraph.scenes || [],
            }

            // Helper to persist an entity array into a category folder
            const persistCategoryEntities = (category, items) => {
                if (!Array.isArray(items)) return

                const categoryDir = path.join(projectDir, category)
                if (!isPathInsideBase(projectDir, categoryDir)) return
                if (!fs.existsSync(categoryDir)) {
                    fs.mkdirSync(categoryDir, { recursive: true })
                }

                const metaPath = path.join(categoryDir, 'meta.json')
                let metaData = {
                    description: `Folder for ${category}`,
                    path: `./${category}`,
                    descriptionPaths: [],
                    imagePaths: [],
                    elements: [],
                }

                if (fs.existsSync(metaPath)) {
                    try {
                        metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
                        if (!Array.isArray(metaData.elements)) metaData.elements = []
                    } catch {
                        // ignore and use default
                    }
                }

                const elementPaths = []
                const existingFolderNames = new Set()

                for (const item of items) {
                    if (!item || typeof item !== 'object') continue

                    // Determine folder name
                    let folderSlug = ''
                    if (item.description && typeof item.description.filePath === 'string') {
                        const parts = item.description.filePath.replace(/\\/g, '/').split('/')
                        const catIdx = parts.findIndex(
                            p => p.toLowerCase() === category.toLowerCase()
                        )
                        if (catIdx !== -1 && parts[catIdx + 1]) {
                            folderSlug = parts[catIdx + 1]
                        }
                    }

                    if (!folderSlug) {
                        const nameSource =
                            item.id || item.title || item.name || `${category.toLowerCase()}_item`
                        const base = slugifyEntityName(String(nameSource))
                        folderSlug = generateUniqueSlug(base, cand => existingFolderNames.has(cand))
                    }

                    existingFolderNames.add(folderSlug)

                    const entityDir = path.join(categoryDir, folderSlug)
                    if (!isPathInsideBase(projectDir, entityDir)) continue
                    if (!fs.existsSync(entityDir)) {
                        fs.mkdirSync(entityDir, { recursive: true })
                    }

                    // Format description path
                    const entityTitle = item.title || item.name || folderSlug
                    const descFileName = formatDescriptionFileName(category, entityTitle)
                    const descRelPath = `./${category}/${folderSlug}/${descFileName}`
                    const descFullPath = path.join(entityDir, descFileName)

                    let descText = ''
                    if (typeof item.description === 'string') {
                        descText = item.description
                        item.description = { text: descText }
                    } else if (item.description && typeof item.description === 'object') {
                        descText = item.description.text || item.description.summary || ''
                    } else if (item.content && typeof item.content === 'object') {
                        descText = item.content.text || item.content.summary || ''
                        if (!item.description) item.description = { ...item.content }
                    }

                    if (!item.description || typeof item.description !== 'object') {
                        item.description = {}
                    }
                    item.description.filePath = descRelPath
                    item.description.textPath = descRelPath

                    // If markdown prose text is provided, write to .md file
                    if (typeof descText === 'string' && descText.length > 0) {
                        atomicWriteStringSync(descFullPath, descText)
                    }

                    // Write element.json
                    const elementJsonPath = path.join(entityDir, 'element.json')
                    atomicWriteJsonSync(elementJsonPath, item)

                    elementPaths.push(`./${folderSlug}/element.json`)
                }

                metaData.elements = elementPaths
                atomicWriteJsonSync(metaPath, metaData)

                const relMetaPath = `./${category}/meta.json`
                if (!updatedProject.dataPaths.includes(relMetaPath)) {
                    updatedProject.dataPaths.push(relMetaPath)
                }
            }

            // Persist Paragraphs
            if (Array.isArray(payload?.paragraphs)) {
                persistCategoryEntities('Paragraphs', payload.paragraphs)
            }

            // Persist Entities
            if (payload?.entities && typeof payload.entities === 'object') {
                for (const [category, items] of Object.entries(payload.entities)) {
                    persistCategoryEntities(category, items)
                }
            }

            // Persist Markdown files
            if (payload?.files && typeof payload.files === 'object') {
                for (const [relPath, content] of Object.entries(payload.files)) {
                    if (typeof relPath === 'string' && typeof content === 'string') {
                        const fullPath = path.resolve(projectDir, relPath)
                        if (isPathInsideBase(projectDir, fullPath)) {
                            atomicWriteStringSync(fullPath, content)
                        }
                    }
                }
            }

            // Write updated project.json
            atomicWriteJsonSync(projectFile, updatedProject)
            RecentProjectsService.saveRecentProject(projectFile, updatedProject.name)
            this.setCurrentProjectDir(projectDir)

            return { success: true, path: projectFile }
        } catch (err) {
            console.error('Error in saveFullProject:', err)
            return {
                success: false,
                error: err.message || 'An error occurred while saving the full project.',
            }
        }
    }
}

module.exports = ProjectService
