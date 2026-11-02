export const FONT_STACK_SANS =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
export const FONT_STACK_SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
export const FONT_STACK_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
export const FONT_STACK_CURSIVE =
    'ui-cursive, "Segoe Script", "Apple Chancery", "Comic Sans MS", cursive'
export const FONT_STACK_FANTASY = 'Impact, "Luminari", "Copperplate", fantasy'

export type FontStackCategory =
    | 'serif'
    | 'sans-serif'
    | 'sans'
    | 'mono'
    | 'monospace'
    | 'cursive'
    | 'handwriting'
    | 'fantasy'
    | 'display'

/**
 * Returns a CSS font-family rule value for a given font family identifier or custom font name.
 * Optionally adapts the fallback font stack based on the provided font category.
 */
export function getFontFamilyCss(family?: string, fallbackCategory?: string): string {
    if (!family || typeof family !== 'string') {
        return 'inherit'
    }

    const trimmed = family.trim()
    if (!trimmed || trimmed.toLowerCase() === 'inherit') {
        return 'inherit'
    }

    const lower = trimmed.toLowerCase()
    if (lower === 'serif') {
        return FONT_STACK_SERIF
    }
    if (lower === 'mono' || lower === 'monospace') {
        return FONT_STACK_MONO
    }
    if (lower === 'sans' || lower === 'sans-serif' || lower === 'system-ui') {
        return FONT_STACK_SANS
    }
    if (lower === 'cursive' || lower === 'handwriting') {
        return FONT_STACK_CURSIVE
    }
    if (lower === 'fantasy' || lower === 'display') {
        return FONT_STACK_FANTASY
    }

    // Clean outer quotes and remove internal quotes to avoid CSS injection/syntax breakage
    const cleanFamily = trimmed
        .replace(/^['"]+|['"]+$/g, '')
        .replace(/["']/g, '')
        .trim()
    if (!cleanFamily) {
        return 'inherit'
    }

    const categoryLower = fallbackCategory?.trim().toLowerCase()
    if (categoryLower === 'sans' || categoryLower === 'sans-serif') {
        return `"${cleanFamily}", ${FONT_STACK_SANS}`
    }
    if (categoryLower === 'mono' || categoryLower === 'monospace') {
        return `"${cleanFamily}", ${FONT_STACK_MONO}`
    }
    if (categoryLower === 'cursive' || categoryLower === 'handwriting') {
        return `"${cleanFamily}", ${FONT_STACK_CURSIVE}`
    }
    if (categoryLower === 'fantasy' || categoryLower === 'display') {
        return `"${cleanFamily}", ${FONT_STACK_FANTASY}`
    }

    // Default fallback preserves backward compatibility with serif
    return `"${cleanFamily}", ui-serif, serif`
}
