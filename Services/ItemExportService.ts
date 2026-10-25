import { type IItemModifier, Item } from '../Model/Item'
import { Paragraph } from '../Model/Paragraph'

export interface IItemExportUsage {
    paragraphId: string
    paragraphNumber: string | number
    paragraphName: string
    action: 'give' | 'require' | 'remove'
    quantity: number
}

export interface IItemExportJSON {
    id: string
    name: string
    category: string
    slotSize: number
    weight: number
    isConsumable: boolean
    inStartingInventory: boolean
    targetInventoryId?: string
    tags: string[]
    modifiers: IItemModifier[]
    description: {
        summary: string
        text: string
    }
    usages?: IItemExportUsage[]
}

export interface IItemExportOptions {
    includeParagraphUsages?: boolean
    paragraphs?: Paragraph[]
    projectTitle?: string
}

/**
 * Escapes text for RFC 4180 CSV compliance.
 *
 * @param val
 * @returns Escaped CSV cell value
 */
function escapeCsvCell(val: unknown): string {
    if (val === undefined || val === null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/**
 * Extracts paragraph usages for a specific item.
 *
 * @param item
 * @param paragraphs
 * @returns Array of usage references
 */
export function resolveItemUsages(item: Item, paragraphs: Paragraph[] = []): IItemExportUsage[] {
    const usages: IItemExportUsage[] = []
    const itemId = typeof item.getId === 'function' ? item.getId() : ''
    const itemName = typeof item.getName === 'function' ? item.getName() : ''

    paragraphs.forEach(p => {
        const actions = typeof p.getItemActions === 'function' ? p.getItemActions() : []
        if (Array.isArray(actions)) {
            actions.forEach(act => {
                if (
                    (act.itemId && act.itemId === itemId) ||
                    (act.itemName && act.itemName === itemName)
                ) {
                    usages.push({
                        paragraphId: typeof p.getId === 'function' ? p.getId() : '',
                        paragraphNumber:
                            typeof p.getDisplayNumber === 'function'
                                ? p.getDisplayNumber()
                                : typeof p.getNumber === 'function'
                                  ? p.getNumber()
                                  : '',
                        paragraphName: typeof p.getName === 'function' ? p.getName() : 'Paragraf',
                        action: act.action || 'give',
                        quantity: act.quantity || 1,
                    })
                }
            })
        }
    })

    return usages
}

export class ItemExportService {
    /**
     * Serializes items to a standardized JSON representation.
     * Compatible with external game engines and data pipelines.
     *
     * @param items
     * @param options
     * @returns Formatted JSON string
     */
    public static exportToJSON(items: Item[] = [], options: IItemExportOptions = {}): string {
        const result: IItemExportJSON[] = items.map(it => {
            const id = typeof it.getId === 'function' ? it.getId() : ''
            const name = typeof it.getName === 'function' ? it.getName() : 'Przedmiot'
            const category = typeof it.getCategory === 'function' ? it.getCategory() : 'misc'
            const slotSize = typeof it.getSlotSize === 'function' ? it.getSlotSize() : 1
            const weight = typeof it.getWeight === 'function' ? it.getWeight() : 1
            const isConsumable = typeof it.isConsumable === 'function' ? it.isConsumable() : false
            const inStartingInventory =
                typeof it.isInStartingInventory === 'function' ? it.isInStartingInventory() : false
            const targetInventoryId =
                typeof it.getTargetInventoryId === 'function' ? it.getTargetInventoryId() : ''

            const rawTags = typeof it.getTags === 'function' ? it.getTags() : []
            const tags = rawTags.map(t =>
                typeof t.getName === 'function' ? t.getName() : String(t)
            )

            const rawMods = typeof it.getModifiers === 'function' ? it.getModifiers() : []
            const modifiers: IItemModifier[] = Array.isArray(rawMods) ? [...rawMods] : []

            const desc = typeof it.getDescription === 'function' ? it.getDescription() : null
            const summary =
                (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : '') || ''
            const text = (desc && typeof desc.getText === 'function' ? desc.getText() : '') || ''

            const itemJson: IItemExportJSON = {
                id,
                name,
                category,
                slotSize,
                weight,
                isConsumable,
                inStartingInventory,
                targetInventoryId,
                tags,
                modifiers,
                description: {
                    summary,
                    text,
                },
            }

            if (options.includeParagraphUsages && options.paragraphs) {
                itemJson.usages = resolveItemUsages(it, options.paragraphs)
            }

            return itemJson
        })

        return JSON.stringify(result, null, 2)
    }

    /**
     * Serializes items to a CSV spreadsheet with UTF-8 BOM for Excel compatibility.
     *
     * @param items
     * @returns Formatted CSV string
     */
    public static exportToCSV(items: Item[] = []): string {
        const headers = [
            'ID',
            'Nazwa',
            'Kategoria',
            'Sloty',
            'Waga',
            'Zuzywalny',
            'W_Ekwipunku_Startowym',
            'Docelowy_Ekwipunek',
            'Tagi',
            'Modyfikatory',
            'Streszczenie',
        ]

        const rows: string[] = []
        rows.push(headers.map(escapeCsvCell).join(','))

        items.forEach(it => {
            const id = typeof it.getId === 'function' ? it.getId() : ''
            const name = typeof it.getName === 'function' ? it.getName() : ''
            const category = typeof it.getCategory === 'function' ? it.getCategory() : 'misc'
            const slotSize = typeof it.getSlotSize === 'function' ? it.getSlotSize() : 1
            const weight = typeof it.getWeight === 'function' ? it.getWeight() : 1
            const isConsumable = typeof it.isConsumable === 'function' ? it.isConsumable() : false
            const inStarting =
                typeof it.isInStartingInventory === 'function' ? it.isInStartingInventory() : false
            const targetInv =
                typeof it.getTargetInventoryId === 'function' ? it.getTargetInventoryId() : ''

            const rawTags = typeof it.getTags === 'function' ? it.getTags() : []
            const tagsStr = rawTags
                .map(t => (typeof t.getName === 'function' ? t.getName() : String(t)))
                .join('; ')

            const rawMods = typeof it.getModifiers === 'function' ? it.getModifiers() : []
            const modsStr = rawMods
                .map(m => {
                    const sign = m.operator === '+' && Number(m.value) > 0 ? '+' : ''
                    return `${m.targetName}: ${sign}${m.value}`
                })
                .join('; ')

            const desc = typeof it.getDescription === 'function' ? it.getDescription() : null
            const summary =
                (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : '') || ''

            const row = [
                id,
                name,
                category,
                slotSize,
                weight,
                isConsumable ? 'Tak' : 'Nie',
                inStarting ? 'Tak' : 'Nie',
                targetInv,
                tagsStr,
                modsStr,
                summary,
            ]

            rows.push(row.map(escapeCsvCell).join(','))
        })

        // Prefix with UTF-8 Byte Order Mark for Microsoft Excel
        return '\uFEFF' + rows.join('\r\n')
    }

    /**
     * Serializes items to a reader-friendly Markdown catalogue.
     * Suitable for gamebooks, player compendiums, and design documentation.
     *
     * @param items
     * @param options
     * @returns Formatted Markdown document
     */
    public static exportToMarkdown(items: Item[] = [], options: IItemExportOptions = {}): string {
        const title = options.projectTitle || 'Katalog Przedmiotów i Ekwipunku'
        const lines: string[] = []

        lines.push(`# ${title}`)
        lines.push('')
        lines.push(
            `*Wygenerowano automatycznie w środowisku Nidavelir • Liczba zdefiniowanych przedmiotów: ${items.length}*`
        )
        lines.push('')

        if (items.length === 0) {
            lines.push('> Projekt nie zawiera jeszcze żadnych zdefiniowanych przedmiotów.')
            return lines.join('\n')
        }

        // 1. Tabela Przeglądowa (Overview Table)
        lines.push('## Tabela Przeglądowa')
        lines.push('')
        lines.push('| Nazwa | Kategoria | Sloty | Waga | Zużywalny | Tagi | Modyfikatory |')
        lines.push('| :--- | :--- | :---: | :---: | :---: | :--- | :--- |')

        items.forEach(it => {
            const name = typeof it.getName === 'function' ? it.getName() : 'Przedmiot'
            const cat = typeof it.getCategory === 'function' ? it.getCategory() : 'misc'
            const slots = typeof it.getSlotSize === 'function' ? it.getSlotSize() : 1
            const weight = typeof it.getWeight === 'function' ? it.getWeight() : 1
            const consumable = typeof it.isConsumable === 'function' ? it.isConsumable() : false
            const rawTags = typeof it.getTags === 'function' ? it.getTags() : []
            const tags =
                rawTags
                    .map(t => (typeof t.getName === 'function' ? `#${t.getName()}` : `#${t}`))
                    .join(', ') || '—'

            const rawMods = typeof it.getModifiers === 'function' ? it.getModifiers() : []
            const mods =
                rawMods
                    .map(m => {
                        const sign = m.operator === '+' && Number(m.value) > 0 ? '+' : ''
                        return `\`${m.targetName}: ${sign}${m.value}\``
                    })
                    .join(', ') || '—'

            lines.push(
                `| **${name}** | \`${cat}\` | ${slots} | ${weight} | ${consumable ? 'Tak' : 'Nie'} | ${tags} | ${mods} |`
            )
        })

        lines.push('')
        lines.push('---')
        lines.push('')

        // 2. Szczegółowe sekcje każdego przedmiotu
        lines.push('## Szczegółowy Opis Przedmiotów')
        lines.push('')

        items.forEach(it => {
            const name = typeof it.getName === 'function' ? it.getName() : 'Przedmiot'
            const id = typeof it.getId === 'function' ? it.getId() : ''
            const cat = typeof it.getCategory === 'function' ? it.getCategory() : 'misc'
            const slots = typeof it.getSlotSize === 'function' ? it.getSlotSize() : 1
            const weight = typeof it.getWeight === 'function' ? it.getWeight() : 1
            const consumable = typeof it.isConsumable === 'function' ? it.isConsumable() : false
            const inStarting =
                typeof it.isInStartingInventory === 'function' ? it.isInStartingInventory() : false
            const targetInv =
                typeof it.getTargetInventoryId === 'function' ? it.getTargetInventoryId() : ''

            lines.push(`### ${name}`)
            lines.push('')
            lines.push(`- **Identyfikator:** \`${id}\``)
            lines.push(`- **Kategoria:** \`${cat}\``)
            lines.push(`- **Zajmowane sloty:** ${slots} ${slots === 1 ? 'slot' : 'sloty'}`)
            lines.push(`- **Waga:** ${weight} kg`)
            lines.push(`- **Jednorazowy (zużywalny):** ${consumable ? 'Tak' : 'Nie'}`)
            lines.push(
                `- **W początkowym ekwipunku bohatera:** ${inStarting ? `Tak${targetInv ? ` (${targetInv})` : ''}` : 'Nie'}`
            )

            const rawTags = typeof it.getTags === 'function' ? it.getTags() : []
            if (rawTags.length > 0) {
                const tagNames = rawTags
                    .map(t => (typeof t.getName === 'function' ? `#${t.getName()}` : `#${t}`))
                    .join(' ')
                lines.push(`- **Tagi:** ${tagNames}`)
            }

            // Modifiers table
            const rawMods = typeof it.getModifiers === 'function' ? it.getModifiers() : []
            if (rawMods.length > 0) {
                lines.push('')
                lines.push('**Modyfikatory:**')
                lines.push('')
                lines.push('| Typ celu | Nazwa | Wartość |')
                lines.push('| :--- | :--- | :--- |')
                rawMods.forEach(m => {
                    const sign = m.operator === '+' && Number(m.value) > 0 ? '+' : ''
                    lines.push(
                        `| ${m.targetType || 'stat'} | ${m.targetName} | \`${sign}${m.value}\` |`
                    )
                })
            }

            // Narrative summary and text
            const desc = typeof it.getDescription === 'function' ? it.getDescription() : null
            const summary =
                (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : '') || ''
            const text = (desc && typeof desc.getText === 'function' ? desc.getText() : '') || ''

            if (summary) {
                lines.push('')
                lines.push(`> *${summary.trim()}*`)
            }
            if (text && text !== summary) {
                lines.push('')
                lines.push(text.trim())
            }

            // Paragraph usages if requested
            if (options.includeParagraphUsages && options.paragraphs) {
                const usages = resolveItemUsages(it, options.paragraphs)
                if (usages.length > 0) {
                    lines.push('')
                    lines.push('**Występowanie w opowieści:**')
                    usages.forEach(u => {
                        const actName =
                            u.action === 'give'
                                ? 'Znajdź / Otrzymaj'
                                : u.action === 'require'
                                  ? 'Wymagaj'
                                  : 'Utrata'
                        lines.push(
                            `- Paragraf §${u.paragraphNumber} "${u.paragraphName}" — *${actName}* (x${u.quantity})`
                        )
                    })
                }
            }

            lines.push('')
            lines.push('---')
            lines.push('')
        })

        return lines.join('\n')
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
