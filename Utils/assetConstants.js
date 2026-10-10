/**
 * Shared asset constants for the main process (CommonJS).
 *
 * NOTE: Renderer-side TypeScript mirror lives in `Utils/assetUtils.ts`.
 * Both are kept in sync by `tests/Utils/assetConstantsSync.test.ts`.
 */

/** Project-relative root assets directory. */
const ASSETS_ROOT_DIR = 'Assets'

/** Project-relative directory (POSIX separators) where imported images are stored. */
const ASSETS_IMAGES_DIR = 'Assets/Images'

/** Project-relative directory (POSIX separators) where imported audio files are stored. */
const ASSETS_AUDIO_DIR = 'Assets/Audio'

/** Custom protocol scheme used to serve project assets to the renderer. */
const ASSET_PROTOCOL_SCHEME = 'asset'

/** The only accepted host for the asset protocol (`asset://project/...`). */
const ASSET_PROTOCOL_HOST = 'project'

/** Full URL prefix for project assets. */
const ASSET_URL_PREFIX = `${ASSET_PROTOCOL_SCHEME}://${ASSET_PROTOCOL_HOST}/`

/** Allowed image extensions (lowercase, without dot). */
const IMAGE_EXTENSIONS = Object.freeze(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'])

/** Allowed audio extensions (lowercase, without dot). */
const AUDIO_EXTENSIONS = Object.freeze(['mp3', 'ogg', 'wav', 'flac', 'aac', 'm4a'])

/** Maximum accepted image size (20 MB). */
const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024

/**
 * Builds a project-relative asset path for an image file name.
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
 * @param {string|number} [version]
 * @returns {string}
 */
function buildAssetUrl(relativePath, version) {
    const base = `${ASSET_URL_PREFIX}${relativePath}`
    if (version !== undefined && version !== null && version !== '') {
        const separator = base.includes('?') ? '&' : '?'
        return `${base}${separator}v=${encodeURIComponent(String(version))}`
    }
    return base
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

/**
 * Returns true when the extension (with or without leading dot) is an allowed audio type.
 *
 * @param {string} ext
 * @returns {boolean}
 */
function isAllowedAudioExtension(ext) {
    if (!ext || typeof ext !== 'string') return false
    return AUDIO_EXTENSIONS.includes(ext.replace(/^\./, '').toLowerCase())
}

/**
 * Determines the category of an asset ('image', 'audio', or 'unknown') from its file name or extension.
 *
 * @param {string} fileNameOrExt
 * @returns {'image' | 'audio' | 'unknown'}
 */
function getAssetCategory(fileNameOrExt) {
    if (!fileNameOrExt || typeof fileNameOrExt !== 'string') return 'unknown'
    const clean = fileNameOrExt.split('?')[0].split('#')[0]
    const extMatch = clean.includes('.') ? clean.split('.').pop() : clean
    const ext = (extMatch || '').toLowerCase()
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
    return 'unknown'
}

module.exports = {
    ASSETS_ROOT_DIR,
    ASSETS_IMAGES_DIR,
    ASSETS_AUDIO_DIR,
    ASSET_PROTOCOL_SCHEME,
    ASSET_PROTOCOL_HOST,
    ASSET_URL_PREFIX,
    IMAGE_EXTENSIONS,
    AUDIO_EXTENSIONS,
    MAX_IMAGE_SIZE_BYTES,
    buildRelativeImagePath,
    buildAssetUrl,
    isAllowedImageExtension,
    isAllowedAudioExtension,
    getAssetCategory,
}
