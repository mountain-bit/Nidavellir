// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import { renderDetailsPanel } from '../../View/ui/detailsPanel/detailsPanel.js'
import { renderItemsModule } from '../../View/ui/detailsPanel/modules/itemsModule.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectParagraphs: Paragraph[]
    projectScenes: unknown[]
    projectCharacters: unknown[]
    projectLocations: unknown[]
    projectItems: Item[]
    projectTags: Tag[]
    selectEntity: (item: unknown, type: string) => void
    refreshActiveSection: (type: string) => void
    renderDetailsPanel?: (ctx: unknown) => void
    markDirty?: () => void
    storyGraphInstance: { render: (force: boolean) => void; focusOnElement: (id: string) => void }
}

describe('DetailsPanel - Items Module in Paragraph (Stage 2)', () => {
    let vm: MainWindowViewModel
    let ctx: IMockAppContext
    let detailsContent: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = `
            <div id="history-tabs-container"></div>
            <div id="details-content"></div>
        `

        detailsContent = document.getElementById('details-content')!
        vm = new MainWindowViewModel()

        ctx = {
            vm,
            projectParagraphs: [],
            projectScenes: [],
            projectCharacters: [],
            projectLocations: [],
            projectItems: [],
            projectTags: [],
            selectEntity: vi.fn(),
            refreshActiveSection: vi.fn(),
            markDirty: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
                focusOnElement: vi.fn(),
            },
        }
    })

    it('does not render items module for START node', () => {
        const startP = new Paragraph('start', 'START')
        startP.setIsStart(true)

        renderItemsModule(detailsContent, startP, 'paragraph', ctx)
        expect(detailsContent.innerHTML).toBe('')
    })

    it('renders empty items state when paragraph has no item actions', () => {
        const p = new Paragraph('p_empty', 'Pusty Skarbiec')
        renderItemsModule(detailsContent, p, 'paragraph', ctx)

        expect(detailsContent.textContent).toContain('Przedmioty')
        expect(detailsContent.textContent).toContain('Brak powiązanych przedmiotów')
    })

    it('renders existing item actions with badges, tags, and modifiers', () => {
        const p = new Paragraph('p_armory', 'Zbrojownia')
        const sword = new Item(
            'it_sword',
            'Miecz Płomienia',
            new Description(),
            [new Tag('tag_w', 'Broń', '#ef4444')],
            [
                {
                    id: 'mod_str',
                    targetType: 'stat',
                    targetName: 'Siła',
                    value: 4,
                    operator: '+',
                },
            ],
            { slotSize: 2 }
        )
        ctx.projectItems.push(sword)

        p.addItemAction({
            id: 'act_1',
            itemId: 'it_sword',
            itemName: 'Miecz Płomienia',
            action: 'give',
            quantity: 1,
        })
        p.addItemAction({
            id: 'act_2',
            itemId: 'it_key',
            itemName: 'Złoty Klucz',
            action: 'require',
            quantity: 1,
        })

        renderItemsModule(detailsContent, p, 'paragraph', ctx)

        expect(detailsContent.textContent).toContain('Przedmioty')
        expect(detailsContent.textContent).toContain('Miecz Płomienia')
        expect(detailsContent.textContent).toContain('Złoty Klucz')
        expect(detailsContent.textContent).toContain('give')
        expect(detailsContent.textContent).toContain('require')
        expect(detailsContent.textContent).toContain('2 sloty')
        expect(detailsContent.textContent).toContain('Broń')
        expect(detailsContent.textContent).toContain('Siła: +4')
    })

    it('clicking item name triggers selectEntity on ctx', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        const potion = new Item('it_pot', 'Mikstura Zdrowia')
        ctx.projectItems.push(potion)

        p.addItemAction({
            itemId: 'it_pot',
            itemName: 'Mikstura Zdrowia',
            action: 'give',
            quantity: 2,
        })

        renderItemsModule(detailsContent, p, 'paragraph', ctx)

        const inspectBtn = detailsContent.querySelector('.btn-inspect-item') as HTMLElement
        expect(inspectBtn).not.toBeNull()
        inspectBtn.click()

        expect(ctx.selectEntity).toHaveBeenCalledWith(potion, 'item')
    })

    it('clicking remove button removes item action from paragraph', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        p.addItemAction({
            id: 'act_del',
            itemId: 'it_torch',
            itemName: 'Pochodnia',
            action: 'give',
        })

        const onRefresh = vi.fn()
        renderItemsModule(detailsContent, p, 'paragraph', ctx, onRefresh)

        expect(p.getItemActions().length).toBe(1)
        const removeBtn = detailsContent.querySelector('.btn-remove-item') as HTMLElement
        expect(removeBtn).not.toBeNull()

        removeBtn.click()
        expect(p.getItemActions().length).toBe(0)
        expect(ctx.markDirty).toHaveBeenCalled()
        expect(onRefresh).toHaveBeenCalled()
    })

    it('changing action select updates item action type and marks dirty', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        p.addItemAction({
            id: 'act_change',
            itemId: 'it_rope',
            itemName: 'Lina',
            action: 'give',
        })

        const onRefresh = vi.fn()
        renderItemsModule(detailsContent, p, 'paragraph', ctx, onRefresh)

        const selAction = detailsContent.querySelector('.select-item-action') as HTMLSelectElement
        expect(selAction).not.toBeNull()
        expect(selAction.value).toBe('give')

        selAction.value = 'remove'
        selAction.dispatchEvent(new Event('change'))

        expect(p.getItemActions()[0].action).toBe('remove')
        expect(ctx.markDirty).toHaveBeenCalled()
        expect(onRefresh).toHaveBeenCalled()
    })

    it('changing quantity input updates item action quantity', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        p.addItemAction({
            id: 'act_qty',
            itemId: 'it_coin',
            itemName: 'Złote Monety',
            action: 'give',
            quantity: 10,
        })

        renderItemsModule(detailsContent, p, 'paragraph', ctx)

        const inputQty = detailsContent.querySelector('.input-item-quantity') as HTMLInputElement
        expect(inputQty.value).toBe('10')

        inputQty.value = '50'
        inputQty.dispatchEvent(new Event('change'))

        expect(p.getItemActions()[0].quantity).toBe(50)
        expect(ctx.markDirty).toHaveBeenCalled()
    })

    it('adds existing item action via dropdown and add button', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        const bow = new Item('it_bow', 'Długi Łuk', new Description(), [], [], {
            category: 'weapon',
        })
        ctx.projectItems.push(bow)

        const onRefresh = vi.fn()
        renderItemsModule(detailsContent, p, 'paragraph', ctx, onRefresh)

        const selectEl = detailsContent.querySelector(
            '#details-add-item-select'
        ) as HTMLSelectElement
        const actionSelect = detailsContent.querySelector(
            '#details-add-item-action-select'
        ) as HTMLSelectElement
        const addBtn = detailsContent.querySelector('#btn-details-add-item') as HTMLElement

        selectEl.value = 'it_bow'
        actionSelect.value = 'require'
        addBtn.click()

        expect(p.getItemActions().length).toBe(1)
        expect(p.getItemActions()[0].itemId).toBe('it_bow')
        expect(p.getItemActions()[0].itemName).toBe('Długi Łuk')
        expect(p.getItemActions()[0].action).toBe('require')
        expect(ctx.markDirty).toHaveBeenCalled()
        expect(onRefresh).toHaveBeenCalled()
    })

    it('creates brand new item inline and attaches it to paragraph', () => {
        const p = new Paragraph('p_1', 'Paragraf')
        const onRefresh = vi.fn()
        renderItemsModule(detailsContent, p, 'paragraph', ctx, onRefresh)

        // Mock window.prompt
        const originalPrompt = window.prompt
        window.prompt = vi.fn().mockReturnValue('Kryształ Życia')

        const createNewBtn = detailsContent.querySelector(
            '#btn-details-create-new-item'
        ) as HTMLElement
        createNewBtn.click()

        expect(ctx.projectItems.length).toBe(1)
        expect(ctx.projectItems[0].getName()).toBe('Kryształ Życia')
        expect(p.getItemActions().length).toBe(1)
        expect(p.getItemActions()[0].itemName).toBe('Kryształ Życia')
        expect(ctx.markDirty).toHaveBeenCalled()
        expect(onRefresh).toHaveBeenCalled()

        window.prompt = originalPrompt
    })

    it('renders inside renderDetailsPanel when paragraph is selected', () => {
        const p = new Paragraph('p_main', 'Główna Komnata')
        p.addItemAction({
            itemId: 'it_chalice',
            itemName: 'Złoty Kielich',
            action: 'give',
        })
        ctx.projectParagraphs.push(p)
        vm.selectElement(p, 'paragraph')

        renderDetailsPanel(ctx)

        expect(detailsContent.textContent).toContain('Przedmioty')
        expect(detailsContent.textContent).toContain('Złoty Kielich')
    })
})
