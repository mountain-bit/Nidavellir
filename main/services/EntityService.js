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

            atomicWriteJsonSync(elementJsonPath, entityData)

            const relativeElementPath = `./${entityFolderSlug}/element.json`
            if (!metaData.elementy.includes(relativeElementPath)) {
                metaData.elementy.push(relativeElementPath)
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
                error: err.message || 'Wystąpił błąd podczas tworzenia elementu na dysku.',
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
            atomicWriteJsonSync(entityJsonPath, entityData)
            return { success: true }
        } catch (err) {
            console.error('Error saving entity:', err)
            return { success: false, error: err.message || 'Nie udało się zapisać pliku encji.' }
        }
    }
}

module.exports = EntityService
