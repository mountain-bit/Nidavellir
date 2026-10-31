/**
 * Compiler Combat - Parses combat markdown and renders publication-ready combat boxes.
 */

import { escapeHtml, formatInlineMarkdown, stripEmojis } from './compilerMarkdown.js'

/**
 * Parses raw combat markdown block into structured fields (opponents, headers, outcomes).
 *
 * @param {string} combatText
 * @param {object|Map} [paragraphMap={}]
 * @returns {object}
 */
export function parseCombatBlock(combatText, paragraphMap = {}) {
    const raw = stripEmojis(combatText || '')
    const titleMatch = raw.match(/###\s*(?:Starcie:\s*)?([^\n\r]+)/i)
    const title = stripEmojis(titleMatch ? titleMatch[1].trim() : 'Starcie')

    // Extract table lines
    const lines = raw.split(/\r?\n/)
    const tableLines = lines.filter(l => {
        const t = l.trim()
        return t.startsWith('|') && t.endsWith('|')
    })

    let headers = []
    const rows = []

    if (tableLines.length >= 2) {
        headers = tableLines[0]
            .split('|')
            .map(c => stripEmojis(c.trim()))
            .filter((c, i, a) => i > 0 && i < a.length - 1)

        // Ignore separator row (index 1)
        for (let i = 2; i < tableLines.length; i++) {
            const cells = tableLines[i]
                .split('|')
                .map(c => stripEmojis(c.trim()))
                .filter((c, idx, a) => idx > 0 && idx < a.length - 1)
            if (cells.length > 0) {
                rows.push(cells)
            }
        }
    }

    // Extract outcomes
    const outcomes = []
    const outcomeRegex = /-\s*\*\*([^*]+)\*\*\s*→\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.*))/g
    let match
    while ((match = outcomeRegex.exec(raw)) !== null) {
        const name = stripEmojis(match[1].trim())
        const linkText = stripEmojis((match[2] || match[4] || '').trim())
        const targetUrl = (match[3] || '').trim()

        let targetNumber = null
        if (targetUrl) {
            const pMatch = targetUrl.match(/^entity:\/\/paragraph\/([^/?#]+)$/)
            if (pMatch) {
                const targetId = pMatch[1]
                targetNumber =
                    paragraphMap[targetId] ||
                    (typeof paragraphMap.get === 'function' ? paragraphMap.get(targetId) : null)
            }
        }
        if (!targetNumber) {
            const numMatch = linkText.match(/§\s*(\d+)/) || linkText.match(/(\d+)/)
            if (numMatch) {
                targetNumber = parseInt(numMatch[1], 10)
            }
        }

        let cleanTarget = linkText
            .replace(/entity:\/\/[^)]+/g, '')
            .replace(/[()[\]]/g, '')
            .trim()

        if (targetNumber) {
            cleanTarget = `Przejdź do § ${targetNumber}`
        }

        outcomes.push({
            name,
            targetNumber,
            targetText:
                cleanTarget || (targetNumber ? `Przejdź do § ${targetNumber}` : 'Koniec starcia'),
        })
    }

    return {
        title,
        headers,
        rows,
        outcomes,
        hasOpponents: rows.length > 0,
        raw,
    }
}

/**
 * Renders parsed combat data into semantic, publication-styled HTML without emojis.
 *
 * @param {object} combatData
 * @param {object|Map} [paragraphMap={}]
 * @returns {string}
 */
export function renderCombatHtml(combatData, paragraphMap = {}) {
    const oppTableHtml = combatData.hasOpponents
        ? `
        <table class="combat-opponents-table">
            <thead>
                <tr>
                    ${combatData.headers
                        .map(
                            (h, idx) =>
                                `<th class="${idx === 0 ? 'text-left' : 'text-center'}">${escapeHtml(h)}</th>`
                        )
                        .join('')}
                </tr>
            </thead>
            <tbody>
                ${combatData.rows
                    .map(
                        row => `
                    <tr>
                        ${row
                            .map(
                                (c, idx) =>
                                    `<td class="${idx === 0 ? 'opponent-name' : 'opponent-stat'}">${escapeHtml(c)}</td>`
                            )
                            .join('')}
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
        `
        : ''

    const outcomesHtml =
        combatData.outcomes && combatData.outcomes.length > 0
            ? `
        <div class="combat-outcomes">
            <div class="combat-outcomes-title">Możliwe wyniki walki:</div>
            <ul class="combat-outcomes-list">
                ${combatData.outcomes
                    .map(
                        o => `
                    <li>
                        <span class="outcome-marker">—</span>
                        <span class="outcome-name"><strong>${escapeHtml(o.name)}</strong>:</span>
                        <span class="outcome-target">${escapeHtml(o.targetText)}</span>
                    </li>
                `
                    )
                    .join('')}
            </ul>
        </div>
        `
            : ''

    let plainContentHtml = ''
    if (!combatData.hasOpponents && (!combatData.outcomes || combatData.outcomes.length === 0)) {
        const cleanBody = combatData.raw
            .replace(/###\s*[^\n\r]+/g, '')
            .replace(/---/g, '')
            .trim()
        if (cleanBody) {
            plainContentHtml = `<div class="combat-body">${formatInlineMarkdown(cleanBody, paragraphMap)}</div>`
        }
    }

    return `
    <div class="gamebook-combat-card gamebook-combat-box">
        <div class="combat-card-header">
            <span class="combat-badge">STARCIE: ${escapeHtml(combatData.title.toUpperCase())}</span>
        </div>
        ${oppTableHtml}
        ${outcomesHtml}
        ${plainContentHtml}
    </div>
    `
}
