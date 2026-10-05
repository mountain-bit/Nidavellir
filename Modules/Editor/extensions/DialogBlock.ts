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
                tag: 'p[data-dialog="true"]',
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
                ({ commands, state, dispatch }: CommandProps): boolean => {
                    const { selection } = state
                    const { $from } = selection
                    const currentBlock = $from.parent

                    const isCurrentlyDialog = currentBlock.type.name === this.name

                    if (isCurrentlyDialog) {
                        // Przełącz z powrotem na zwykły akapit i ewentualnie usuń wiodący myślnik dialogowy
                        const text = currentBlock.textContent
                        const hasDashPrefix = /^[\u2014\u2013-]{1,2}\s*/u.test(text)

                        const toggled = commands.toggleNode(this.name, 'paragraph')
                        if (toggled && hasDashPrefix && dispatch) {
                            const startPos = $from.start()
                            const match = text.match(/^[\u2014\u2013-]{1,2}\s*/u)
                            if (match) {
                                state.tr.delete(startPos, startPos + match[0].length)
                            }
                        }
                        return toggled
                    } else {
                        // Przełącz na dialog i jeśli nie ma myślnika dialogowego, dodaj '— '
                        const text = currentBlock.textContent
                        const hasDashPrefix = /^[\u2014\u2013-]{1,2}\s*/u.test(text)

                        const toggled = commands.toggleNode(this.name, 'paragraph')
                        if (toggled && !hasDashPrefix && dispatch) {
                            const startPos = $from.start()
                            state.tr.insertText('— ', startPos)
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
