import { mergeAttributes, Node } from '@tiptap/core'

export interface IParsedCombatData {
    title: string
    headers: string[]
    rows: string[][]
    outcomes: Array<{ name: string; targetText: string; targetUrl: string }>
    hasOpponents: boolean
}

/**
 * Parses raw combat markdown block into structured fields for preview.
 */
export function parseCombatMarkdown(raw: string): IParsedCombatData {
    const titleMatch = raw.match(/###\s*(?:⚔️\s*)?Starcie:\s*([^\n\r]+)/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Starcie'

    // Extract table
    const lines = raw.split(/\r?\n/)
    const tableLines = lines.filter(l => {
        const t = l.trim()
        return t.startsWith('|') && t.endsWith('|')
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
    const outcomesSplit = raw.split(/####\s*Możliwe wyniki starcia:/i)
    const outcomesSection = outcomesSplit.length > 1 ? outcomesSplit[1] : ''
    const outcomeLines = outcomesSection.split(/\r?\n/)

    for (const line of outcomeLines) {
        const match = line.match(/^-\s*\*\*([^*]+)\*\*\s*→\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.*))$/)
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
                parseHTML: (el: HTMLElement): string => {
                    const encoded = el.getAttribute('data-raw-combat') || ''
                    if (encoded) {
                        try {
                            return decodeURIComponent(encoded)
                        } catch {
                            return encoded
                        }
                    }
                    return el.textContent || ''
                },
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
                    const encoded = dom.getAttribute('data-raw-combat') || ''
                    let rawMarkdown = ''
                    if (encoded) {
                        try {
                            rawMarkdown = decodeURIComponent(encoded)
                        } catch {
                            rawMarkdown = encoded
                        }
                    }
                    if (!rawMarkdown) {
                        rawMarkdown = dom.textContent || ''
                    }
                    return { rawMarkdown }
                },
            },
            {
                tag: 'div.combat-block-card',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return false
                    const encoded = dom.getAttribute('data-raw-combat') || ''
                    let rawMarkdown = ''
                    if (encoded) {
                        try {
                            rawMarkdown = decodeURIComponent(encoded)
                        } catch {
                            rawMarkdown = encoded
                        }
                    }
                    return { rawMarkdown }
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
                'Brak zdefiniowanych przeciwników.',
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
                    o.targetText || 'Paragraf docelowy',
                ],
            ])

            outcomesSpec = [
                'div',
                { class: 'mt-3 space-y-1.5' },
                [
                    'div',
                    { class: 'text-[11px] font-bold text-zinc-400 uppercase tracking-wider' },
                    'Możliwe wyniki starcia:',
                ],
                ['ul', { class: 'list-none space-y-1 pl-1 m-0' }, ...outcomeItemSpecs],
            ]
        } else {
            outcomesSpec = [
                'div',
                { class: 'mt-2 text-xs italic text-zinc-400' },
                'Brak zdefiniowanych wyników walki.',
            ]
        }

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
                    ['span', { class: 'text-amber-400 font-bold text-sm' }, '⚔️'],
                    [
                        'span',
                        {
                            class: 'text-xs font-bold text-amber-200 uppercase tracking-wide truncate',
                        },
                        `Starcie: ${data.title}`,
                    ],
                ],
                [
                    'span',
                    {
                        class: 'px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold tracking-wider uppercase shrink-0',
                    },
                    'Walka w paragrafie',
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
