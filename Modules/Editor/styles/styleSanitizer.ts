import { ICustomTextStyle } from '../types'

const STYLE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGB_COLOR_PATTERN =
    /^rgba?\(\s*\d{1,3}%?\s*(?:,\s*|\s+)\d{1,3}%?\s*(?:,\s*|\s+)\d{1,3}%?(?:\s*[,/]\s*(?:0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i
const HSL_COLOR_PATTERN =
    /^hsla?\(\s*\d{1,3}(?:deg|rad|turn)?\s*(?:,\s*|\s+)\d{1,3}%\s*(?:,\s*|\s+)\d{1,3}%(?:\s*[,/]\s*(?:0|1|0?\.\d+|\d{1,3}%)\s*)?\)$/i
const FONT_FAMILY_PATTERN = /^[\p{L}\p{N} _-]{1,64}$/u

/**
 * Returns true when the id is safe to embed in a CSS class name and an HTML attribute.
 */
export function isSafeStyleId(id: unknown): id is string {
    return typeof id === 'string' && STYLE_ID_PATTERN.test(id)
}

/**
 * Returns the color if it is a valid hex, rgb(a), hsl(a) literal, or "transparent", otherwise undefined.
 */
export function sanitizeColor(color: unknown): string | undefined {
    if (typeof color !== 'string') return undefined
    const trimmed = color.trim()
    if (trimmed.toLowerCase() === 'transparent') {
        return 'transparent'
    }
    if (
        HEX_COLOR_PATTERN.test(trimmed) ||
        RGB_COLOR_PATTERN.test(trimmed) ||
        HSL_COLOR_PATTERN.test(trimmed)
    ) {
        return trimmed
    }
    return undefined
}

/**
 * Returns the font family if it contains only letters, digits, spaces, `_` or `-`.
 * Strips outer surrounding quotes if present.
 */
export function sanitizeFontFamily(fontFamily: unknown): string | undefined {
    if (typeof fontFamily !== 'string') return undefined
    const trimmed = fontFamily
        .trim()
        .replace(/^['"]+|['"]+$/g, '')
        .trim()
    return FONT_FAMILY_PATTERN.test(trimmed) ? trimmed : undefined
}

/**
 * Cleans human-readable style name, removing control characters and limiting length.
 */
export function sanitizeStyleName(name: unknown): string {
    if (typeof name !== 'string') return ''
    return name
        .replace(/\p{Cc}/gu, '')
        .trim()
        .slice(0, 100)
}

/**
 * Returns a sanitized copy of the style or null when its id is unsafe.
 * Invalid optional values are dropped instead of rejecting the whole style.
 * Uses strict allowlisting without spreading unknown properties.
 */
export function sanitizeCustomStyle(style: ICustomTextStyle): ICustomTextStyle | null {
    if (!style || !isSafeStyleId(style.id)) return null
    const result: ICustomTextStyle = {
        id: style.id,
        name: sanitizeStyleName(style.name),
        color: sanitizeColor(style.color),
        backgroundColor: sanitizeColor(style.backgroundColor),
        fontFamily: sanitizeFontFamily(style.fontFamily),
        italic: Boolean(style.italic),
        bold: Boolean(style.bold),
        underline: Boolean(style.underline),
        border: Boolean(style.border),
    }

    if (isSafeStyleId(style.docxStyleName)) {
        result.docxStyleName = style.docxStyleName
    }

    return result
}

/**
 * Returns an array of sanitized styles, discarding null or invalid entries.
 */
export function sanitizeCustomStyles(styles: unknown): ICustomTextStyle[] {
    if (!Array.isArray(styles)) return []
    const result: ICustomTextStyle[] = []
    for (const item of styles) {
        const sanitized = sanitizeCustomStyle(item as ICustomTextStyle)
        if (sanitized) {
            result.push(sanitized)
        }
    }
    return result
}
