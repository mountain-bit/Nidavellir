import { type IItemModifier, Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { EntityAccessor } from '../helpers/EntityAccessor'
import { copyTextToClipboard, downloadTextFile, escapeCsvCell } from '../helpers/ExportUtils'

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
 * Extracts paragraph usages for a specific item.
 *
 * @param item
 * @param paragraphs
 * @returns Array of usage references
 */
export function resolveItemUsages(item: Item, paragraphs: Paragraph[] = []): IItemExportUsage[] {
    const usages: IItemExportUsage[] = []
    const itemId = EntityAccessor.getId(item)
    const itemName = EntityAccessor.getName(item)

    paragraphs.forEach(p => {
        const actions = typeof p.getItemActions === 'function' ? p.getItemActions() : []
        if (Array.isArray(actions)) {
            actions.forEach(act => {
                if (
                    (act.itemId && act.itemId === itemId) ||
                    (act.itemName && act.itemName === itemName)
                ) {
                    usages.push({
                        paragraphId: EntityAccessor.getId(p),
                        paragraphNumber:
                            typeof p.getDisplayNumber === 'function'
                                ? p.getDisplayNumber()
                                : typeof p.getNumber === 'function'
                                  ? p.getNumber()
                                  : '',
                        paragraphName: EntityAccessor.getName(p, 'Paragraf'),
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
     * Normalizes an Item instance or duck-typed item object into a clean DTO structure
     * used across JSON, CSV, and Markdown exporters.
     */
    private static toItemDTO(
        it: Item,
        options: IItemExportOptions = {},
        defaultName: string = 'Przedmiot'
    ): IItemExportJSON {
        const id = EntityAccessor.getId(it)
        const name = EntityAccessor.getName(it, defaultName)
        const category = typeof it.getCategory === 'function' ? it.getCategory() : 'misc'
        const slotSize = typeof it.getSlotSize === 'function' ? it.getSlotSize() : 1
        const weight = typeof it.getWeight === 'function' ? it.getWeight() : 1
        const isConsumable = typeof it.isConsumable === 'function' ? it.isConsumable() : false
        const inStartingInventory =
            typeof it.isInStartingInventory === 'function' ? it.isInStartingInventory() : false
        const targetInventoryId =
            typeof it.getTargetInventoryId === 'function' ? it.getTargetInventoryId() : ''

        const rawTags = typeof it.getTags === 'function' ? it.getTags() : []
        const tags = rawTags.map(t => (typeof t.getName === 'function' ? t.getName() : String(t)))

        const rawMods = typeof it.getModifiers === 'function' ? it.getModifiers() : []
        const modifiers: IItemModifier[] = Array.isArray(rawMods) ? [...rawMods] : []

        const desc = typeof it.getDescription === 'function' ? it.getDescription() : null
        const summary =
            (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : '') || ''
        const text = (desc && typeof desc.getText === 'function' ? desc.getText() : '') || ''

        const dto: IItemExportJSON = {
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
            dto.usages = resolveItemUsages(it, options.paragraphs)
        }

        return dto
    }

    /**
     * Formats a single item modifier for human-readable display (e.g. "Siła: +6").
     */
    private static formatModifier(m: IItemModifier): string {
        const sign = m.operator === '+' && Number(m.value) > 0 ? '+' : ''
        return `${m.targetName}: ${sign}${m.value}`
    }

    /**
     * Serializes items to a standardized JSON representation.
     * Compatible with external game engines and data pipelines.
     *
     * @param items
     * @param options
     * @returns Formatted JSON string
     */
    public static exportToJSON(items: Item[] = [], options: IItemExportOptions = {}): string {
        const result = items.map(it => this.toItemDTO(it, options, 'Przedmiot'))
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

        const rows: string[] = [headers.map(escapeCsvCell).join(',')]

        items.forEach(it => {
            const dto = this.toItemDTO(it, {}, '')
            const tagsStr = dto.tags.join('; ')
            const modsStr = dto.modifiers.map(m => this.formatModifier(m)).join('; ')

            const row = [
                dto.id,
                dto.name,
                dto.category,
                dto.slotSize,
                dto.weight,
                dto.isConsumable ? 'Tak' : 'Nie',
                dto.inStartingInventory ? 'Tak' : 'Nie',
                dto.targetInventoryId || '',
                tagsStr,
                modsStr,
                dto.description.summary,
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
        const lines: string[] = [
            `# ${title}`,
            '',
            `*Wygenerowano automatycznie w środowisku Nidavelir • Liczba zdefiniowanych przedmiotów: ${items.length}*`,
            '',
        ]

        if (items.length === 0) {
            lines.push('> Projekt nie zawiera jeszcze żadnych zdefiniowanych przedmiotów.')
            return lines.join('\n')
        }

        const dtos = items.map(it => this.toItemDTO(it, options, 'Przedmiot'))

        // 1. Tabela Przeglądowa (Overview Table)
        lines.push('## Tabela Przeglądowa')
        lines.push('')
        lines.push('| Nazwa | Kategoria | Sloty | Waga | Zużywalny | Tagi | Modyfikatory |')
        lines.push('| :--- | :--- | :---: | :---: | :---: | :--- | :--- |')

        dtos.forEach(dto => {
            const tags = dto.tags.map(t => `#${t}`).join(', ') || '—'
            const mods = dto.modifiers.map(m => `\`${this.formatModifier(m)}\``).join(', ') || '—'

            lines.push(
                `| **${dto.name}** | \`${dto.category}\` | ${dto.slotSize} | ${dto.weight} | ${dto.isConsumable ? 'Tak' : 'Nie'} | ${tags} | ${mods} |`
            )
        })

        lines.push('')
        lines.push('---')
        lines.push('')

        // 2. Szczegółowe sekcje każdego przedmiotu
        lines.push('## Szczegółowy Opis Przedmiotów')
        lines.push('')

        dtos.forEach(dto => {
            const targetInv = dto.targetInventoryId || ''

            lines.push(`### ${dto.name}`)
            lines.push('')
            lines.push(`- **Identyfikator:** \`${dto.id}\``)
            lines.push(`- **Kategoria:** \`${dto.category}\``)
            lines.push(
                `- **Zajmowane sloty:** ${dto.slotSize} ${dto.slotSize === 1 ? 'slot' : 'sloty'}`
            )
            lines.push(`- **Waga:** ${dto.weight} kg`)
            lines.push(`- **Jednorazowy (zużywalny):** ${dto.isConsumable ? 'Tak' : 'Nie'}`)
            lines.push(
                `- **W początkowym ekwipunku bohatera:** ${dto.inStartingInventory ? `Tak${targetInv ? ` (${targetInv})` : ''}` : 'Nie'}`
            )

            if (dto.tags.length > 0) {
                const tagNames = dto.tags.map(t => `#${t}`).join(' ')
                lines.push(`- **Tagi:** ${tagNames}`)
            }

            // Modifiers table
            if (dto.modifiers.length > 0) {
                lines.push('')
                lines.push('**Modyfikatory:**')
                lines.push('')
                lines.push('| Typ celu | Nazwa | Wartość |')
                lines.push('| :--- | :--- | :--- |')
                dto.modifiers.forEach(m => {
                    const sign = m.operator === '+' && Number(m.value) > 0 ? '+' : ''
                    lines.push(
                        `| ${m.targetType || 'stat'} | ${m.targetName} | \`${sign}${m.value}\` |`
                    )
                })
            }

            // Narrative summary and text
            const { summary, text } = dto.description
            if (summary) {
                lines.push('')
                lines.push(`> *${summary.trim()}*`)
            }
            if (text && text !== summary) {
                lines.push('')
                lines.push(text.trim())
            }

            // Paragraph usages if requested
            if (dto.usages && dto.usages.length > 0) {
                lines.push('')
                lines.push('**Występowanie w opowieści:**')
                dto.usages.forEach(u => {
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

            lines.push('')
            lines.push('---')
            lines.push('')
        })

        return lines.join('\n')
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
