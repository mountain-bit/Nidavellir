// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Tag } from '../../Model/Tag'
import { renderItemsList } from '../../View/ui/drawer/drawerLists.js'
import { setupSectionControlsAndContextMenu } from '../../View/ui/workspace/contextMenu.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectItems: Item[]
    projectTags: Tag[]
    selectEntity: (item: unknown, type: string) => void
    openContextMenu: (x: number, y: number, data: unknown) => void
    renderItemsList: () => void
    refreshActiveSection: (type: string) => void
}

describe('DrawerLists - Items & Inventory tab', () => {
    let vm: MainWindowViewModel
    let ctx: IMockAppContext
    let container: HTMLElement

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="left-content-items">
                <button id="btn-add-item"></button>
                <input type="text" id="item-search-input" />
                <div id="item-create-form" class="hidden">
                    <input type="text" id="item-create-name" />
                    <button id="item-create-cancel"></button>
                    <button id="item-create-submit"></button>
                </div>
                <div id="items-list-container"></div>
            </div>
            <div id="custom-context-menu" class="hidden">
                <button id="ctx-delete"></button>
                <div id="ctx-add-tag-group" class="hidden">
                    <button id="ctx-add-tag-toggle"></button>
                    <div id="ctx-add-tag-list" class="hidden"></div>
                </div>
            </div>
        `

        container = document.getElementById('items-list-container')!
        vm = new MainWindowViewModel()

        ctx = {
            vm,
            projectItems: [],
            projectTags: [],
            selectEntity: vi.fn(),
            openContextMenu: vi.fn(),
            renderItemsList: (): void => renderItemsList(ctx),
            refreshActiveSection: vi.fn(),
        }
    })

    it('renders empty message when no items in project', () => {
        renderItemsList(ctx)
        expect(container.innerHTML).toContain('data-i18n="left_panel.no_items"')
    })

    it('renders items with category badge, modifiers, tags, and start inventory indicator', () => {
        const item1 = new Item(
            'item_1',
            'Miecz ze stali',
            new Description('Ostry miecz stalowy'),
            [new Tag('tag_1', 'Rzadki', '#eab308')],
            [
                {
                    id: 'mod_1',
                    targetType: 'stat',
                    targetName: 'Siła',
                    value: '+3',
                },
            ],
            { category: 'weapon', inStartingInventory: true }
        )

        const item2 = new Item(
            'item_2',
            'Mikstura leczenia',
            new Description('Przywraca siły'),
            [],
            [],
            { category: 'consumable', inStartingInventory: false }
        )

        ctx.projectItems = [item1, item2]
        renderItemsList(ctx)

        const cards = container.querySelectorAll('.drawer-item[data-item-type="item"]')
        expect(cards.length).toBe(2)

        // Item 1 verification
        const card1 = cards[0]
        expect(card1.getAttribute('data-item-id')).toBe('item_1')
        expect(card1.textContent).toContain('Miecz ze stali')
        expect(card1.textContent).toContain('weapon')
        expect(card1.textContent).toContain('START')
        expect(card1.textContent).toContain('+1 mod')
        expect(card1.textContent).toContain('Rzadki')

        // Item 2 verification
        const card2 = cards[1]
        expect(card2.getAttribute('data-item-id')).toBe('item_2')
        expect(card2.textContent).toContain('Mikstura leczenia')
        expect(card2.textContent).toContain('consumable')
        expect(card2.textContent).not.toContain('START')
    })

    it('filters items when search query is set in ViewModel', () => {
        const item1 = new Item('item_1', 'Żelazny topór')
        const item2 = new Item('item_2', 'Drewniana tarcza')
        ctx.projectItems = [item1, item2]

        vm.filter.setItemSearchQuery('topór')
        renderItemsList(ctx)

        const cards = container.querySelectorAll('.drawer-item[data-item-type="item"]')
        expect(cards.length).toBe(1)
        expect(cards[0].textContent).toContain('Żelazny topór')
    })

    it('invokes selectEntity on item click and dblclick', () => {
        const item = new Item('item_1', 'Amulet ognia')
        ctx.projectItems = [item]
        renderItemsList(ctx)

        const card = container.querySelector('.drawer-item[data-item-type="item"]') as HTMLElement
        expect(card).not.toBeNull()

        card.click()
        expect(ctx.selectEntity).toHaveBeenCalledWith(item, 'item')

        card.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        expect(ctx.selectEntity).toHaveBeenCalledTimes(2)
    })

    it('supports creation of a new item via drawer creation form', async () => {
        setupSectionControlsAndContextMenu(ctx)

        const addBtn = document.getElementById('btn-add-item')!
        const form = document.getElementById('item-create-form')!
        const input = document.getElementById('item-create-name') as HTMLInputElement
        const submitBtn = document.getElementById('item-create-submit')!

        addBtn.click()
        expect(form.classList.contains('hidden')).toBe(false)

        input.value = 'Magiczny pierścień'
        submitBtn.click()

        expect(ctx.projectItems.length).toBe(1)
        expect(ctx.projectItems[0].getName()).toBe('Magiczny pierścień')
        expect(form.classList.contains('hidden')).toBe(true)
    })
})
