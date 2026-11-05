// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import { RulesExportService } from '../../Services/export/RulesExportService'

describe('RulesExportService', () => {
    it('exports clean, semantic HTML without wrapping headings or lists inside <p> tags', () => {
        const html = RulesExportService.exportToHtml({
            title: 'Zasady Walki & Magii',
            author: 'Jan "Mistrz" Kowalski',
            version: '1.2',
            content: [
                '# Rozdział 1: Walka',
                '',
                'Podstawowa zasada **ataku** oraz *obrony* i ***ciosu krytycznego***.',
                '',
                '## Sekcja: Rzuty',
                '',
                '- Rzut 2k6 + Siła',
                '- Porównaj z obroną wroga',
                '',
                '> Pamiętaj o modyfikatorach z ekwipunku!',
            ].join('\n'),
        })

        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<title>Zasady Walki &amp; Magii</title>')
        expect(html).toContain('Autor: Jan &quot;Mistrz&quot; Kowalski')
        expect(html).toContain('v1.2')

        // Block elements must not be wrapped inside <p>
        expect(html).toContain('<h1>Rozdział 1: Walka</h1>')
        expect(html).not.toContain('<p><h1>')
        expect(html).toContain('<h2>Sekcja: Rzuty</h2>')
        expect(html).toContain(
            '<p>Podstawowa zasada <strong>ataku</strong> oraz <em>obrony</em> i <strong><em>ciosu krytycznego</em></strong>.</p>'
        )
        expect(html).toContain(
            '<ul><li>Rzut 2k6 + Siła</li>\n<li>Porównaj z obroną wroga</li></ul>'
        )
        expect(html).not.toContain('<p><ul>')
        expect(html).toContain('<blockquote>Pamiętaj o modyfikatorach z ekwipunku!</blockquote>')
    })

    it('escapes raw HTML tags in markdown content to prevent XSS', () => {
        const html = RulesExportService.exportToHtml({
            content: 'Niebezpieczny tekst <script>alert("xss")</script> w zasadach.',
        })

        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })

    it('exports Markdown with YAML frontmatter and escaped quotes', () => {
        const md = RulesExportService.exportToMarkdown({
            title: 'Księga "Cieni"',
            author: 'Autor "X"',
            version: '0.9.0',
            content: '## Zasady\n\nTreść zasad.',
        })

        expect(md).toContain('title: "Księga \\"Cieni\\""')
        expect(md).toContain('author: "Autor \\"X\\""')
        expect(md).toContain('version: "0.9.0"')
        expect(md).toContain('## Zasady\n\nTreść zasad.\n')
    })

    it('delegates downloadFile and copyToClipboard to shared ExportUtils', async () => {
        const clickSpy = vi.fn()
        const origCreate = document.createElement.bind(document)
        vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
            const el = origCreate(tagName)
            if (tagName === 'a') {
                el.click = clickSpy
            }
            return el
        }) as any)

        RulesExportService.downloadFile('# Reguły', 'rules.md', 'text/markdown')
        expect(clickSpy).toHaveBeenCalled()

        const writeTextMock = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            writable: true,
            configurable: true,
        })

        const copied = await RulesExportService.copyToClipboard('Skopiowane zasady')
        expect(copied).toBe(true)
        expect(writeTextMock).toHaveBeenCalledWith('Skopiowane zasady')
    })
})
