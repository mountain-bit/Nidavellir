/**
 * Compiler Markdown - Print-safe typographic Markdown parsing and rendering for gamebooks.
 */

import { parseCombatBlock, renderCombatHtml } from './compilerCombat.js'

/**
 * Escapes HTML characters to prevent XSS / formatting issues.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Strips emoji characters from text to ensure clean literary book typography.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripEmojis(text) {
    if (!text) return ''
    return String(text)
        .replace(
            /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
            ''
        )
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
}

/**
 * Formats inline markdown, resolving entity mentions, embeds, and paragraph references into styled HTML elements without emojis.
 *
 * @param {string} str
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function formatInlineMarkdown(str, paragraphMap = {}) {
    if (!str) return ''

    let s = str

    // Links: [label](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, rawLabel, rawUrl) => {
        const url = rawUrl.trim()
        const label = stripEmojis(rawLabel.trim())

        // 1. Paragraph link: entity://paragraph/targetId
        const pMatch = url.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
        if (pMatch) {
            const targetId = pMatch[1]
            const targetNum =
                paragraphMap[targetId] ||
                (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)

            if (targetNum) {
                if (/^§?\s*\d+/.test(label)) {
                    const cleanLabel = label.replace(/^§?\s*\d+\s*:?\s*/, '').trim()
                    return cleanLabel
                        ? `<span class="gamebook-entity gamebook-entity-paragraph">§ ${targetNum} (${escapeHtml(cleanLabel)})</span>`
                        : `<span class="gamebook-entity gamebook-entity-paragraph">§ ${targetNum}</span>`
                }
                return `<span class="gamebook-entity gamebook-entity-paragraph">${escapeHtml(label)} (→ § ${targetNum})</span>`
            }
            return `<span class="gamebook-entity gamebook-entity-paragraph">${escapeHtml(label)}</span>`
        }

        // 2. Entity link: entity://(location|character|npc|item|tag|trait)/id
        const eMatch = url.match(/^entity:\/\/(location|character|npc|item|tag|trait)\/([^/?#]+)$/)
        if (eMatch) {
            const type =
                eMatch[1] === 'npc' ? 'character' : eMatch[1] === 'trait' ? 'tag' : eMatch[1]
            const cleanLabel = label.replace(/^Opis:\s*/i, '').trim()

            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(cleanLabel)}</span></span>`
        }

        // 3. Embed link: embed://(location|character|npc|item)/id...
        const embedMatch = url.match(/^embed:\/\/(location|character|npc|item)\/([^/?#]+)/)
        if (embedMatch) {
            const type = embedMatch[1] === 'npc' ? 'character' : embedMatch[1]
            const cleanLabel = label.replace(/^Opis:\s*/i, '').trim()

            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(cleanLabel)}</span></span>`
        }

        // 4. External link or other
        return `<span class="gamebook-link">${escapeHtml(label)}</span>`
    })

    // Legacy embed macros {{embed:type:id...}}
    s = s.replace(
        /\{\{embed:(item|character|location):([^:}]+)(?::[^}]+)?\}\}/g,
        (_m, type, id) => {
            return `<span class="gamebook-entity gamebook-entity-${type}"><span class="entity-name">${escapeHtml(stripEmojis(id))}</span></span>`
        }
    )

    // Strip any lingering emojis from prose
    s = stripEmojis(s)

    // Bold & italic
    s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    s = s.replace(/`([^`]+)`/g, '<code class="gamebook-code">$1</code>')

    return s
}

/**
 * Converts standard Markdown to semantic print-safe HTML with styled combat and entities.
 *
 * @param {string} mdText
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function markdownToHtml(mdText, paragraphMap = {}) {
    if (!mdText) return ''
    let text = String(mdText).replace(/\r\n/g, '\n')

    // Clean TipTap dialog tags
    text = text.replace(/<p\s+class="gamebook-dialog"[^>]*>([\s\S]*?)<\/p>/gi, '\n\n— $1\n\n')

    // Extract and render combat blocks
    const combatRegex =
        /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})([\s\S]*?)(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\})/gi
    const combatCards = []

    text = text.replace(combatRegex, (_match, combatContent) => {
        const combatData = parseCombatBlock(combatContent, paragraphMap)
        const rendered = renderCombatHtml(combatData, paragraphMap)
        const idx = combatCards.length
        combatCards.push(rendered)
        return `\n\n___COMBAT_PLACEHOLDER_${idx}___\n\n`
    })

    const rawBlocks = text.split(/\n\n+/)
    const htmlBlocks = []

    for (let block of rawBlocks) {
        block = block.trim()
        if (!block) continue

        // Restore combat card
        const combatMatch = block.match(/^___COMBAT_PLACEHOLDER_(\d+)___$/)
        if (combatMatch) {
            const idx = parseInt(combatMatch[1], 10)
            if (combatCards[idx]) {
                htmlBlocks.push(combatCards[idx])
            }
            continue
        }

        // Headings: #, ##, ###, ####
        const hMatch = block.match(/^(#{1,6})\s+(.+)$/)
        if (hMatch) {
            const level = Math.min(hMatch[1].length + 1, 4)
            htmlBlocks.push(
                `<h${level} class="gamebook-heading">${formatInlineMarkdown(hMatch[2], paragraphMap)}</h${level}>`
            )
            continue
        }

        // Dialogue lines: — or –
        if (/^[—–]\s+/.test(block)) {
            htmlBlocks.push(
                `<div class="gamebook-dialog">${formatInlineMarkdown(block, paragraphMap)}</div>`
            )
            continue
        }

        // Blockquotes: > quote
        if (block.startsWith('>')) {
            const lines = block
                .split('\n')
                .map(l => l.replace(/^>\s?/, ''))
                .join('<br/>')
            htmlBlocks.push(
                `<blockquote class="gamebook-quote">${formatInlineMarkdown(lines, paragraphMap)}</blockquote>`
            )
            continue
        }

        // Unordered lists: - or *
        if (/^[-*]\s+/m.test(block)) {
            const items = block
                .split('\n')
                .filter(l => /^[-*]\s+/.test(l.trim()))
                .map(
                    l =>
                        `<li>${formatInlineMarkdown(l.trim().replace(/^[-*]\s+/, ''), paragraphMap)}</li>`
                )
                .join('')
            htmlBlocks.push(`<ul class="gamebook-list">${items}</ul>`)
            continue
        }

        // Ordered lists: 1.
        if (/^\d+\.\s+/m.test(block)) {
            const items = block
                .split('\n')
                .filter(l => /^\d+\.\s+/.test(l.trim()))
                .map(
                    l =>
                        `<li>${formatInlineMarkdown(l.trim().replace(/^\d+\.\s+/, ''), paragraphMap)}</li>`
                )
                .join('')
            htmlBlocks.push(`<ol class="gamebook-ordered-list">${items}</ol>`)
            continue
        }

        // Standard paragraph
        const lines = block
            .split('\n')
            .map(l => formatInlineMarkdown(l, paragraphMap))
            .join('<br/>')
        htmlBlocks.push(`<p>${lines}</p>`)
    }

    return htmlBlocks.join('\n')
}
