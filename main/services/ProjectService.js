const fs = require('fs')
const path = require('path')
const {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
    atomicWriteJsonSync,
} = require('../../Utils/fsSecurity')
const { t } = require('../../Utils/i18n')
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

class ProjectService {
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

            fs.writeFileSync(projectFile, JSON.stringify(projectData, null, 2))
            RecentProjectsService.saveRecentProject(projectFile, projectData.name)

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

            return { success: true, path: projectFile }
        } catch (err) {
            console.error('Error saving project manifest:', err)
            return {
                success: false,
                error: err.message || 'An error occurred while saving project.json.',
            }
        }
    }
}

module.exports = ProjectService
