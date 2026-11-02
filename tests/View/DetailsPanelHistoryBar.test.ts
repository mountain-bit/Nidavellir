// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { renderHistoryBar as renderHistoryBarRoot } from '../../View/ui/detailsPanel/historyBar.js'
import {
    renderCloseAllButtonHtml,
    renderEmptyHistoryHtml,
    renderHistoryBar,
    renderHistoryTabHtml,
    resolveHistoryContainer,
} from '../../View/ui/detailsPanel/navigation/historyBar.js'
import * as HistoryBarTemplates from '../../View/ui/detailsPanel/navigation/historyBarTemplates.js'
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
        expect(NavigationModule.renderEmptyHistoryHtml).toBe(renderEmptyHistoryHtml)
        expect(NavigationModule.renderHistoryTabHtml).toBe(renderHistoryTabHtml)
        expect(NavigationModule.renderCloseAllButtonHtml).toBe(renderCloseAllButtonHtml)
        expect(HistoryBarTemplates.renderHistoryTabHtml).toBe(renderHistoryTabHtml)
    })

    describe('resolveHistoryContainer', () => {
        it('resolves container correctly based on override, ctx, or fallback ID', () => {
            const override = document.createElement('div')
            expect(resolveHistoryContainer({}, override)).toBe(override)

            const ctxContainer = document.createElement('div')
            expect(resolveHistoryContainer({ historyTabsContainer: ctxContainer })).toBe(
                ctxContainer
            )

            expect(resolveHistoryContainer({})).toBe(container)
        })
    })

    describe('pure template functions', () => {
        it('renders empty history HTML with localized labels', () => {
            const html = renderEmptyHistoryHtml()
            expect(html).toContain(translate('details.history'))
            expect(html).toContain(translate('details.history_empty'))
        })

        it('renders active and inactive history tab HTML with proper ARIA attributes', () => {
            const activeHtml = renderHistoryTabHtml({
                item: { id: 'p_1', name: 'Wstęp', type: 'paragraph' },
                isActive: true,
            })
            expect(activeHtml).toContain('border-blue-500/50')
            expect(activeHtml).toContain('Wstęp')
            expect(activeHtml).toContain('btn-close-history-item')
            expect(activeHtml).toContain('role="tab"')
            expect(activeHtml).toContain('aria-selected="true"')
            expect(activeHtml).toContain('tabindex="0"')

            const inactiveHtml = renderHistoryTabHtml({
                item: { id: 'p_2', name: 'Zakończenie', type: 'paragraph' },
                isActive: false,
            })
            expect(inactiveHtml).not.toContain('border-blue-500/50')
            expect(inactiveHtml).toContain('Zakończenie')
            expect(inactiveHtml).toContain('aria-selected="false"')
            expect(inactiveHtml).toContain('tabindex="-1"')
        })

        it('renders close all button HTML with icon and title', () => {
            const html = renderCloseAllButtonHtml()
            expect(html).toContain('id="btn-close-all-history"')
            expect(html).toContain(translate('details.close_all'))
            expect(html).toContain('aria-label')
            expect(html).toContain('<svg')
        })
    })

    describe('renderHistoryBar controller', () => {
        it('renders empty placeholder if history is empty', () => {
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => [],
                        getSelectedItem: (): unknown => null,
                    },
                },
            }

            renderHistoryBar(ctx)
            expect(container.textContent).toContain(translate('details.history'))
            expect(container.textContent).toContain(translate('details.history_empty'))
        })

        it('renders tabs with role="tablist" and close all button when history has entries', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                        selectHistoryItem: vi.fn(),
                        closeHistoryItem: vi.fn(),
                        closeAllHistory: vi.fn(),
                    },
                },
                renderDetailsPanel: vi.fn(),
            }

            renderHistoryBar(ctx)

            const tablist = container.querySelector('[role="tablist"]')
            expect(tablist).not.toBeNull()
            expect(tablist?.getAttribute('aria-orientation')).toBe('horizontal')

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

        it('supports rendering into a custom override container', () => {
            const customContainer = document.createElement('div')
            const mockHistory = [{ id: 'p_1', name: 'Prolog', type: 'paragraph' }]
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                    },
                },
            }

            renderHistoryBar(ctx, { container: customContainer })

            expect(customContainer.querySelectorAll('.history-tab-btn').length).toBe(1)
            expect(container.children.length).toBe(0)
        })

        it('handles tab selection click via delegation', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const selectSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                        selectHistoryItem: selectSpy,
                        closeHistoryItem: vi.fn(),
                        closeAllHistory: vi.fn(),
                    },
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            const tabs = container.querySelectorAll('.history-tab-btn')
            ;(tabs[1] as HTMLElement).click()

            expect(selectSpy).toHaveBeenCalledWith('p_2')
            expect(refreshSpy).toHaveBeenCalled()
        })

        it('handles individual tab close click via delegation without selecting tab', () => {
            const mockHistory = [{ id: 'p_1', name: 'Prolog', type: 'paragraph' }]
            const selectSpy = vi.fn()
            const closeSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                        selectHistoryItem: selectSpy,
                        closeHistoryItem: closeSpy,
                        closeAllHistory: vi.fn(),
                    },
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            const closeBtn = container.querySelector(
                '.btn-close-history-item'
            ) as HTMLElement | null
            expect(closeBtn).not.toBeNull()
            closeBtn?.click()

            expect(closeSpy).toHaveBeenCalledWith('p_1')
            expect(selectSpy).not.toHaveBeenCalled()
            expect(refreshSpy).toHaveBeenCalled()
        })

        it('handles close all history click', () => {
            const mockHistory = [{ id: 'p_1', name: 'Prolog', type: 'paragraph' }]
            const closeAllSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                        selectHistoryItem: vi.fn(),
                        closeHistoryItem: vi.fn(),
                        closeAllHistory: closeAllSpy,
                    },
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

        it('preserves horizontal scroll offset across re-renders', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Część 1', type: 'paragraph' },
                { id: 'p_3', name: 'Epilog', type: 'paragraph' },
            ]
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                    },
                },
            }

            renderHistoryBar(ctx)
            const scrollWrapper = container.querySelector(
                '.history-tabs-scroll-wrapper'
            ) as HTMLElement
            expect(scrollWrapper).not.toBeNull()

            // Simulate scroll position
            scrollWrapper.scrollLeft = 85

            // Re-render
            renderHistoryBar(ctx)
            const newScrollWrapper = container.querySelector(
                '.history-tabs-scroll-wrapper'
            ) as HTMLElement
            expect(newScrollWrapper.scrollLeft).toBe(85)
        })

        it('supports keyboard navigation with ArrowRight, ArrowLeft, Enter, and Delete', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const selectSpy = vi.fn()
            const closeSpy = vi.fn()
            const refreshSpy = vi.fn()
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                        selectHistoryItem: selectSpy,
                        closeHistoryItem: closeSpy,
                    },
                },
            }

            renderHistoryBar(ctx, refreshSpy)

            expect(container.querySelector('.history-tabs-scroll-wrapper')).not.toBeNull()
            const tabs = Array.from(container.querySelectorAll('.history-tab-btn')) as HTMLElement[]

            // Focus first tab
            tabs[0].focus()
            expect(document.activeElement).toBe(tabs[0])

            // ArrowRight focuses next tab
            tabs[0].dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
            )
            expect(document.activeElement).toBe(tabs[1])

            // ArrowLeft focuses previous tab
            tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
            expect(document.activeElement).toBe(tabs[0])

            // Enter selects focused tab
            tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
            expect(selectSpy).toHaveBeenCalledWith('p_1')

            // Delete closes currently focused tab
            document.activeElement?.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })
            )
            expect(closeSpy).toHaveBeenCalledWith('p_1')
        })

        it('supports mouse wheel horizontal scrolling on scrollWrapper', () => {
            const mockHistory = [
                { id: 'p_1', name: 'Prolog', type: 'paragraph' },
                { id: 'p_2', name: 'Epilog', type: 'paragraph' },
            ]
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => mockHistory,
                        getSelectedItem: (): unknown => mockHistory[0],
                    },
                },
            }

            renderHistoryBar(ctx)
            const scrollWrapper = container.querySelector(
                '.history-tabs-scroll-wrapper'
            ) as HTMLElement
            expect(scrollWrapper).not.toBeNull()
            Object.defineProperty(scrollWrapper, 'scrollWidth', { value: 500, configurable: true })
            Object.defineProperty(scrollWrapper, 'clientWidth', { value: 200, configurable: true })

            const wheelEvent = new WheelEvent('wheel', {
                deltaY: 40,
                bubbles: true,
                cancelable: true,
            })
            scrollWrapper.dispatchEvent(wheelEvent)

            expect(scrollWrapper.scrollLeft).toBe(40)
        })

        it('translates correctly in English and German without hardcoded strings', async () => {
            const ctx = {
                vm: {
                    selection: {
                        getHistory: (): unknown[] => [],
                        getSelectedItem: (): unknown => null,
                    },
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
