// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { MarkdownEditor } from '../../Modules/Editor/MarkdownEditor'

describe('DialogBlock & CustomUnderline integration', () => {
    let container: HTMLElement

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    it('toggles dialog block and automatically adds dialogue dash prefix', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Witaj w karczmie.',
        })

        expect(editor.isActive('dialog')).toBe(false)

        editor.toggleDialog()
        expect(editor.isActive('dialog')).toBe(true)

        const md = editor.getMarkdown()
        expect(md).toContain('gamebook-dialog')
        expect(md).toContain('— Witaj w karczmie.')

        editor.destroy()
    })

    it('toggling dialog off returns to paragraph and strips the dialogue dash prefix', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Witaj w karczmie.',
        })

        // Toggle on to dialog
        editor.toggleDialog()
        expect(editor.isActive('dialog')).toBe(true)
        expect(editor.getMarkdown()).toContain('— Witaj w karczmie.')

        // Toggle back off to paragraph
        editor.toggleDialog()
        expect(editor.isActive('dialog')).toBe(false)
        expect(editor.isActive('paragraph')).toBe(true)

        const md = editor.getMarkdown()
        expect(md).not.toContain('gamebook-dialog')
        expect(md).toContain('Witaj w karczmie.')
        expect(md).not.toContain('—')

        editor.destroy()
    })

    it('serializes underline as HTML u tags in markdown and parses it back', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Zwykły tekst.',
        })

        const raw = editor.getRawEditor()
        raw?.commands.selectAll()
        editor.toggleUnderline()

        expect(editor.isActive('underline')).toBe(true)
        const md = editor.getMarkdown()
        expect(md).toContain('<u>')
        expect(md).toContain('</u>')

        // Roundtrip test via setMarkdown
        editor.setMarkdown('To jest <u>podkreślone</u> słowo.')
        expect(editor.getMarkdown()).toContain('<u>podkreślone</u>')

        editor.destroy()
    })
})
