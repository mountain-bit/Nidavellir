/**
 * RulesExportService.ts
 *
 * Dedicated service for standalone export of Game Rules (Zasady Gry).
 * Allows generating clean, styled player handouts in HTML, Markdown, or print-ready layouts.
 */

export interface IRulesExportOptions {
    title?: string
    author?: string
    version?: string
    content: string
}

function escapeHtml(str: string): string {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Basic markdown to HTML converter for standalone rules formatting.
 */
function basicMarkdownToHtml(md: string): string {
    if (!md) return ''

    let html = md
        // Headings
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        // Unordered lists
        .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
        // Blockquotes
        .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
        // Line breaks
        .replace(/\n\n+/g, '</p><p>')

    // Wrap list items in <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul>$1</ul>')
    // Remove duplicate nested <ul>
    html = html.replace(/<\/ul>\s*<ul>/g, '')

    return `<p>${html}</p>`
}

export class RulesExportService {
    /**
     * Generates a self-contained, responsive, and print-ready HTML player handout.
     *
     * @param options
     * @returns Full HTML string
     */
    public static exportToHtml(options: IRulesExportOptions): string {
        const title = options.title || 'Zasady Gry'
        const author = options.author || ''
        const version = options.version ? `v${options.version}` : ''
        const bodyContent = basicMarkdownToHtml(options.content || '')

        return `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        :root {
            --bg-color: #faf9f6;
            --text-color: #1f2937;
            --accent-color: #b45309;
            --border-color: #e5e7eb;
            --header-font: 'Cinzel', Georgia, serif;
            --body-font: 'Lora', 'Georgia', serif;
        }

        @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
            @bottom-center {
                content: counter(page);
                font-family: var(--body-font);
                font-size: 9pt;
            }
        }

        body {
            font-family: var(--body-font);
            font-size: 11pt;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            margin: 0;
            padding: 24px;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            text-rendering: optimizeLegibility;
        }

        header.document-header {
            border-bottom: 2pt solid var(--accent-color);
            padding-bottom: 12px;
            margin-bottom: 24px;
        }

        h1 {
            font-family: var(--header-font);
            font-size: 22pt;
            color: var(--accent-color);
            margin: 0 0 6px 0;
            letter-spacing: 0.5px;
        }

        .meta-line {
            font-size: 10pt;
            color: #6b7280;
            margin: 0;
        }

        h2 {
            font-family: var(--header-font);
            font-size: 15pt;
            color: var(--accent-color);
            margin: 20px 0 8px 0;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 4px;
        }

        h3 {
            font-family: var(--header-font);
            font-size: 12pt;
            color: #374151;
            margin: 14px 0 4px 0;
        }

        p {
            margin: 0 0 10px 0;
            text-align: justify;
        }

        ul, ol {
            margin: 6px 0 12px 20px;
            padding: 0;
        }

        li {
            margin-bottom: 4px;
        }

        blockquote {
            border-left: 3px solid var(--accent-color);
            margin: 10px 0 10px 12px;
            padding-left: 12px;
            font-style: italic;
            color: #4b5563;
        }

        strong {
            color: #111827;
        }

        @media print {
            body {
                background: transparent;
                padding: 0;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <header class="document-header">
        <h1>${escapeHtml(title)}</h1>
        <p class="meta-line">
            ${author ? `Autor: ${escapeHtml(author)} • ` : ''}
            ${version ? `${escapeHtml(version)} • ` : ''}
            Wygenerowano w Nidavelir
        </p>
    </header>

    <main class="rules-content">
        ${bodyContent}
    </main>
</body>
</html>`
    }

    /**
     * Generates a clean Markdown export with YAML/frontmatter header.
     *
     * @param options
     * @returns Markdown string
     */
    public static exportToMarkdown(options: IRulesExportOptions): string {
        const title = options.title || 'Zasady Gry'
        const author = options.author || ''
        const version = options.version || '1.0.0'
        const dateStr = new Date().toISOString().split('T')[0]

        const header = [
            '---',
            `title: "${title.replace(/"/g, '\\"')}"`,
            ...(author ? [`author: "${author.replace(/"/g, '\\"')}"`] : []),
            `version: "${version}"`,
            `date: "${dateStr}"`,
            'generator: "Nidavelir Gamebook Engine"',
            '---',
            '',
            '',
        ].join('\n')

        return header + (options.content || '').trim() + '\n'
    }

    /**
     * Triggers a browser file download for exported text content.
     *
     * @param content
     * @param filename
     * @param mimeType
     */
    public static downloadFile(
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
     * Copies content to the system clipboard.
     *
     * @param content
     */
    public static async copyToClipboard(content: string): Promise<boolean> {
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
}
