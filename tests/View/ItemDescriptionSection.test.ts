// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Description } from '../../Model/Description.js'
import {
    createItemDescriptionSection,
    renderItemDescriptionHtml,
} from '../../View/ui/detailsPanel/item/itemDescriptionSection.js'

describe('itemDescriptionSection Component', () => {
    let descObj: Description
    let ctx: {
        vm: {
            openOrCreateDescriptionFile: ReturnType<typeof vi.fn>
        }
        files: Record<string, string>
        updateMainWorkspaceUI: ReturnType<typeof vi.fn>
        markDirty: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        descObj = new Description('Tekst opisu', 'Miecz wykuty w sercu góry.')

        ctx = {
            vm: {
                openOrCreateDescriptionFile: vi.fn().mockReturnValue({
                    fileName: 'Items/it_sword.md',
                    content: '# Miecz\n\nPełny opis.',
                }),
            },
            files: {},
            updateMainWorkspaceUI: vi.fn(),
            markDirty: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderItemDescriptionHtml', () => {
        it('renders label, textarea with value, and open markdown button', () => {
            const html = renderItemDescriptionHtml('Krótki opis przedmiotu.')
            expect(html).toContain('Streszczenie fabularne')
            expect(html).toContain('details-item-summary-input')
            expect(html).toContain('Krótki opis przedmiotu.')
            expect(html).toContain('btn-open-item-markdown')
            expect(html).toContain('Otwórz plik opisu (Markdown)')
        })

        it('safely escapes special characters in summary', () => {
            const html = renderItemDescriptionHtml('Opis <"niebezpieczny" & ostry>')
            expect(html).toContain('Opis &lt;&quot;niebezpieczny&quot; &amp; ostry&gt;')
        })
    })

    describe('createItemDescriptionSection', () => {
        it('initializes textarea with current summary and updates descObj on input', () => {
            const section = createItemDescriptionSection(descObj, descObj.getSummary(), ctx)
            const textarea = section.querySelector(
                '#details-item-summary-input'
            ) as HTMLTextAreaElement

            expect(textarea).not.toBeNull()
            expect(textarea.value).toBe('Miecz wykuty w sercu góry.')

            textarea.value = 'Zaktualizowany opis miecza.'
            textarea.dispatchEvent(new Event('input'))

            expect(descObj.getSummary()).toBe('Zaktualizowany opis miecza.')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('supports fallback to plain object properties when setters are missing', () => {
            const plainDesc: { summary: string; text?: string } = { summary: 'Początkowy' }
            const section = createItemDescriptionSection(
                plainDesc as unknown as Description,
                'Początkowy',
                ctx
            )
            const textarea = section.querySelector(
                '#details-item-summary-input'
            ) as HTMLTextAreaElement

            textarea.value = 'Nowy tekst'
            textarea.dispatchEvent(new Event('input'))

            expect(plainDesc.summary).toBe('Nowy tekst')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('triggers openOrCreateDescriptionFile on button click and updates workspace', () => {
            const section = createItemDescriptionSection(descObj, descObj.getSummary(), ctx)
            const button = section.querySelector('#btn-open-item-markdown') as HTMLButtonElement

            expect(button).not.toBeNull()
            button.click()

            expect(ctx.vm.openOrCreateDescriptionFile).toHaveBeenCalledWith(descObj)
            expect(ctx.files['Items/it_sword.md']).toBe('# Miecz\n\nPełny opis.')
            expect(ctx.updateMainWorkspaceUI).toHaveBeenCalled()
        })

        it('handles omitted summary parameter by reading from descObj', () => {
            const section = createItemDescriptionSection(descObj, undefined, ctx)
            const textarea = section.querySelector(
                '#details-item-summary-input'
            ) as HTMLTextAreaElement

            expect(textarea.value).toBe('Miecz wykuty w sercu góry.')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemDescriptionSection(descObj, '', ctx)
            expect(sectionEn.textContent).toContain('Narrative summary')
            expect(sectionEn.textContent).toContain('Open description file (Markdown)')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemDescriptionSection(descObj, '', ctx)
            expect(sectionDe.textContent).toContain('Handlungszusammenfassung')
            expect(sectionDe.textContent).toContain('Beschreibungsdatei öffnen (Markdown)')
        })
    })
})
