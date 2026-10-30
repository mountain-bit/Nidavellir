// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Description } from '../../Model/Description.js'
import { Paragraph } from '../../Model/Paragraph.js'
import {
    renderFilesModule,
    renderFilesModuleHtml,
    renderParagraphNumberModule,
    renderParagraphNumberModuleHtml,
    renderParagraphRoleModule,
    renderParagraphRoleModuleHtml,
    renderSummaryModule,
    renderSummaryModuleHtml,
} from '../../View/ui/detailsPanel/modules/entityConfigModules.js'

describe('entityConfigModules - Part 2 (ParagraphNumber, Role, Summary, Files)', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        container.remove()
        vi.restoreAllMocks()
    })

    describe('renderParagraphNumberModule', () => {
        let paragraph: Paragraph
        let mockCtx: {
            vm: {
                selection: {
                    validateParagraphNumber: (
                        val: number,
                        id: string,
                        list: Paragraph[]
                    ) => { valid: boolean; message?: string }
                    toggleNumberLock: ReturnType<typeof vi.fn>
                    updateCustomNumber: ReturnType<typeof vi.fn>
                }
            }
            projectParagraphs: Paragraph[]
            renderParagraphsList: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            paragraph = new Paragraph('p-1', 'Paragraf 1')
            mockCtx = {
                vm: {
                    selection: {
                        validateParagraphNumber: vi.fn(() => ({ valid: true })),
                        toggleNumberLock: vi.fn(),
                        updateCustomNumber: vi.fn(),
                    },
                },
                projectParagraphs: [paragraph],
                renderParagraphsList: vi.fn(),
            }
        })

        it('renderParagraphNumberModuleHtml renders auto-number badge when unlocked', () => {
            const html = renderParagraphNumberModuleHtml(false, 0, 12)
            expect(html).toContain('#12')
            expect(html).toContain('Automatyczny')
            expect(html).toContain('disabled')
        })

        it('renderParagraphNumberModuleHtml renders custom-number badge when locked', () => {
            const html = renderParagraphNumberModuleHtml(true, 42, 12)
            expect(html).toContain('#42')
            expect(html).toContain('Własny numer')
            expect(html).toContain('value="42"')
        })

        it('returns null for non-paragraph types', () => {
            expect(renderParagraphNumberModule(container, paragraph, 'scene', mockCtx)).toBeNull()
            expect(renderParagraphNumberModule(null, paragraph, 'paragraph', mockCtx)).toBeNull()
        })

        it('toggles lock number and updates custom number', () => {
            renderParagraphNumberModule(container, paragraph, 'paragraph', mockCtx)

            const lockCheckbox = container.querySelector('#details-number-lock') as HTMLInputElement
            const customInput = container.querySelector(
                '#details-custom-number'
            ) as HTMLInputElement
            const badge = container.querySelector('#details-number-mode-badge') as HTMLElement

            lockCheckbox.checked = true
            lockCheckbox.dispatchEvent(new Event('change'))

            expect(mockCtx.vm.selection.toggleNumberLock).toHaveBeenCalledWith(
                true,
                mockCtx.projectParagraphs
            )
            expect(customInput.disabled).toBe(false)
            expect(badge.textContent).toContain('Własny numer')

            customInput.value = '77'
            customInput.dispatchEvent(new Event('input'))
            expect(mockCtx.vm.selection.updateCustomNumber).toHaveBeenCalledWith(
                77,
                mockCtx.projectParagraphs
            )
        })
    })

    describe('renderParagraphRoleModule', () => {
        let paragraph: Paragraph
        let mockCtx: {
            renderParagraphsList: ReturnType<typeof vi.fn>
            storyGraph: { renderGraph: ReturnType<typeof vi.fn> }
        }

        beforeEach(() => {
            paragraph = new Paragraph('p-2', 'Zakończenie')
            mockCtx = {
                renderParagraphsList: vi.fn(),
                storyGraph: {
                    renderGraph: vi.fn(),
                },
            }
        })

        it('renderParagraphRoleModuleHtml renders finale badge when isEnd is true', () => {
            const html = renderParagraphRoleModuleHtml(true)
            expect(html).toContain('FINAŁ (KONIEC)')
            expect(html).toContain('checked')
            expect(html).toContain('bg-rose-950/70')
        })

        it('renderParagraphRoleModuleHtml renders regular badge when isEnd is false', () => {
            const html = renderParagraphRoleModuleHtml(false)
            expect(html).toContain('Zwykły paragraf')
            expect(html).not.toContain('checked')
        })

        it('does not render role module for START node', () => {
            const startP = new Paragraph('start', 'START')
            startP.setIsStart(true)
            expect(renderParagraphRoleModule(container, startP, 'paragraph', mockCtx)).toBeNull()
        })

        it('toggles isEnd flag on checkbox change', () => {
            const onRefresh = vi.fn()
            renderParagraphRoleModule(container, paragraph, 'paragraph', mockCtx, onRefresh)

            const checkbox = container.querySelector(
                '#details-paragraph-is-end'
            ) as HTMLInputElement
            const badge = container.querySelector('#details-paragraph-role-badge') as HTMLElement

            checkbox.checked = true
            checkbox.dispatchEvent(new Event('change'))

            expect(paragraph.getIsEnd()).toBe(true)
            expect(badge.textContent).toContain('FINAŁ (KONIEC)')
            expect(mockCtx.renderParagraphsList).toHaveBeenCalled()
            expect(mockCtx.storyGraph.renderGraph).toHaveBeenCalled()
            expect(onRefresh).toHaveBeenCalled()
        })
    })

    describe('renderSummaryModule', () => {
        let mockEntity: {
            _desc: Description
            getDescription: () => Description
        }
        let mockCtx: {
            vm: {
                selection: {
                    updateSummary: ReturnType<typeof vi.fn>
                    getSelectedItem: () => { type: string }
                }
            }
            refreshActiveSection: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            const desc = new Description()
            desc.setSummary('Krótki opis sceny')
            mockEntity = {
                _desc: desc,
                getDescription: (): Description => mockEntity._desc,
            }
            mockCtx = {
                vm: {
                    selection: {
                        updateSummary: vi.fn(),
                        getSelectedItem: (): { type: string } => ({ type: 'paragraph' }),
                    },
                },
                refreshActiveSection: vi.fn(),
            }
        })

        it('renderSummaryModuleHtml renders textarea with value and placeholder', () => {
            const html = renderSummaryModuleHtml('Wstęp do lochu')
            expect(html).toContain('Streszczenie')
            expect(html).toContain('Wstęp do lochu')
            expect(html).toContain('details-summary-input')
        })

        it('returns null if entity has no description or content', () => {
            expect(renderSummaryModule(container, {}, mockCtx)).toBeNull()
            expect(renderSummaryModule(null, mockEntity, mockCtx)).toBeNull()
        })

        it('updates summary on textarea input', () => {
            renderSummaryModule(container, mockEntity, mockCtx)

            const textarea = container.querySelector(
                '#details-summary-input'
            ) as HTMLTextAreaElement
            textarea.value = 'Nowe streszczenie'
            textarea.dispatchEvent(new Event('input'))

            expect(mockCtx.vm.selection.updateSummary).toHaveBeenCalledWith('Nowe streszczenie')
            expect(mockEntity._desc.getSummary()).toBe('Nowe streszczenie')
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('paragraph')
        })
    })

    describe('renderFilesModule', () => {
        let mockEntity: {
            getDescription: () => Description
            getHasCombat: () => boolean
        }
        let mockCtx: {
            vm: {
                files: {
                    openOrCreateDescriptionFile: () => {
                        fileName: string
                        content: string
                    }
                }
            }
            files: Record<string, string>
            updateMainWorkspaceUI: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockEntity = {
                getDescription: (): Description => new Description(),
                getHasCombat: (): boolean => false,
            }
            mockCtx = {
                vm: {
                    files: {
                        openOrCreateDescriptionFile: vi.fn(() => ({
                            fileName: 'p_1.md',
                            content: '# Paragraf 1',
                        })),
                    },
                },
                files: {},
                updateMainWorkspaceUI: vi.fn(),
            }
        })

        it('renderFilesModuleHtml renders file button with SVG icons', () => {
            const html = renderFilesModuleHtml()
            expect(html).toContain('Plik opisu (Markdown)')
            expect(html).toContain('Otwórz plik opisu')
            expect(html).toContain('btn-open-player-text')
            expect(html).toContain('<svg')
        })

        it('returns null if entity has no description or content method', () => {
            expect(renderFilesModule(container, {}, mockCtx)).toBeNull()
            expect(renderFilesModule(null, mockEntity, mockCtx)).toBeNull()
        })

        it('opens description file on button click and updates workspace', () => {
            renderFilesModule(container, mockEntity, mockCtx)

            const btn = container.querySelector('#btn-open-player-text') as HTMLButtonElement
            btn.click()

            expect(mockCtx.vm.files.openOrCreateDescriptionFile).toHaveBeenCalled()
            expect(mockCtx.files['p_1.md']).toBe('# Paragraf 1')
            expect(mockCtx.updateMainWorkspaceUI).toHaveBeenCalled()
        })
    })

    describe('Internationalization (i18n)', () => {
        it('renders templates in English correctly', async () => {
            await initTranslationsWithLocale('en')
            const numHtml = renderParagraphNumberModuleHtml(false, 0, 5)
            expect(numHtml).toContain('Automatic')

            const roleHtml = renderParagraphRoleModuleHtml(true)
            expect(roleHtml).toContain('FINALE (END)')
            expect(roleHtml).toContain('Narrative role')

            const sumHtml = renderSummaryModuleHtml('Brief')
            expect(sumHtml).toContain('Summary')

            const fileHtml = renderFilesModuleHtml()
            expect(fileHtml).toContain('Open Description File')
        })

        it('renders templates in German correctly', async () => {
            await initTranslationsWithLocale('de')
            const roleHtml = renderParagraphRoleModuleHtml(true)
            expect(roleHtml).toContain('FINALE (ENDE)')
            expect(roleHtml).toContain('Narrative Rolle')

            const sumHtml = renderSummaryModuleHtml('Kurz')
            expect(sumHtml).toContain('Zusammenfassung')

            const fileHtml = renderFilesModuleHtml()
            expect(fileHtml).toContain('Beschreibungsdatei öffnen')
        })
    })
})
