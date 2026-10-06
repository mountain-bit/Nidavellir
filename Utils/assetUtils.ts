/**
 * Utility functions for handling gamebook asset paths and URLs (renderer side).
 *
 * NOTE: Constants below mirror `Utils/assetConstants.js` (main process, CommonJS).
 * Both are kept in sync by `tests/Utils/assetConstantsSync.test.ts`.
 */

export const ASSETS_IMAGES_DIR = 'Assets/Images'
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
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024

const IMAGE_EXTENSION_REGEX = new RegExp(`\\.(${IMAGE_EXTENSIONS.join('|')})$`, 'i')
const PASSTHROUGH_URL_REGEX = /^(asset|https?|data):/i

/**
 * Converts a project-relative asset path into an asset:// URL for Chromium rendering.
 *
 * @param {string} relativePath
 * @returns {string}
 */
export function toAssetUrl(relativePath: string): string {
    if (!relativePath || typeof relativePath !== 'string') return ''
    if (PASSTHROUGH_URL_REGEX.test(relativePath)) {
        return relativePath
    }
    const cleanPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '')
    return `${ASSET_URL_PREFIX}${cleanPath}`
}

/**
 * Strips the asset://project/ prefix to restore a clean relative path for storage.
 *
 * @param {string} url
 * @returns {string}
 */
export function toRelativeAssetPath(url: string): string {
    if (!url || typeof url !== 'string') return ''
    const normalized = url.replace(/\\/g, '/')
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
