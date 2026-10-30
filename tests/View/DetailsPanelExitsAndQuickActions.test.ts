/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { Paragraph } from '../../dist/ViewModel/MainWindowViewModel.js'
import {
    renderAddExitFormHtml,
    renderEmptyExitsHtml,
    renderExitBadgesHtml,
    renderExitCardHtml,
    renderExitsModule,
    renderExitsModuleHeaderHtml,
    renderExitsModuleHtml,
    renderTargetParagraphOptionsHtml,
} from '../../View/ui/detailsPanel/modules/exitsModule.js'
import {
    renderQuickActionsModule,
    renderQuickActionsModuleHtml,
} from '../../View/ui/detailsPanel/modules/quickActionsModule.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)

describe('DetailsPanel - Exits & Quick Actions Modules', () => {
    let container: HTMLElement

    beforeEach(() => {
        initTranslationsWithLocale('en')
        container = document.createElement('div')
    })

    describe('Exits Module Pure Templates', () => {
        it('renders exits module header with count and icon', () => {
            const html = renderExitsModuleHeaderHtml(3)
            expect(html).toContain('3')
            expect(html).toContain(translate('details.paragraph_exits'))
            expect(html).toContain(translate('details.add_exit'))
            expect(html).toContain('<svg')
        })

        it('renders empty exits message', () => {
            const html = renderEmptyExitsHtml()
            expect(html).toContain(translate('details.no_exits'))
        })

        it('renders exit badges for combat outcome, condition, costs, rewards, and dice check', () => {
            const mockChoice = {
                getIsCombatOutcome: (): boolean => true,
                hasCosts: (): boolean => true,
                getCosts: (): Array<{ name: string; value: number }> => [
                    { name: 'Gold', value: 5 },
                ],
                hasRewards: (): boolean => true,
                getRewards: (): Array<{ name: string; value: number }> => [
                    { name: 'Key', value: 1 },
                ],
                hasDiceCheck: (): boolean => true,
                getDiceCheck: (): { dice: string; branches: unknown[] } => ({
                    dice: 'd20',
                    branches: [{}, {}],
                }),
            }

            const html = renderExitBadgesHtml(mockChoice, 'Has Torch')
            expect(html).toContain(translate('details.combat_outcome'))
            expect(html).toContain(`${translate('details.exit_badge_condition')}: Has Torch`)
            expect(html).toContain(`${translate('details.exit_badge_cost')}: -5 Gold`)
            expect(html).toContain(`${translate('details.exit_badge_reward')}: +1 Key`)
            expect(html).toContain(
                `${translate('details.exit_badge_dice')}: d20 (2 ${translate('details.exit_badge_targets')})`
            )
        })

        it('handles null safely in renderExitBadgesHtml', () => {
            expect(renderExitBadgesHtml(null)).toBe('')
            const emptyChoice = {
                getIsCombatOutcome: (): boolean => false,
                hasCosts: (): boolean => false,
                hasRewards: (): boolean => false,
                hasDiceCheck: (): boolean => false,
            }
            expect(renderExitBadgesHtml(emptyChoice, '')).toBe('')
        })

        it('renders target paragraph options for select with current selection and self annotation', () => {
            const paragraphs = [
                { getId: (): string => 'p1', getTitle: (): string => 'Entrance' },
                { getId: (): string => 'p2', getTitle: (): string => 'Hall' },
            ]
            const html = renderTargetParagraphOptionsHtml(paragraphs, 'p2', 'p1')
            expect(html).toContain('value="p1"')
            expect(html).toContain('§ Entrance')
            expect(html).toContain(translate('details.this_paragraph'))
            expect(html).toContain('value="p2" selected')
            expect(html).toContain('§ Hall')
        })

        it('renders add exit form block with inputs and buttons', () => {
            const html = renderAddExitFormHtml('<option value="p1">§ Entrance</option>')
            expect(html).toContain('id="details-add-exit-form"')
            expect(html).toContain('id="details-add-exit-target"')
            expect(html).toContain('id="details-add-exit-name"')
            expect(html).toContain('id="details-add-exit-condition"')
            expect(html).toContain('id="btn-cancel-add-exit"')
            expect(html).toContain('id="btn-submit-add-exit"')
            expect(html).toContain(translate('buttons.cancel'))
            expect(html).toContain(translate('buttons.add'))
        })

        it('renders exit card with target title, inputs, delete button, and escapes XSS', () => {
            const mockChoice = {
                getName: (): string => '<script>alert(1)</script> Go East',
            }
            const html = renderExitCardHtml(
                mockChoice,
                '<img src=x onerror=alert(2)> Dark Room',
                '<option value="p3">§ Dark Room</option>',
                '<span class="badge">Badge</span>'
            )
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; Go East')
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;img src=x onerror=alert(2)&gt; Dark Room')
            expect(html).toContain('btn-inspect-exit')
            expect(html).toContain('btn-delete-exit')
            expect(html).toContain('exit-name-input')
            expect(html).toContain('exit-target-select')
        })

        it('handles null safely in renderExitCardHtml', () => {
            expect(renderExitCardHtml(null, 'Title', '', '')).toBe('')
        })

        it('renders full exits module template layout', () => {
            const html = renderExitsModuleHtml(2, '<div>Form</div>')
            expect(html).toContain('details-exits-list')
            expect(html).toContain('<div>Form</div>')
            expect(html).toContain('2')
        })
    })

    describe('Exits Module DOM Integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderExitsModule(null, {}, 'paragraph', {})).not.toThrow()
            expect(() => renderExitsModule(container, null, 'paragraph', {})).not.toThrow()
            expect(() => renderExitsModule(container, {}, 'item', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when paragraph has no choices', () => {
            const p = new Paragraph('p_test', 'Test Paragraph')
            renderExitsModule(container, p, 'paragraph', { projectParagraphs: [p] })
            expect(container.textContent).toContain(translate('details.no_exits'))
        })

        it('toggles add exit form when clicking toggle and cancel buttons', () => {
            const p = new Paragraph('p_test', 'Test Paragraph')
            renderExitsModule(container, p, 'paragraph', { projectParagraphs: [p] })

            const form = container.querySelector('#details-add-exit-form') as HTMLElement
            const toggleBtn = container.querySelector('#btn-toggle-add-exit') as HTMLButtonElement
            const cancelBtn = container.querySelector('#btn-cancel-add-exit') as HTMLButtonElement

            expect(form.classList.contains('hidden')).toBe(true)

            toggleBtn.click()
            expect(form.classList.contains('hidden')).toBe(false)

            cancelBtn.click()
            expect(form.classList.contains('hidden')).toBe(true)
        })

        it('creates new exit connection on submit click', () => {
            const p1 = new Paragraph('p_1', 'Origin')
            const p2 = new Paragraph('p_2', 'Destination')
            const mockVm = {
                graph: {
                    createChoice: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectParagraphs: [p1, p2],
                renderConnectionsList: vi.fn(),
                renderParagraphsList: vi.fn(),
            }

            renderExitsModule(container, p1, 'paragraph', ctx, mockRefresh)

            const targetSelect = container.querySelector(
                '#details-add-exit-target'
            ) as HTMLSelectElement
            const nameInput = container.querySelector('#details-add-exit-name') as HTMLInputElement
            const submitBtn = container.querySelector('#btn-submit-add-exit') as HTMLButtonElement

            targetSelect.value = 'p_2'
            nameInput.value = 'Walk North'
            submitBtn.click()

            expect(mockVm.graph.createChoice).toHaveBeenCalledWith(
                p1,
                p2,
                'Walk North',
                expect.any(String),
                ''
            )
            expect(mockRefresh).toHaveBeenCalled()
        })

        it('updates exit choice name on input and blur', () => {
            const p1 = new Paragraph('p_1', 'Origin')
            const mockChoice = {
                getId: (): string => 'ch_1',
                getName: (): string => 'Door A',
                getToParagraphId: (): string => 'p_2',
            }
            ;(p1 as unknown as { getChoices: () => unknown[] }).getChoices = (): unknown[] => [
                mockChoice,
            ]

            const mockVm = {
                graph: {
                    updateChoiceDetails: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectParagraphs: [p1],
                renderConnectionsList: vi.fn(),
            }

            renderExitsModule(container, p1, 'paragraph', ctx)
            const input = container.querySelector('.exit-name-input') as HTMLInputElement
            expect(input.value).toBe('Door A')

            input.value = 'Door B'
            input.dispatchEvent(new Event('input'))
            expect(mockVm.graph.updateChoiceDetails).toHaveBeenCalledWith(mockChoice, 'Door B')
        })

        it('updates target node on select change', () => {
            const p1 = new Paragraph('p_1', 'Origin')
            const mockSetTo = vi.fn()
            const mockChoice = {
                getId: (): string => 'ch_1',
                getName: (): string => 'Passage',
                getToParagraphId: (): string => 'p_2',
                setToParagraphId: mockSetTo,
            }
            ;(p1 as unknown as { getChoices: () => unknown[] }).getChoices = (): unknown[] => [
                mockChoice,
            ]

            const mockRefresh = vi.fn()
            const ctx = {
                projectParagraphs: [
                    p1,
                    { getId: (): string => 'p_3', getTitle: (): string => 'Castle' },
                ],
                renderConnectionsList: vi.fn(),
            }

            renderExitsModule(container, p1, 'paragraph', ctx, mockRefresh)
            const select = container.querySelector('.exit-target-select') as HTMLSelectElement
            select.value = 'p_3'
            select.dispatchEvent(new Event('change'))

            expect(mockSetTo).toHaveBeenCalledWith('p_3')
            expect(mockRefresh).toHaveBeenCalled()
        })

        it('inspects choice when clicking inspect button', () => {
            const p1 = new Paragraph('p_1', 'Origin')
            const mockChoice = {
                getId: (): string => 'ch_1',
                getName: (): string => 'Passage',
                getToParagraphId: (): string => 'p_2',
            }
            ;(p1 as unknown as { getChoices: () => unknown[] }).getChoices = (): unknown[] => [
                mockChoice,
            ]

            const mockSelectEntity = vi.fn()
            const ctx = {
                projectParagraphs: [p1],
                selectEntity: mockSelectEntity,
            }

            renderExitsModule(container, p1, 'paragraph', ctx)
            const inspectBtn = container.querySelector('.btn-inspect-exit') as HTMLButtonElement
            inspectBtn.click()

            expect(mockSelectEntity).toHaveBeenCalledWith(mockChoice, 'choice', p1)
        })

        it('deletes choice when confirmed', () => {
            const p1 = new Paragraph('p_1', 'Origin')
            const mockChoice = {
                getId: (): string => 'ch_1',
                getName: (): string => 'Passage',
                getToParagraphId: (): string => 'p_2',
            }
            ;(p1 as unknown as { getChoices: () => unknown[] }).getChoices = (): unknown[] => [
                mockChoice,
            ]

            const mockVm = {
                selection: {
                    getHistory: (): unknown[] => [],
                    getSelectedItem: (): unknown => null,
                },
                graph: {
                    deleteChoice: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectParagraphs: [p1],
                renderConnectionsList: vi.fn(),
                renderParagraphsList: vi.fn(),
            }

            vi.spyOn(window, 'confirm').mockReturnValue(true)

            renderExitsModule(container, p1, 'paragraph', ctx)
            const deleteBtn = container.querySelector('.btn-delete-exit') as HTMLButtonElement
            deleteBtn.click()

            expect(mockVm.graph.deleteChoice).toHaveBeenCalledWith('ch_1', [p1])
        })
    })

    describe('Quick Actions Module', () => {
        it('renders quick actions template with icon and title', () => {
            const html = renderQuickActionsModuleHtml()
            expect(html).toContain(translate('right_panel.quick_actions'))
            expect(html).toContain(translate('right_panel.show_story_graph'))
            expect(html).toContain('btn-details-show-graph')
            expect(html).toContain('<svg')
        })

        it('handles null container gracefully in renderQuickActionsModule', () => {
            expect(() => renderQuickActionsModule(null, {}, 'paragraph', {})).not.toThrow()
        })

        it('clicking show graph button switches view and focuses on canvas element', () => {
            const mockVm = {
                layout: {
                    setActiveMainView: vi.fn(),
                },
            }
            const mockUpdateUI = vi.fn()
            const mockFocus = vi.fn()
            const ctx = {
                vm: mockVm,
                updateMainWorkspaceUI: mockUpdateUI,
                storyGraphInstance: { focusOnElement: mockFocus },
            }

            renderQuickActionsModule(container, { id: 'para_1' }, 'paragraph', ctx)
            const btn = container.querySelector('#btn-details-show-graph') as HTMLButtonElement
            btn.click()

            expect(mockVm.layout.setActiveMainView).toHaveBeenCalledWith('graph')
            expect(mockUpdateUI).toHaveBeenCalled()
            expect(mockFocus).toHaveBeenCalledWith('para_1')
        })
    })

    describe('Multilingual i18n support', () => {
        it('renders proper translations in PL, EN, and DE', () => {
            initTranslationsWithLocale('pl')
            expect(renderExitsModuleHeaderHtml(0)).toContain('Wyjścia / Przeskoki z paragrafu')
            expect(renderEmptyExitsHtml()).toContain('Brak zdefiniowanych wyjść z tego paragrafu')
            expect(renderQuickActionsModuleHtml()).toContain('Szybkie akcje')

            initTranslationsWithLocale('de')
            expect(renderExitsModuleHeaderHtml(0)).toContain('Ausgänge / Sprünge des Absatzes')
            expect(renderEmptyExitsHtml()).toContain(
                'Keine Ausgänge für diesen Absatz konfiguriert'
            )
            expect(renderQuickActionsModuleHtml()).toContain('Schnellaktionen')
        })
    })
})
