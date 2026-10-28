/**
 * Shared formatting, escaping, and browser I/O helpers for Export Services
 * (RulesExportService, ItemExportService, etc.).
 */

/**
 * Escapes HTML special characters to prevent XSS and broken markup.
 */
export function escapeHtml(str: string): string {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Escapes a value for RFC 4180 CSV compliance.
 */
export function escapeCsvCell(val: unknown): string {
    if (val === undefined || val === null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/**
 * Triggers a browser file download for exported text content.
 */
export function downloadTextFile(
    content: string,
    filename: string,
    mimeType: string = 'text/plain'
): void {
    if (typeof document === 'undefined') return
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Copies text content to the system clipboard when available.
 */
export async function copyTextToClipboard(content: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(content)
            return true
        } catch {
            return false
        }
    }
    return false
}
