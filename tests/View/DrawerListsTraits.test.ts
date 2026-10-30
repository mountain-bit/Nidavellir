// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { renderTraitsList } from '../../View/ui/drawer/drawerLists.js'
import { setupSectionControlsAndContextMenu } from '../../View/ui/workspace/contextMenu.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectStats: Stat[]
    projectParameters: Parameter[]
    projectSkills: Skill[]
    projectFeatures: Feature[]
    selectEntity: (item: unknown, type: string) => void
    openContextMenu: (x: number, y: number, data: unknown) => void
    renderTraitsList: () => void
    refreshActiveSection: (type: string) => void
}

describe('DrawerLists - Traits & Attributes (4 RPG categories)', () => {
    let vm: MainWindowViewModel
    let ctx: IMockAppContext
    let container: HTMLElement

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="left-content-traits">
                <button id="add-trait-btn"></button>
                <input type="text" id="trait-search-input" />
                <div id="trait-create-form" class="hidden">
                    <select id="trait-create-type">
                        <option value="stat" selected>Cecha</option>
                        <option value="parameter">Parametr</option>
                        <option value="skill">Umiejętność</option>
                        <option value="feature">Przymiot</option>
                    </select>
                    <input type="text" id="trait-create-name" />
                    <input type="text" id="trait-create-value" />
                    <button id="trait-create-cancel"></button>
                    <button id="trait-create-submit"></button>
                </div>
                <div id="traits-list-container"></div>
            </div>
            <div id="drawer-context-menu" class="hidden">
                <button id="ctx-delete"></button>
            </div>
        `

        container = document.getElementById('traits-list-container')!
        vm = new MainWindowViewModel()

        ctx = {
            vm,
            projectStats: [],
            projectParameters: [],
            projectSkills: [],
            projectFeatures: [],
            selectEntity: vi.fn(),
            openContextMenu: vi.fn(),
            renderTraitsList: vi.fn(() => renderTraitsList(ctx)),
            refreshActiveSection: vi.fn(),
        }
    })

    describe('renderTraitsList empty state', () => {
        it('should display empty message when no stats, parameters, skills or features exist', () => {
            renderTraitsList(ctx)

            expect(container.innerHTML).toContain('data-i18n="left_panel.no_traits"')
            expect(container.querySelectorAll('.drawer-item')).toHaveLength(0)
        })
    })

    describe('renderTraitsList with 4 categories', () => {
        beforeEach(() => {
            ctx.projectStats = [
                new Stat('stat-1', 'Siła', new Description(), '12'),
                new Stat('stat-2', 'Zręczność', new Description(), '14'),
            ]
            ctx.projectParameters = [
                new Parameter('param-1', 'Punkty Życia', new Description(), 'direct', 100),
                new Parameter('param-2', 'Mana', new Description(), 'formula', 0, 'Siła * 2'),
            ]
            ctx.projectSkills = [
                new Skill('skill-1', 'Walka mieczem', new Description(), 'direct', '+3'),
                new Skill(
                    'skill-2',
                    'Akrobatyka',
                    new Description(),
                    'stat_mod',
                    '+0',
                    'Zręczność',
                    '+2'
                ),
            ]
            ctx.projectFeatures = [
                new Feature(
                    'feat-1',
                    'Widzenie w ciemności',
                    new Description('Widzi w mroku do 20m')
                ),
            ]
        })

        it('should render all 4 categories with distinct icons, headers, and counts', () => {
            renderTraitsList(ctx)

            const items = container.querySelectorAll('.drawer-item')
            expect(items).toHaveLength(7)

            const statItems = container.querySelectorAll('.drawer-item[data-item-type="stat"]')
            expect(statItems).toHaveLength(2)

            const paramItems = container.querySelectorAll(
                '.drawer-item[data-item-type="parameter"]'
            )
            expect(paramItems).toHaveLength(2)

            const skillItems = container.querySelectorAll('.drawer-item[data-item-type="skill"]')
            expect(skillItems).toHaveLength(2)

            const featureItems = container.querySelectorAll(
                '.drawer-item[data-item-type="feature"]'
            )
            expect(featureItems).toHaveLength(1)
        })

        it('should render parameter badges correctly for direct value and formula', () => {
            renderTraitsList(ctx)

            const param1 = container.querySelector(
                '.drawer-item[data-item-id="param-1"]'
            ) as HTMLElement
            expect(param1.textContent).toContain('Punkty Życia')
            expect(param1.textContent).toContain('100')

            const param2 = container.querySelector(
                '.drawer-item[data-item-id="param-2"]'
            ) as HTMLElement
            expect(param2.textContent).toContain('Mana')
            expect(param2.textContent).toContain('= Siła * 2')
        })

        it('should render skill badges correctly for direct value and stat modifier', () => {
            renderTraitsList(ctx)

            const skill1 = container.querySelector(
                '.drawer-item[data-item-id="skill-1"]'
            ) as HTMLElement
            expect(skill1.textContent).toContain('Walka mieczem')
            expect(skill1.textContent).toContain('+3')

            const skill2 = container.querySelector(
                '.drawer-item[data-item-id="skill-2"]'
            ) as HTMLElement
            expect(skill2.textContent).toContain('Akrobatyka')
            expect(skill2.textContent).toContain('Zręczność +2')
        })

        it('should attach drag and drop metadata to drawer items', () => {
            renderTraitsList(ctx)

            const item = container.querySelector(
                '.drawer-item[data-item-id="param-1"]'
            ) as HTMLElement
            expect(item).not.toBeNull()

            const dataTransferMap: Record<string, string> = {}
            const dragEvent = new Event('dragstart', { bubbles: true }) as Event & {
                dataTransfer: {
                    setData: (key: string, val: string) => void
                    effectAllowed: string
                }
            }
            dragEvent.dataTransfer = {
                setData: (key: string, val: string): void => {
                    dataTransferMap[key] = val
                },
                effectAllowed: '',
            }

            item.dispatchEvent(dragEvent)

            expect(dataTransferMap['text/plain']).toBe('param-1')
            expect(dataTransferMap['application/x-entity-type']).toBe('parameter')
            expect(dataTransferMap['application/x-entity-id']).toBe('param-1')
            expect(dataTransferMap['application/x-parameter-id']).toBe('param-1')
        })

        it('should trigger selectEntity with correct entity and type on double-click', () => {
            renderTraitsList(ctx)

            const skillItem = container.querySelector(
                '.drawer-item[data-item-id="skill-1"]'
            ) as HTMLElement
            skillItem.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

            expect(ctx.selectEntity).toHaveBeenCalledWith(ctx.projectSkills[0], 'skill')

            const statItem = container.querySelector(
                '.drawer-item[data-item-id="stat-2"]'
            ) as HTMLElement
            statItem.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

            expect(ctx.selectEntity).toHaveBeenCalledWith(ctx.projectStats[1], 'stat')
        })

        it('should open context menu with proper item type on right-click', () => {
            renderTraitsList(ctx)

            const featItem = container.querySelector(
                '.drawer-item[data-item-id="feat-1"]'
            ) as HTMLElement
            featItem.dispatchEvent(
                new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 150 })
            )

            expect(ctx.openContextMenu).toHaveBeenCalledWith(
                100,
                150,
                expect.objectContaining({
                    type: 'feature',
                    id: 'feat-1',
                    name: 'Widzenie w ciemności',
                    item: ctx.projectFeatures[0],
                })
            )
        })

        it('should filter items across categories according to search query', () => {
            // Set query matching 'Akrobatyka' and 'Zręczność'
            vm.filter.setStatSearchQuery('Zręcz')
            vm.filter.setParameterSearchQuery('Zręcz')
            vm.filter.setSkillSearchQuery('Zręcz')
            vm.filter.setFeatureSearchQuery('Zręcz')

            renderTraitsList(ctx)

            const visibleItems = container.querySelectorAll('.drawer-item')
            expect(visibleItems).toHaveLength(1)
            expect(visibleItems[0].getAttribute('data-item-id')).toBe('stat-2')
        })
    })

    describe('setupSectionControlsAndContextMenu - Trait creation & deletion', () => {
        beforeEach(() => {
            setupSectionControlsAndContextMenu(ctx)
        })

        it('should create a Parameter when type is parameter', async () => {
            const typeSelect = document.getElementById('trait-create-type') as HTMLSelectElement
            const nameInput = document.getElementById('trait-create-name') as HTMLInputElement
            const valInput = document.getElementById('trait-create-value') as HTMLInputElement
            const submitBtn = document.getElementById('trait-create-submit') as HTMLButtonElement

            typeSelect.value = 'parameter'
            nameInput.value = 'Energia'
            valInput.value = '50'

            submitBtn.click()

            expect(ctx.projectParameters).toHaveLength(1)
            const param = ctx.projectParameters[0]
            expect(param.getName()).toBe('Energia')
            expect(param.getValue()).toBe('50')
            expect(param.getMode()).toBe('direct')
            expect(ctx.renderTraitsList).toHaveBeenCalled()
        })

        it('should create a Parameter with formula mode when value contains mathematical operator', async () => {
            const typeSelect = document.getElementById('trait-create-type') as HTMLSelectElement
            const nameInput = document.getElementById('trait-create-name') as HTMLInputElement
            const valInput = document.getElementById('trait-create-value') as HTMLInputElement
            const submitBtn = document.getElementById('trait-create-submit') as HTMLButtonElement

            typeSelect.value = 'parameter'
            nameInput.value = 'Maksymalny Udźwig'
            valInput.value = 'Siła * 10'

            submitBtn.click()

            expect(ctx.projectParameters).toHaveLength(1)
            const param = ctx.projectParameters[0]
            expect(param.getName()).toBe('Maksymalny Udźwig')
            expect(param.getMode()).toBe('formula')
            expect(param.getFormula()).toBe('Siła * 10')
        })

        it('should create a Skill when type is skill', async () => {
            const typeSelect = document.getElementById('trait-create-type') as HTMLSelectElement
            const nameInput = document.getElementById('trait-create-name') as HTMLInputElement
            const valInput = document.getElementById('trait-create-value') as HTMLInputElement
            const submitBtn = document.getElementById('trait-create-submit') as HTMLButtonElement

            typeSelect.value = 'skill'
            nameInput.value = 'Skradanie'
            valInput.value = '+2'

            submitBtn.click()

            expect(ctx.projectSkills).toHaveLength(1)
            const skill = ctx.projectSkills[0]
            expect(skill.getName()).toBe('Skradanie')
            expect(skill.getValue()).toBe('+2')
            expect(ctx.renderTraitsList).toHaveBeenCalled()
        })

        it('should create a Feature when type is feature', async () => {
            const typeSelect = document.getElementById('trait-create-type') as HTMLSelectElement
            const nameInput = document.getElementById('trait-create-name') as HTMLInputElement
            const valInput = document.getElementById('trait-create-value') as HTMLInputElement
            const submitBtn = document.getElementById('trait-create-submit') as HTMLButtonElement

            typeSelect.value = 'feature'
            nameInput.value = 'Nocny łowca'
            valInput.value = 'Premia do zmysłów w nocy'

            submitBtn.click()

            expect(ctx.projectFeatures).toHaveLength(1)
            const feature = ctx.projectFeatures[0]
            expect(feature.getName()).toBe('Nocny łowca')
            expect(feature.getDescription().getText()).toBe('Premia do zmysłów w nocy')
            expect(ctx.renderTraitsList).toHaveBeenCalled()
        })

        it('should create a Stat when type is stat', async () => {
            const typeSelect = document.getElementById('trait-create-type') as HTMLSelectElement
            const nameInput = document.getElementById('trait-create-name') as HTMLInputElement
            const valInput = document.getElementById('trait-create-value') as HTMLInputElement
            const submitBtn = document.getElementById('trait-create-submit') as HTMLButtonElement

            typeSelect.value = 'stat'
            nameInput.value = 'Wytrzymałość'
            valInput.value = '15'

            submitBtn.click()

            expect(ctx.projectStats).toHaveLength(1)
            const stat = ctx.projectStats[0]
            expect(stat.getName()).toBe('Wytrzymałość')
            expect(stat.getValue()).toBe('15')
            expect(ctx.renderTraitsList).toHaveBeenCalled()
        })
    })
})
