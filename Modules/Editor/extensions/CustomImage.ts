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
    esc?: (text: string) => string
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
                tag: 'div.gamebook-image-container',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return false
                    const img = dom.querySelector('img')
                    if (!img) return false
                    const rawSrc = img.getAttribute('src') || ''
                    return {
                        src: toRelativeAssetPath(rawSrc),
                        alt: img.getAttribute('alt') || '',
                        title: img.getAttribute('title') || null,
                    }
                },
            },
            {
                tag: 'img[src]',
                getAttrs: (dom: HTMLElement | string) => {
                    if (typeof dom === 'string') return false
                    const rawSrc = dom.getAttribute('src') || ''
                    return {
                        src: toRelativeAssetPath(rawSrc),
                        alt: dom.getAttribute('alt') || '',
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
            {
                class: 'gamebook-image-container my-3 text-center',
                'data-gamebook-image': 'true',
            },
            [
                'img',
                mergeAttributes(HTMLAttributes, {
                    src: displaySrc,
                    alt: HTMLAttributes.alt ?? '',
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
                    const esc =
                        typeof state.esc === 'function'
                            ? (text: string) => state.esc!(text)
                            : (text: string) => text
                    const alt = esc(node.attrs.alt || '')
                    const cleanSrc = toRelativeAssetPath(node.attrs.src || '')
                    const formattedSrc =
                        cleanSrc.includes(' ') && !cleanSrc.startsWith('<')
                            ? `<${cleanSrc}>`
                            : cleanSrc
                    const title = node.attrs.title ? ` "${esc(node.attrs.title)}"` : ''
                    state.write(`![${alt}](${formattedSrc}${title})`)
                    state.closeBlock(node)
                },
                parse: {
                    // Handled automatically by tiptap-markdown default image parser
                },
            },
        }
    },
})
