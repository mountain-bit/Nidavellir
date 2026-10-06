import { mergeAttributes } from '@tiptap/core'
import Mention, { MentionOptions } from '@tiptap/extension-mention'
import { SuggestionOptions } from '@tiptap/suggestion'

import { IEntityMentionItem } from '../types'
import { ISuggestionProps, MentionSuggestionRenderer } from '../ui/MentionSuggestionRenderer'

export interface IEntityMentionOptions extends Omit<MentionOptions, 'suggestion'> {
    getEntities?: () => IEntityMentionItem[]
    suggestion?: Partial<SuggestionOptions<IEntityMentionItem>>
}

export const EntityMention = Mention.extend<IEntityMentionOptions>({
    name: 'mention',

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element: HTMLElement): string | null =>
                    element.getAttribute('data-id') || element.getAttribute('data-entity-id'),
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
                parseHTML: (element: HTMLElement): string =>
                    element.getAttribute('data-type') ||
                    element.getAttribute('data-entity-type') ||
                    'location',
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
                tag: 'a[href^="entity://"]',
                getAttrs: (dom: HTMLElement | string): false | Record<string, unknown> => {
                    if (typeof dom === 'string') return false
                    const href = dom.getAttribute('href') || ''
                    const match = href.match(/^entity:\/\/([^/]+)\/(.+)$/)
                    if (match) {
                        return {
                            type: match[1],
                            id: match[2],
                            label: dom.textContent?.trim() || match[2],
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

        let typeName = 'Lokacja'

        if (type === 'character') {
            typeName = 'Postać (NPC)'
        } else if (type === 'trait' || type === 'tag') {
            typeName = 'Cecha / Tag'
        } else if (type === 'item') {
            typeName = 'Przedmiot'
        }

        const tooltip =
            id && id !== label
                ? `${typeName}: ${id} (w tekście jako: „${label}”)`
                : `${typeName}: ${label}`

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
                    const label = node.attrs.label || node.attrs.id || 'encja'
                    const type = node.attrs.type || 'location'
                    const id = node.attrs.id || ''
                    state.write(`[${label}](entity://${type}/${id})`)
                },
                parse: {
                    // Handled automatically via markdown-it link parser and parseHTML() above
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
            const cleanQuery = query.toLowerCase()
            return list.filter(item => item.name.toLowerCase().includes(cleanQuery)).slice(0, 7)
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
