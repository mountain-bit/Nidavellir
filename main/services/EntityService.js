const fs = require('fs')
const path = require('path')
const {
    resolveProjectDir,
    isPathInsideBase,
    atomicWriteJsonSync,
} = require('../../Utils/fsSecurity')
const { slugifyEntityName, generateUniqueSlug } = require('../../Utils/pathSanitizer')

class EntityService {
    /**
     * Creates a new entity directory, generates slug, description paths and persists element.json.
     *
     * @param {Object} options
     * @returns {Promise<{ success: boolean, entity?: any, entityPath?: string, error?: string }>}
     */
    static async createEntity(options) {
        const {
            projectPath,
            category,
            entityData,
            folderName,
            createDescriptionPaths = true,
        } = options || {}

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Invalid project path.' }
        }
        if (!category || typeof category !== 'string') {
            return { success: false, error: 'Missing element category.' }
        }

        const categoryDir = path.join(projectDir, category)
        if (!isPathInsideBase(projectDir, categoryDir)) {
            return { success: false, error: 'Unauthorized category path.' }
        }

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
                if (!Array.isArray(metaData.elements) && !Array.isArray(metaData.elementy)) {
                    metaData.elements = []
                }
            } catch (err) {
                console.error(`Error reading meta.json in ${categoryDir}:`, err)
            }
        }

        const nameSource =
            folderName ||
            entityData?.id ||
            entityData?.name ||
            entityData?.nazwa ||
            entityData?.title ||
            entityData?.tytul ||
            `new_${category.toLowerCase()}`

        const rawSlug = slugifyEntityName(String(nameSource))
        const entityFolderSlug = generateUniqueSlug(rawSlug, candidate =>
            fs.existsSync(path.join(categoryDir, candidate))
        )
        const entityDir = path.join(categoryDir, entityFolderSlug)

        if (!isPathInsideBase(projectDir, entityDir)) {
            return { success: false, error: 'Unauthorized entity path.' }
        }

        const elementJsonPath = path.join(entityDir, 'element.json')
        if (!isPathInsideBase(projectDir, elementJsonPath)) {
            return { success: false, error: 'Unauthorized entity save path.' }
        }

        try {
            fs.mkdirSync(entityDir, { recursive: true })

            if (createDescriptionPaths) {
                const textPath = `./${category}/${entityFolderSlug}/text.md`
                const authorNotesPath = `./${category}/${entityFolderSlug}/author.md`

                const existingDesc =
                    typeof entityData?.description === 'object' && entityData.description !== null
                        ? entityData.description
                        : typeof entityData?.opis === 'object' && entityData.opis !== null
                          ? entityData.opis
                          : {}

                const text = existingDesc.text || existingDesc.tekst || ''
                const summary = existingDesc.summary || existingDesc.streszczenie || ''
                const authorNotes = existingDesc.authorNotes || existingDesc.tekstDlaAutora || ''

                entityData.description = {
                    text,
                    summary,
                    authorNotes,
                    textPath,
                    authorNotesPath,
                }
            }

            atomicWriteJsonSync(elementJsonPath, entityData)

            const relativeElementPath = `./${entityFolderSlug}/element.json`
            const elementsArray = Array.isArray(metaData.elements)
                ? metaData.elements
                : Array.isArray(metaData.elementy)
                  ? metaData.elementy
                  : (metaData.elements = [])

            if (!elementsArray.includes(relativeElementPath)) {
                elementsArray.push(relativeElementPath)
                if (metaData.elements === undefined && metaData.elementy !== undefined) {
                    metaData.elementy = elementsArray
                } else {
                    metaData.elements = elementsArray
                }
                atomicWriteJsonSync(metaPath, metaData)
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
                error: err.message || 'An error occurred while creating the element on disk.',
            }
        }
    }

    /**
     * Atomically saves updated entity data to element.json.
     *
     * @param {Object} payload
     * @returns {Promise<{ success: boolean, error?: string }>}
     */
    static async saveEntity(payload) {
        const { projectPath, category, entityFolder, entityData } = payload || {}
        if (!projectPath || !category || !entityFolder || !entityData) {
            return { success: false, error: 'Missing required parameters to save entity.' }
        }

        const projectDir = resolveProjectDir(projectPath)
        if (!projectDir) {
            return { success: false, error: 'Invalid project path.' }
        }

        const entityJsonPath = path.join(projectDir, category, entityFolder, 'element.json')
        if (!isPathInsideBase(projectDir, entityJsonPath)) {
            return { success: false, error: 'Unauthorized entity save path.' }
        }

        try {
            atomicWriteJsonSync(entityJsonPath, entityData)
            return { success: true }
        } catch (err) {
            console.error('Error saving entity:', err)
            return { success: false, error: err.message || 'Failed to save entity file.' }
        }
    }
}

module.exports = EntityService
