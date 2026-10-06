// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { CustomFontsService, IProjectFontsData } from '../../Modules/Editor/CustomFontsService'
import {
    CustomStylesService,
    DEFAULT_CUSTOM_STYLES,
    IProjectStylesData,
} from '../../Modules/Editor/CustomStylesService'
import { MarkdownEditor } from '../../Modules/Editor/MarkdownEditor'
import { ICustomTextStyle } from '../../Modules/Editor/types'

describe('CustomStylesService', () => {
    it('returns default custom styles if none provided', () => {
        const styles = CustomStylesService.getStyles()
        expect(styles.length).toBeGreaterThan(0)
        expect(styles).toEqual(DEFAULT_CUSTOM_STYLES)
        expect(styles.some(s => s.id === 'style_thoughts')).toBe(true)
    })

    it('adds and updates custom styles in projectData', () => {
        const projectData: IProjectStylesData = { customStyles: [] }

        const newStyle: ICustomTextStyle = {
            id: 'style_custom_1',
            name: 'Mowa smoków',
            color: '#ef4444',
            bold: true,
        }

        CustomStylesService.saveStyle(projectData, newStyle)
        expect(projectData.customStyles?.length).toBe(1)
        expect(projectData.customStyles?.[0].name).toBe('Mowa smoków')

        // Update
        CustomStylesService.saveStyle(projectData, {
            ...newStyle,
            name: 'Starożytna mowa smoków',
        })
        expect(projectData.customStyles?.length).toBe(1)
        expect(projectData.customStyles?.[0].name).toBe('Starożytna mowa smoków')
    })

    it('deletes custom style by id', () => {
        const projectData: IProjectStylesData = {
            customStyles: [
                { id: 's1', name: 'Styl 1' },
                { id: 's2', name: 'Styl 2' },
            ],
        }

        CustomStylesService.deleteStyle(projectData, 's1')
        expect(projectData.customStyles?.length).toBe(1)
        expect(projectData.customStyles?.[0].id).toBe('s2')
    })

    it('generates correct CSS rule string', () => {
        const style: ICustomTextStyle = {
            id: 'test_style',
            name: 'Test',
            color: '#3b82f6',
            backgroundColor: '#1e3a8a',
            italic: true,
            bold: true,
            fontFamily: 'serif',
        }

        const css = CustomStylesService.buildCssRule(style)
        expect(css).toContain('.gamebook-custom-style-test_style')
        expect(css).toContain('color: #3b82f6 !important;')
        expect(css).toContain('background-color: #1e3a8a;')
        expect(css).toContain('font-style: italic;')
        expect(css).toContain('font-weight: 700;')
        expect(css).toContain('ui-serif')
    })

    it('rejects unsafe style id when saving or building CSS', () => {
        const unsafeStyle: ICustomTextStyle = {
            id: 'bad" onclick="alert(1)"',
            name: 'XSS Style',
            color: 'red; } body { display:none }',
        }

        const projectData: IProjectStylesData = { customStyles: [] }
        expect(() => CustomStylesService.saveStyle(projectData, unsafeStyle)).toThrow()

        const css = CustomStylesService.buildCssRule(unsafeStyle)
        expect(css).toBe('')
    })

    it('sanitizes malicious colors and font families', () => {
        const style: ICustomTextStyle = {
            id: 'safe_id',
            name: 'Tampered Style',
            color: 'blue; } * { color: red !important; }',
            backgroundColor: 'url("https://evil.com")',
            fontFamily: 'Arial"; } body { background: black }',
        }

        const css = CustomStylesService.buildCssRule(style)
        expect(css).toContain('.gamebook-custom-style-safe_id')
        expect(css).not.toContain('evil.com')
        expect(css).not.toContain('* { color: red')
        expect(css).not.toContain('background: black')
    })
})

describe('MarkdownEditor - Custom Styles Integration', () => {
    let container: HTMLElement

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    it('applies custom style mark to selected text and serializes to markdown', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'To jest tajemnicze słowo w księdze.',
        })

        const raw = editor.getRawEditor()
        raw?.commands.selectAll()

        editor.toggleCustomStyle('style_thoughts')
        expect(editor.isActive('customStyle', { styleId: 'style_thoughts' })).toBe(true)

        const activeFormatting = editor.getActiveFormatting()
        expect(activeFormatting.customStyle).toBe(true)
        expect(activeFormatting.activeCustomStyleId).toBe('style_thoughts')

        const md = editor.getMarkdown()
        expect(md).toContain('<span data-custom-style="style_thoughts">')

        editor.destroy()
    })

    it('toggles off and unsets custom style', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Fragment tekstu',
        })

        const raw = editor.getRawEditor()
        raw?.commands.selectAll()

        editor.toggleCustomStyle('style_spell')
        expect(editor.isActive('customStyle', { styleId: 'style_spell' })).toBe(true)

        // Toggle off
        editor.toggleCustomStyle('style_spell')
        expect(editor.isActive('customStyle')).toBe(false)

        editor.destroy()
    })

    it('parses markdown with custom style span back into editor mark', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
        })

        editor.setMarkdown(
            'Zwykły tekst i <span data-custom-style="style_hint">ważna wskazówka</span> dla gracza.'
        )
        const md = editor.getMarkdown()
        expect(md).toContain('style_hint')

        editor.destroy()
    })

    it('ignores unsafe styleId in parsed markdown HTML span', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
        })

        editor.setMarkdown(
            'Tekst z <span data-custom-style="bad\\" onclick=\\"alert(1)\\">złośliwym stylem</span>.'
        )
        expect(editor.isActive('customStyle')).toBe(false)
        editor.destroy()
    })
})

describe('CustomFontsService', () => {
    it('returns curated fonts by default', () => {
        const fonts = CustomFontsService.getFonts()
        expect(fonts.length).toBeGreaterThanOrEqual(7)
        expect(fonts.some(f => f.name === 'Cinzel')).toBe(true)
        expect(fonts.some(f => f.name === 'MedievalSharp')).toBe(true)
    })

    it('adds new font to projectData and loads it into document head', () => {
        const projectData: IProjectFontsData = { customFonts: [] }
        const added = CustomFontsService.addFont(projectData, 'IM Fell English')

        expect(added.name).toBe('IM Fell English')
        expect(projectData.customFonts?.length).toBe(1)
        const firstFont = projectData.customFonts?.[0]
        const firstName = typeof firstFont === 'string' ? firstFont : firstFont?.name
        expect(firstName).toBe('IM Fell English')

        // Verify link tag added to head
        const link = document.querySelector('link#gfont-im-fell-english') as HTMLLinkElement
        expect(link).not.toBeNull()
        expect(link?.href).toContain('family=IM+Fell+English')

        // Combining getFonts returns curated + custom
        const allFonts = CustomFontsService.getFonts(projectData)
        expect(allFonts.some(f => f.name === 'IM Fell English')).toBe(true)
    })

    it('prevents adding empty font name', () => {
        const projectData: IProjectFontsData = {}
        expect(() => CustomFontsService.addFont(projectData, '  ')).toThrow()
    })

    it('deletes font from projectData', () => {
        const projectData: IProjectFontsData = {
            customFonts: [{ name: 'Custom Font 1' }, { name: 'Custom Font 2' }],
        }

        CustomFontsService.deleteFont(projectData, 'Custom Font 1')
        expect(projectData.customFonts?.length).toBe(1)
        const remaining = projectData.customFonts?.[0]
        const remainingName = typeof remaining === 'string' ? remaining : remaining?.name
        expect(remainingName).toBe('Custom Font 2')
    })

    it('returns offline catalog with rich metadata and polish support', () => {
        const offline = CustomFontsService.getOfflineCatalog()
        expect(offline.length).toBeGreaterThanOrEqual(25)
        const medieval = offline.find(f => f.family === 'MedievalSharp')
        expect(medieval).toBeDefined()
        expect(medieval?.supportsPolish).toBe(true)
        expect(medieval?.category).toBe('display')
    })

    it('filters fonts by query, category, and polish diacritics', () => {
        const catalog = CustomFontsService.getOfflineCatalog()

        // Filter by text query
        const gotykResults = CustomFontsService.filterFonts(catalog, 'gotyk')
        expect(gotykResults.length).toBeGreaterThan(0)
        expect(
            gotykResults.some(f => f.family.includes('Gotisch') || f.family === 'Almendra')
        ).toBe(true)

        // Filter by category
        const serifResults = CustomFontsService.filterFonts(catalog, '', 'serif')
        expect(serifResults.every(f => f.category === 'serif')).toBe(true)

        // Filter only Polish characters
        const polishResults = CustomFontsService.filterFonts(catalog, '', 'all', true)
        expect(polishResults.every(f => f.supportsPolish === true)).toBe(true)
    })

    it('handles offline state and network errors gracefully', async () => {
        CustomFontsService.clearCache()
        const originalFetch = globalThis.fetch
        globalThis.fetch = (): Promise<Response> =>
            Promise.reject(new Error('Network disconnected'))

        const result = await CustomFontsService.fetchOnlineFonts(5000, true)
        expect(result.isOnline).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toContain('Nie udało się')
        expect(result.fonts.length).toBeGreaterThan(0)

        globalThis.fetch = originalFetch
    })

    it('parses online fonts catalog when fetch succeeds', async () => {
        CustomFontsService.clearCache()
        const originalFetch = globalThis.fetch
        globalThis.fetch = (): Promise<Response> =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve([
                        {
                            id: 'online-test-font',
                            family: 'Online Test Font',
                            category: 'serif',
                            subsets: ['latin', 'latin-ext'],
                        },
                    ]),
            } as unknown as Response)

        const result = await CustomFontsService.fetchOnlineFonts(5000, true)
        expect(result.isOnline).toBe(true)
        expect(result.fonts.some(f => f.family === 'Online Test Font')).toBe(true)

        globalThis.fetch = originalFetch
    })
})
