import Underline from '@tiptap/extension-underline'

export const CustomUnderline = Underline.extend({
    addStorage() {
        return {
            markdown: {
                serialize: {
                    open: '<u>',
                    close: '</u>',
                },
                parse: {
                    // Parsowane przez bazowe parseHTML w Underline (tag: 'u')
                },
            },
        }
    },
})
