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

export type AssetCategory = 'image' | 'audio' | 'unknown'

const IMAGE_EXTENSION_REGEX = new RegExp(`\\.(${IMAGE_EXTENSIONS.join('|')})$`, 'i')
const PASSTHROUGH_URL_REGEX = /^(asset|https?|data):/i

/**
 * Normalizes a file extension by stripping a leading dot and lowercasing.
 */
function normalizeExtension(ext: string): string {
    if (!ext || typeof ext !== 'string') return ''
    return ext.replace(/^\./, '').toLowerCase()
}

/**
 * Builds a project-relative asset path for an image file name.
 */
export function buildRelativeImagePath(fileName: string): string {
    return `${ASSETS_IMAGES_DIR}/${fileName}`
}

/**
 * Returns true when the extension is an allowed image type.
 */
export function isAllowedImageExtension(ext: string): boolean {
    const clean = normalizeExtension(ext)
    return Boolean(clean && IMAGE_EXTENSIONS.includes(clean))
}

/**
 * Returns true when the extension is an allowed audio type.
 */
export function isAllowedAudioExtension(ext: string): boolean {
    const clean = normalizeExtension(ext)
    return Boolean(clean && AUDIO_EXTENSIONS.includes(clean))
}

/**
 * Determines the category of an asset ('image', 'audio', or 'unknown') from its file name or extension.
 */
export function getAssetCategory(fileNameOrExt: string): AssetCategory {
    if (!fileNameOrExt || typeof fileNameOrExt !== 'string') return 'unknown'
    const clean = fileNameOrExt.split('?')[0].split('#')[0]
    const extMatch = clean.includes('.') ? clean.split('.').pop() : clean
    const ext = normalizeExtension(extMatch || '')
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
    if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
    return 'unknown'
}

/**
 * Converts a project-relative asset path into an asset:// URL for Chromium rendering,
 * optionally appending a version query parameter for cache-busting.
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

export const buildAssetUrl = toAssetUrl

/**
 * Strips query parameters, fragments, and the asset://project/ prefix to restore a clean relative path for storage.
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
 */
export function isCustomAvatarPath(avatarId: string): boolean {
    if (!avatarId || typeof avatarId !== 'string') return false
    return avatarId.includes('/') || avatarId.includes('\\') || IMAGE_EXTENSION_REGEX.test(avatarId)
}
