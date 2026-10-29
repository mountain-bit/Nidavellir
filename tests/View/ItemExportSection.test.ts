// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { ItemExportService } from '../../dist/ViewModel/MainWindowViewModel.js'
import { Item } from '../../Model/Item.js'
import {
    createItemExportSection,
    getProjectName,
    renderItemExportHtml,
} from '../../View/ui/detailsPanel/item/itemExportSection.js'

describe('itemExportSection Component', () => {
    let itemEntity: Item
    let ctx: {
        projectName: string
        projectItems: Item[]
        projectParagraphs: Array<{ id: string }>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_amulet_1', 'Amulet Czasu')
        ctx = {
            projectName: 'Wrota Magii',
            projectItems: [itemEntity],
            projectParagraphs: [{ id: 'p_1' }],
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('getProjectName', () => {
        it('resolves project name from ctx properties and fallback methods', () => {
            expect(getProjectName({ projectName: 'Super Gra' })).toBe('Super Gra')
            expect(getProjectName({ getProjectName: () => 'Projekt X' })).toBe('Projekt X')
            expect(
                getProjectName({
                    vm: {
                        project: {
                            getName: () => 'Kronika',
                        },
                    },
                } as unknown as typeof ctx)
            ).toBe('Kronika')
            expect(getProjectName({})).toBe('projekt')
        })
    })

    describe('renderItemExportHtml', () => {
        it('renders export buttons without any emojis', () => {
            const html = renderItemExportHtml()
            expect(html).toContain('Eksport i Narzędzia')
            expect(html).toContain('Kopiuj JSON')
            expect(html).toContain('Zapisz JSON')
            expect(html).toContain('Katalog (CSV)')
            expect(html).toContain('Katalog (MD)')

            // Verify emojis are eliminated
            expect(html).not.toContain('📊')
            expect(html).not.toContain('📝')
        })
    })

    describe('createItemExportSection', () => {
        it('handles copy JSON button click and writes to clipboard', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined)
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: writeTextMock,
                },
                configurable: true,
            })

            const exportSpy = vi
                .spyOn(ItemExportService, 'exportToJSON')
                .mockReturnValue('{"id":"it_amulet_1"}')

            const section = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            const copyBtn = section.querySelector('#btn-copy-item-json') as HTMLButtonElement
            expect(copyBtn).not.toBeNull()

            copyBtn.click()

            expect(exportSpy).toHaveBeenCalled()
            expect(writeTextMock).toHaveBeenCalledWith('{"id":"it_amulet_1"}')
        })

        it('handles download JSON button click using ItemExportService', () => {
            const exportSpy = vi
                .spyOn(ItemExportService, 'exportToJSON')
                .mockReturnValue('{"id":"it_amulet_1"}')
            const downloadSpy = vi
                .spyOn(ItemExportService, 'downloadFile')
                .mockImplementation(() => {})

            const section = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            const downloadBtn = section.querySelector(
                '#btn-download-item-json'
            ) as HTMLButtonElement
            expect(downloadBtn).not.toBeNull()

            downloadBtn.click()

            expect(exportSpy).toHaveBeenCalled()
            expect(downloadSpy).toHaveBeenCalledWith(
                '{"id":"it_amulet_1"}',
                'item_amulet_czasu.json',
                'application/json'
            )
        })

        it('handles export all items to CSV button click', () => {
            const csvSpy = vi
                .spyOn(ItemExportService, 'exportToCSV')
                .mockReturnValue('id,name\nit_amulet_1,Amulet Czasu')
            const downloadSpy = vi
                .spyOn(ItemExportService, 'downloadFile')
                .mockImplementation(() => {})

            const section = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            const csvBtn = section.querySelector('#btn-export-all-csv') as HTMLButtonElement
            expect(csvBtn).not.toBeNull()

            csvBtn.click()

            expect(csvSpy).toHaveBeenCalledWith([itemEntity])
            expect(downloadSpy).toHaveBeenCalledWith(
                'id,name\nit_amulet_1,Amulet Czasu',
                'wrota_magii_przedmioty.csv',
                'text/csv;charset=utf-8'
            )
        })

        it('handles export all items to Markdown button click', () => {
            const mdSpy = vi
                .spyOn(ItemExportService, 'exportToMarkdown')
                .mockReturnValue('# Katalog')
            const downloadSpy = vi
                .spyOn(ItemExportService, 'downloadFile')
                .mockImplementation(() => {})

            const section = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            const mdBtn = section.querySelector('#btn-export-all-md') as HTMLButtonElement
            expect(mdBtn).not.toBeNull()

            mdBtn.click()

            expect(mdSpy).toHaveBeenCalled()
            expect(downloadSpy).toHaveBeenCalledWith(
                '# Katalog',
                'wrota_magii_katalog_przedmiotow.md',
                'text/markdown;charset=utf-8'
            )
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            expect(sectionEn.textContent).toContain('Export & Tools')
            expect(sectionEn.textContent).toContain('Copy JSON')
            expect(sectionEn.textContent).toContain('Save JSON')
            expect(sectionEn.textContent).toContain('Catalog (CSV)')
            expect(sectionEn.textContent).toContain('Catalog (MD)')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemExportSection(itemEntity, 'Amulet Czasu', ctx)
            expect(sectionDe.textContent).toContain('Export & Werkzeuge')
            expect(sectionDe.textContent).toContain('JSON kopieren')
            expect(sectionDe.textContent).toContain('JSON speichern')
        })
    })
})
