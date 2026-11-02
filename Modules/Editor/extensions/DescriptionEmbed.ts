import { CommandProps, mergeAttributes, Node } from '@tiptap/core'

import { t } from '../../../Utils/i18n/translate'
import { DescriptionEmbedType, DescriptionEmbedVariant, IDescriptionEmbedAttrs } from '../types'

/**
 * Universally extracts the clean entity name from a label by stripping any
 * localized prefix before the first colon (e.g. "Opis: Miecz" -> "Miecz", "Description: Sword" -> "Sword").
 * If no colon prefix is present, returns the trimmed label as-is.
 */
function extractEntityName(text: string): string {
    if (!text || typeof text !== 'string') return ''
    const trimmed = text.trim()
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > 0 && colonIndex < trimmed.length - 1) {
        return trimmed.slice(colonIndex + 1).trim()
    }
    return trimmed
}

/**
 * Returns the description prefix for the current active locale (e.g. "Opis:", "Description:").
 */
function getLocalizedPrefix(): string {
    const desc = t('item.description') || 'Opis'
    return `${desc}:`
}

declare module '@tiptap/core' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Commands<ReturnType> {
        descriptionEmbed: {
            insertDescriptionEmbed: (attrs: IDescriptionEmbedAttrs) => ReturnType
            updateDescriptionEmbed: (
                pos: number,
                attrs: Partial<IDescriptionEmbedAttrs>
            ) => ReturnType
        }
    }
}

export const DescriptionEmbed = Node.create({
    name: 'descriptionEmbed',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    draggable: true,

    addAttributes() {
        return {
            id: {
                default: '',
                parseHTML: (el: HTMLElement): string => {
                    const dataId = el.getAttribute('data-id') || el.getAttribute('data-embed-id')
                    if (dataId) return dataId
                    const href = el.getAttribute('href') || ''
                    const match = href.match(/^embed:\/\/([^/]+)\/([^/:?#]+)/)
                    return match ? match[2] : ''
                },
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    return { 'data-id': String(attrs.id || '') }
                },
            },
            type: {
                default: 'item',
                parseHTML: (el: HTMLElement): DescriptionEmbedType => {
                    const dataType =
                        el.getAttribute('data-type') || el.getAttribute('data-embed-type')
                    if (dataType) return dataType as DescriptionEmbedType
                    const href = el.getAttribute('href') || ''
                    const match = href.match(/^embed:\/\/([^/]+)\//)
                    return (match ? match[1] : 'item') as DescriptionEmbedType
                },
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    return { 'data-type': String(attrs.type || 'item') }
                },
            },
            variant: {
                default: 'text',
                parseHTML: (el: HTMLElement): DescriptionEmbedVariant => {
                    const dataVariant =
                        el.getAttribute('data-variant') || el.getAttribute('data-embed-variant')
                    if (dataVariant) return dataVariant as DescriptionEmbedVariant
                    const href = el.getAttribute('href') || ''
                    const match = href.match(/^embed:\/\/[^/]+\/[^/:?#]+(?:[/:]?(text|summary))?/)
                    return (match && match[1] ? match[1] : 'text') as DescriptionEmbedVariant
                },
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    return { 'data-variant': String(attrs.variant || 'text') }
                },
            },
            name: {
                default: '',
                parseHTML: (el: HTMLElement): string => {
                    const dataName =
                        el.getAttribute('data-name') ||
                        el.getAttribute('data-embed-name') ||
                        el.getAttribute('data-label')
                    if (dataName) return extractEntityName(dataName)
                    const text =
                        el.querySelector('.description-badge-text')?.textContent ||
                        el.textContent ||
                        ''
                    return extractEntityName(text)
                },
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    if (!attrs.name) return {}
                    return { 'data-name': String(attrs.name) }
                },
            },
            label: {
                default: '',
                parseHTML: (el: HTMLElement): string => {
                    const dataLabel = el.getAttribute('data-label')
                    if (dataLabel) return dataLabel
                    const text =
                        el.querySelector('.description-badge-text')?.textContent ||
                        el.textContent ||
                        ''
                    return text.trim()
                },
                renderHTML: (attrs: Record<string, unknown>): Record<string, string> => {
                    if (!attrs.label) return {}
                    return { 'data-label': String(attrs.label) }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-description-embed="true"]',
            },
            {
                tag: 'span.description-embed-badge',
            },
            {
                tag: 'a[href^="embed://"]',
                getAttrs: (dom: HTMLElement | string): false | Record<string, unknown> => {
                    if (typeof dom === 'string') return false
                    const href = dom.getAttribute('href') || ''
                    // Match embed://type/id/variant or embed://type/id:variant or embed://type/id
                    const match = href.match(
                        /^embed:\/\/([^/]+)\/([^/:?#]+)(?:[/:]?(text|summary))?/
                    )
                    if (match) {
                        const type = match[1].toLowerCase() as DescriptionEmbedType
                        const id = match[2]
                        const variant = (
                            match[3] || 'text'
                        ).toLowerCase() as DescriptionEmbedVariant
                        const rawLabel = dom.textContent?.trim() || id
                        const cleanName = extractEntityName(rawLabel)
                        return {
                            type,
                            id,
                            variant,
                            name: cleanName,
                            label: rawLabel || `${getLocalizedPrefix()} ${cleanName}`,
                        }
                    }
                    return false
                },
            },
            {
                tag: 'div[data-description-embed="true"]',
            },
            {
                tag: 'div[data-embed-id]',
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const type = String(node.attrs.type || 'item').toLowerCase() as DescriptionEmbedType
        const id = String(node.attrs.id || '')
        const variant = String(
            node.attrs.variant || 'text'
        ).toLowerCase() as DescriptionEmbedVariant
        const rawName = String(node.attrs.name || node.attrs.label || id || '')
        const cleanName = extractEntityName(rawName)
        const displayLabel = String(
            node.attrs.label || (cleanName ? `${getLocalizedPrefix()} ${cleanName}` : id)
        )

        let typeLabel = t('details.type_item') || 'Przedmiot'
        if (type === 'character') {
            typeLabel = t('left_panel.add_character') || t('details.type_character') || 'Postać'
        } else if (type === 'location') {
            typeLabel = t('details.type_location') || 'Lokacja'
        }

        const variantBadgeText =
            variant === 'summary'
                ? t('details.summary') || 'Skrót'
                : t('item.description') || 'Pełny'
        const narrativePrefix = t('editor.embed_modal.title') || 'Wstawka narracyjna'
        const tooltip = `${narrativePrefix}: [${typeLabel}] ${cleanName} (${variantBadgeText})`

        return [
            'span',
            mergeAttributes(
                {
                    class: `description-embed-badge entity-mention-badge entity-badge-${type} cursor-pointer select-all`,
                    'data-description-embed': 'true',
                    'data-type': type,
                    'data-id': id,
                    'data-variant': variant,
                    'data-name': cleanName,
                    'data-label': displayLabel,
                    title: tooltip,
                },
                HTMLAttributes
            ),
            [
                'span',
                {
                    class: `entity-badge-icon entity-badge-icon-${type}`,
                    'aria-hidden': 'true',
                },
            ],
            ['span', { class: 'description-badge-text font-medium' }, displayLabel],
            [
                'span',
                {
                    class: 'description-badge-variant text-[9px] uppercase px-1 py-0.2 rounded border font-mono ml-0.5 opacity-80 bg-black/20 border-white/20',
                },
                variantBadgeText,
            ],
        ]
    },

    addCommands() {
        return {
            insertDescriptionEmbed:
                (attrs: IDescriptionEmbedAttrs) =>
                ({ commands }: CommandProps): boolean => {
                    const cleanName = extractEntityName(attrs.name || attrs.id)
                    const label = attrs.label || `${getLocalizedPrefix()} ${cleanName}`
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            id: attrs.id,
                            type: attrs.type,
                            variant: attrs.variant || 'text',
                            name: cleanName,
                            label,
                        },
                    })
                },
            updateDescriptionEmbed:
                (pos: number, attrs: Partial<IDescriptionEmbedAttrs>) =>
                ({ commands }: CommandProps): boolean => {
                    const cleanName = attrs.name ? extractEntityName(attrs.name) : undefined
                    const updateAttrs: Record<string, unknown> = { ...attrs }
                    if (cleanName) {
                        updateAttrs.name = cleanName
                        if (!updateAttrs.label) {
                            updateAttrs.label = `${getLocalizedPrefix()} ${cleanName}`
                        }
                    }
                    return (
                        commands.setNodeSelection(pos) &&
                        commands.updateAttributes(this.name, updateAttrs)
                    )
                },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    state: { write: (text: string) => void },
                    node: {
                        attrs: {
                            id?: string
                            type?: string
                            variant?: string
                            name?: string
                            label?: string
                        }
                    }
                ): void {
                    const type = node.attrs.type || 'item'
                    const id = node.attrs.id || ''
                    const variant = node.attrs.variant || 'text'
                    const rawName = node.attrs.name || id
                    const cleanName = extractEntityName(rawName)
                    const rawLabel = node.attrs.label || `${getLocalizedPrefix()} ${cleanName}`
                    const label = rawLabel.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
                    const url =
                        variant === 'summary'
                            ? `embed://${type}/${id}/summary`
                            : `embed://${type}/${id}`
                    state.write(`[${label}](${url})`)
                },
                parse: {
                    // Parsed via markdown link parser and parseHTML a[href^="embed://"]
                },
            },
        }
    },
})
