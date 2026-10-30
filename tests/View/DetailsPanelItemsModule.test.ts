// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { renderDetailsPanel } from '../../View/ui/detailsPanel/detailsPanel.js'
import {
    findProjectItem,
    getActionDisplayInfo,
    renderAddItemBarHtml,
    renderEmptyItemsHtml,
    renderItemActionCardHtml,
    renderItemActionSelectOptionsHtml,
    renderItemCardModifiersHtml,
    renderItemCardTagsHtml,
    renderItemSlotSizeBadgeHtml,
    renderItemsModule,
    renderItemsModuleHeaderHtml,
    renderProjectItemOptionsHtml,
} from '../../View/ui/detailsPanel/modules/itemsModule.js'
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
        vm.selection.selectElement(p, 'paragraph')

        renderDetailsPanel(ctx)

        expect(detailsContent.textContent).toContain('Przedmioty')
        expect(detailsContent.textContent).toContain('Złoty Kielich')
    })

    describe('ItemsModule Template Helpers and Functions', () => {
        it('getActionDisplayInfo returns appropriate label and styling', () => {
            expect(getActionDisplayInfo('require').badgeClass).toContain('amber')
            expect(getActionDisplayInfo('remove').badgeClass).toContain('rose')
            expect(getActionDisplayInfo('give').badgeClass).toContain('emerald')
            expect(getActionDisplayInfo('unknown').badgeClass).toContain('emerald')
        })

        it('findProjectItem locates items by ID or name', () => {
            const item1 = new Item('it_1', 'Miecz')
            const item2 = new Item('it_2', 'Tarcza')
            const list = [item1, item2]

            expect(findProjectItem(list, 'it_1')).toBe(item1)
            expect(findProjectItem(list, 'Tarcza')).toBe(item2)
            expect(findProjectItem(list, 'it_missing')).toBeNull()
            expect(findProjectItem([], '')).toBeNull()
        })

        it('renderItemsModuleHeaderHtml renders header and count', () => {
            const html = renderItemsModuleHeaderHtml(3)
            expect(html).toContain('Przedmioty')
            expect(html).toContain('>3<')
            expect(html).toContain('<svg')

            expect(renderItemsModuleHeaderHtml(-1)).toContain('>0<')
        })

        it('renderEmptyItemsHtml renders empty message', () => {
            const html = renderEmptyItemsHtml()
            expect(html).toContain('Brak powiązanych przedmiotów')
            expect(html).toContain('italic')
        })

        it('renderItemActionSelectOptionsHtml renders all 3 action options', () => {
            const html = renderItemActionSelectOptionsHtml('require')
            expect(html).toContain('value="give"')
            expect(html).toContain('value="require" selected')
            expect(html).toContain('value="remove"')
        })

        it('renderProjectItemOptionsHtml renders select options with category', () => {
            const item = new Item('it_pot', 'Mikstura', new Description(), [], [], {
                category: 'potion',
            })
            const html = renderProjectItemOptionsHtml([item])
            expect(html).toContain('value="it_pot"')
            expect(html).toContain('Mikstura (potion)')
        })

        it('renderItemCardTagsHtml and renderItemCardModifiersHtml render badges', () => {
            const tag = new Tag('tag_q', 'Fabularny', '#ff0000')
            const tagsHtml = renderItemCardTagsHtml([tag])
            expect(tagsHtml).toContain('Fabularny')
            expect(tagsHtml).toContain('#ff0000')

            const mod = {
                id: 'mod_1',
                targetType: 'stat',
                targetName: 'Siła',
                value: 3,
                operator: '+',
            }
            const modsHtml = renderItemCardModifiersHtml([mod])
            expect(modsHtml).toContain('Siła: +3')
        })

        it('renderItemSlotSizeBadgeHtml renders badge only when slotSize > 1', () => {
            expect(renderItemSlotSizeBadgeHtml(1)).toBe('')
            expect(renderItemSlotSizeBadgeHtml(0)).toBe('')
            const badge = renderItemSlotSizeBadgeHtml(3)
            expect(badge).toContain('3')
            expect(badge).toContain('sloty')
        })

        it('renderItemActionCardHtml renders card with escaped values and accessibility attributes', () => {
            const action = {
                id: 'act_x',
                itemId: 'it_test',
                itemName: '<Danger>&Item',
                action: 'give',
                quantity: 2,
            }
            const html = renderItemActionCardHtml(action, null, 0)
            expect(html).toContain('&lt;Danger&gt;&amp;Item')
            expect(html).toContain('data-action-index="0"')
            expect(html).toContain('btn-remove-item')
            expect(html).toContain('value="2"')
        })

        it('renderAddItemBarHtml renders create and add buttons with icons', () => {
            const html = renderAddItemBarHtml([])
            expect(html).toContain('details-add-item-select')
            expect(html).toContain('btn-details-create-new-item')
            expect(html).toContain('btn-details-add-item')
            expect(html).toContain('<svg')
        })
    })

    describe('ItemsModule Internationalization (i18n)', () => {
        it('renders item templates in English correctly', async () => {
            await initTranslationsWithLocale('en')
            const header = renderItemsModuleHeaderHtml(2)
            expect(header).toContain('Items')

            const empty = renderEmptyItemsHtml()
            expect(empty).toContain('No associated items')

            const slot = renderItemSlotSizeBadgeHtml(2)
            expect(slot).toContain('slots')
        })

        it('renders item templates in German correctly', async () => {
            await initTranslationsWithLocale('de')
            const header = renderItemsModuleHeaderHtml(1)
            expect(header).toContain('Gegenstände')

            const empty = renderEmptyItemsHtml()
            expect(empty).toContain('Keine zugewiesenen Gegenstände')

            const slot = renderItemSlotSizeBadgeHtml(2)
            expect(slot).toContain('Slots')
        })
    })
})
