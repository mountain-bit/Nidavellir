/**
 * RulesExportService.ts
 *
 * Dedicated service for standalone export of Game Rules (Zasady Gry).
 * Allows generating clean, styled player handouts in HTML, Markdown, or print-ready layouts.
 */

import { copyTextToClipboard, downloadTextFile, escapeHtml } from '../helpers/ExportUtils'

export interface IRulesExportOptions {
    title?: string
    author?: string
    version?: string
    content: string
}

/**
 * Formats inline Markdown emphasis (**bold**, *italic*, ***bold-italic***) on an HTML-escaped line.
 */
function formatInlineMarkdown(escapedLine: string): string {
    return escapedLine
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

/**
 * Basic markdown to HTML converter for standalone rules formatting.
 * Escapes raw HTML first and properly separates block elements (<h1..3>, <ul>, <blockquote>) from <p>.
 */
function basicMarkdownToHtml(md: string): string {
    if (!md) return ''

    const blocks = md.trim().split(/\n\n+/)
    const renderedBlocks: string[] = []

    for (const rawBlock of blocks) {
        const trimmed = rawBlock.trim()
        if (!trimmed) continue

        // Unordered list block
        const lines = trimmed.split('\n')
        if (lines.every(line => /^\s*-\s+/.test(line))) {
            const listItems = lines
                .map(line => line.replace(/^\s*-\s+/, ''))
                .map(itemText => `<li>${formatInlineMarkdown(escapeHtml(itemText))}</li>`)
                .join('\n')
            renderedBlocks.push(`<ul>${listItems}</ul>`)
            continue
        }

        // Headings
        if (/^###\s+/.test(trimmed) && lines.length === 1) {
            const text = trimmed.replace(/^###\s+/, '')
            renderedBlocks.push(`<h3>${formatInlineMarkdown(escapeHtml(text))}</h3>`)
            continue
        }
        if (/^##\s+/.test(trimmed) && lines.length === 1) {
            const text = trimmed.replace(/^##\s+/, '')
            renderedBlocks.push(`<h2>${formatInlineMarkdown(escapeHtml(text))}</h2>`)
            continue
        }
        if (/^#\s+/.test(trimmed) && lines.length === 1) {
            const text = trimmed.replace(/^#\s+/, '')
            renderedBlocks.push(`<h1>${formatInlineMarkdown(escapeHtml(text))}</h1>`)
            continue
        }

        // Blockquotes
        if (lines.every(line => /^>\s?/.test(line))) {
            const quoteText = lines
                .map(line => line.replace(/^>\s?/, ''))
                .map(line => formatInlineMarkdown(escapeHtml(line)))
                .join('<br>')
            renderedBlocks.push(`<blockquote>${quoteText}</blockquote>`)
            continue
        }

        // Regular paragraph (supports inline headings/lists if mixed within single newline block)
        const formattedLines = lines.map(line => {
            if (/^###\s+(.*$)/.test(line)) {
                return `<h3>${formatInlineMarkdown(escapeHtml(line.replace(/^###\s+/, '')))}</h3>`
            }
            if (/^##\s+(.*$)/.test(line)) {
                return `<h2>${formatInlineMarkdown(escapeHtml(line.replace(/^##\s+/, '')))}</h2>`
            }
            if (/^#\s+(.*$)/.test(line)) {
                return `<h1>${formatInlineMarkdown(escapeHtml(line.replace(/^#\s+/, '')))}</h1>`
            }
            if (/^\s*-\s+(.*$)/.test(line)) {
                return `<ul><li>${formatInlineMarkdown(escapeHtml(line.replace(/^\s*-\s+/, '')))}</li></ul>`
            }
            if (/^>\s+(.*$)/.test(line)) {
                return `<blockquote>${formatInlineMarkdown(escapeHtml(line.replace(/^>\s+/, '')))}</blockquote>`
            }
            return formatInlineMarkdown(escapeHtml(line))
        })

        const joined = formattedLines.join('\n').replace(/<\/ul>\s*<ul>/g, '\n')
        renderedBlocks.push(`<p>${joined}</p>`)
    }

    return renderedBlocks.join('\n')
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
     */
    public static downloadFile(
        content: string,
        filename: string,
        mimeType: string = 'text/plain'
    ): void {
        downloadTextFile(content, filename, mimeType)
    }

    /**
     * Copies content to the system clipboard.
     */
    public static async copyToClipboard(content: string): Promise<boolean> {
        return copyTextToClipboard(content)
    }
}
