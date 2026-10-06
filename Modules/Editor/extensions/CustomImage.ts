import { CommandProps, mergeAttributes, Node } from '@tiptap/core'

import { toAssetUrl, toRelativeAssetPath } from '../../../Utils/assetUtils'

declare module '@tiptap/core' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Commands<ReturnType> {
        image: {
            setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType
        }
    }
}

interface IMarkdownSerializerState {
    write: (text: string) => void
    closeBlock: (node: unknown) => void
    esc: (text: string) => string
}

export const CustomImage = Node.create({
    name: 'image',
    group: 'block',
    inline: false,
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return {}
                    const rawSrc = dom.getAttribute('src') || ''
                    return {
                        src: toRelativeAssetPath(rawSrc),
                        alt: dom.getAttribute('alt') || null,
                        title: dom.getAttribute('title') || null,
                    }
                },
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const rawSrc = (HTMLAttributes.src as string) || ''
        const displaySrc = toAssetUrl(rawSrc)

        return [
            'div',
            { class: 'gamebook-image-container my-3 text-center' },
            [
                'img',
                mergeAttributes(HTMLAttributes, {
                    src: displaySrc,
                    class: 'gamebook-image rounded-lg border border-[#3f3f46] max-w-full h-auto shadow-md mx-auto inline-block',
                    loading: 'lazy',
                }),
            ],
        ]
    },

    addCommands() {
        return {
            setImage:
                options =>
                ({ commands }: CommandProps): boolean => {
                    return commands.insertContent({
                        type: this.name,
                        attrs: {
                            ...options,
                            src: toRelativeAssetPath(options.src),
                        },
                    })
                },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    state: IMarkdownSerializerState,
                    node: { attrs: { src?: string; alt?: string; title?: string } }
                ): void {
                    const alt = state.esc(node.attrs.alt || '')
                    const cleanSrc = toRelativeAssetPath(node.attrs.src || '')
                    const title = node.attrs.title ? ` "${state.esc(node.attrs.title)}"` : ''
                    state.write(`![${alt}](${cleanSrc}${title})`)
                    state.closeBlock(node)
                },
                parse: {
                    // Handled automatically by tiptap-markdown default image parser
                },
            },
        }
    },
})
