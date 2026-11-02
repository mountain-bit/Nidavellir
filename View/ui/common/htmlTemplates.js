import { getIconSvg } from '../../../dist/Utils/icons.js'

/**
 * Escapes special HTML characters to prevent XSS vulnerabilities.
 *
 * @param {any} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (str === undefined || str === null) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Returns the SVG string for a given entity type icon.
 *
 * @param {string} type
 * @param {string} [extraClasses='w-3.5 h-3.5 shrink-0']
 * @returns {string}
 */
export function getTypeIconSvg(type, extraClasses = 'w-3.5 h-3.5 shrink-0') {
    return getIconSvg(type, extraClasses)
}

/**
 * Color palette presets for tags and scenes.
 */
export const PRESET_COLORS = Object.freeze([
    '#4a5b6d', // Stal grafitowa
    '#3f5263', // Ciemny łupek
    '#3e5445', // Szałwia leśna
    '#4c573f', // Ciemna oliwka
    '#69563c', // Zgaszona ochra
    '#69453b', // Zgaszona terakota
    '#643c42', // Stonowany burgund
    '#55425a', // Zgaszona śliwka
    '#41455a', // Grafit indygo
    '#4f545c', // Chłodny popiel
    '#57524c', // Kamienny taupe
    '#3b3d42', // Neutralny antracyt
])

/**
 * Returns Tailwind badge classes according to entity type.
 *
 * @param {string} type
 * @returns {string}
 */
export function getTypeBadgeColor(type) {
    const normalizedType = String(type || '')
        .trim()
        .toLowerCase()

    switch (normalizedType) {
        case 'start':
        case 'start_node':
            return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
        case 'paragraph':
            return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
        case 'scene':
            return 'bg-blue-900/60 text-blue-300 border-blue-700/50'
        case 'character':
            return 'bg-purple-900/60 text-purple-300 border-purple-700/50'
        case 'player_character':
        case 'playercharacter':
        case 'main-character':
            return 'bg-amber-900/60 text-amber-300 border-amber-600/50'
        case 'template':
            return 'bg-purple-950/70 text-purple-200 border-purple-600/50'
        case 'location':
            return 'bg-amber-900/60 text-amber-300 border-amber-700/50'
        case 'stat':
        case 'trait':
            return 'bg-amber-950/70 text-amber-300 border-amber-800/50'
        case 'parameter':
            return 'bg-rose-950/70 text-rose-300 border-rose-800/50'
        case 'skill':
            return 'bg-blue-950/70 text-blue-300 border-blue-800/50'
        case 'feature':
            return 'bg-purple-950/70 text-purple-300 border-purple-800/50'
        case 'tag':
            return 'bg-pink-900/60 text-pink-300 border-pink-700/50'
        case 'item':
            return 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50'
        case 'choice':
        case 'connection':
            return 'bg-teal-900/60 text-teal-300 border-teal-700/50'
        default:
            return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
}

/**
 * Renders an empty state placeholder.
 *
 * @param {string} [iconText='']
 * @param {string} [message='']
 * @returns {string}
 */
export function renderEmptyPlaceholderHtml(iconText = '', message = '') {
    return `
        <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-64">
            <div class="text-3xl mb-3 text-gray-600">${escapeHtml(iconText)}</div>
            <p class="text-xs leading-relaxed max-w-[200px]">${escapeHtml(message)}</p>
        </div>
    `
}

/**
 * Renders color preset buttons HTML.
 *
 * @param {string[]} [presetColors=PRESET_COLORS]
 * @param {string} [currentColor='']
 * @returns {string}
 */
export function renderColorPresetButtonsHtml(presetColors = PRESET_COLORS, currentColor = '') {
    const colors = Array.isArray(presetColors) ? presetColors : PRESET_COLORS
    return colors
        .map(c => {
            const isMatch =
                String(c || '').toLowerCase() === String(currentColor || '').toLowerCase()
            const borderClass = isMatch
                ? 'border-white ring-2 ring-white/50 scale-105'
                : 'border-white/15'
            return `
                <button type="button" class="details-color-preset-btn h-5 rounded border transition-transform hover:scale-110 cursor-pointer ${borderClass}"
                    style="background-color: ${escapeHtml(c)}" data-color="${escapeHtml(c)}" title="${escapeHtml(c)}"></button>
            `
        })
        .join('')
}
