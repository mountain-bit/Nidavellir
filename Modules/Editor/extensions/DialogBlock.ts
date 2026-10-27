import { CommandProps, mergeAttributes, Node } from '@tiptap/core'

declare module '@tiptap/core' {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Commands<ReturnType> {
        dialog: {
            toggleDialog: () => ReturnType
            setDialog: () => ReturnType
        }
    }
}

interface IMarkdownSerializerState {
    write: (text: string) => void
    renderInline: (node: unknown) => void
    closeBlock: (node: unknown) => void
}

/**
 * Wyrażenie regularne dopasowujące wiodące myślniki dialogowe:
 * pauzę (—), półpauzę (–), kreskę poziomą (―) lub dywiz (-) (jeden lub dwa znaki) wraz z następującymi spacjami.
 */
const DIALOG_DASH_REGEX = /^[\u2014\u2013\u2015-]{1,2}\s*/u
const DIALOG_DASH_PREFIX = '— '

export const DialogBlock = Node.create({
    name: 'dialog',
    group: 'block',
    content: 'inline*',
    defining: true,

    parseHTML() {
        return [
            {
                tag: 'p.gamebook-dialog',
            },
            {
                tag: 'p.dialog',
            },
            {
                tag: 'div.gamebook-dialog',
            },
            {
                tag: 'div[data-dialog="true"]',
            },
            {
                tag: 'p[data-dialog="true"]',
            },
            {
                tag: 'blockquote.gamebook-dialog',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'p',
            mergeAttributes(HTMLAttributes, {
                class: 'gamebook-dialog pl-4 border-l-2 border-amber-500/70 my-2 italic text-amber-100/90 font-serif bg-amber-500/5 py-1 rounded-r',
                'data-dialog': 'true',
            }),
            0,
        ]
    },

    addCommands() {
        return {
            toggleDialog:
                () =>
                ({ tr, commands, state, dispatch }: CommandProps): boolean => {
                    const { selection } = state
                    const { $from } = selection
                    const currentBlock = $from.parent

                    if (!currentBlock.isTextblock) {
                        return false
                    }

                    const isCurrentlyDialog = currentBlock.type.name === this.name

                    if (isCurrentlyDialog) {
                        // Przełącz z powrotem na zwykły akapit i ewentualnie usuń wiodący myślnik dialogowy
                        const text = currentBlock.textContent
                        const match = text.match(DIALOG_DASH_REGEX)

                        const toggled = commands.toggleNode(this.name, 'paragraph')
                        if (toggled && match && dispatch) {
                            const startPos = $from.start()
                            tr.delete(startPos, startPos + match[0].length)
                        }
                        return toggled
                    } else {
                        // Przełącz na dialog i jeśli nie ma myślnika dialogowego, dodaj '— '
                        const text = currentBlock.textContent
                        const hasDashPrefix = DIALOG_DASH_REGEX.test(text)

                        const toggled = commands.toggleNode(this.name, 'paragraph')
                        if (toggled && !hasDashPrefix && dispatch) {
                            const startPos = $from.start()
                            tr.insertText(DIALOG_DASH_PREFIX, startPos)
                        }
                        return toggled
                    }
                },
            setDialog:
                () =>
                ({ commands }: CommandProps): boolean => {
                    return commands.setNode(this.name)
                },
        }
    },

    addStorage() {
        return {
            markdown: {
                serialize(state: IMarkdownSerializerState, node: unknown): void {
                    state.write('<p class="gamebook-dialog">')
                    state.renderInline(node)
                    state.write('</p>')
                    state.closeBlock(node)
                },
                parse: {
                    // Parsowane przez parseHTML (tag: p.gamebook-dialog)
                },
            },
        }
    },
})
