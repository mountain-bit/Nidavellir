const fs = require('fs')
const path = require('path')
const { dialog } = require('electron')
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
})

const ERROR_I18N_KEYS = Object.freeze({
    [ASSET_ERRORS.NO_PROJECT]: 'asset.error.no_project',
    [ASSET_ERRORS.FILE_NOT_FOUND]: 'asset.error.file_not_found',
    [ASSET_ERRORS.UNSUPPORTED_FORMAT]: 'asset.error.unsupported_format',
    [ASSET_ERRORS.FILE_TOO_LARGE]: 'asset.error.file_too_large',
    [ASSET_ERRORS.FORBIDDEN_PATH]: 'asset.error.forbidden_path',
    [ASSET_ERRORS.IMPORT_FAILED]: 'asset.error.import_failed',
    [ASSET_ERRORS.LIST_FAILED]: 'asset.error.list_failed',
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
     * Lists all image assets in the project's images directory.
     *
     * @param {Object} [payload]
     * @param {string|null} [payload.projectPath]
     * @returns {Promise<{ success: boolean, assets?: Array<{ relativePath: string, fileName: string, assetUrl: string }>, errorCode?: string, error?: string }>}
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
            const assets = files
                .filter(file => isAllowedImageExtension(path.extname(file)))
                .map(fileName => {
                    const relativePath = buildRelativeImagePath(fileName)
                    return { fileName, relativePath, assetUrl: buildAssetUrl(relativePath) }
                })

            return { success: true, assets }
        } catch (err) {
            console.error('Error listing assets:', err)
            return failure(ASSET_ERRORS.LIST_FAILED)
        }
    }
}

AssetService.ASSET_ERRORS = ASSET_ERRORS

module.exports = AssetService
