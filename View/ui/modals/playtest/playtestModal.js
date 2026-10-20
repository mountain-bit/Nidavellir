/**
 * Playtest & Gamebook Narrative Simulator Engine.
 *
 * Provides an interactive playthrough window for testing gamebooks:
 * - Displays active paragraph narrative & formatted text in editor theme
 * - Dynamic choice actions with keyboard shortcuts (1-9)
 * - Step-by-step history stack with undo / step back (Backspace)
 * - Interactive breadcrumbs navigation trail
 * - Teleportation system to any Scene, Graph or specific Paragraph
 * - Author is always in god-mode (full preview & branch exploration)
 * - Quick jump to editor / graph centering
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import {
    CombatSyncService,
    DescriptionTransclusionService,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeIconSvg } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'

/**
 * @typedef {object} PlaytestHistoryEntry
 * @property {string} paragraphId
 * @property {number} paragraphNumber
 * @property {string} paragraphTitle
 * @property {string} [sceneId]
 * @property {string} [sceneName]
 * @property {string} [choiceTakenTitle]
 * @property {boolean} isTeleport
 * @property {number} timestamp
 */

export class PlaytestEngine {
    /**
     * @param {object} ctx - Application context
     */
    constructor(ctx) {
        this.ctx = ctx
        /** @type {PlaytestHistoryEntry[]} */
        this.history = []
        this.currentIndex = -1
        this.godMode = true // In editor, author is always in god mode
        this.visitedParagraphIds = new Set()
    }

    getParagraphs() {
        return (
            this.ctx?.projectData?.projectParagraphs ||
            this.ctx?.projectParagraphs ||
            (this.ctx?.vm?.project?.getParagraphs ? this.ctx.vm.project.getParagraphs() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectParagraphs) ||
            []
        )
    }

    getScenes() {
        return (
            this.ctx?.projectData?.projectScenes ||
            this.ctx?.projectScenes ||
            (this.ctx?.vm?.project?.getScenes ? this.ctx.vm.project.getScenes() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectScenes) ||
            []
        )
    }

    getCharacters() {
        return (
            this.ctx?.projectCharacters ||
            this.ctx?.projectData?.projectCharacters ||
            (this.ctx?.vm?.project?.getCharacters ? this.ctx.vm.project.getCharacters() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectCharacters) ||
            []
        )
    }

    getTemplates() {
        return (
            this.ctx?.projectTemplates ||
            this.ctx?.projectData?.projectTemplates ||
            (this.ctx?.vm?.project?.getTemplates ? this.ctx.vm.project.getTemplates() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectTemplates) ||
            []
        )
    }

    getNpcs() {
        return [...this.getCharacters(), ...this.getTemplates()]
    }

    getStats() {
        return (
            this.ctx?.projectStats ||
            this.ctx?.projectData?.projectStats ||
            (this.ctx?.vm?.project?.getStats ? this.ctx.vm.project.getStats() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectStats) ||
            []
        )
    }

    getParameters() {
        return (
            this.ctx?.projectParameters ||
            this.ctx?.projectData?.projectParameters ||
            (this.ctx?.vm?.project?.getParameters ? this.ctx.vm.project.getParameters() : []) ||
            (typeof window !== 'undefined' && window.projectData?.projectParameters) ||
            []
        )
    }

    getTraits() {
        const stats = this.getStats()
        const parameters = this.getParameters()
        const traits = []
        stats.forEach(s => {
            const id =
                typeof s.getId === 'function' ? s.getId() : s.id || (s.getName ? s.getName() : '')
            const name = typeof s.getName === 'function' ? s.getName() : s.name || ''
            if (id || name) {
                traits.push({ id: id || name, name: name || id, kind: 'stat' })
            }
        })
        parameters.forEach(p => {
            const id =
                typeof p.getId === 'function' ? p.getId() : p.id || (p.getName ? p.getName() : '')
            const name = typeof p.getName === 'function' ? p.getName() : p.name || ''
            if (id || name) {
                traits.push({ id: id || name, name: name || id, kind: 'parameter' })
            }
        })
        return traits
    }

    findParagraph(paragraphId) {
        if (!paragraphId) return null
        return (
            this.getParagraphs().find(
                p => (typeof p.getId === 'function' ? p.getId() : p.id) === paragraphId
            ) || null
        )
    }

    findScene(sceneId) {
        if (!sceneId) return null
        return (
            this.getScenes().find(
                s => (typeof s.getId === 'function' ? s.getId() : s.id) === sceneId
            ) || null
        )
    }

    findSceneForParagraph(paragraphId) {
        if (!paragraphId) return null
        const scenes = this.getScenes()
        for (const scene of scenes) {
            const paragraphs =
                typeof scene.getParagraphs === 'function'
                    ? scene.getParagraphs()
                    : scene.paragraphs || []
            if (paragraphs.some(p => (p.getId ? p.getId() : p.id) === paragraphId)) {
                return scene
            }
        }
        return null
    }

    getInitialStartParagraph() {
        const paragraphs = this.getParagraphs()
        if (paragraphs.length === 0) return null

        // 1. Sprawdź czy zaznaczony jest paragraf w edytorze
        const selectedItem = this.ctx?.vm?.getSelectedItem ? this.ctx.vm.getSelectedItem() : null
        if (selectedItem && selectedItem.type === 'paragraph' && selectedItem.id) {
            const p = this.findParagraph(selectedItem.id)
            if (p) return p
        }

        // 2. Szukaj węzła oznaczonego jako start
        const trueStartP = paragraphs.find(
            p => (typeof p.getIsStart === 'function' && p.getIsStart()) || p.isStart === true
        )
        if (trueStartP) return trueStartP

        // 3. Sprawdź pierwszą scenę i jej initialParagraphId
        const scenes = this.getScenes()
        if (scenes.length > 0) {
            const firstScene = scenes[0]
            const initialId =
                typeof firstScene.getInitialParagraphId === 'function'
                    ? firstScene.getInitialParagraphId()
                    : firstScene.initialParagraphId
            if (initialId) {
                const initP = this.findParagraph(initialId)
                if (initP) return initP
            }
        }

        return paragraphs[0] || null
    }

    /**
     * Starts or restarts playtest session.
     *
     * @param {string} [startParagraphId]
     */
    start(startParagraphId) {
        if (this.ctx?.vm && typeof this.ctx.vm.ensureParagraphNumbers === 'function') {
            this.ctx.vm.ensureParagraphNumbers(this.getParagraphs())
        }

        this.history = []
        this.currentIndex = -1
        this.visitedParagraphIds.clear()

        const startP = startParagraphId
            ? this.findParagraph(startParagraphId)
            : this.getInitialStartParagraph()

        if (!startP) return null

        const entry = this.createHistoryEntry(startP, null, false)
        this.history.push(entry)
        this.currentIndex = 0
        this.visitedParagraphIds.add(entry.paragraphId)
        return startP
    }

    /**
     * Creates a history snapshot entry.
     *
     * @param {object} p
     * @param {string|null} [choiceTitle]
     * @param {boolean} [isTeleport=false]
     * @returns {PlaytestHistoryEntry}
     */
    createHistoryEntry(p, choiceTitle = null, isTeleport = false) {
        const id = typeof p.getId === 'function' ? p.getId() : p.id || ''
        const number =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function' && p.getNumber() > 0
                  ? p.getNumber()
                  : p.number || 1
        const title =
            typeof p.getTitle === 'function'
                ? p.getTitle()
                : typeof p.getName === 'function'
                  ? p.getName()
                  : `Paragraf ${number}`

        const scene = this.findSceneForParagraph(id)
        const sceneId = scene ? (typeof scene.getId === 'function' ? scene.getId() : scene.id) : ''
        const sceneName = scene
            ? typeof scene.getName === 'function'
                ? scene.getName()
                : scene.name
            : ''

        return {
            paragraphId: id,
            paragraphNumber: number,
            paragraphTitle: title,
            sceneId,
            sceneName,
            choiceTakenTitle: choiceTitle || (isTeleport ? '🚀 Teleportacja' : null),
            isTeleport,
            timestamp: Date.now(),
        }
    }

    /**
     * Transitions to next paragraph via choice.
     *
     * @param {string} targetParagraphId
     * @param {string} choiceTitle
     * @returns {object|null}
     */
    goTo(targetParagraphId, choiceTitle = '') {
        const targetP = this.findParagraph(targetParagraphId)
        if (!targetP) return null

        // Truncate forward history if stepped back previously
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1)
        }

        const entry = this.createHistoryEntry(targetP, choiceTitle, false)
        this.history.push(entry)
        this.currentIndex = this.history.length - 1
        this.visitedParagraphIds.add(entry.paragraphId)
        return targetP
    }

    /**
     * Teleports directly to a scene or specific paragraph.
     *
     * @param {string} [sceneId]
     * @param {string} [targetParagraphId]
     * @param {boolean} [resetHistory=false]
     * @returns {object|null}
     */
    teleportTo(sceneId, targetParagraphId, resetHistory = false) {
        let p = null

        if (targetParagraphId) {
            p = this.findParagraph(targetParagraphId)
        } else if (sceneId) {
            const scene = this.findScene(sceneId)
            if (scene) {
                const initId =
                    typeof scene.getInitialParagraphId === 'function'
                        ? scene.getInitialParagraphId()
                        : scene.initialParagraphId
                if (initId) p = this.findParagraph(initId)

                if (!p) {
                    const paragraphs =
                        typeof scene.getParagraphs === 'function'
                            ? scene.getParagraphs()
                            : scene.paragraphs || []
                    if (paragraphs.length > 0) p = paragraphs[0]
                }
            }
        }

        if (!p) return null

        if (resetHistory) {
            return this.start(typeof p.getId === 'function' ? p.getId() : p.id)
        }

        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1)
        }

        const entry = this.createHistoryEntry(p, '🚀 Teleportacja', true)
        this.history.push(entry)
        this.currentIndex = this.history.length - 1
        this.visitedParagraphIds.add(entry.paragraphId)
        return p
    }

    /**
     * Steps back one item in history.
     *
     * @returns {object|null}
     */
    stepBack() {
        if (!this.canStepBack()) return null
        this.currentIndex--
        const entry = this.history[this.currentIndex]
        return this.findParagraph(entry.paragraphId)
    }

    /**
     * Rewinds directly to a specific history index.
     *
     * @param {number} index
     * @returns {object|null}
     */
    stepToIndex(index) {
        if (index < 0 || index >= this.history.length) return null
        this.currentIndex = index
        const entry = this.history[this.currentIndex]
        return this.findParagraph(entry.paragraphId)
    }

    canStepBack() {
        return this.currentIndex > 0
    }

    getCurrentEntry() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex]
        }
        return null
    }

    getCurrentParagraph() {
        const entry = this.getCurrentEntry()
        return entry ? this.findParagraph(entry.paragraphId) : null
    }

    getHistoryTrail() {
        return this.history.slice(0, this.currentIndex + 1)
    }

    getVisitedCount() {
        return this.visitedParagraphIds.size
    }

    getStepCount() {
        return this.currentIndex + 1
    }

    toggleGodMode() {
        return true
    }
}

/** Active global instance of PlaytestEngine */
let playtestEngineInstance = null
let keydownListenerAttached = false

/**
 * Formats basic Markdown text to styled safe HTML.
 *
 * @param {string} text
 * @returns {string}
 */
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
function parseMarkdownTable(lines) {
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

/**
 * Opens and renders Playtest Simulator modal.
 *
 * @param {object} ctx Application context
 * @param {string} [startParagraphId] Optional paragraph ID to begin with
 */
export function openPlaytestSimulator(ctx, startParagraphId = '') {
    const modal = document.getElementById('modal-playtest')
    if (!modal) {
        toast.error('Błąd: Nie znaleziono okna playtestu w widoku.', 'Playtest')
        return
    }

    if (ctx?.vm && typeof ctx.vm.ensureParagraphNumbers === 'function') {
        ctx.vm.ensureParagraphNumbers(ctx.projectParagraphs)
    }

    playtestEngineInstance = new PlaytestEngine(ctx)
    const initialP = playtestEngineInstance.start(startParagraphId)

    if (!initialP) {
        toast.warning(
            'Brak paragrafów w projekcie do przetestowania. Utwórz pierwszy paragraf.',
            'Playtest'
        )
        return
    }

    initPlaytestUI(ctx)
    renderPlaytestView()

    modal.classList.remove('hidden')
}

/**
 * Closes the Playtest modal.
 */
export function closePlaytestSimulator() {
    const modal = document.getElementById('modal-playtest')
    if (modal) modal.classList.add('hidden')
}

/**
 * Sets up event listeners and UI controls for the Playtest modal.
 *
 * @param {object} ctx
 */
function initPlaytestUI(ctx) {
    const modal = document.getElementById('modal-playtest')
    if (!modal) return

    // Close buttons
    const btnClose = document.getElementById('btn-close-playtest-modal')
    if (btnClose) btnClose.onclick = () => closePlaytestSimulator()

    // Restart button
    const btnRestart = document.getElementById('btn-playtest-restart')
    if (btnRestart) {
        btnRestart.onclick = () => {
            if (!playtestEngineInstance) return
            playtestEngineInstance.start()
            renderPlaytestView()
            toast.info('Zrestartowano rozgrywkę od początku.', 'Playtest')
        }
    }

    // Step Back (Cofnij) button
    const btnBack = document.getElementById('btn-playtest-back')
    if (btnBack) {
        btnBack.onclick = () => {
            if (!playtestEngineInstance || !playtestEngineInstance.canStepBack()) return
            playtestEngineInstance.stepBack()
            renderPlaytestView()
        }
    }

    // Edit current node in Editor/Graph
    const btnEditNode = document.getElementById('btn-playtest-edit-node')
    if (btnEditNode) {
        btnEditNode.onclick = () => {
            if (!playtestEngineInstance) return
            const currentP = playtestEngineInstance.getCurrentParagraph()
            if (!currentP) return
            const pId = typeof currentP.getId === 'function' ? currentP.getId() : currentP.id

            closePlaytestSimulator()
            if (ctx.vm) {
                ctx.vm.setActiveMainView('graph')
                if (ctx.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI(ctx)
                if (ctx.vm.isRightSidebarCollapsed && ctx.vm.isRightSidebarCollapsed()) {
                    ctx.vm.setRightSidebarCollapsed(false)
                }
                const scene = playtestEngineInstance.findSceneForParagraph(pId)
                if (typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(currentP, 'paragraph', scene)
                }
                const graph =
                    ctx.storyGraphInstance ||
                    (typeof window !== 'undefined' ? window.storyGraphInstance : null)
                if (graph && typeof graph.focusOnElement === 'function') {
                    graph.focusOnElement(pId, true)
                }
                const pTitle =
                    typeof currentP.getTitle === 'function'
                        ? currentP.getTitle()
                        : currentP.title || pId
                toast.info(`Wybrano paragraf „${pTitle}” w edytorze.`, 'Edytor')
            }
        }
    }

    // Teleport toggle button
    const btnTeleportToggle = document.getElementById('btn-playtest-teleport-toggle')
    const teleportPanel = document.getElementById('playtest-teleport-panel')
    if (btnTeleportToggle && teleportPanel) {
        btnTeleportToggle.onclick = () => {
            const isHidden = teleportPanel.classList.contains('hidden')
            if (isHidden) {
                openTeleportPanel()
            } else {
                teleportPanel.classList.add('hidden')
                btnTeleportToggle.classList.remove('active')
            }
        }
    }

    // Teleport Cancel button
    const btnTeleportCancel = document.getElementById('btn-playtest-teleport-cancel')
    if (btnTeleportCancel && teleportPanel) {
        btnTeleportCancel.onclick = () => {
            teleportPanel.classList.add('hidden')
            if (btnTeleportToggle) btnTeleportToggle.classList.remove('active')
        }
    }

    // Teleport Submit button
    const btnTeleportSubmit = document.getElementById('btn-playtest-teleport-submit')
    if (btnTeleportSubmit) {
        btnTeleportSubmit.onclick = () => {
            if (!playtestEngineInstance) return
            const sceneSelect = document.getElementById('playtest-teleport-scene-select')
            const pSelect = document.getElementById('playtest-teleport-paragraph-select')
            const sceneId = sceneSelect ? sceneSelect.value : ''
            const paragraphId = pSelect ? pSelect.value : ''

            if (!paragraphId && !sceneId) {
                toast.warning('Wybierz scenę lub paragraf docelowy.', 'Teleportacja')
                return
            }

            const targetP = playtestEngineInstance.teleportTo(sceneId, paragraphId)
            if (targetP) {
                if (teleportPanel) teleportPanel.classList.add('hidden')
                if (btnTeleportToggle) btnTeleportToggle.classList.remove('active')
                renderPlaytestView()
                toast.success('Przeteleportowano do wybranego węzła!', 'Teleportacja')
            } else {
                toast.error('Nie znaleziono węzła docelowego.', 'Teleportacja')
            }
        }
    }

    // Scene select changes list of paragraphs in Teleport panel
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    if (sceneSelect) {
        sceneSelect.onchange = () => updateTeleportParagraphOptions()
    }

    // Search filter input in Teleport panel
    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (searchInput) {
        searchInput.oninput = () => updateTeleportParagraphOptions()
    }

    // Keyboard shortcuts (1-9, Backspace, T, R, Esc)
    if (!keydownListenerAttached) {
        window.addEventListener('keydown', handlePlaytestKeydown)
        keydownListenerAttached = true
    }
}

/**
 * Handles global keydown shortcuts during playtest.
 *
 * @param {KeyboardEvent} e
 */
function handlePlaytestKeydown(e) {
    const modal = document.getElementById('modal-playtest')
    if (!modal || modal.classList.contains('hidden')) return
    if (!playtestEngineInstance) return

    // Don't intercept if user is typing in an input
    const targetTag = e.target?.tagName?.toLowerCase()
    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        if (e.key === 'Escape') {
            const teleportPanel = document.getElementById('playtest-teleport-panel')
            if (teleportPanel && !teleportPanel.classList.contains('hidden')) {
                teleportPanel.classList.add('hidden')
                const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
                if (btnTeleport) btnTeleport.classList.remove('active')
                e.preventDefault()
            }
        }
        return
    }

    // Escape -> close modal
    if (e.key === 'Escape') {
        const teleportPanel = document.getElementById('playtest-teleport-panel')
        if (teleportPanel && !teleportPanel.classList.contains('hidden')) {
            teleportPanel.classList.add('hidden')
            const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
            if (btnTeleport) btnTeleport.classList.remove('active')
            e.preventDefault()
            return
        }
        closePlaytestSimulator()
        e.preventDefault()
        return
    }

    // Backspace or Alt+ArrowLeft -> Step Back
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
        if (playtestEngineInstance.canStepBack()) {
            e.preventDefault()
            playtestEngineInstance.stepBack()
            renderPlaytestView()
        }
        return
    }

    // T / t -> Toggle Teleport Panel
    if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        const teleportPanel = document.getElementById('playtest-teleport-panel')
        const btnTeleport = document.getElementById('btn-playtest-teleport-toggle')
        if (teleportPanel) {
            if (teleportPanel.classList.contains('hidden')) {
                openTeleportPanel()
            } else {
                teleportPanel.classList.add('hidden')
                if (btnTeleport) btnTeleport.classList.remove('active')
            }
        }
        return
    }

    // R / r -> Restart
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        playtestEngineInstance.start()
        renderPlaytestView()
        toast.info('Zrestartowano od początku.', 'Playtest')
        return
    }

    // Number keys 1-9 -> Select choice
    const num = parseInt(e.key, 10)
    if (!isNaN(num) && num >= 1 && num <= 9) {
        const choiceBtns = document.querySelectorAll(
            '#playtest-choices-container .btn-playtest-choice:not([disabled])'
        )
        if (choiceBtns.length >= num) {
            e.preventDefault()
            const chosenBtn = choiceBtns[num - 1]
            chosenBtn?.click()
        }
    }
}

/**
 * Opens and populates the Teleport drawer panel.
 */
function openTeleportPanel() {
    const teleportPanel = document.getElementById('playtest-teleport-panel')
    const btnTeleportToggle = document.getElementById('btn-playtest-teleport-toggle')
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    if (!teleportPanel || !playtestEngineInstance) return

    teleportPanel.classList.remove('hidden')
    if (btnTeleportToggle) btnTeleportToggle.classList.add('active')

    // Populate Scenes
    if (sceneSelect) {
        const scenes = playtestEngineInstance.getScenes()
        const currentP = playtestEngineInstance.getCurrentParagraph()
        const currentPId = currentP ? (currentP.getId ? currentP.getId() : currentP.id) : ''
        const currentScene = playtestEngineInstance.findSceneForParagraph(currentPId)
        const currentSceneId = currentScene
            ? typeof currentScene.getId === 'function'
                ? currentScene.getId()
                : currentScene.id
            : ''

        let html = '<option value="">-- Wszystkie sceny / Cały projekt --</option>'
        scenes.forEach(s => {
            const sId = typeof s.getId === 'function' ? s.getId() : s.id || ''
            const sName = typeof s.getName === 'function' ? s.getName() : s.name || 'Scena'
            const pCount =
                typeof s.getParagraphs === 'function'
                    ? s.getParagraphs().length
                    : (s.paragraphs || []).length
            const isSelected = sId === currentSceneId ? 'selected' : ''
            html += `<option value="${escapeHtml(sId)}" ${isSelected}>${escapeHtml(sName)} (${pCount} paragrafów)</option>`
        })
        sceneSelect.innerHTML = html
    }

    updateTeleportParagraphOptions()

    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (searchInput) {
        searchInput.value = ''
        searchInput.focus()
    }
}

/**
 * Filters and populates paragraph dropdown inside Teleport panel.
 */
function updateTeleportParagraphOptions() {
    const sceneSelect = document.getElementById('playtest-teleport-scene-select')
    const pSelect = document.getElementById('playtest-teleport-paragraph-select')
    const searchInput = document.getElementById('playtest-teleport-search-input')
    if (!pSelect || !playtestEngineInstance) return

    const selectedSceneId = sceneSelect ? sceneSelect.value : ''
    const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase()

    let paragraphs = playtestEngineInstance.getParagraphs()

    if (selectedSceneId) {
        const scene = playtestEngineInstance.findScene(selectedSceneId)
        if (scene) {
            paragraphs =
                typeof scene.getParagraphs === 'function'
                    ? scene.getParagraphs()
                    : scene.paragraphs || []
        }
    }

    if (searchQuery) {
        paragraphs = paragraphs.filter(p => {
            const num = String(
                p.getDisplayNumber
                    ? p.getDisplayNumber()
                    : p.getNumber && p.getNumber() > 0
                      ? p.getNumber()
                      : p.number || ''
            )
            const title = (p.getTitle ? p.getTitle() : p.getName ? p.getName() : '').toLowerCase()
            return num.includes(searchQuery) || title.includes(searchQuery)
        })
    }

    if (paragraphs.length === 0) {
        pSelect.innerHTML = '<option value="">Brak pasujących paragrafów</option>'
        pSelect.disabled = true
        return
    }

    pSelect.disabled = false
    let html = ''
    paragraphs.forEach(p => {
        const pId = typeof p.getId === 'function' ? p.getId() : p.id || ''
        const pNum =
            typeof p.getDisplayNumber === 'function'
                ? p.getDisplayNumber()
                : typeof p.getNumber === 'function' && p.getNumber() > 0
                  ? p.getNumber()
                  : p.number || 1
        const pTitle =
            typeof p.getTitle === 'function'
                ? p.getTitle()
                : typeof p.getName === 'function'
                  ? p.getName()
                  : `Paragraf ${pNum}`
        const isStart = (p.getIsStart ? p.getIsStart() : p.isStart) ? ' ★ [START]' : ''
        const isEnd = (p.getIsEnd ? p.getIsEnd() : p.isEnd) ? ' 🏁 [KONIEC]' : ''

        html += `<option value="${escapeHtml(pId)}">§ ${pNum}: ${escapeHtml(pTitle)}${isStart}${isEnd}</option>`
    })
    pSelect.innerHTML = html
}

/**
 * Renders complete view of current paragraph, choices, breadcrumbs, and stats.
 */
export function renderPlaytestView() {
    if (!playtestEngineInstance) return

    const currentP = playtestEngineInstance.getCurrentParagraph()
    const contentEl = document.getElementById('playtest-content')
    const choicesEl = document.getElementById('playtest-choices-container')
    const badgeEl = document.getElementById('playtest-paragraph-badge')
    const sceneBadgeEl = document.getElementById('playtest-scene-badge')
    const stepCounterEl = document.getElementById('playtest-step-counter')
    const btnBack = document.getElementById('btn-playtest-back')
    const breadcrumbsContainer = document.getElementById('playtest-breadcrumbs-container')

    if (!contentEl || !choicesEl) return

    // Update Step back button disabled state
    if (btnBack) {
        btnBack.disabled = !playtestEngineInstance.canStepBack()
        if (playtestEngineInstance.canStepBack()) {
            btnBack.classList.remove('opacity-40', 'cursor-not-allowed')
        } else {
            btnBack.classList.add('opacity-40', 'cursor-not-allowed')
        }
    }

    // Update Counter
    if (stepCounterEl) {
        stepCounterEl.textContent = `Krok: ${playtestEngineInstance.getStepCount()} · Odwiedzono: ${playtestEngineInstance.getVisitedCount()}`
    }

    // Render Breadcrumbs
    if (breadcrumbsContainer) {
        const trail = playtestEngineInstance.getHistoryTrail()
        breadcrumbsContainer.innerHTML = trail
            .map((entry, idx) => {
                const isCurrent = idx === playtestEngineInstance.currentIndex
                const teleportPrefix = entry.isTeleport ? '🚀 ' : ''
                const badgeClass = isCurrent
                    ? 'bg-[#263545] text-[#b8d1ea] border-[#3d5269] font-semibold shadow-xs'
                    : 'bg-[#212226] hover:bg-[#282a30] text-zinc-300 border-[#2e3037] hover:border-[#3e424c] cursor-pointer'

                return `
                <div class="flex items-center shrink-0">
                    <button
                        type="button"
                        class="btn-playtest-breadcrumb px-2 py-0.5 rounded text-[11px] border transition-colors flex items-center gap-1 ${badgeClass}"
                        data-step-index="${idx}"
                        title="Kliknij, aby cofnąć się do tego kroku"
                    >
                        <span>${teleportPrefix}§${entry.paragraphNumber}: ${escapeHtml(entry.paragraphTitle.slice(0, 18))}</span>
                    </button>
                    ${idx < trail.length - 1 ? '<span class="text-zinc-600 mx-1 text-xs select-none">→</span>' : ''}
                </div>
            `
            })
            .join('')

        breadcrumbsContainer.querySelectorAll('.btn-playtest-breadcrumb').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.stepIndex, 10)
                if (!isNaN(idx)) {
                    playtestEngineInstance.stepToIndex(idx)
                    renderPlaytestView()
                }
            })
        })
    }

    if (!currentP) {
        contentEl.innerHTML = `
            <div class="p-8 text-center text-zinc-400">
                <p class="font-medium text-base text-zinc-300">Koniec opowieści lub brak węzła.</p>
                <p class="text-xs mt-1">Nie znaleziono danych dla tego paragrafu.</p>
            </div>
        `
        choicesEl.innerHTML = ''
        return
    }

    const pNum =
        typeof currentP.getDisplayNumber === 'function'
            ? currentP.getDisplayNumber()
            : typeof currentP.getNumber === 'function' && currentP.getNumber() > 0
              ? currentP.getNumber()
              : currentP.number || 1
    const pTitle =
        typeof currentP.getTitle === 'function'
            ? currentP.getTitle()
            : typeof currentP.getName === 'function'
              ? currentP.getName()
              : `Paragraf ${pNum}`

    const currentScene = playtestEngineInstance.findSceneForParagraph(
        currentP.getId ? currentP.getId() : currentP.id
    )

    // Badges in Header
    if (badgeEl) badgeEl.textContent = `§ ${pNum}: ${pTitle}`
    if (sceneBadgeEl) {
        if (currentScene) {
            const sName =
                typeof currentScene.getName === 'function'
                    ? currentScene.getName()
                    : currentScene.name || 'Scena'
            sceneBadgeEl.textContent = `Scena: ${sName}`
            sceneBadgeEl.classList.remove('hidden')
        } else {
            sceneBadgeEl.classList.add('hidden')
        }
    }

    // Story Text extraction
    let text = ''
    if (currentP.getContent && typeof currentP.getContent === 'function') {
        const desc = currentP.getContent()
        text =
            (desc && desc.getText && desc.getText()) ||
            (desc && desc.getSummary && desc.getSummary()) ||
            ''
    } else if (currentP.content) {
        text = currentP.content.text || currentP.content.summary || ''
    }

    if (!text) {
        text = `*Brak zapisanego tekstu w tym paragrafie.* Możesz uzupełnić treść w edytorze Markdown.`
    }

    let narrativeText = text

    // Resolve description transclusions if projectData is available
    const projectData =
        playtestEngineInstance?.ctx?.projectData ||
        (typeof window !== 'undefined' && window.projectData)
    if (projectData && typeof DescriptionTransclusionService?.resolve === 'function') {
        try {
            narrativeText = DescriptionTransclusionService.resolve(narrativeText, projectData, {
                fallbackOnMissing: 'empty',
            })
        } catch (_e) {
            // ignore transclusion errors
        }
    }

    // Remove technical combat markdown block from narrative view if present,
    // because Playtest displays a rich interactive combat card below.
    narrativeText = narrativeText
        .replace(
            /(?:<!--\s*COMBAT_START\s*-->|\{\{combat:start\}\})[\s\S]*?(?:<!--\s*COMBAT_END\s*-->|\{\{combat:end\}\}|$)/gi,
            ''
        )
        .trim()

    // Paragraph Metadata (Tags, Location, Characters, Combat)
    const tags = (typeof currentP.getTags === 'function' ? currentP.getTags() : currentP.tags) || []
    const locations =
        (typeof currentP.getLocations === 'function'
            ? currentP.getLocations()
            : currentP.locations) || []
    const characters =
        (typeof currentP.getCharacters === 'function'
            ? currentP.getCharacters()
            : currentP.characters) || []
    const hasCombat =
        (typeof currentP.getHasCombat === 'function'
            ? currentP.getHasCombat()
            : currentP.hasCombat) || false
    const isStart =
        (typeof currentP.getIsStart === 'function' ? currentP.getIsStart() : currentP.isStart) ||
        false
    const isEnd =
        (typeof currentP.getIsEnd === 'function' ? currentP.getIsEnd() : currentP.isEnd) || false

    const metaBadgesHtml = []

    if (isStart) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#1c2921] border border-[#2b4c39] text-[#8ec8ad] text-[11px] font-semibold flex items-center gap-1">${getIconSvg('play', 'w-3 h-3')} Początek gry</span>`
        )
    }

    if (isEnd) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#282133] border border-[#4a365f] text-[#c4a8e6] text-[11px] font-semibold flex items-center gap-1">${getIconSvg('flag', 'w-3 h-3')} Zakończenie</span>`
        )
    }

    if (hasCombat) {
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[11px] font-semibold flex items-center gap-1">${getIconSvg('combat', 'w-3 h-3') || getIconSvg('swords', 'w-3 h-3')} Walka / Starcie</span>`
        )
    }

    if (locations.length > 0) {
        const locName =
            typeof locations[0].getName === 'function'
                ? locations[0].getName()
                : locations[0].name || 'Lokacja'
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#2e261a] border border-[#4f3d24] text-[#d6b07c] text-[11px] flex items-center gap-1">${getTypeIconSvg('location', 'w-3 h-3')} ${escapeHtml(locName)}</span>`
        )
    }

    if (characters.length > 0) {
        const charNames = characters
            .slice(0, 2)
            .map(c => (typeof c.getName === 'function' ? c.getName() : c.name || 'NPC'))
            .join(', ')
        metaBadgesHtml.push(
            `<span class="px-2 py-0.5 rounded bg-[#1a2930] border border-[#274754] text-[#7ec6db] text-[11px] flex items-center gap-1">${getTypeIconSvg('character', 'w-3 h-3')} ${escapeHtml(charNames)}</span>`
        )
    }

    tags.forEach(tag => {
        const tName = typeof tag.getName === 'function' ? tag.getName() : tag.name || ''
        if (tName) {
            metaBadgesHtml.push(
                `<span class="px-2 py-0.5 rounded bg-[#1e2025] text-zinc-400 border border-[#2e3037] text-[10px]">#${escapeHtml(tName)}</span>`
            )
        }
    })

    const metaSection =
        metaBadgesHtml.length > 0
            ? `<div class="flex items-center flex-wrap gap-1.5 pb-2 border-b border-[#2e3037] mb-3">${metaBadgesHtml.join('')}</div>`
            : ''

    let combatCardHtml = ''
    if (hasCombat) {
        const combat = currentP.getCombat ? currentP.getCombat() : currentP.combat
        const opponents = combat && combat.getCombatOpponents ? combat.getCombatOpponents() : []
        const visibleStatIds = combat && combat.getVisibleStatIds ? combat.getVisibleStatIds() : []
        const allNpcs = playtestEngineInstance.getNpcs
            ? playtestEngineInstance.getNpcs()
            : [
                  ...(playtestEngineInstance.ctx?.projectCharacters || []),
                  ...(playtestEngineInstance.ctx?.projectTemplates || []),
              ]
        const allTraits = playtestEngineInstance.getTraits
            ? playtestEngineInstance.getTraits()
            : [
                  ...(playtestEngineInstance.ctx?.projectStats || []),
                  ...(playtestEngineInstance.ctx?.projectParameters || []),
              ]

        if (opponents.length > 0) {
            const opponentCards = opponents
                .map(opp => {
                    const avatarObj = getAvatarById(opp.avatar || 'warrior')
                    const avatarSvg = avatarObj ? avatarObj.svg : getIconSvg('character', 'w-4 h-4')
                    const originalNpc = allNpcs.find(
                        n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId
                    )

                    const statsBadges = visibleStatIds
                        .map(traitId => {
                            const traitDef = allTraits.find(
                                t =>
                                    (typeof t.getId === 'function' ? t.getId() : t.id) ===
                                        traitId ||
                                    (typeof t.getName === 'function' ? t.getName() : t.name) ===
                                        traitId
                            )

                            let traitName = traitDef
                                ? typeof traitDef.getName === 'function'
                                    ? traitDef.getName()
                                    : traitDef.name
                                : ''

                            // Jeśli cecha nie została znaleziona w cechach projektu, sprawdź w oryginalnym NPC
                            if (!traitName && originalNpc) {
                                const npcStats =
                                    typeof originalNpc.getStats === 'function'
                                        ? originalNpc.getStats()
                                        : originalNpc.stats || []
                                const npcParams =
                                    typeof originalNpc.getParameters === 'function'
                                        ? originalNpc.getParameters()
                                        : originalNpc.parameters || []
                                const foundInNpc = [...npcStats, ...npcParams].find(item => {
                                    const sId =
                                        typeof item.getId === 'function' ? item.getId() : item.id
                                    const sName =
                                        typeof item.getName === 'function'
                                            ? item.getName()
                                            : item.name
                                    return sId === traitId || sName === traitId
                                })
                                if (foundInNpc) {
                                    traitName =
                                        typeof foundInNpc.getName === 'function'
                                            ? foundInNpc.getName()
                                            : foundInNpc.name
                                }
                            }

                            if (!traitName) {
                                traitName = traitId
                            }

                            let val = ''
                            if (opp.overriddenStats) {
                                if (
                                    opp.overriddenStats[traitId] !== undefined &&
                                    opp.overriddenStats[traitId] !== ''
                                ) {
                                    val = opp.overriddenStats[traitId]
                                } else if (
                                    traitDef &&
                                    traitDef.id &&
                                    opp.overriddenStats[traitDef.id] !== undefined &&
                                    opp.overriddenStats[traitDef.id] !== ''
                                ) {
                                    val = opp.overriddenStats[traitDef.id]
                                } else if (
                                    traitDef &&
                                    traitDef.name &&
                                    opp.overriddenStats[traitDef.name] !== undefined &&
                                    opp.overriddenStats[traitDef.name] !== ''
                                ) {
                                    val = opp.overriddenStats[traitDef.name]
                                }
                            }

                            if ((val === '' || val === undefined) && originalNpc) {
                                val = CombatSyncService.resolveNpcTraitValue(
                                    originalNpc,
                                    traitId,
                                    traitDef
                                )
                            }

                            return `
                            <div class="px-2 py-0.5 rounded bg-[#1e2025] border border-zinc-700/60 text-[11px] flex items-center gap-1.5 font-mono">
                                <span class="text-zinc-400 font-sans">${escapeHtml(traitName)}:</span>
                                <span class="text-amber-300 font-bold">${escapeHtml(String(val || '-'))}</span>
                            </div>
                        `
                        })
                        .join('')

                    return `
                    <div class="p-2.5 bg-[#1b1c20] border border-[#2e3037] rounded-lg flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <div class="w-8 h-8 rounded-lg bg-zinc-800 p-1 border border-zinc-700/60 shrink-0 text-amber-400 flex items-center justify-center">
                                ${avatarSvg}
                            </div>
                            <div>
                                <div class="text-xs font-bold text-zinc-100 truncate">${escapeHtml(opp.name)}</div>
                                <div class="text-[10px] text-zinc-400">Przeciwnik</div>
                            </div>
                        </div>
                        <div class="flex items-center flex-wrap gap-1.5 justify-end">
                            ${statsBadges}
                        </div>
                    </div>
                `
                })
                .join('')

            combatCardHtml = `
                <div class="my-4 p-3.5 rounded-xl bg-gradient-to-b from-[#241a1c]/80 to-[#18191d] border border-amber-600/40 shadow-sm space-y-2.5">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-amber-400">${getIconSvg('combat', 'w-4 h-4') || '⚔️'}</span>
                            <span class="text-xs font-bold text-amber-200 uppercase tracking-wider">Starcie z przeciwnikami</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-300 border border-amber-500/50 font-bold uppercase font-mono">
                            ${opponents.length} ${opponents.length === 1 ? 'Wróg' : 'Wrogów'}
                        </span>
                    </div>
                    <div class="space-y-1.5">
                        ${opponentCards}
                    </div>
                </div>
            `
        }
    }

    contentEl.innerHTML = `
        ${metaSection}
        <h2 class="text-base font-bold text-zinc-100 mb-3 tracking-wide">§ ${pNum}: ${escapeHtml(pTitle)}</h2>
        <div class="prose prose-invert max-w-none text-sm text-zinc-200">
            ${formatMarkdown(narrativeText)}
        </div>
        ${combatCardHtml}
    `

    // Attach click listeners to inline paragraph links [label](entity://paragraph/targetId)
    contentEl.querySelectorAll('.btn-playtest-inline-link').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.targetId
            if (!targetId) return
            const nextP = playtestEngineInstance.goTo(targetId, 'Odnośnik w narracji')
            if (nextP) {
                renderPlaytestView()
            } else {
                toast.error(`Nie znaleziono paragrafu o ID: ${targetId}`, 'Błąd nawigacji')
            }
        })
    })

    // Render Choices
    const choices =
        (typeof currentP.getChoices === 'function' ? currentP.getChoices() : currentP.choices) || []

    if (choices.length === 0 || isEnd) {
        choicesEl.innerHTML = `
            <div class="p-6 rounded-xl bg-[#1b1c20] border border-[#2e3037] text-center space-y-3">
                <div class="w-10 h-10 rounded-full bg-[#282133] border border-[#4a365f] flex items-center justify-center text-[#c4a8e6] mx-auto">
                    ${getIconSvg('flag', 'w-5 h-5')}
                </div>
                <h4 class="font-bold text-sm text-zinc-100">Koniec ścieżki fabularnej</h4>
                <p class="text-xs text-zinc-400 max-w-md mx-auto">
                    ${isEnd ? 'Ten paragraf został oznaczony jako oficjalne zakończenie gry.' : 'Ten paragraf nie posiada zdefiniowanych dalszych wyborów (ślepy zaułek lub finał).'}
                </p>
                <div class="flex items-center justify-center gap-2 pt-2">
                    <button
                        type="button"
                        id="btn-playtest-end-back"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#212226] hover:bg-[#2a2c33] border border-[#2e3037] text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        ${getIconSvg('arrow-left', 'w-3.5 h-3.5 text-zinc-400')}
                        <span>Cofnij o 1 krok</span>
                    </button>
                    <button
                        type="button"
                        id="btn-playtest-end-restart"
                        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#245842] hover:bg-[#2e6d52] border border-[#357357] text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        ${getIconSvg('undo', 'w-3.5 h-3.5')}
                        <span>Zacznij od początku</span>
                    </button>
                </div>
            </div>
        `

        const btnEndBack = document.getElementById('btn-playtest-end-back')
        if (btnEndBack) {
            btnEndBack.onclick = () => {
                if (playtestEngineInstance.canStepBack()) {
                    playtestEngineInstance.stepBack()
                    renderPlaytestView()
                }
            }
        }

        const btnEndRestart = document.getElementById('btn-playtest-end-restart')
        if (btnEndRestart) {
            btnEndRestart.onclick = () => {
                playtestEngineInstance.start()
                renderPlaytestView()
            }
        }
    } else {
        choicesEl.innerHTML = choices
            .map((ch, idx) => {
                const targetId =
                    (typeof ch.getToParagraphId === 'function' && ch.getToParagraphId()) ||
                    (typeof ch.getTargetParagraphId === 'function' && ch.getTargetParagraphId()) ||
                    (typeof ch.getTargetId === 'function' && ch.getTargetId()) ||
                    ch.toParagraphId ||
                    ch.targetParagraphId ||
                    ch.targetId ||
                    ''

                const targetP = playtestEngineInstance.findParagraph(targetId)
                const targetNum = targetP
                    ? typeof targetP.getDisplayNumber === 'function'
                        ? targetP.getDisplayNumber()
                        : typeof targetP.getNumber === 'function' && targetP.getNumber() > 0
                          ? targetP.getNumber()
                          : targetP.number || ''
                    : ''
                const targetTitle = targetP
                    ? targetP.getTitle
                        ? targetP.getTitle()
                        : targetP.getName
                          ? targetP.getName()
                          : targetId
                    : `Paragraf ${targetId || '?'}`

                const chTitle =
                    (typeof ch.getName === 'function' && ch.getName()) ||
                    (typeof ch.getTitle === 'function' && ch.getTitle()) ||
                    ch.name ||
                    ch.title ||
                    `Przejdź do: ${targetTitle}`

                // Condition check (informational for author)
                const condition =
                    typeof ch.getCondition === 'function' ? ch.getCondition() : ch.condition
                const hasCondition = Boolean(condition)
                let conditionBadge = ''
                if (hasCondition) {
                    const condText =
                        (condition.getDescription && condition.getDescription()) ||
                        condition.name ||
                        'Warunek'
                    conditionBadge = `
                    <span class="px-2 py-0.5 rounded text-[10px] bg-[#29241b] border border-[#4d3d25] text-[#d6b07c] flex items-center gap-1 font-mono">
                        ${getIconSvg('lock', 'w-3 h-3 text-[#d6b07c]')} ${escapeHtml(condText)}
                    </span>
                `
                }

                const combatObj = currentP.getCombat ? currentP.getCombat() : currentP.combat
                const outcomesList =
                    combatObj && combatObj.getOutcomes ? combatObj.getOutcomes() : []
                const chId = typeof ch.getId === 'function' ? ch.getId() : ch.id
                const isCombatOutcome = Boolean(
                    hasCombat && outcomesList.some(o => o.id === chId || o.name === chTitle)
                )

                let outcomeBadge = ''
                if (isCombatOutcome) {
                    outcomeBadge = `
                    <span class="px-1.5 py-0.2 rounded text-[10px] bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1 shrink-0">
                        ${getIconSvg('combat', 'w-2.5 h-2.5') || '⚔️'} WYNIK WALKI
                    </span>
                    `
                }

                const targetLabel = targetNum ? `§ ${targetNum}: ${targetTitle}` : targetTitle

                return `
                <button
                    type="button"
                    class="btn-playtest-choice w-full text-left p-3 rounded-lg bg-[#1b1c20] hover:bg-[#22242a] border transition-all flex items-center justify-between group cursor-pointer shadow-xs ${
                        isCombatOutcome
                            ? 'border-amber-600/40 hover:border-amber-500/70 bg-gradient-to-r from-amber-950/20 to-[#1b1c20]'
                            : 'border-[#2e3037] hover:border-[#4a5e74]'
                    }"
                    data-target-id="${escapeHtml(targetId)}"
                    data-choice-title="${escapeHtml(chTitle)}"
                >
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                        <span class="w-6 h-6 rounded-md bg-[#24262c] border border-[#343740] flex items-center justify-center text-xs font-mono font-semibold text-zinc-300 group-hover:text-[#9bb7d4] group-hover:border-[#4a5e74] shrink-0">
                            ${idx + 1}
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="text-zinc-200 group-hover:text-white font-medium text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                                <span>${escapeHtml(chTitle)}</span>
                                ${outcomeBadge}
                            </div>
                            <div class="text-[11px] text-zinc-500 group-hover:text-zinc-400 mt-0.5 flex items-center gap-2">
                                <span>(cel: ${escapeHtml(targetLabel)})</span>
                                ${conditionBadge}
                            </div>
                        </div>
                    </div>
                    <span class="text-zinc-500 group-hover:text-[#9bb7d4] text-sm transition-transform group-hover:translate-x-1 pl-2 shrink-0">
                        →
                    </span>
                </button>
            `
            })
            .join('')

        choicesEl.querySelectorAll('.btn-playtest-choice').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.targetId
                const title = btn.dataset.choiceTitle
                if (!targetId) {
                    toast.warning('Ten wybór nie ma przypisanego węzła docelowego.', 'Wybór')
                    return
                }
                const nextP = playtestEngineInstance.goTo(targetId, title)
                if (nextP) {
                    renderPlaytestView()
                } else {
                    toast.error(`Nie znaleziono paragrafu o ID: ${targetId}`, 'Błąd przejścia')
                }
            })
        })
    }
}
