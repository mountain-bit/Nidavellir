/**
 * Shared asset constants for the main process (CommonJS).
 *
 * NOTE: Renderer-side TypeScript mirror lives in `Utils/assetUtils.ts`.
 * Both are kept in sync by `tests/Utils/assetConstantsSync.test.ts`.
 */

/** Project-relative directory (POSIX separators) where imported images are stored. */
const ASSETS_IMAGES_DIR = 'Assets/Images'

/** Custom protocol scheme used to serve project assets to the renderer. */
const ASSET_PROTOCOL_SCHEME = 'asset'

/** The only accepted host for the asset protocol (`asset://project/...`). */
const ASSET_PROTOCOL_HOST = 'project'

/** Full URL prefix for project assets. */
const ASSET_URL_PREFIX = `${ASSET_PROTOCOL_SCHEME}://${ASSET_PROTOCOL_HOST}/`

/** Allowed image extensions (lowercase, without dot). */
const IMAGE_EXTENSIONS = Object.freeze(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'])

/** Maximum accepted image size (20 MB). */
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024

/**
 * Builds a project-relative asset path for a file name.
 *
 * @param {string} fileName
 * @returns {string}
 */
function buildRelativeImagePath(fileName) {
    return `${ASSETS_IMAGES_DIR}/${fileName}`
}

/**
 * Builds an `asset://project/...` URL from a project-relative path.
 *
 * @param {string} relativePath
 * @returns {string}
 */
function buildAssetUrl(relativePath) {
    return `${ASSET_URL_PREFIX}${relativePath}`
}

/**
 * Returns true when the extension (with or without leading dot) is an allowed image type.
 *
 * @param {string} ext
 * @returns {boolean}
 */
function isAllowedImageExtension(ext) {
    if (!ext || typeof ext !== 'string') return false
    return IMAGE_EXTENSIONS.includes(ext.replace(/^\./, '').toLowerCase())
}

module.exports = {
    ASSETS_IMAGES_DIR,
    ASSET_PROTOCOL_SCHEME,
    ASSET_PROTOCOL_HOST,
    ASSET_URL_PREFIX,
    IMAGE_EXTENSIONS,
    MAX_IMAGE_SIZE_BYTES,
    buildRelativeImagePath,
    buildAssetUrl,
    isAllowedImageExtension,
}
