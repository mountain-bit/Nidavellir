import { Mark, mergeAttributes } from '@tiptap/core'

import { isSafeStyleId } from '../styleSanitizer'

export interface ICustomStyleOptions {
    HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Commands<ReturnType> {
        customStyle: {
            setCustomStyle: (styleId: string) => ReturnType
            toggleCustomStyle: (styleId: string) => ReturnType
            unsetCustomStyle: () => ReturnType
        }
    }
}

export const CustomStyleMark = Mark.create<ICustomStyleOptions>({
    name: 'customStyle',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            styleId: {
                default: null,
                parseHTML: (element: HTMLElement): string | null => {
                    const candidate =
                        element.getAttribute('data-custom-style') ||
                        (element.className.match(/gamebook-custom-style-([a-zA-Z0-9_-]+)/) || [])[1]
                    return isSafeStyleId(candidate) ? candidate : null
                },
                renderHTML: (attributes: Record<string, unknown>): Record<string, string> => {
                    if (!isSafeStyleId(attributes.styleId)) return {}
                    return {
                        'data-custom-style': attributes.styleId,
                    }
                },
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-custom-style]',
            },
            {
                tag: 'span[class*="gamebook-custom-style-"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        const rawId = HTMLAttributes['data-custom-style']
        const styleId = isSafeStyleId(rawId) ? rawId : 'default'
        return [
            'span',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
                class: `gamebook-custom-style gamebook-custom-style-${styleId}`,
            }),
            0,
        ]
    },

    addCommands() {
        return {
            setCustomStyle:
                (styleId: string) =>
                ({ commands }): boolean => {
                    return commands.setMark(this.name, { styleId })
                },
            toggleCustomStyle:
                (styleId: string) =>
                ({ commands, editor }): boolean => {
                    const isCurrentActive = editor.isActive(this.name, { styleId })
                    if (isCurrentActive) {
                        return commands.unsetMark(this.name)
                    }
                    return commands.setMark(this.name, { styleId })
                },
            unsetCustomStyle:
                () =>
                ({ commands }): boolean => {
                    return commands.unsetMark(this.name)
                },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize: {
                    open(_state: unknown, mark: { attrs: { styleId?: string } }): string {
                        const styleId = isSafeStyleId(mark.attrs.styleId)
                            ? mark.attrs.styleId
                            : 'default'
                        return `<span data-custom-style="${styleId}">`
                    },
                    close: '</span>',
                },
                parse: {
                    // Parsowane przez parseHTML (tag: span[data-custom-style])
                },
            },
        }
    },
})
