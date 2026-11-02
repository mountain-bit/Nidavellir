/**
 * Compiler Print - Generates print-ready HTML documents with typographic layout and CSS page rules.
 */

import { escapeHtml, markdownToHtml } from './compilerMarkdown.js'

/**
 * Generates print-ready HTML with @page rules, typographic hierarchy, and separators.
 *
 * @param {object} bookData - Compiled gamebook model
 * @param {object} styleConfig - Style configuration
 * @returns {string} Full HTML document
 */
export function generatePrintHtml(bookData, styleConfig = {}) {
    const pageFormat = styleConfig.pageFormat || 'A5'
    const orientation = styleConfig.pageOrientation || 'portrait'
    const cols = styleConfig.columns || 1
    const margins = styleConfig.margins || { top: 15, bottom: 15, left: 18, right: 15 }
    const fontFamily = styleConfig.fontFamily || 'Georgia, serif'
    const headerFontFamily = styleConfig.headerFontFamily || 'Cinzel, Georgia, serif'
    const fontSize = styleConfig.fontSize || 10
    const headerFontSize = styleConfig.headerFontSize || 13
    const lineHeight = styleConfig.lineHeight || 1.45
    const textColor = styleConfig.textColor || '#1a1a1a'
    const accentColor = styleConfig.accentColor || '#8b1e1e'
    const bgColor = styleConfig.backgroundColor || '#ffffff'
    const pIndent = styleConfig.paragraphIndent ?? 4
    const pSpacing = styleConfig.paragraphSpacing ?? 4
    const sepType = styleConfig.separatorType || 'ornament'
    const customSep = styleConfig.customSeparator || '❖ ❖ ❖'
    const choiceStyle = styleConfig.choiceStyle || 'italic'
    const choicePrefix = styleConfig.choicePrefix || '→ '

    let separatorHtml = ''
    if (sepType === 'page-break') {
        separatorHtml = '<div class="page-break-sep"></div>'
    } else if (sepType === 'line') {
        separatorHtml = '<hr class="p-line-sep" />'
    } else if (sepType === 'ornament') {
        separatorHtml = `<div class="p-ornament-sep">${escapeHtml(customSep)}</div>`
    } else {
        separatorHtml = '<div class="p-space-sep"></div>'
    }

    // Build paragraphs HTML
    const paragraphsHtml = (bookData.paragraphs || [])
        .map((p, idx) => {
            const isLast = idx === bookData.paragraphs.length - 1
            const choicesHtml = (p.choices || [])
                .map(ch => {
                    let prefixTags = ''
                    if (ch.conditionSummary) {
                        prefixTags += `<span class="choice-tag choice-condition" style="color: #b45309; font-weight: 600;">[Jeżeli: ${escapeHtml(ch.conditionSummary)}]</span> `
                    }
                    if (ch.costs && ch.costs.length > 0) {
                        const costsStr = ch.costs.map(c => `${c.value || 1} ${c.name}`).join(', ')
                        prefixTags += `<span class="choice-tag choice-cost" style="color: #b91c1c; font-weight: 600;">[Tracisz: ${escapeHtml(costsStr)}]</span> `
                    }
                    if (ch.rewards && ch.rewards.length > 0) {
                        const rewardsStr = ch.rewards
                            .map(r => `${r.value || 1} ${r.name}`)
                            .join(', ')
                        prefixTags += `<span class="choice-tag choice-reward" style="color: #047857; font-weight: 600;">[Zyskujesz: ${escapeHtml(rewardsStr)}]</span> `
                    }

                    if (
                        ch.diceCheck &&
                        Array.isArray(ch.diceCheck.branches) &&
                        ch.diceCheck.branches.length > 0
                    ) {
                        const dc = ch.diceCheck
                        const statPart = dc.stat ? ` + ${escapeHtml(dc.stat)}` : ''
                        const descPart = dc.description ? ` (${escapeHtml(dc.description)})` : ''
                        const branchesHtml = dc.branches
                            .map(b => {
                                const bTarget = b.targetNumber
                                    ? `idź do ${b.targetNumber}`
                                    : 'pozostań'
                                const bDesc = b.description ? ` — ${escapeHtml(b.description)}` : ''
                                return `<li class="dice-branch-item" style="margin: 2px 0;">Wynik ${b.min}–${b.max}: <strong>${bTarget}</strong>${bDesc}</li>`
                            })
                            .join('')
                        return `
                        <div class="choice-item ${choiceStyle} choice-with-dice" style="margin-bottom: 6px;">
                            <span class="choice-prefix">${escapeHtml(choicePrefix)}</span>${prefixTags}${escapeHtml(ch.text)}
                            <div class="choice-dice-block" style="margin-top: 3px; padding-left: 14px; font-size: 0.9em; color: #4b5563;">
                                <em>Rzuć kośćmi (${escapeHtml(dc.dice)}${statPart})${descPart}:</em>
                                <ul style="margin: 2px 0 0 16px; padding: 0;">
                                    ${branchesHtml}
                                </ul>
                            </div>
                        </div>`
                    }

                    const targetStr = ch.targetNumber
                        ? ` <span class="choice-target">(Idź do ${ch.targetNumber})</span>`
                        : ''
                    return `<div class="choice-item ${choiceStyle}"><span class="choice-prefix">${escapeHtml(choicePrefix)}</span>${prefixTags}${escapeHtml(ch.text)}${targetStr}</div>`
                })
                .join('')

            const bodyHtml = markdownToHtml(p.text || '', bookData.paragraphMap || {})

            return `
            <article class="gamebook-paragraph" id="p-${p.displayNumber}">
                <header class="paragraph-header">
                    <span class="paragraph-number">§ ${p.displayNumber}</span>
                </header>
                <div class="paragraph-body">
                    ${bodyHtml}
                </div>
                ${choicesHtml ? `<div class="paragraph-choices">${choicesHtml}</div>` : ''}
            </article>
            ${!isLast ? separatorHtml : ''}
        `
        })
        .join('')

    // Build extra sections
    const renderSectionList = sections => {
        if (!sections || sections.length === 0) return ''
        return sections
            .map(
                sec => `
            <section class="book-extra-section page-break-before">
                <h2>${escapeHtml(sec.title)}</h2>
                <div class="extra-items-grid">
                    ${(sec.items || [])
                        .map(item => {
                            const metaParts = []
                            if (sec.type === 'items') {
                                if (item.category)
                                    metaParts.push(`Kategoria: ${escapeHtml(item.category)}`)
                                if (item.slotSize !== undefined)
                                    metaParts.push(
                                        `${item.slotSize} ${item.slotSize === 1 ? 'slot' : 'sloty'}`
                                    )
                                if (item.weight) metaParts.push(`${item.weight} kg`)
                                if (item.isConsumable) metaParts.push('Jednorazowy')
                            }
                            const metaHtml =
                                metaParts.length > 0
                                    ? `<div class="item-meta" style="font-size: 8.5pt; color: #666; margin: 2pt 0 4pt 0;">${metaParts.join(' • ')}</div>`
                                    : ''

                            const modsHtml =
                                sec.type === 'items' &&
                                Array.isArray(item.modifiers) &&
                                item.modifiers.length > 0
                                    ? `<div class="item-mods" style="font-size: 8.5pt; margin: 2pt 0 4pt 0;"><strong>Modyfikatory:</strong> ${item.modifiers
                                          .map(m => {
                                              const sign =
                                                  m.operator === '+' && Number(m.value) > 0
                                                      ? '+'
                                                      : ''
                                              return `${escapeHtml(m.targetName)}: ${sign}${escapeHtml(String(m.value))}`
                                          })
                                          .join(', ')}</div>`
                                    : ''

                            const tagsHtml =
                                sec.type === 'items' &&
                                Array.isArray(item.tags) &&
                                item.tags.length > 0
                                    ? `<div class="item-tags" style="font-size: 8pt; color: #888; margin: 2pt 0 4pt 0;">${item.tags
                                          .map(t => `#${escapeHtml(t)}`)
                                          .join(' ')}</div>`
                                    : ''

                            return `
                        <article class="extra-item">
                            <h3 class="item-name">${escapeHtml(item.name)}</h3>
                            ${metaHtml}
                            ${modsHtml}
                            ${tagsHtml}
                            ${item.description ? `<div class="item-desc">${markdownToHtml(item.description, bookData.paragraphMap || {})}</div>` : '<p class="item-desc italic text-gray-500">(Brak opisu)</p>'}
                        </article>
                    `
                        })
                        .join('')}
                </div>
            </section>
        `
            )
            .join('')
    }

    const startSectionsHtml = renderSectionList(bookData.startSections)
    const endSectionsHtml = renderSectionList(bookData.endSections)

    // Character sheet(s) HTML
    const sheets =
        bookData.characterSheets && bookData.characterSheets.length > 0
            ? bookData.characterSheets
            : bookData.characterSheet
              ? [bookData.characterSheet]
              : []

    let sheetHtml = ''
    if (sheets.length > 0) {
        sheetHtml = sheets
            .map(sheet => {
                const basicInfoParts = []
                if (sheet.name) {
                    basicInfoParts.push(
                        `<div><strong>Imię:</strong> ${escapeHtml(sheet.name)}</div>`
                    )
                }
                if (sheet.characterClass) {
                    basicInfoParts.push(
                        `<div><strong>Klasa:</strong> ${escapeHtml(sheet.characterClass)}</div>`
                    )
                }
                const basicInfoHtml =
                    basicInfoParts.length > 0
                        ? `<div class="sheet-row">${basicInfoParts.join('')}</div>`
                        : ''

                const summaryHtml = sheet.summary
                    ? `<p style="font-style: italic; font-size: 9pt; margin: 4px 0 8px 0; color: #555;">${escapeHtml(sheet.summary)}</p>`
                    : ''

                const statsHtml =
                    sheet.stats && sheet.stats.length > 0
                        ? `<div class="sheet-stats-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 6px; margin: 8px 0;">
                            ${sheet.stats.map(s => `<div style="border: 1px solid #ccc; padding: 4px 6px; border-radius: 4px; font-size: 9pt;"><strong>${escapeHtml(s.name)}:</strong> ${escapeHtml(String(s.value))}</div>`).join('')}
                           </div>`
                        : ''

                const paramsHtml =
                    sheet.parameters && sheet.parameters.length > 0
                        ? `<div class="sheet-row stats-row" style="margin-top: 6px;">
                            ${sheet.parameters
                                .map(p => {
                                    const cur =
                                        p.currentValue !== undefined && p.currentValue !== ''
                                            ? p.currentValue
                                            : (p.value ?? '')
                                    const max =
                                        p.maxValue !== undefined && p.maxValue !== ''
                                            ? ` / ${escapeHtml(String(p.maxValue))}`
                                            : ''
                                    const valStr =
                                        cur !== '' || max !== ''
                                            ? ` [ ${escapeHtml(String(cur))}${max} ]`
                                            : ''
                                    return `<div><strong>${escapeHtml(p.name)}:</strong>${valStr}</div>`
                                })
                                .join('')}
                           </div>`
                        : ''

                const skillsHtml =
                    sheet.skills && sheet.skills.length > 0
                        ? `<div style="margin: 6px 0; font-size: 9pt;">
                            <strong>Umiejętności:</strong> ${sheet.skills.map(sk => `${escapeHtml(sk.name)}${sk.value !== undefined && sk.value !== '' ? ` (${escapeHtml(String(sk.value))})` : ''}`).join(', ')}
                           </div>`
                        : ''

                const featuresHtml =
                    sheet.features && sheet.features.length > 0
                        ? `<div style="margin: 6px 0; font-size: 9pt;">
                            <strong>Zdolności i Atuty:</strong>
                            <ul style="margin: 4px 0 0 16px; padding: 0;">
                                ${sheet.features.map(f => `<li><strong>${escapeHtml(f.name)}</strong>${f.description ? `: ${escapeHtml(f.description)}` : ''}</li>`).join('')}
                            </ul>
                           </div>`
                        : ''

                let inventoryHtml = ''
                if (sheet.inventories && sheet.inventories.length > 0) {
                    inventoryHtml = sheet.inventories
                        .map(inv => {
                            const capText =
                                inv.capacity > 0
                                    ? ` (Pojemność: ${inv.capacity} miejsc)`
                                    : ' (Bez limitu)'
                            const invItems = inv.items || []
                            const itemsContent =
                                invItems.length > 0
                                    ? `<ol class="backpack-lines" style="margin: 4px 0 0 16px; padding: 0;">
                                        ${invItems.map(it => `<li>${escapeHtml(it.name)}</li>`).join('')}
                                       </ol>`
                                    : ''
                            return `
                        <div class="sheet-box-inner" style="margin-top: 8px;">
                            <strong>${escapeHtml(inv.name || 'Ekwipunek')}${escapeHtml(capText)}:</strong>
                            ${itemsContent}
                        </div>`
                        })
                        .join('')
                } else if (sheet.items && sheet.items.length > 0) {
                    inventoryHtml = `
                        <div class="sheet-box-inner" style="margin-top: 8px;">
                            <strong>Ekwipunek i Wyposażenie:</strong>
                            <ol class="backpack-lines" style="margin: 4px 0 0 16px; padding: 0;">
                                ${sheet.items.map(it => `<li>${escapeHtml(it.name)}</li>`).join('')}
                            </ol>
                        </div>`
                }

                const tagsHtml =
                    sheet.tags && sheet.tags.length > 0
                        ? `<div style="margin: 6px 0; font-size: 8.5pt; color: #666;">
                            <strong>Tagi:</strong> ${sheet.tags.map(t => escapeHtml(String(t))).join(', ')}
                           </div>`
                        : ''

                const titleText = sheet.name
                    ? `Karta Postaci: ${escapeHtml(sheet.name)}`
                    : 'Karta Postaci'

                return `
                <section class="character-sheet-section page-break-before">
                    <h2>${titleText}</h2>
                    <div class="sheet-box">
                        ${basicInfoHtml}
                        ${summaryHtml}
                        ${paramsHtml}
                        ${statsHtml}
                        ${skillsHtml}
                        ${featuresHtml}
                        ${inventoryHtml}
                        ${tagsHtml}
                    </div>
                </section>
                `
            })
            .join('')
    }

    let rulesSectionHtml = ''
    if (bookData.rulesContent && bookData.rulesContent.trim().length > 0) {
        const rulesBodyHtml = markdownToHtml(bookData.rulesContent, bookData.paragraphMap || {})
        rulesSectionHtml = `
        <section class="gamebook-rules-section page-break-before" style="margin-bottom: 24pt;">
            <header class="rules-header" style="margin-bottom: 12pt; border-bottom: 2pt solid ${accentColor}; padding-bottom: 4pt;">
                <h2 style="font-family: ${headerFontFamily}; color: ${accentColor}; font-size: ${headerFontSize * 1.3}pt; margin: 0;">Zasady Gry i Wprowadzenie</h2>
            </header>
            <div class="paragraph-body rules-body">
                ${rulesBodyHtml}
            </div>
        </section>
        `
    }

    return `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(bookData.title)}</title>
    <style>
        @page {
            size: ${pageFormat} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
            @top-right {
                content: "${escapeHtml(bookData.title)}";
                font-family: ${fontFamily};
                font-size: 8pt;
                color: #888;
            }
            @bottom-center {
                content: counter(page);
                font-family: ${fontFamily};
                font-size: 9pt;
            }
        }

        body {
            font-family: ${fontFamily};
            font-size: ${fontSize}pt;
            line-height: ${lineHeight};
            color: ${textColor};
            background-color: ${bgColor};
            margin: 0;
            padding: 0;
            text-rendering: optimizeLegibility;
        }

        h1, h2, h3, .paragraph-header {
            font-family: ${headerFontFamily};
            color: ${accentColor};
            margin: 0 0 8pt 0;
        }

        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-after: always;
        }
        .cover-title {
            font-size: 26pt;
            margin-bottom: 12pt;
            letter-spacing: 1px;
        }
        .cover-author {
            font-size: 14pt;
            color: #555;
            margin-bottom: 24pt;
        }
        .cover-meta {
            font-size: 9pt;
            color: #888;
        }

        .book-content-container {
            column-count: ${cols};
            column-gap: 8mm;
            column-rule: ${cols > 1 ? '0.5pt solid #e0e0e0' : 'none'};
        }

        .gamebook-paragraph {
            break-inside: avoid;
            margin-bottom: ${pSpacing}pt;
        }

        .paragraph-number {
            font-size: ${headerFontSize}pt;
            font-weight: bold;
            color: ${accentColor};
            display: block;
            margin-bottom: 3pt;
        }

        .paragraph-body p {
            margin: 0 0 ${pSpacing}pt 0;
            text-align: justify;
            text-indent: ${pIndent}mm;
        }
        .paragraph-body p:first-child {
            text-indent: 0;
        }
        .paragraph-body h2, .paragraph-body h3, .paragraph-body h4 {
            font-family: ${headerFontFamily};
            color: ${accentColor};
            margin: 6pt 0 3pt 0;
            font-size: ${headerFontSize}pt;
        }
        .paragraph-body ul, .paragraph-body ol {
            margin: 4pt 0 6pt 14pt;
            padding-left: 0;
        }
        .paragraph-body li {
            margin-bottom: 2pt;
        }
        .gamebook-quote {
            border-left: 2pt solid ${accentColor};
            margin: 6pt 0 6pt 8pt;
            padding-left: 8pt;
            font-style: italic;
            color: #444;
        }
        .gamebook-dialog {
            border-left: 2pt solid ${accentColor};
            margin: 4pt 0 4pt 8pt;
            padding-left: 8pt;
            font-style: italic;
            color: ${textColor};
        }
        .gamebook-combat-card, .gamebook-combat-box {
            border: 1.5pt solid ${accentColor};
            background: #faf8f5;
            border-radius: 4pt;
            padding: 8pt 10pt;
            margin: 10pt 0;
            break-inside: avoid;
            page-break-inside: avoid;
        }
        .combat-card-header {
            border-bottom: 1pt solid rgba(0, 0, 0, 0.12);
            padding-bottom: 4pt;
            margin-bottom: 6pt;
        }
        .combat-badge {
            font-family: ${headerFontFamily};
            font-weight: bold;
            color: ${accentColor};
            font-size: ${fontSize * 0.95}pt;
            letter-spacing: 0.5px;
        }
        .combat-opponents-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6pt 0;
            font-size: ${fontSize * 0.88}pt;
        }
        .combat-opponents-table th {
            background: rgba(0, 0, 0, 0.04);
            border-bottom: 1.5pt solid ${accentColor};
            padding: 4pt 6pt;
            font-weight: bold;
            text-align: center;
        }
        .combat-opponents-table th.text-left {
            text-align: left;
        }
        .combat-opponents-table td {
            border-bottom: 0.5pt solid #ddd;
            padding: 4pt 6pt;
            text-align: center;
        }
        .combat-opponents-table td.opponent-name {
            text-align: left;
            font-weight: bold;
        }
        .combat-opponents-table td.opponent-stat {
            font-family: Consolas, monospace;
            font-weight: bold;
        }
        .combat-outcomes {
            margin-top: 6pt;
            padding-top: 4pt;
            border-top: 0.5pt dashed #ccc;
        }
        .combat-outcomes-title {
            font-weight: bold;
            font-size: ${fontSize * 0.88}pt;
            color: #555;
            margin-bottom: 3pt;
            text-transform: uppercase;
        }
        .combat-outcomes-list {
            list-style: none;
            padding-left: 0;
            margin: 0;
        }
        .combat-outcomes-list li {
            padding: 2pt 0;
            font-size: ${fontSize * 0.9}pt;
        }
        .combat-outcomes-list .outcome-marker {
            margin-right: 3pt;
            color: ${accentColor};
        }
        .combat-outcomes-list .outcome-target {
            font-weight: bold;
            font-style: italic;
            color: ${accentColor};
        }
        .combat-body {
            font-size: ${fontSize * 0.9}pt;
            color: #333;
            margin-top: 4pt;
        }

        /* Entity badges (Locations, NPCs, Items, Tags) without structural brackets */
        .gamebook-entity {
            display: inline-flex;
            align-items: center;
            gap: 2pt;
            padding: 0.5pt 4pt;
            border-radius: 3pt;
            font-size: 0.92em;
            line-height: 1.25;
            vertical-align: baseline;
            border: 0.5pt solid #ccc;
            background: rgba(0, 0, 0, 0.02);
            font-weight: 600;
        }
        .gamebook-entity-location {
            color: #8a5314;
            border-color: #d9ad74;
            background: #fdfaf4;
        }
        .gamebook-entity-character {
            color: #1a5675;
            border-color: #8ec3dc;
            background: #f4fafc;
        }
        .gamebook-entity-item {
            color: #7b2929;
            border-color: #dca3a3;
            background: #fcf6f6;
        }
        .gamebook-entity-tag {
            color: #444444;
            border-color: #cccccc;
            background: #f8f8f8;
        }
        .gamebook-entity-paragraph {
            color: ${accentColor};
            font-weight: bold;
            font-style: italic;
            border: none;
            background: transparent;
            padding: 0;
        }
        .entity-icon {
            font-size: 0.85em;
        }
        .gamebook-link {
            color: ${accentColor};
            text-decoration: underline;
        }
        .gamebook-code {
            font-family: Consolas, monospace;
            background: #eee;
            padding: 1pt 3pt;
            border-radius: 2pt;
            font-size: 8.5pt;
        }

        .paragraph-choices {
            margin-top: 6pt;
            padding-left: 2mm;
        }
        .choice-item {
            margin-bottom: 3pt;
            font-size: ${fontSize * 0.95}pt;
        }
        .choice-item.italic { font-style: italic; }
        .choice-item.bold { font-weight: bold; }
        .choice-item.box {
            border: 0.5pt solid #ddd;
            padding: 3pt 6pt;
            border-radius: 3pt;
            background: #fafafa;
        }
        .choice-target {
            font-weight: bold;
            color: ${accentColor};
        }

        /* Separators */
        .p-ornament-sep {
            text-align: center;
            margin: 12pt 0;
            color: #888;
            font-size: 11pt;
            letter-spacing: 2px;
            break-inside: avoid;
        }
        .p-line-sep {
            border: 0;
            border-top: 0.5pt solid #ccc;
            margin: 10pt auto;
            width: 60%;
            break-inside: avoid;
        }
        .p-space-sep {
            height: 14pt;
        }
        .page-break-sep, .page-break-before {
            page-break-before: always;
            break-before: page;
        }

        /* Extra sections */
        .extra-item {
            margin-bottom: 6pt;
            text-align: justify;
        }
        .item-name {
            font-weight: bold;
            color: ${accentColor};
        }

        /* Rules section */
        .gamebook-rules-section {
            break-before: page;
            page-break-before: always;
        }
        .rules-body p {
            margin: 0 0 ${pSpacing}pt 0;
            text-align: justify;
            text-indent: ${pIndent}mm;
        }
        .rules-body p:first-child {
            text-indent: 0;
        }
        .rules-body h2, .rules-body h3, .rules-body h4 {
            font-family: ${headerFontFamily};
            color: ${accentColor};
            margin: 10pt 0 4pt 0;
        }

        /* Character sheet */
        .sheet-box {
            border: 1pt solid ${accentColor};
            border-radius: 4pt;
            padding: 10pt;
            margin-top: 10pt;
        }
        .sheet-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8pt;
        }
        .backpack-lines {
            margin: 6pt 0 0 0;
            padding-left: 18pt;
            line-height: 1.8;
        }
    </style>
</head>
<body>
    ${
        bookData.includeCoverPage
            ? `
    <div class="cover-page">
        <h1 class="cover-title">${escapeHtml(bookData.title)}</h1>
        <div class="cover-author">${escapeHtml(bookData.author)}</div>
        <div class="cover-meta">Wygenerowano w Nidavelir • ${new Date().toLocaleDateString('pl-PL')}</div>
    </div>`
            : ''
    }

    ${sheetHtml}
    ${rulesSectionHtml}
    ${startSectionsHtml}

    <div class="book-content-container">
        ${paragraphsHtml}
    </div>

    ${endSectionsHtml}
</body>
</html>`
}
