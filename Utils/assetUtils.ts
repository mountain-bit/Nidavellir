/**
 * Utility functions for handling gamebook asset paths and URLs (renderer side).
 *
 * NOTE: Constants below mirror `Utils/assetConstants.js` (main process, CommonJS).
 * Both are kept in sync by `tests/Utils/assetConstantsSync.test.ts`.
 */

export const ASSETS_ROOT_DIR = 'Assets'
export const ASSETS_IMAGES_DIR = 'Assets/Images'
export const ASSETS_AUDIO_DIR = 'Assets/Audio'
export const ASSET_PROTOCOL_SCHEME = 'asset'
export const ASSET_PROTOCOL_HOST = 'project'
export const ASSET_URL_PREFIX = `${ASSET_PROTOCOL_SCHEME}://${ASSET_PROTOCOL_HOST}/`
export const IMAGE_EXTENSIONS: readonly string[] = Object.freeze([
    'png',
    'jpg',
    'jpeg',
    'webp',
    'svg',
    'gif',
])
export const AUDIO_EXTENSIONS: readonly string[] = Object.freeze([
    'mp3',
    'ogg',
    'wav',
    'flac',
    'aac',
    'm4a',
])
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024

const IMAGE_EXTENSION_REGEX = new RegExp(`\\.(${IMAGE_EXTENSIONS.join('|')})$`, 'i')
const PASSTHROUGH_URL_REGEX = /^(asset|https?|data):/i

/**
 * Returns true when the extension is an allowed image type.
 *
 * @param {string} ext
 * @returns {boolean}
 */
export function isAllowedImageExtension(ext: string): boolean {
    if (!ext || typeof ext !== 'string') return false
    return IMAGE_EXTENSIONS.includes(ext.replace(/^\./, '').toLowerCase())
}

/**
 * Returns true when the extension is an allowed audio type.
 *
 * @param {string} ext
 * @returns {boolean}
 */
export function isAllowedAudioExtension(ext: string): boolean {
    if (!ext || typeof ext !== 'string') return false
    return AUDIO_EXTENSIONS.includes(ext.replace(/^\./, '').toLowerCase())
}

/**
 * Determines the category of an asset ('image', 'audio', or 'unknown') from its file name or extension.
 *
 * @param {string} fileNameOrExt
 * @returns {'image' | 'audio' | 'unknown'}
 */
export function getAssetCategory(fileNameOrExt: string): 'image' | 'audio' | 'unknown' {
    if (!fileNameOrExt || typeof fileNameOrExt !== 'string') return 'unknown'
    const clean = fileNameOrExt.split('?')[0].split('#')[0]
    const extMatch = clean.includes('.') ? clean.split('.').pop() : clean
    const ext = (extMatch || '').toLowerCase()
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
    return 'unknown'
}

/**
 * Converts a project-relative asset path into an asset:// URL for Chromium rendering,
 * optionally appending a version query parameter for cache-busting.
 *
 * @param {string} relativePath
 * @param {string|number} [version]
 * @returns {string}
 */
export function toAssetUrl(relativePath: string, version?: number | string): string {
    if (!relativePath || typeof relativePath !== 'string') return ''
    if (relativePath.startsWith('data:')) {
        return relativePath
    }
    let base = relativePath
    if (!PASSTHROUGH_URL_REGEX.test(relativePath)) {
        const cleanPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
        base = `${ASSET_URL_PREFIX}${cleanPath}`
    }
    if (version !== undefined && version !== null && version !== '') {
        const separator = base.includes('?') ? '&' : '?'
        return `${base}${separator}v=${encodeURIComponent(String(version))}`
    }
    return base
}

/**
 * Strips query parameters, fragments, and the asset://project/ prefix to restore a clean relative path for storage.
 *
 * @param {string} url
 * @returns {string}
 */
export function toRelativeAssetPath(url: string): string {
    if (!url || typeof url !== 'string') return ''
    const withoutQuery = url.split('?')[0].split('#')[0]
    const normalized = withoutQuery.replace(/\\/g, '/')
    if (normalized.startsWith(ASSET_URL_PREFIX)) {
        return normalized.slice(ASSET_URL_PREFIX.length)
    }
    return normalized.replace(/^asset:\/\/(?:project\/)?/, '').replace(/^\/+/, '')
}

/**
 * Determines whether an avatar identifier is a custom file path or a preset SVG ID.
 *
 * @param {string} avatarId
 * @returns {boolean}
 */
export function isCustomAvatarPath(avatarId: string): boolean {
    if (!avatarId || typeof avatarId !== 'string') return false
    return avatarId.includes('/') || avatarId.includes('\\') || IMAGE_EXTENSION_REGEX.test(avatarId)
}
