import { ICustomTextStyle } from './types'

const STYLE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGB_COLOR_PATTERN =
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/
const FONT_FAMILY_PATTERN = /^[\p{L}\p{N} _-]{1,64}$/u

/**
 * Returns true when the id is safe to embed in a CSS class name and an HTML attribute.
 */
export function isSafeStyleId(id: unknown): id is string {
    return typeof id === 'string' && STYLE_ID_PATTERN.test(id)
}

/**
 * Returns the color if it is a valid hex / rgb(a) literal, otherwise undefined.
 */
export function sanitizeColor(color: unknown): string | undefined {
    if (typeof color !== 'string') return undefined
    const trimmed = color.trim()
    if (HEX_COLOR_PATTERN.test(trimmed) || RGB_COLOR_PATTERN.test(trimmed)) {
        return trimmed
    }
    return undefined
}

/**
 * Returns the font family if it contains only letters, digits, spaces, `_` or `-`.
 */
export function sanitizeFontFamily(fontFamily: unknown): string | undefined {
    if (typeof fontFamily !== 'string') return undefined
    const trimmed = fontFamily.trim()
    return FONT_FAMILY_PATTERN.test(trimmed) ? trimmed : undefined
}

/**
 * Returns a sanitized copy of the style or null when its id is unsafe.
 * Invalid optional values are dropped instead of rejecting the whole style.
 */
export function sanitizeCustomStyle(style: ICustomTextStyle): ICustomTextStyle | null {
    if (!style || !isSafeStyleId(style.id)) return null
    return {
        ...style,
        name: typeof style.name === 'string' ? style.name : '',
        color: sanitizeColor(style.color),
        backgroundColor: sanitizeColor(style.backgroundColor),
        fontFamily: sanitizeFontFamily(style.fontFamily),
        italic: Boolean(style.italic),
        bold: Boolean(style.bold),
        underline: Boolean(style.underline),
        border: Boolean(style.border),
    }
}
