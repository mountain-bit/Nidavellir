const fs = require('fs')
const path = require('path')
const {
    resolveProjectDir,
    isPathInsideBase,
    validateProjectData,
} = require('../../Utils/fsSecurity')
const { t } = require('../../Utils/i18n')
const RecentProjectsService = require('./RecentProjectsService')

const DEFAULT_PROJECT_FOLDERS = [
    'NPC',
    'Paragrafy',
    'Przedmioty',
    'Lokacje',
    'Templates',
    'KlasyPostaci',
    'Zasady',
    'PostacGracza',
]

class ProjectService {
    /**
     * Creates a new gamebook project directory structure with default folders and metadata.
     *
     * @param {Object} projectDetails
     * @returns {Promise<{ success: boolean, path?: string, error?: string }>}
     */
    static async createProject(projectDetails) {
        const { id, nazwa, autor, projectPath } = projectDetails || {}

        if (!projectPath) {
            return { success: false, error: 'Nie wybrano ścieżki projektu.' }
        }

        const projectFile = path.join(projectPath, 'project.json')

        try {
            const sciezkiDanych = []

            for (const folder of DEFAULT_PROJECT_FOLDERS) {
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
            RecentProjectsService.saveRecentProject(projectFile, projectData.nazwa)

            return { success: true, path: projectFile }
        } catch (err) {
            console.error('Error creating project structure:', err)
            return {
                success: false,
                error: err.message || 'Wystąpił błąd podczas zapisu struktury projektu.',
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
        const defaultNotFoundError = 'Projekt nie został znaleziony.'

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
            RecentProjectsService.saveRecentProject(resolvedProjectFile, projectName)

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
                error: 'Wystąpił nieoczekiwany błąd podczas otwierania projektu.',
            }
        }
    }
}

module.exports = ProjectService
