/**
 * Playtest Markdown & Rich-text formatter.
 *
 * Provides safe HTML rendering of narrative Markdown for the playtest simulator:
 * - Inline formatting (bold, italic, strikethrough, code, links)
 * - Headings, blockquotes, gamebook dialogues, lists, and horizontal rules
 * - Fenced code blocks
 * - Markdown tables
 */

import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Formats inline Markdown features (bold, italic, strikethrough, code, links).
 * Escapes raw HTML entities to prevent XSS.
 *
 * @param {string} text
 * @returns {string}
 */
export function formatInlineMarkdown(text) {
    if (!text) return ''

    // Escape raw HTML characters first for safety
    let str = escapeHtml(text)

    // Preserve inline code `code`
    const codePlaceholders = []
    str = str.replace(/`([^`]+)`/g, (_match, code) => {
        const idx = codePlaceholders.length
        codePlaceholders.push(
            `<code class="px-1.5 py-0.5 rounded bg-[#18191c] text-[#8ec8ad] font-mono text-xs border border-[#2e3037]">${code}</code>`
        )
        return `___CODE_INLINE_${idx}___`
    })

    // Markdown Links: [label](url)
    str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, rawUrl) => {
        const url = rawUrl.trim()
        // Entity paragraph link -> interactive playtest jump button
        const pMatch = url.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
        if (pMatch) {
            const targetId = pMatch[1]
            return `<button type="button" class="btn-playtest-inline-link inline-flex items-center gap-1 text-[#8ec8ad] hover:text-[#a8e6c7] hover:underline font-medium cursor-pointer align-baseline px-1.5 py-0.2 rounded bg-[#1c2921]/60 border border-[#2b4c39] transition-colors" data-target-id="${targetId}" title="Przejdź do tego paragrafu">${label}</button>`
        }

        // Entity general link (character, item, location, trait)
        const eMatch = url.match(/^entity:\/\/([^/]+)\/([^/?#]+)$/)
        if (eMatch) {
            const eType = eMatch[1]
            const eId = eMatch[2]
            return `<span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-xs bg-[#202228] border border-[#343740] text-zinc-200 font-medium align-baseline" data-entity-type="${eType}" data-entity-id="${eId}">${label}</span>`
        }

        // Embed transclusion link
        if (url.startsWith('embed://')) {
            return `<span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-xs bg-[#242133] border border-[#4a365f] text-[#c4a8e6] font-medium align-baseline">${label}</span>`
        }

        // External or general web link
        if (/^https?:\/\//i.test(url)) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#8ec8ad] hover:text-[#a8e6c7] underline underline-offset-2 transition-colors">${label}</a>`
        }

        return `<a href="${url}" class="text-[#8ec8ad] hover:text-[#a8e6c7] underline underline-offset-2 transition-colors">${label}</a>`
    })

    // Bold & Italic (*** or ___)
    str = str.replace(
        /\*\*\*(.*?)\*\*\*/g,
        '<strong class="font-bold text-zinc-100"><em>$1</em></strong>'
    )
    str = str.replace(
        /___(.*?)___/g,
        '<strong class="font-bold text-zinc-100"><em>$1</em></strong>'
    )

    // Bold (** or __)
    str = str.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>')
    str = str.replace(/__(.*?)__/g, '<strong class="font-bold text-zinc-100">$1</strong>')

    // Italic (* or _)
    str = str.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-300">$1</em>')
    str = str.replace(/\b_([^_]+)_\b/g, '<em class="italic text-zinc-300">$1</em>')

    // Strikethrough (~~)
    str = str.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-400">$1</del>')

    // Restore inline code
    str = str.replace(/___CODE_INLINE_(\d+)___/g, (_m, idx) => codePlaceholders[Number(idx)] || '')

    return str
}

/**
 * Parses markdown table lines into styled HTML table.
 *
 * @param {string[]} lines
 * @returns {string|null}
 */
export function parseMarkdownTable(lines) {
    if (!lines || lines.length < 2) return null
    const trimmed = lines.map(l => l.trim()).filter(Boolean)
    if (trimmed.length < 2) return null

    const headerLine = trimmed[0]
    const sepLine = trimmed[1]
    const dataLines = trimmed.slice(2)

    // Check if line 2 is markdown table separator: | :--- | :---: | ---: | etc.
    const isSep =
        /^\|?(\s*:?-{2,}:?\s*\|)+\s*(:?-{2,}:?\s*)?\|?$/.test(sepLine) ||
        /^\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+$/.test(sepLine)
    if (!isSep) return null

    const splitRow = row => {
        const cells = row.split('|')
        if (cells.length > 1 && cells[0].trim() === '') cells.shift()
        if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop()
        return cells.map(c => c.trim())
    }

    const headers = splitRow(headerLine)
    const alignments = splitRow(sepLine).map(col => {
        const left = col.startsWith(':')
        const right = col.endsWith(':')
        if (left && right) return 'text-center'
        if (right) return 'text-right'
        return 'text-left'
    })

    const theadThs = headers
        .map((h, i) => {
            const align = alignments[i] || 'text-left'
            return `<th class="py-2.5 px-3 font-semibold text-zinc-200 ${align}">${formatInlineMarkdown(h)}</th>`
        })
        .join('')

    const tbodyRows = dataLines
        .map(row => {
            const cells = splitRow(row)
            const tds = headers
                .map((_, i) => {
                    const cell = cells[i] !== undefined ? cells[i] : ''
                    const align = alignments[i] || 'text-left'
                    return `<td class="py-2 px-3 ${align}">${formatInlineMarkdown(cell)}</td>`
                })
                .join('')
            return `<tr class="hover:bg-[#1d1f25]/50 transition-colors">${tds}</tr>`
        })
        .join('')

    return `<div class="my-3 overflow-x-auto rounded-lg border border-[#2e3037] bg-[#16171a]"><table class="w-full text-left border-collapse text-xs"><thead class="bg-[#1f2127] text-zinc-300 border-b border-[#2e3037]"><tr>${theadThs}</tr></thead><tbody class="divide-y divide-[#282a32] text-zinc-300">${tbodyRows}</tbody></table></div>`
}

/**
 * Formats multi-line Markdown into safe and rich semantic HTML for playtest view.
 * Handles headings, paragraphs, dialogues, blockquotes, markdown tables,
 * lists, horizontal rules, code blocks and inline formatting safely.
 *
 * @param {string} text
 * @returns {string}
 */
export function formatMarkdown(text) {
    if (!text || typeof text !== 'string') return ''

    // 1. Strip HTML comments (e.g. <!-- COMBAT_START -->)
    let raw = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n')

    // 2. Normalize TipTap serialized gamebook dialogs <p class="gamebook-dialog">...</p>
    raw = raw.replace(/<p\s+class="gamebook-dialog"[^>]*>([\s\S]*?)<\/p>/gi, '\n\n— $1\n\n')

    // 3. Extract fenced code blocks ```lang ... ```
    const codeBlocks = []
    raw = raw.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
        const idx = codeBlocks.length
        codeBlocks.push(
            `<pre class="p-3 my-2.5 rounded-lg bg-[#141518] border border-[#2e3037] text-xs font-mono text-zinc-300 overflow-x-auto"><code>${escapeHtml(code.trim())}</code></pre>`
        )
        return `\n\n___FENCED_CODE_${idx}___\n\n`
    })

    const lines = raw.split('\n')
    const blocks = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]
        const trimmed = line.trim()

        if (!trimmed) {
            i++
            continue
        }

        // Fenced code placeholder
        if (/^___FENCED_CODE_\d+___$/.test(trimmed)) {
            const idx = Number(trimmed.replace(/\D/g, ''))
            blocks.push(codeBlocks[idx] || '')
            i++
            continue
        }

        // Headings
        if (/^#{1,6}\s+/.test(trimmed)) {
            const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
            if (hMatch) {
                const level = hMatch[1].length
                const hContent = formatInlineMarkdown(hMatch[2])
                if (level === 1) {
                    blocks.push(
                        `<h2 class="font-bold text-base text-[#8ec8ad] my-3 pb-1 border-b border-[#2e3037]">${hContent}</h2>`
                    )
                } else if (level === 2) {
                    blocks.push(
                        `<h3 class="font-bold text-base text-zinc-100 my-2.5">${hContent}</h3>`
                    )
                } else if (level === 3) {
                    blocks.push(`<h4 class="font-bold text-sm text-zinc-100 my-2">${hContent}</h4>`)
                } else if (level === 4) {
                    blocks.push(
                        `<h5 class="font-bold text-xs text-zinc-200 my-1.5 uppercase tracking-wide">${hContent}</h5>`
                    )
                } else {
                    blocks.push(
                        `<h6 class="font-semibold text-xs text-zinc-300 my-1">${hContent}</h6>`
                    )
                }
                i++
                continue
            }
        }

        // Horizontal Rule
        if (/^(?:---|\*\*\*|___)\s*$/.test(trimmed)) {
            blocks.push('<hr class="my-3.5 border-t border-[#2e3037]" />')
            i++
            continue
        }

        // Markdown Table (starts with | or contains | followed by separator)
        if (trimmed.startsWith('|') || trimmed.includes('|')) {
            const nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : ''
            const looksLikeSep =
                /^\|?(\s*:?-{2,}:?\s*\|)+\s*(:?-{2,}:?\s*)?\|?$/.test(nextTrimmed) ||
                /^\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+$/.test(nextTrimmed)

            if (looksLikeSep) {
                const tableLines = []
                while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
                    tableLines.push(lines[i])
                    i++
                }
                const tableHtml = parseMarkdownTable(tableLines)
                if (tableHtml) {
                    blocks.push(tableHtml)
                    continue
                }
            }
        }

        // Blockquotes (> text)
        if (/^>\s?/.test(trimmed)) {
            const quoteLines = []
            while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
                quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
                i++
            }
            const qContent = quoteLines.map(l => formatInlineMarkdown(l)).join('<br/>')
            blocks.push(
                `<div class="border-l-2 border-[#4f6b8a] pl-3 py-1 my-2 italic text-zinc-300 bg-[#1b222c]/50 rounded-r">${qContent}</div>`
            )
            continue
        }

        // Dialogue line (— or –)
        if (/^[—–]\s+/.test(trimmed)) {
            const dContent = formatInlineMarkdown(trimmed)
            blocks.push(
                `<div class="gamebook-dialog pl-4 border-l-2 border-amber-500/70 my-2 italic text-amber-100/90 font-serif bg-amber-500/5 py-1.5 rounded-r">${dContent}</div>`
            )
            i++
            continue
        }

        // Unordered List (- or * or +)
        if (/^\s*[-*+]\s+/.test(trimmed)) {
            const listItems = []
            while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i].trim())) {
                const itContent = lines[i].trim().replace(/^[-*+]\s+/, '')
                listItems.push(`<li class="ml-2">${formatInlineMarkdown(itContent)}</li>`)
                i++
            }
            blocks.push(
                `<ul class="my-2.5 space-y-1 list-disc list-inside text-zinc-300">${listItems.join('')}</ul>`
            )
            continue
        }

        // Ordered List (1. 2. etc.)
        if (/^\s*\d+\.\s+/.test(trimmed)) {
            const listItems = []
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i].trim())) {
                const itContent = lines[i].trim().replace(/^\d+\.\s+/, '')
                listItems.push(`<li class="ml-2">${formatInlineMarkdown(itContent)}</li>`)
                i++
            }
            blocks.push(
                `<ol class="my-2.5 space-y-1 list-decimal list-inside text-zinc-300">${listItems.join('')}</ol>`
            )
            continue
        }

        // Regular paragraph (read consecutive non-empty lines until next block)
        const pLines = []
        while (i < lines.length) {
            const curTrim = lines[i].trim()
            if (!curTrim) break
            if (
                /^#{1,6}\s+/.test(curTrim) ||
                /^(?:---|\*\*\*|___)\s*$/.test(curTrim) ||
                /^>\s?/.test(curTrim) ||
                /^[—–]\s+/.test(curTrim) ||
                /^\s*[-*+]\s+/.test(curTrim) ||
                /^\s*\d+\.\s+/.test(curTrim) ||
                curTrim.startsWith('___FENCED_CODE_')
            ) {
                break
            }
            pLines.push(curTrim)
            i++
        }

        if (pLines.length > 0) {
            const pContent = pLines.map(l => formatInlineMarkdown(l)).join('<br/>')
            blocks.push(`<p class="leading-relaxed text-zinc-200 my-2">${pContent}</p>`)
        }
    }

    return blocks.join('\n')
}
