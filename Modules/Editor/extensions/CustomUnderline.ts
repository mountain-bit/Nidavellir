import Underline from '@tiptap/extension-underline'

export const CustomUnderline = Underline.extend({
    parseHTML() {
        return [
            ...(this.parent?.() ?? []),
            {
                tag: 'ins',
            },
        ]
    },

    addStorage() {
        return {
            markdown: {
                serialize: {
                    open: '<u>',
                    close: '</u>',
                    expelEnclosingWhitespace: true,
                },
                parse: {
                    // Parsowane przez parseHTML w Underline (tag: 'u', 'ins', styl text-decoration)
                },
            },
        }
    },
})
