import { mergeAttributes } from '@tiptap/core'
import Mention, { MentionOptions } from '@tiptap/extension-mention'
import { SuggestionOptions } from '@tiptap/suggestion'

import { IEntityMentionItem } from '../types'
import { MentionSuggestionRenderer } from '../ui/MentionSuggestionRenderer'

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
                parseHTML: element =>
                    element.getAttribute('data-id') || element.getAttribute('data-entity-id'),
                renderHTML: attributes => {
                    if (!attributes.id) return {}
                    return {
                        'data-id': attributes.id,
                        'data-entity-id': attributes.id,
                    }
                },
            },
            label: {
                default: null,
                parseHTML: element =>
                    element.getAttribute('data-label') ||
                    element.textContent?.replace(/^(?:📍|👤|🏷️|🎒|🔗)\s*/u, '').trim(),
                renderHTML: attributes => {
                    if (!attributes.label) return {}
                    return {
                        'data-label': attributes.label,
                    }
                },
            },
            type: {
                default: 'location',
                parseHTML: element =>
                    element.getAttribute('data-type') ||
                    element.getAttribute('data-entity-type') ||
                    'location',
                renderHTML: attributes => {
                    return {
                        'data-type': attributes.type || 'location',
                        'data-entity-type': attributes.type || 'location',
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
                getAttrs: dom => {
                    const el = dom as HTMLElement
                    const href = el.getAttribute('href') || ''
                    const match = href.match(/^entity:\/\/([^/]+)\/(.+)$/)
                    if (match) {
                        return {
                            type: match[1],
                            id: match[2],
                            label: el.textContent?.trim() || match[2],
                        }
                    }
                    return false
                },
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const type = node.attrs.type || 'location'
        let icon = '📍'
        let badgeColorClass =
            'entity-badge-location bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'

        if (type === 'character') {
            icon = '👤'
            badgeColorClass =
                'entity-badge-character bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
        } else if (type === 'trait' || type === 'tag') {
            icon = '🏷️'
            badgeColorClass =
                'entity-badge-trait bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
        } else if (type === 'item') {
            icon = '🎒'
            badgeColorClass =
                'entity-badge-item bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
        }

        return [
            'span',
            mergeAttributes(
                {
                    class: `entity-mention-badge inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded text-xs font-medium border select-all cursor-pointer transition-colors align-baseline ${badgeColorClass}`,
                },
                HTMLAttributes
            ),
            `${icon} ${node.attrs.label || node.attrs.id}`,
        ]
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: any, node: any) {
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

export function createEntitySuggestionConfig(getEntities: () => IEntityMentionItem[]) {
    let renderer: MentionSuggestionRenderer | null = null

    return {
        char: '@',
        items: ({ query }: { query: string }) => {
            const list = getEntities() || []
            if (!query) {
                return list.slice(0, 7)
            }
            const cleanQuery = query.toLowerCase()
            return list.filter(item => item.name.toLowerCase().includes(cleanQuery)).slice(0, 7)
        },
        render: () => {
            return {
                onStart: (props: any) => {
                    renderer = new MentionSuggestionRenderer()
                    renderer.onStart(props)
                },
                onUpdate: (props: any) => {
                    renderer?.onUpdate(props)
                },
                onKeyDown: (props: any) => {
                    if (props.event.key === 'Escape') {
                        renderer?.destroy()
                        return true
                    }
                    return renderer?.onKeyDown(props) || false
                },
                onExit: () => {
                    renderer?.destroy()
                    renderer = null
                },
            }
        },
    }
}
