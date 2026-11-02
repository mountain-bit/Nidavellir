/**
 * Gamebook Compiler - Orchestrates gamebook compilation into printable/exportable models.
 *
 * Decomposed into domain submodules:
 * - compilerExtractors.js: extractText, extractEntityMarkdown, getAvailablePlayerCharacters
 * - compilerCharacterSheet.js: compileCharacterSheet
 * - compilerCombat.js: parseCombatBlock, renderCombatHtml
 * - compilerMarkdown.js: stripEmojis, formatInlineMarkdown, markdownToHtml, escapeHtml
 * - compilerPrint.js: generatePrintHtml
 */

import { compileCharacterSheet } from './compiler/compilerCharacterSheet.js'
import { parseCombatBlock, renderCombatHtml } from './compiler/compilerCombat.js'
import {
    extractEntityMarkdown,
    extractText,
    getAvailablePlayerCharacters,
} from './compiler/compilerExtractors.js'
import {
    escapeHtml,
    formatInlineMarkdown,
    markdownToHtml,
    stripEmojis,
} from './compiler/compilerMarkdown.js'
import { generatePrintHtml } from './compiler/compilerPrint.js'

// Re-export full public compiler API for seamless backwards-compatibility
export {
    compileCharacterSheet,
    escapeHtml,
    extractEntityMarkdown,
    extractText,
    formatInlineMarkdown,
    generatePrintHtml,
    getAvailablePlayerCharacters,
    markdownToHtml,
    parseCombatBlock,
    renderCombatHtml,
    stripEmojis,
}

/**
 * Compiles project data according to user export options.
 *
 * @param {object} ctx - Application context
 * @param {object} options - Export options
 * @param {object} styleConfig - Active style configuration
 * @returns {object} Compiled gamebook model
 */
export function compileGamebook(ctx, options = {}, styleConfig = {}) {
    const rawParagraphs =
        ctx?.projectData?.projectParagraphs ||
        ctx?.projectParagraphs ||
        ctx?.vm?.project?.paragraphs ||
        []
    const rawLocations =
        ctx?.projectData?.projectLocations ||
        ctx?.projectData?.locations ||
        ctx?.projectLocations ||
        ctx?.vm?.project?.locations ||
        []
    const rawNpcs =
        ctx?.projectData?.projectCharacters ||
        ctx?.projectData?.npcs ||
        ctx?.projectCharacters ||
        ctx?.vm?.project?.characters ||
        []
    const rawItems =
        ctx?.projectData?.projectItems ||
        ctx?.projectData?.items ||
        ctx?.projectItems ||
        ctx?.vm?.project?.items ||
        []
    const rawRules = ctx?.projectData?.rules || ctx?.projectData?.projectRules || []

    const projectName =
        document.getElementById('project-name-display')?.textContent?.trim() ||
        ctx?.vm?.project?.getName?.() ||
        'Moja Gra Paragrafowa'

    // 1. Process paragraphs and numbering
    const compiledParagraphs = processParagraphs(rawParagraphs, options.shuffleParagraphs, ctx)

    // 2. Sections: Locations, NPCs, Items, Glossary
    const startSections = []
    const endSections = []

    // Helper to resolve entity file path
    const getEntityFilePath = ent => {
        const desc =
            typeof ent.getContent === 'function'
                ? ent.getContent()
                : typeof ent.getDescription === 'function'
                  ? ent.getDescription()
                  : ent.content || ent.description
        return (
            (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
            desc?.filePath ||
            desc?.textPath ||
            ent?.filePath ||
            ''
        )
    }

    // Locations
    if (options.includeLocations && rawLocations.length > 0) {
        const locSection = {
            title: 'Atlas Świata i Lokacje',
            type: 'locations',
            items: rawLocations.map(l => ({
                id: (typeof l.getId === 'function' ? l.getId() : l.id) || '',
                name:
                    (typeof l.getName === 'function' ? l.getName() : l.name) || 'Nieznana lokacja',
                description: extractEntityMarkdown(l, ctx),
                filePath: getEntityFilePath(l),
            })),
        }
        if (options.locationsPlacement === 'start') startSections.push(locSection)
        else endSections.push(locSection)
    }

    // NPCs
    if (options.includeNPCs && rawNpcs.length > 0) {
        const npcSection = {
            title: 'Dramatis Personae / Bestiariusz',
            type: 'npcs',
            items: rawNpcs.map(n => ({
                id: (typeof n.getId === 'function' ? n.getId() : n.id) || '',
                name: (typeof n.getName === 'function' ? n.getName() : n.name) || 'Postać',
                description: extractEntityMarkdown(n, ctx),
                filePath: getEntityFilePath(n),
            })),
        }
        if (options.npcsPlacement === 'start') startSections.push(npcSection)
        else endSections.push(npcSection)
    }

    // Items
    if (options.includeItems && rawItems.length > 0) {
        const itemSection = {
            title: 'Katalog Przedmiotów i Artefaktów',
            type: 'items',
            items: rawItems.map(i => {
                const category =
                    typeof i.getCategory === 'function' ? i.getCategory() : i.category || 'misc'
                const slotSize =
                    typeof i.getSlotSize === 'function' ? i.getSlotSize() : (i.slotSize ?? 1)
                const weight = typeof i.getWeight === 'function' ? i.getWeight() : (i.weight ?? 1)
                const isConsumable =
                    typeof i.isConsumable === 'function'
                        ? i.isConsumable()
                        : Boolean(i.isConsumable)
                const tags = (typeof i.getTags === 'function' ? i.getTags() : i.tags || []).map(
                    t => (typeof t.getName === 'function' ? t.getName() : t.name || String(t))
                )
                const modifiers =
                    typeof i.getModifiers === 'function' ? i.getModifiers() : i.modifiers || []
                return {
                    id: (typeof i.getId === 'function' ? i.getId() : i.id) || '',
                    name: (typeof i.getName === 'function' ? i.getName() : i.name) || 'Przedmiot',
                    category,
                    slotSize,
                    weight,
                    isConsumable,
                    tags,
                    modifiers,
                    description: extractEntityMarkdown(i, ctx),
                    filePath: getEntityFilePath(i),
                }
            }),
        }
        if (options.itemsPlacement === 'start') startSections.push(itemSection)
        else endSections.push(itemSection)
    }

    // Glossary
    if (options.includeGlossary) {
        const glossaryItems = extractGlossary(ctx)
        if (glossaryItems.length > 0) {
            const glossarySection = {
                title: 'Glosariusz i Słowniczek Pojęć',
                type: 'glossary',
                items: glossaryItems,
            }
            if (options.glossaryPlacement === 'start') startSections.push(glossarySection)
            else endSections.push(glossarySection)
        }
    }

    // Rules
    let rulesContent = ''
    if (options.includeRules) {
        const dedicatedRules =
            ctx?.files?.['Rules/GameRules.md'] ||
            ctx?.files?.['GameRules.md'] ||
            ctx?.projectData?.files?.['Rules/GameRules.md'] ||
            ctx?.projectData?.files?.['GameRules.md']

        if (typeof dedicatedRules === 'string' && dedicatedRules.trim().length > 0) {
            rulesContent = dedicatedRules.trim()
        } else if (rawRules.length > 0) {
            rulesContent = rawRules
                .map(r => `${r.title || r.name || 'Zasada'}:\n${r.content || r.description || ''}`)
                .join('\n\n')
        }
    }

    // Character Sheet(s)
    const availableHeroes = getAvailablePlayerCharacters(ctx)
    let characterSheets = []

    if (options.includeCharacterSheet && availableHeroes.length > 0) {
        if (Array.isArray(options.selectedHeroIds)) {
            const selIds = options.selectedHeroIds.map(String)
            const filtered = availableHeroes.filter(h => {
                const hId = typeof h.getId === 'function' ? h.getId() : h.id
                const hName = typeof h.getName === 'function' ? h.getName() : h.name
                return (
                    (hId !== undefined && hId !== null && selIds.includes(String(hId))) ||
                    (hName !== undefined && hName !== null && selIds.includes(String(hName)))
                )
            })
            characterSheets = filtered.map(compileCharacterSheet).filter(Boolean)
        } else {
            characterSheets = availableHeroes.map(compileCharacterSheet).filter(Boolean)
        }
    }

    const paragraphMap = {}
    for (const p of compiledParagraphs) {
        if (p.id) {
            paragraphMap[p.id] = p.displayNumber
        }
    }

    return {
        title: projectName,
        author: ctx?.projectData?.author || 'Autor',
        includeCoverPage: options.includeCoverPage !== false,
        rulesContent,
        characterSheet: characterSheets[0] || null,
        characterSheets,
        startSections,
        endSections,
        paragraphs: compiledParagraphs,
        paragraphMap,
        styleConfig,
    }
}

/**
 * Normalizes and optionally shuffles paragraph numbering while respecting locks.
 * Strictly guarantees that paragraph numbers span 1 to N (where N is the total paragraphs count),
 * with paragraph 1 assigned to the starting paragraph, no duplicates, no gaps, and no numbers exceeding N.
 */
function processParagraphs(paragraphs, shuffle = false, ctx = null) {
    if (!paragraphs || paragraphs.length === 0) return []

    // Filter valid paragraphs
    const validParagraphs = paragraphs.filter(Boolean)
    const total = validParagraphs.length
    if (total === 0) return []

    // Map of paragraph original IDs/references
    const pList = validParagraphs.map((p, idx) => {
        const id = p.getId ? p.getId() : p.id || `p-${idx}`
        const isLocked =
            typeof p.getIsNumberLocked === 'function' ? p.getIsNumberLocked() : !!p.isNumberLocked
        const currentNum =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function'
                  ? p.getNumber()
                  : p.number || idx + 1

        const text = extractEntityMarkdown(p, ctx)
        const desc =
            typeof p.getContent === 'function'
                ? p.getContent()
                : typeof p.getDescription === 'function'
                  ? p.getDescription()
                  : p.content || p.description
        const rawFilePath =
            (desc && typeof desc.getFilePath === 'function' ? desc.getFilePath() : null) ||
            desc?.filePath ||
            desc?.textPath ||
            p?.filePath ||
            ''

        const rawChoices = (p.getChoices ? p.getChoices() : p.choices) || []
        const choices = rawChoices.map(ch => {
            const cond = typeof ch.getCondition === 'function' ? ch.getCondition() : ch.condition
            const condSummary =
                cond && typeof cond.getSummary === 'function'
                    ? cond.getSummary()
                    : cond?.text || cond?.name || ''
            const costs = typeof ch.getCosts === 'function' ? ch.getCosts() : ch.costs || []
            const rewards = typeof ch.getRewards === 'function' ? ch.getRewards() : ch.rewards || []
            const diceCheck =
                typeof ch.getDiceCheck === 'function' ? ch.getDiceCheck() : ch.diceCheck || null

            return {
                text:
                    (typeof ch.getName === 'function' ? ch.getName() : null) ||
                    (typeof ch.getTitle === 'function' ? ch.getTitle() : null) ||
                    (typeof ch.getText === 'function' ? ch.getText() : null) ||
                    ch.name ||
                    ch.title ||
                    ch.text ||
                    'Wybierz',
                targetId:
                    (typeof ch.getTargetId === 'function' ? ch.getTargetId() : null) ||
                    (typeof ch.getToParagraphId === 'function' ? ch.getToParagraphId() : null) ||
                    (typeof ch.getTargetParagraphId === 'function'
                        ? ch.getTargetParagraphId()
                        : null) ||
                    ch.targetId ||
                    ch.toParagraphId ||
                    ch.targetParagraphId ||
                    '',
                targetNumber:
                    (typeof ch.getTargetNumber === 'function' ? ch.getTargetNumber() : null) ||
                    ch.targetNumber ||
                    null,
                conditionSummary: condSummary,
                costs,
                rewards,
                diceCheck,
            }
        })

        const isStart =
            (typeof p.getIsStart === 'function' ? p.getIsStart() : p.isStartNode || p.isStart) ||
            false

        return {
            id,
            isLocked,
            originalNum:
                typeof currentNum === 'number' && Number.isInteger(currentNum) ? currentNum : null,
            isStart,
            text,
            filePath: rawFilePath,
            choices,
        }
    })

    const idToNewNumber = new Map()
    const claimedNumbers = new Set()

    // 1. Identify start node (must always receive number 1)
    let startIdx = pList.findIndex(p => p.isStart)
    if (startIdx < 0) {
        startIdx = 0
    }
    const startP = pList[startIdx]
    idToNewNumber.set(startP.id, 1)
    claimedNumbers.add(1)

    // 2. Process locked paragraphs whose locked numbers are valid integers within [1, total]
    pList.forEach(p => {
        if (p.id === startP.id) return
        if (p.isLocked && p.originalNum !== null) {
            // Strictly check that the locked number is within 1 to N and not already claimed
            if (
                p.originalNum >= 1 &&
                p.originalNum <= total &&
                !claimedNumbers.has(p.originalNum)
            ) {
                idToNewNumber.set(p.id, p.originalNum)
                claimedNumbers.add(p.originalNum)
            }
        }
    })

    // 3. Gather remaining available numbers strictly from 1 to total (1 to N)
    const availableNumbers = []
    for (let n = 1; n <= total; n++) {
        if (!claimedNumbers.has(n)) {
            availableNumbers.push(n)
        }
    }

    // 4. Assign numbers to remaining unlocked paragraphs
    if (shuffle) {
        // Shuffle available pool using Fisher-Yates
        for (let i = availableNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]]
        }
    }

    // Assign available numbers in order (shuffled if shuffle=true, sequential ascending if shuffle=false)
    let availIdx = 0
    pList.forEach(p => {
        if (!idToNewNumber.has(p.id)) {
            const assignedNum = availableNumbers[availIdx++]
            idToNewNumber.set(p.id, assignedNum)
        }
    })

    // Also build a fallback map of original numbers to new numbers for choices that only recorded targetNumber
    const oldNumToNewNum = new Map()
    pList.forEach(p => {
        if (p.originalNum !== null && idToNewNumber.has(p.id)) {
            oldNumToNewNum.set(p.originalNum, idToNewNumber.get(p.id))
        }
    })

    // 5. Re-link choices to display numbers and sort paragraphs by presentation number
    const finalParagraphs = pList.map(p => {
        const myDisplayNumber = idToNewNumber.get(p.id) || 1
        const resolvedChoices = p.choices.map(ch => {
            let targetNum = ch.targetNumber
            if (ch.targetId && idToNewNumber.has(ch.targetId)) {
                targetNum = idToNewNumber.get(ch.targetId)
            } else if (targetNum && oldNumToNewNum.has(targetNum)) {
                targetNum = oldNumToNewNum.get(targetNum)
            }

            let resolvedDiceCheck = null
            if (ch.diceCheck && Array.isArray(ch.diceCheck.branches)) {
                resolvedDiceCheck = {
                    ...ch.diceCheck,
                    branches: ch.diceCheck.branches.map(b => {
                        let bTargetNum = null
                        if (b.targetParagraphId && idToNewNumber.has(b.targetParagraphId)) {
                            bTargetNum = idToNewNumber.get(b.targetParagraphId)
                        } else if (b.targetNumber && oldNumToNewNum.has(b.targetNumber)) {
                            bTargetNum = oldNumToNewNum.get(b.targetNumber)
                        }
                        return {
                            ...b,
                            targetNumber: bTargetNum,
                        }
                    }),
                }
            }

            return {
                text: ch.text,
                targetNumber: targetNum,
                conditionSummary: ch.conditionSummary,
                costs: ch.costs,
                rewards: ch.rewards,
                diceCheck: resolvedDiceCheck,
            }
        })

        return {
            id: p.id,
            displayNumber: myDisplayNumber,
            text: p.text,
            filePath: p.filePath,
            choices: resolvedChoices,
        }
    })

    // Sort by presentation number ascending so reading order is strictly 1, 2, ..., N
    finalParagraphs.sort((a, b) => a.displayNumber - b.displayNumber)

    return finalParagraphs
}

/**
 * Extracts and consolidates glossary items from tags and descriptions.
 */
function extractGlossary(ctx) {
    const items = []
    const seen = new Set()

    const tags =
        ctx?.projectData?.projectTags ||
        ctx?.projectData?.tags ||
        ctx?.projectTags ||
        ctx?.vm?.project?.tags ||
        []
    tags.forEach(t => {
        const name = (typeof t.getName === 'function' ? t.getName() : null) || t.name || t.tag || t
        if (typeof name === 'string' && name.trim() && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase())
            const descText =
                (typeof t.getDescription === 'function'
                    ? extractEntityMarkdown(t.getDescription(), ctx)
                    : null) ||
                (typeof t.description === 'string' ? t.description : '') ||
                'Pojęcie kluczowe świata gry.'
            items.push({
                name: name.trim(),
                description: descText,
            })
        }
    })

    items.sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    return items
}
