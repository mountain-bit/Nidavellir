// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { renderHistoryBar as renderHistoryBarRoot } from '../../View/ui/detailsPanel/historyBar.js'
import {
    renderCloseAllButtonHtml,
    renderEmptyHistoryHtml,
    renderHistoryBar,
    renderHistoryTabHtml,
} from '../../View/ui/detailsPanel/navigation/historyBar.js'
import * as NavigationModule from '../../View/ui/detailsPanel/navigation/index.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)

describe('historyBar module & navigation index', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        container.id = 'history-tabs-container'
        document.body.appendChild(container)
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    it('exports renderHistoryBar identically from root facade, submodule, and navigation index', () => {
        expect(renderHistoryBar).toBeDefined()
        expect(renderHistoryBarRoot).toBe(renderHistoryBar)
        expect(NavigationModule.renderHistoryBar).toBe(renderHistoryBar)
    })

    describe('pure template functions', () => {
        it('renders empty history HTML with localized labels', () => {
            const html = renderEmptyHistoryHtml()
            expect(html).toContain(translate('details.history'))
            expect(html).toContain(translate('details.history_empty'))
        })

        it('renders active and inactive history tab HTML', () => {
            const activeHtml = renderHistoryTabHtml({
                item: { id: 'p_1', name: 'Wstęp', type: 'paragraph' },
                isActive: true,
            })
            expect(activeHtml).toContain('border-blue-500/50')
            expect(activeHtml).toContain('Wstęp')
            expect(activeHtml).toContain('btn-close-history-item')

            const inactiveHtml = renderHistoryTabHtml({
                item: { id: 'p_2', name: 'Zakończenie', type: 'paragraph' },
                isActive: false,
            })
            expect(inactiveHtml).not.toContain('border-blue-500/50')
            expect(inactiveHtml).toContain('Zakończenie')
        })

        it('renders close all button HTML with icon and title', () => {
            const html = renderCloseAllButtonHtml()
            expect(html).toContain('id="btn-close-all-history"')
            expect(html).toContain(translate('details.close_all'))
            expect(html).toContain('<svg')
        })
    })

    describe('renderHistoryBar controller', () => {
        it('renders empty placeholder if history is empty', () => {
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => [],
                    getSelectedItem: (): unknown => null,
                },
            }

            renderHistoryBar(ctx)
            expect(container.textContent).toContain(translate('details.history'))
            expect(container.textContent).toContain(translate('details.history_empty'))
        })

        it('renders tabs and close all button when history has entries', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => mockHistory,
                    getSelectedItem: (): unknown => mockHistory[0],
                    selectHistoryItem: vi.fn(),
                    closeHistoryItem: vi.fn(),
                    closeAllHistory: vi.fn(),
                },
                renderDetailsPanel: vi.fn(),
            }

            renderHistoryBar(ctx)

            const tabs = container.querySelectorAll('.history-tab-btn')
            expect(tabs.length).toBe(2)
            expect(tabs[0].textContent).toContain('Prolog')
            expect(tabs[1].textContent).toContain('Epilog')
            expect(tabs[0].classList.contains('border-blue-500/50')).toBe(true)
            expect(tabs[1].classList.contains('border-blue-500/50')).toBe(false)

            const closeAllBtn = container.querySelector(
                '#btn-close-all-history'
            ) as HTMLButtonElement | null
            expect(closeAllBtn).not.toBeNull()
        })

        it('handles tab selection click', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const selectSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => mockHistory,
                    getSelectedItem: (): unknown => mockHistory[0],
                    selectHistoryItem: selectSpy,
                    closeHistoryItem: vi.fn(),
                    closeAllHistory: vi.fn(),
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            const tabs = container.querySelectorAll('.history-tab-btn')
            ;(tabs[1] as HTMLButtonElement).click()

            expect(selectSpy).toHaveBeenCalledWith('p_2')
            expect(refreshSpy).toHaveBeenCalled()
        })

        it('handles individual tab close click', () => {
            const mockHistory = [{ id: 'p_1', name: 'Prolog', type: 'paragraph' }]
            const closeSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => mockHistory,
                    getSelectedItem: (): unknown => mockHistory[0],
                    selectHistoryItem: vi.fn(),
                    closeHistoryItem: closeSpy,
                    closeAllHistory: vi.fn(),
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            const closeBtn = container.querySelector(
                '.btn-close-history-item'
            ) as HTMLElement | null
            expect(closeBtn).not.toBeNull()
            closeBtn?.click()

            expect(closeSpy).toHaveBeenCalledWith('p_1')
            expect(refreshSpy).toHaveBeenCalled()
        })

        it('handles close all history click', () => {
            const mockHistory = [{ id: 'p_1', name: 'Prolog', type: 'paragraph' }]
            const closeAllSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => mockHistory,
                    getSelectedItem: (): unknown => mockHistory[0],
                    selectHistoryItem: vi.fn(),
                    closeHistoryItem: vi.fn(),
                    closeAllHistory: closeAllSpy,
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            const closeAllBtn = container.querySelector(
                '#btn-close-all-history'
            ) as HTMLButtonElement | null
            expect(closeAllBtn).not.toBeNull()
            closeAllBtn?.click()

            expect(closeAllSpy).toHaveBeenCalled()
            expect(refreshSpy).toHaveBeenCalled()
        })

        it('translates correctly in English and German without hardcoded strings', async () => {
            const ctx = {
                vm: {
                    getHistory: (): unknown[] => [],
                    getSelectedItem: (): unknown => null,
                },
            }

            // EN
            await initTranslationsWithLocale('en')
            renderHistoryBar(ctx)
            expect(container.textContent).toContain(translate('details.history'))
            expect(container.textContent).toContain(translate('details.history_empty'))

            // DE
            await initTranslationsWithLocale('de')
            renderHistoryBar(ctx)
            expect(container.textContent).toContain(translate('details.history'))
            expect(container.textContent).toContain(translate('details.history_empty'))
        })
    })
})
