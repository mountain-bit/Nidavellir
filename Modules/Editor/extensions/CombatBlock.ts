import { mergeAttributes, Node } from '@tiptap/core'

import { t } from '../../../Utils/i18n/translate'

export interface IParsedCombatData {
    title: string
    headers: string[]
    rows: string[][]
    outcomes: Array<{ name: string; targetText: string; targetUrl: string }>
    hasOpponents: boolean
}

/**
 * Extracts and decodes raw combat markdown from element attributes or textContent.
 */
function extractRawMarkdown(dom: HTMLElement): string {
    const encoded = dom.getAttribute('data-raw-combat') || ''
    if (encoded) {
        try {
            return decodeURIComponent(encoded)
        } catch {
            return encoded
        }
    }
    return dom.textContent || ''
}

/**
 * Parses raw combat markdown block into structured fields for preview.
 */
export function parseCombatMarkdown(raw: string): IParsedCombatData {
    const headingMatch = raw.match(/###\s*([^\n\r]+)/)
    const defaultTitle = t('combat.title') || 'Starcie'
    let title = defaultTitle

    if (headingMatch) {
        const rawHeading = headingMatch[1].trim()
        const colonIdx = rawHeading.indexOf(':')
        if (colonIdx >= 0 && colonIdx < rawHeading.length - 1) {
            title = rawHeading.slice(colonIdx + 1).trim()
        } else if (rawHeading) {
            title = rawHeading
        }
    }

    // Extract table
    const lines = raw.split(/\r?\n/)
    const tableLines = lines.filter(l => {
        const lineText = l.trim()
        return lineText.startsWith('|') && lineText.endsWith('|')
    })

    let headers: string[] = []
    const rows: string[][] = []

    if (tableLines.length >= 2) {
        // First row is header
        headers = tableLines[0]
            .split('|')
            .map(c => c.trim())
            .filter((c, i, a) => i > 0 && i < a.length - 1)

        // Rows after alignment (index 1 is alignment e.g. |:---|)
        for (let i = 2; i < tableLines.length; i++) {
            const cells = tableLines[i]
                .split('|')
                .map(c => c.trim())
                .filter((c, idx, a) => idx > 0 && idx < a.length - 1)
            if (cells.length > 0) {
                rows.push(cells)
            }
        }
    }

    // Extract outcomes
    const outcomes: Array<{ name: string; targetText: string; targetUrl: string }> = []
    const outcomesSplit = raw.split(/####\s*[^\n\r]+/i)
    const outcomesSection = outcomesSplit.length > 1 ? outcomesSplit[1] : ''
    const outcomeLines = outcomesSection.split(/\r?\n/)

    for (const line of outcomeLines) {
        const match = line.match(
            /^-\s*\*\*([^*]+)\*\*\s*(?:→|->)\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.*))$/
        )
        if (match) {
            const name = match[1].trim()
            const targetText = (match[2] || match[4] || '').trim()
            const targetUrl = (match[3] || '').trim()
            outcomes.push({ name, targetText, targetUrl })
        }
    }

    return {
        title,
        headers,
        rows,
        outcomes,
        hasOpponents: rows.length > 0,
    }
}

export const CombatBlock = Node.create({
    name: 'combatBlock',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
        return {
            rawMarkdown: {
                default: '',
                parseHTML: (el: HTMLElement): string => extractRawMarkdown(el),
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    if (!attrs.rawMarkdown) return {}
                    return {
                        'data-raw-combat': encodeURIComponent(String(attrs.rawMarkdown)),
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-combat-block="true"]',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return false
                    return { rawMarkdown: extractRawMarkdown(dom) }
                },
            },
            {
                tag: 'div.combat-block-card',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return false
                    return { rawMarkdown: extractRawMarkdown(dom) }
                },
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const rawMarkdown = String(node.attrs.rawMarkdown || '')
        const data = parseCombatMarkdown(rawMarkdown)

        // 1. Build opponents table DOM
        let opponentsSpec: unknown[]
        if (data.headers.length > 0 && data.rows.length > 0) {
            const headerRowSpec: unknown[] = [
                'tr',
                { class: 'border-b border-[#333338] bg-[#1a1b1e]' },
                ...data.headers.map((h, idx) => [
                    'th',
                    {
                        class: `px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider ${
                            idx === 0 ? 'text-left' : 'text-center'
                        }`,
                    },
                    h,
                ]),
            ]

            const dataRowSpecs = data.rows.map(row => [
                'tr',
                { class: 'border-b border-[#2a2b30]/60 hover:bg-zinc-800/30' },
                ...row.map((val, idx) => [
                    'td',
                    {
                        class: `px-3 py-1.5 text-xs ${
                            idx === 0
                                ? 'font-semibold text-zinc-200 text-left'
                                : 'text-center font-mono font-bold text-amber-300'
                        }`,
                    },
                    val,
                ]),
            ])

            opponentsSpec = [
                'div',
                { class: 'overflow-x-auto rounded-lg border border-[#2e3037] my-2.5 bg-[#141518]' },
                [
                    'table',
                    { class: 'w-full border-collapse text-left' },
                    ['thead', {}, headerRowSpec],
                    ['tbody', {}, ...dataRowSpecs],
                ],
            ]
        } else {
            opponentsSpec = [
                'div',
                {
                    class: 'py-2 px-3 rounded bg-zinc-900/50 border border-zinc-800 text-xs italic text-zinc-400 my-2',
                },
                t('combat.no_opponents_defined') || 'Brak zdefiniowanych przeciwników.',
            ]
        }

        // 2. Build outcomes list DOM
        let outcomesSpec: unknown[]
        if (data.outcomes.length > 0) {
            const outcomeItemSpecs = data.outcomes.map(o => [
                'li',
                { class: 'flex items-center gap-2 text-xs py-0.5' },
                ['span', { class: 'font-bold text-amber-300' }, o.name],
                ['span', { class: 'text-zinc-400' }, '→'],
                [
                    'span',
                    {
                        class: 'px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-200 border border-zinc-700/60 font-mono text-[11px]',
                    },
                    o.targetText || t('combat.target_paragraph') || 'Paragraf docelowy',
                ],
            ])

            outcomesSpec = [
                'div',
                { class: 'mt-3 space-y-1.5' },
                [
                    'div',
                    { class: 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider' },
                    `${t('combat.outcomes_title') || 'Możliwe wyniki starcia'}:`,
                ],
                ['ul', { class: 'list-none space-y-1 pl-1 m-0' }, ...outcomeItemSpecs],
            ]
        } else {
            outcomesSpec = [
                'div',
                { class: 'mt-2 text-xs italic text-zinc-400' },
                t('combat.no_outcomes') || 'Brak zdefiniowanych wyników walki.',
            ]
        }

        const encounterPrefix = (t('combat.encounter_label') || 'Starcie').replace(/[:\s]+$/, '')
        const combatBadgeText = t('combat.badge') || 'Walka'

        return [
            'div',
            mergeAttributes(
                {
                    class: 'combat-block-card my-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/20 via-[#1b1c20] to-[#16171a] border border-amber-600/40 shadow-sm select-none cursor-default font-sans text-zinc-200',
                    'data-combat-block': 'true',
                    'data-raw-combat': encodeURIComponent(rawMarkdown),
                    contenteditable: 'false',
                },
                HTMLAttributes
            ),
            // Header
            [
                'div',
                {
                    class: 'flex items-center justify-between gap-2 pb-2.5 border-b border-[#2e3037] mb-2.5',
                },
                [
                    'div',
                    { class: 'flex items-center gap-2 min-w-0' },
                    [
                        'span',
                        {
                            class: 'text-amber-400 font-bold inline-flex items-center justify-center shrink-0 w-4 h-4',
                            'aria-hidden': 'true',
                        },
                        [
                            'svg',
                            {
                                class: 'w-4 h-4',
                                fill: 'none',
                                stroke: 'currentColor',
                                viewBox: '0 0 24 24',
                            },
                            [
                                'path',
                                {
                                    d: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2',
                                    'stroke-width': '1.8',
                                    'stroke-linecap': 'round',
                                    'stroke-linejoin': 'round',
                                },
                            ],
                        ],
                    ],
                    [
                        'span',
                        {
                            class: 'text-xs font-bold text-amber-200 uppercase tracking-wide truncate',
                        },
                        `${encounterPrefix}: ${data.title}`,
                    ],
                ],
                [
                    'span',
                    {
                        class: 'px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold tracking-wider uppercase shrink-0',
                    },
                    combatBadgeText,
                ],
            ],
            // Opponents Table
            opponentsSpec,
            // Outcomes
            outcomesSpec,
            // Footer Note
            [
                'div',
                {
                    class: 'pt-2 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400',
                },
                [
                    'span',
                    {},
                    t('combat.description') ||
                        'Edycja przeciwników, cech i wyników walki dostępna w panelu bocznym (Moduł walki).',
                ],
            ],
        ]
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
                    node: { attrs: { rawMarkdown?: string } }
                ): void {
                    const raw = node.attrs.rawMarkdown || ''
                    if (raw) {
                        state.write('\n\n' + raw.trim() + '\n\n')
                        state.closeBlock(node)
                    }
                },
                parse: {},
            },
        }
    },
})
