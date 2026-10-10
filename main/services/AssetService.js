const fs = require('fs')
const path = require('path')
const { dialog, shell } = require('electron')
const { resolveProjectDir, isPathInsideBase } = require('../../Utils/fsSecurity')
const { slugifyEntityName, generateUniqueSlug } = require('../../Utils/pathSanitizer')
const { t } = require('../../Utils/i18n')
const {
    ASSETS_IMAGES_DIR,
    IMAGE_EXTENSIONS,
    MAX_IMAGE_SIZE_BYTES,
    buildAssetUrl,
    buildRelativeImagePath,
    isAllowedImageExtension,
} = require('../../Utils/assetConstants')
const ProjectService = require('./ProjectService')

/**
 * Stable error codes returned to the renderer alongside a localized message.
 */
const ASSET_ERRORS = Object.freeze({
    NO_PROJECT: 'NO_PROJECT',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FORBIDDEN_PATH: 'FORBIDDEN_PATH',
    IMPORT_FAILED: 'IMPORT_FAILED',
    LIST_FAILED: 'LIST_FAILED',
    SAVE_FAILED: 'SAVE_FAILED',
    INVALID_DATA: 'INVALID_DATA',
    FILE_ALREADY_EXISTS: 'FILE_ALREADY_EXISTS',
})

const ERROR_I18N_KEYS = Object.freeze({
    [ASSET_ERRORS.NO_PROJECT]: 'asset.error.no_project',
    [ASSET_ERRORS.FILE_NOT_FOUND]: 'asset.error.file_not_found',
    [ASSET_ERRORS.UNSUPPORTED_FORMAT]: 'asset.error.unsupported_format',
    [ASSET_ERRORS.FILE_TOO_LARGE]: 'asset.error.file_too_large',
    [ASSET_ERRORS.FORBIDDEN_PATH]: 'asset.error.forbidden_path',
    [ASSET_ERRORS.IMPORT_FAILED]: 'asset.error.import_failed',
    [ASSET_ERRORS.LIST_FAILED]: 'asset.error.list_failed',
    [ASSET_ERRORS.SAVE_FAILED]: 'asset.error.save_failed',
    [ASSET_ERRORS.INVALID_DATA]: 'asset.error.invalid_data',
    [ASSET_ERRORS.FILE_ALREADY_EXISTS]: 'asset.error.file_already_exists',
})

/**
 * Builds a failure result with a stable code and a localized message.
 *
 * @param {string} errorCode
 * @param {Record<string, unknown>} [params]
 * @returns {{ success: false, errorCode: string, error: string }}
 */
function failure(errorCode, params) {
    return {
        success: false,
        errorCode,
        error: t(ERROR_I18N_KEYS[errorCode], params) || errorCode,
    }
}

/**
 * Resolves the target project directory: explicit path first, active project as fallback.
 *
 * @param {string|null|undefined} projectPath
 * @returns {string|null}
 */
function resolveTargetProjectDir(projectPath) {
    return resolveProjectDir(projectPath) || ProjectService.getCurrentProjectDir()
}

class AssetService {
    /**
     * Opens a native file dialog and copies the selected image into the project's images folder.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @param {string} [payload.prefix='img']
     * @param {import('electron').BrowserWindow|null} [parentWindow] Window the dialog is modal to
     * @returns {Promise<{ success: boolean, canceled?: boolean, relativePath?: string, assetUrl?: string, fileName?: string, errorCode?: string, error?: string }>}
     */
    static async chooseAndImportImage(payload = {}, parentWindow = null) {
        const { projectPath, prefix = 'img' } = payload || {}
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }

        const dialogOptions = {
            title: t('dialog.choose_image'),
            properties: ['openFile'],
            filters: [{ name: t('dialog.image_files'), extensions: [...IMAGE_EXTENSIONS] }],
        }
        const { canceled, filePaths } = parentWindow
            ? await dialog.showOpenDialog(parentWindow, dialogOptions)
            : await dialog.showOpenDialog(dialogOptions)

        if (canceled || !filePaths || filePaths.length === 0) {
            return { success: false, canceled: true }
        }

        return this.importFile(projectDir, filePaths[0], prefix)
    }

    /**
     * Imports an image file into the target project from a given source path on disk.
     *
     * @param {string|null} [projectPath]
     * @param {string} sourcePath
     * @param {string} [prefix='img']
     * @returns {Promise<{ success: boolean, canceled?: boolean, relativePath?: string, assetUrl?: string, fileName?: string, errorCode?: string, error?: string }>}
     */
    static async importFileFromSource(projectPath, sourcePath, prefix = 'img') {
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }
        return this.importFile(projectDir, sourcePath, prefix)
    }

    /**
     * Imports a given file into the project's images directory under a unique, slugified name.
     *
     * @param {string} projectDir
     * @param {string} sourcePath
     * @param {string} [prefix='img']
     * @returns {Promise<{ success: boolean, canceled?: boolean, relativePath?: string, assetUrl?: string, fileName?: string, errorCode?: string, error?: string }>}
     */
    static async importFile(projectDir, sourcePath, prefix = 'img') {
        try {
            if (!sourcePath || !fs.existsSync(sourcePath)) {
                return failure(ASSET_ERRORS.FILE_NOT_FOUND)
            }

            const ext = path.extname(sourcePath).toLowerCase()
            if (!isAllowedImageExtension(ext)) {
                return failure(ASSET_ERRORS.UNSUPPORTED_FORMAT, {
                    formats: IMAGE_EXTENSIONS.join(', '),
                })
            }

            const { size } = await fs.promises.stat(sourcePath)
            if (size > MAX_IMAGE_SIZE_BYTES) {
                return failure(ASSET_ERRORS.FILE_TOO_LARGE, {
                    maxMb: Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)),
                })
            }

            const targetDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))
            await fs.promises.mkdir(targetDir, { recursive: true })

            const safePrefix = slugifyEntityName(prefix, 'img')
            const baseSlug = slugifyEntityName(path.basename(sourcePath, ext), 'image').slice(0, 40)
            const uniqueSlug = generateUniqueSlug(`${safePrefix}_${baseSlug}`, candidate =>
                fs.existsSync(path.join(targetDir, `${candidate}${ext}`))
            )
            const fileName = `${uniqueSlug}${ext}`
            const targetPath = path.join(targetDir, fileName)

            if (!isPathInsideBase(projectDir, targetPath)) {
                return failure(ASSET_ERRORS.FORBIDDEN_PATH)
            }

            await fs.promises.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL)

            const relativePath = buildRelativeImagePath(fileName)
            return {
                success: true,
                canceled: false,
                fileName,
                relativePath,
                assetUrl: buildAssetUrl(relativePath),
            }
        } catch (err) {
            console.error('Error importing asset file:', err)
            return failure(ASSET_ERRORS.IMPORT_FAILED)
        }
    }

    /**
     * Lists all image assets in the project's images directory with file metadata.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @returns {Promise<{ success: boolean, assets?: Array<{ relativePath: string, fileName: string, assetUrl: string, size: number, modifiedAt: number, extension: string }>, errorCode?: string, error?: string }>}
     */
    static async listProjectAssets(payload = {}) {
        const { projectPath } = payload || {}
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }

        const imagesDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))
        if (!fs.existsSync(imagesDir)) {
            return { success: true, assets: [] }
        }

        try {
            const files = await fs.promises.readdir(imagesDir)
            const assets = []
            for (const fileName of files) {
                const ext = path.extname(fileName)
                if (!isAllowedImageExtension(ext)) continue

                const fullPath = path.join(imagesDir, fileName)
                const relativePath = buildRelativeImagePath(fileName)
                let size = 0
                let modifiedAt = 0

                try {
                    const st = await fs.promises.stat(fullPath)
                    size = st.size
                    modifiedAt = st.mtimeMs
                } catch {
                    // Ignore stat errors
                }

                assets.push({
                    fileName,
                    relativePath,
                    assetUrl: buildAssetUrl(relativePath),
                    size,
                    modifiedAt,
                    extension: ext.replace('.', '').toLowerCase(),
                })
            }

            return { success: true, assets }
        } catch (err) {
            console.error('Error listing assets:', err)
            return failure(ASSET_ERRORS.LIST_FAILED)
        }
    }

    /**
     * Deletes an image asset from the project's images directory.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @param {string} payload.relativePath
     * @returns {Promise<{ success: boolean, relativePath?: string, errorCode?: string, error?: string }>}
     */
    static async deleteAsset(payload = {}) {
        const { projectPath, relativePath } = payload || {}
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }
        if (!relativePath || typeof relativePath !== 'string') {
            return failure(ASSET_ERRORS.INVALID_DATA)
        }

        const fullPath = path.resolve(projectDir, relativePath)
        const imagesDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))

        if (!isPathInsideBase(imagesDir, fullPath)) {
            return failure(ASSET_ERRORS.FORBIDDEN_PATH)
        }
        if (!fs.existsSync(fullPath)) {
            return failure(ASSET_ERRORS.FILE_NOT_FOUND)
        }

        try {
            await fs.promises.unlink(fullPath)
            return { success: true, relativePath }
        } catch (err) {
            console.error('Error deleting asset:', err)
            return failure(ASSET_ERRORS.SAVE_FAILED)
        }
    }

    /**
     * Renames an existing image asset in the project.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @param {string} payload.oldRelativePath
     * @param {string} payload.newName
     * @returns {Promise<{ success: boolean, oldRelativePath?: string, newRelativePath?: string, newFileName?: string, assetUrl?: string, errorCode?: string, error?: string }>}
     */
    static async renameAsset(payload = {}) {
        const { projectPath, oldRelativePath, newName } = payload || {}
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }
        if (
            !oldRelativePath ||
            !newName ||
            typeof oldRelativePath !== 'string' ||
            typeof newName !== 'string'
        ) {
            return failure(ASSET_ERRORS.INVALID_DATA)
        }

        const oldFullPath = path.resolve(projectDir, oldRelativePath)
        const imagesDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))

        if (!isPathInsideBase(imagesDir, oldFullPath)) {
            return failure(ASSET_ERRORS.FORBIDDEN_PATH)
        }
        if (!fs.existsSync(oldFullPath)) {
            return failure(ASSET_ERRORS.FILE_NOT_FOUND)
        }

        const originalExt = path.extname(oldFullPath).toLowerCase()
        let targetBase = newName.trim()
        if (targetBase.toLowerCase().endsWith(originalExt)) {
            targetBase = targetBase.slice(0, -originalExt.length)
        }
        const cleanBase = slugifyEntityName(targetBase, 'asset')
        const newFileName = `${cleanBase}${originalExt}`
        const newFullPath = path.join(imagesDir, newFileName)

        if (!isPathInsideBase(imagesDir, newFullPath)) {
            return failure(ASSET_ERRORS.FORBIDDEN_PATH)
        }
        if (newFullPath.toLowerCase() !== oldFullPath.toLowerCase() && fs.existsSync(newFullPath)) {
            return failure(ASSET_ERRORS.FILE_ALREADY_EXISTS)
        }

        try {
            await fs.promises.rename(oldFullPath, newFullPath)
            const newRelativePath = buildRelativeImagePath(newFileName)
            return {
                success: true,
                oldRelativePath,
                newRelativePath,
                newFileName,
                assetUrl: buildAssetUrl(newRelativePath),
            }
        } catch (err) {
            console.error('Error renaming asset:', err)
            return failure(ASSET_ERRORS.SAVE_FAILED)
        }
    }

    /**
     * Reveals the asset file in the operating system's native file explorer.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @param {string} [payload.relativePath]
     * @returns {Promise<{ success: boolean, errorCode?: string, error?: string }>}
     */
    static async openAssetInFolder(payload = {}) {
        const { projectPath, relativePath } = payload || {}
        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }

        const targetPath = relativePath
            ? path.resolve(projectDir, relativePath)
            : path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))

        if (fs.existsSync(targetPath)) {
            shell.showItemInFolder(targetPath)
            return { success: true }
        }
        return failure(ASSET_ERRORS.FILE_NOT_FOUND)
    }

    /**
     * Saves edited image data (base64 data URL) into the project's images directory.
     * Can overwrite the original or create a new copy with a unique slug.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @param {string} payload.dataUrl Base64 data URL (e.g. data:image/png;base64,...)
     * @param {string} [payload.originalRelativePath] Relative path of the original image
     * @param {boolean} [payload.overwrite=false] Whether to overwrite the original file
     * @param {string} [payload.prefix='edited'] Fallback prefix if no original relative path
     * @returns {Promise<{ success: boolean, relativePath?: string, assetUrl?: string, fileName?: string, errorCode?: string, error?: string }>}
     */
    static async saveEditedImage(payload = {}) {
        const {
            projectPath,
            dataUrl,
            originalRelativePath,
            overwrite = false,
            prefix = 'edited',
        } = payload || {}

        const projectDir = resolveTargetProjectDir(projectPath)
        if (!projectDir) {
            return failure(ASSET_ERRORS.NO_PROJECT)
        }

        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
            return failure(ASSET_ERRORS.INVALID_DATA)
        }

        try {
            const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
            if (!matches) {
                return failure(ASSET_ERRORS.INVALID_DATA)
            }

            const rawFormat = matches[1].toLowerCase()
            const ext = rawFormat === 'jpeg' ? '.jpg' : `.${rawFormat}`
            if (!isAllowedImageExtension(ext)) {
                return failure(ASSET_ERRORS.UNSUPPORTED_FORMAT, {
                    formats: IMAGE_EXTENSIONS.join(', '),
                })
            }

            const buffer = Buffer.from(matches[2], 'base64')
            if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
                return failure(ASSET_ERRORS.FILE_TOO_LARGE, {
                    maxMb: Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024)),
                })
            }

            const targetDir = path.join(projectDir, ...ASSETS_IMAGES_DIR.split('/'))
            await fs.promises.mkdir(targetDir, { recursive: true })

            let fileName
            if (overwrite && originalRelativePath) {
                const candidateName = path.basename(originalRelativePath)
                const candidateExt = path.extname(candidateName).toLowerCase()
                const isMatchingJpg =
                    (candidateExt === '.jpg' || candidateExt === '.jpeg') &&
                    (ext === '.jpg' || ext === '.jpeg')

                if (candidateExt !== ext && !isMatchingJpg) {
                    const baseWithoutExt = path.basename(candidateName, candidateExt)
                    fileName = `${baseWithoutExt}${ext}`
                } else {
                    fileName = candidateName
                }

                const candidatePath = path.join(targetDir, fileName)
                if (!isPathInsideBase(projectDir, candidatePath)) {
                    return failure(ASSET_ERRORS.FORBIDDEN_PATH)
                }
            } else {
                const baseName = originalRelativePath
                    ? path.basename(originalRelativePath, path.extname(originalRelativePath))
                    : 'image'
                const safePrefix = slugifyEntityName(prefix, 'edited')
                const baseSlug = slugifyEntityName(baseName, 'image').slice(0, 40)
                const uniqueSlug = generateUniqueSlug(`${safePrefix}_${baseSlug}`, candidate =>
                    fs.existsSync(path.join(targetDir, `${candidate}${ext}`))
                )
                fileName = `${uniqueSlug}${ext}`
            }

            const targetPath = path.join(targetDir, fileName)
            if (!isPathInsideBase(projectDir, targetPath)) {
                return failure(ASSET_ERRORS.FORBIDDEN_PATH)
            }

            await fs.promises.writeFile(targetPath, buffer)

            const relativePath = buildRelativeImagePath(fileName)
            return {
                success: true,
                fileName,
                relativePath,
                assetUrl: buildAssetUrl(relativePath),
            }
        } catch (err) {
            console.error('Error saving edited image:', err)
            return failure(ASSET_ERRORS.SAVE_FAILED)
        }
    }
}

AssetService.ASSET_ERRORS = ASSET_ERRORS

module.exports = AssetService
