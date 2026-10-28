import { mergeAttributes } from '@tiptap/core'
import Mention, { MentionOptions } from '@tiptap/extension-mention'
import { SuggestionOptions } from '@tiptap/suggestion'

import { t } from '../../../Utils/i18n/translate'
import { IEntityMentionItem } from '../types'
import { ISuggestionProps, MentionSuggestionRenderer } from '../ui/MentionSuggestionRenderer'

export interface IEntityMentionOptions extends Omit<MentionOptions, 'suggestion'> {
    getEntities?: () => IEntityMentionItem[]
    suggestion?: Partial<SuggestionOptions<IEntityMentionItem>>
}

function getEntityTypeName(type: string): string {
    switch (type.toLowerCase()) {
        case 'character':
            return t('details.type_character') || 'Postać'
        case 'item':
            return t('details.type_item') || 'Przedmiot'
        case 'trait':
            return t('details.type_stat') || 'Cecha'
        case 'tag':
            return t('details.type_tag') || 'Tag'
        case 'location':
        default:
            return t('details.type_location') || 'Lokacja'
    }
}

export const EntityMention = Mention.extend<IEntityMentionOptions>({
    name: 'mention',

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element: HTMLElement): string | null => {
                    const did =
                        element.getAttribute('data-id') || element.getAttribute('data-entity-id')
                    if (did) return did
                    const href = element.getAttribute('href') || ''
                    const match = href.match(/^entity:\/\/[^/]+\/(.+)$/)
                    if (match) {
                        try {
                            return decodeURIComponent(match[1])
                        } catch {
                            return match[1]
                        }
                    }
                    return null
                },
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
                    if (!attributes.id) return {}
                    return {
                        'data-id': String(attributes.id),
                        'data-entity-id': String(attributes.id),
                    }
                },
            },
            label: {
                default: null,
                parseHTML: (element: HTMLElement): string | null => {
                    const textSpan = element.querySelector('.entity-badge-text')
                    return (
                        element.getAttribute('data-label') ||
                        textSpan?.textContent?.trim() ||
                        element.textContent?.trim() ||
                        null
                    )
                },
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
                    if (!attributes.label) return {}
                    return {
                        'data-label': String(attributes.label),
                    }
                },
            },
            type: {
                default: 'location',
                parseHTML: (element: HTMLElement): string => {
                    const dt =
                        element.getAttribute('data-type') ||
                        element.getAttribute('data-entity-type')
                    if (dt) return dt
                    const href = element.getAttribute('href') || ''
                    const match = href.match(/^entity:\/\/([^/]+)\//)
                    if (match) {
                        try {
                            return decodeURIComponent(match[1])
                        } catch {
                            return match[1]
                        }
                    }
                    return 'location'
                },
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
                    return {
                        'data-type': String(attributes.type || 'location'),
                        'data-entity-type': String(attributes.type || 'location'),
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-entity-id]',
            },
            {
                tag: 'span[data-mention]',
            },
            {
                tag: 'span.entity-mention-badge',
            },
            {
                tag: 'a[href^="entity://"]',
                getAttrs: (dom: HTMLElement | string): false | Record<string, unknown> => {
                    if (typeof dom === 'string') return false
                    const href = dom.getAttribute('href') || ''
                    const match = href.match(/^entity:\/\/([^/]+)\/(.+)$/)
                    if (match) {
                        let entityType = match[1]
                        let entityId = match[2]
                        try {
                            entityType = decodeURIComponent(entityType)
                            entityId = decodeURIComponent(entityId)
                        } catch {
                            // Zachowaj surowe wartości jeśli dekodowanie URI rzuci błąd
                        }
                        return {
                            type: entityType,
                            id: entityId,
                            label: dom.textContent?.trim() || entityId,
                        }
                    }
                    return false
                },
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const type = String(node.attrs.type || 'location').toLowerCase()
        const label = String(node.attrs.label || node.attrs.id || '')
        const id = String(node.attrs.id || '')
        const typeName = getEntityTypeName(type)

        const tooltip =
            id && id !== label ? `${typeName}: ${id} (${label})` : `${typeName}: ${label}`

        return [
            'span',
            mergeAttributes(
                {
                    class: `entity-mention-badge entity-badge-${type}`,
                    'data-type': type,
                    'data-id': id,
                    'data-label': label,
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
            ['span', { class: 'entity-badge-text' }, label],
        ]
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    state: { write: (text: string) => void },
                    node: { attrs: { label?: string; id?: string; type?: string } }
                ): void {
                    const rawLabel = String(node.attrs.label || node.attrs.id || '')
                    const cleanLabel =
                        rawLabel.replace(/[[\]]/g, '').trim() ||
                        String(node.attrs.id || '')
                            .replace(/[[\]]/g, '')
                            .trim()
                    const type = String(node.attrs.type || 'location').trim()
                    const id = String(node.attrs.id || '').trim()
                    state.write(`[${cleanLabel}](entity://${type}/${id})`)
                },
                parse: {
                    // Parsowane automatycznie przez parser linków oraz parseHTML() powyżej
                },
            },
        }
    },
})

export function createEntitySuggestionConfig(
    getEntities: () => IEntityMentionItem[]
): Omit<SuggestionOptions<IEntityMentionItem>, 'editor'> {
    let renderer: MentionSuggestionRenderer | null = null

    return {
        char: '@',
        items: ({ query }: { query: string }): IEntityMentionItem[] => {
            const list = getEntities() || []
            if (!query) {
                return list.slice(0, 7)
            }
            const cleanQuery = query.toLowerCase().trim()
            return list
                .filter(item => {
                    const nameMatch = item.name
                        ? item.name.toLowerCase().includes(cleanQuery)
                        : false
                    const idMatch = item.id ? item.id.toLowerCase().includes(cleanQuery) : false
                    return nameMatch || idMatch
                })
                .slice(0, 7)
        },
        render: (): Record<string, (props: never) => void | boolean> => {
            return {
                onStart: (props: ISuggestionProps): void => {
                    renderer = new MentionSuggestionRenderer()
                    renderer.onStart(props)
                },
                onUpdate: (props: ISuggestionProps): void => {
                    renderer?.onUpdate(props)
                },
                onKeyDown: (props: { event: KeyboardEvent }): boolean => {
                    if (props.event.key === 'Escape') {
                        renderer?.destroy()
                        return true
                    }
                    return renderer?.onKeyDown(props) || false
                },
                onExit: (): void => {
                    renderer?.destroy()
                    renderer = null
                },
            } as Record<string, (props: never) => void | boolean>
        },
    }
}
