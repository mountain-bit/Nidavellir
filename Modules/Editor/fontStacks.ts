export const FONT_STACK_SANS =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
export const FONT_STACK_SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
export const FONT_STACK_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

/**
 * Returns a CSS font-family rule value for a given font family identifier or custom font name.
 */
export function getFontFamilyCss(family?: string): string {
    if (!family || family === 'inherit') {
        return 'inherit'
    }

    const lower = family.trim().toLowerCase()
    if (lower === 'serif') {
        return FONT_STACK_SERIF
    }
    if (lower === 'mono' || lower === 'monospace') {
        return FONT_STACK_MONO
    }
    if (lower === 'sans' || lower === 'sans-serif') {
        return FONT_STACK_SANS
    }

    return `"${family}", ui-serif, serif`
}
