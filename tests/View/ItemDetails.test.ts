// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Inventory } from '../../Model/Inventory'
import { Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { Tag } from '../../Model/Tag'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import { renderDetailsPanel } from '../../View/ui/detailsPanel/detailsPanel.js'
import { renderHeroReadOnlyDetails } from '../../View/ui/detailsPanel/heroReadOnlyDetails.js'
import { renderItemDetails } from '../../View/ui/detailsPanel/itemDetails.js'
import { type IIdentifiableEntity, MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectParagraphs: Paragraph[]
    projectScenes: unknown[]
    projectCharacters: unknown[]
    projectLocations: unknown[]
    projectItems: Item[]
    projectTags: Tag[]
    playerCharacter: PlayerCharacter
    projectPlayerCharacter: PlayerCharacter
    selectEntity: (item: unknown, type: string) => void
    refreshActiveSection: (type: string) => void
    renderDetailsPanel?: (ctx: unknown) => void
    markDirty?: () => void
    storyGraphInstance: { render: (force: boolean) => void; focusOnElement: (id: string) => void }
    files: Record<string, string>
    updateMainWorkspaceUI: () => void
}

describe('Item Details Inspector & Inventory Correlation (Stage 3)', () => {
    let vm: MainWindowViewModel
    let ctx: IMockAppContext
    let detailsContent: HTMLElement
    let hero: PlayerCharacter

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = `
            <div id="history-tabs-container"></div>
            <div id="details-content"></div>
        `

        detailsContent = document.getElementById('details-content')!
        vm = new MainWindowViewModel()

        hero = new PlayerCharacter(
            'hero_1',
            'Alchemik Geralt',
            new Description('Doświadczony wiedźmin i alchemik'),
            [],
            [],
            [],
            [],
            null,
            'warrior',
            [],
            [],
            [],
            [
                new Inventory('inv_main', 'Torba podróżna', 10),
                new Inventory('inv_belt', 'Pasek na eliksiry', 3),
            ]
        )

        ctx = {
            vm,
            projectParagraphs: [],
            projectScenes: [],
            projectCharacters: [],
            projectLocations: [],
            projectItems: [],
            projectTags: [
                new Tag('tag_weapon', 'Broń', '#ef4444'),
                new Tag('tag_magic', 'Magia', '#8b5cf6'),
                new Tag('tag_quest', 'Kluczowe', '#eab308'),
            ],
            playerCharacter: hero,
            projectPlayerCharacter: hero,
            selectEntity: vi.fn(),
            refreshActiveSection: vi.fn(),
            markDirty: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
                focusOnElement: vi.fn(),
            },
            files: {},
            updateMainWorkspaceUI: vi.fn(),
        }
    })

    it('renders item inspector directly when item is selected in VM', () => {
        const item = new Item(
            'it_excalibur',
            'Excalibur',
            new Description('Legendarny miecz króla Artura', 'Legendarny miecz króla Artura'),
            [new Tag('tag_weapon', 'Broń', '#ef4444')],
            [
                {
                    id: 'mod_1',
                    targetType: 'stat',
                    targetName: 'Siła',
                    operator: '+',
                    value: 5,
                },
            ],
            {
                category: 'weapon',
                slotSize: 2,
                weight: 3.5,
                isConsumable: false,
                inStartingInventory: false,
            }
        )
        ctx.projectItems.push(item)
        vm.selectElement(item, 'item')

        renderDetailsPanel(ctx)

        expect(detailsContent.textContent).toContain('Przedmiot')
        expect(detailsContent.textContent).toContain('ID: it_excalibur')

        const nameInput = detailsContent.querySelector(
            '#details-item-name-input'
        ) as HTMLInputElement
        expect(nameInput).not.toBeNull()
        expect(nameInput.value).toBe('Excalibur')

        const slotSizeInput = detailsContent.querySelector(
            '#details-item-slot-size'
        ) as HTMLInputElement
        expect(slotSizeInput.value).toBe('2')

        const weightInput = detailsContent.querySelector('#details-item-weight') as HTMLInputElement
        expect(weightInput.value).toBe('3.5')

        expect(detailsContent.textContent).toContain('#Broń')
        expect(detailsContent.textContent).toContain('Siła')
        expect(detailsContent.textContent).toContain('+5')
        const summaryInput = detailsContent.querySelector(
            '#details-item-summary-input'
        ) as HTMLTextAreaElement
        expect(summaryInput.value).toBe('Legendarny miecz króla Artura')
    })

    it('validates item name uniqueness and rejects collisions or empty string', () => {
        const item1 = new Item('it_1', 'Klucz do Lochu')
        const item2 = new Item('it_2', 'Eliksir Siły')
        ctx.projectItems.push(item1, item2)

        const historyItem = vm.selectElement(item1, 'item')
        renderItemDetails(detailsContent, item1, historyItem, ctx)

        const nameInput = detailsContent.querySelector(
            '#details-item-name-input'
        ) as HTMLInputElement
        const nameError = detailsContent.querySelector('#details-item-name-error') as HTMLElement

        // Set empty
        nameInput.value = '   '
        nameInput.dispatchEvent(new Event('input'))
        expect(nameError.classList.contains('hidden')).toBe(false)
        expect(nameError.textContent).toContain('nie może być pusta')

        // Set collision
        nameInput.value = 'Eliksir Siły'
        nameInput.dispatchEvent(new Event('input'))
        expect(nameError.classList.contains('hidden')).toBe(false)
        expect(nameError.textContent).toContain('już istnieje')

        // Valid new name
        nameInput.value = 'Mistyczny Klucz'
        nameInput.dispatchEvent(new Event('input'))
        expect(nameError.classList.contains('hidden')).toBe(true)
        expect(item1.getName()).toBe('Mistyczny Klucz')
        expect(ctx.markDirty).toHaveBeenCalled()
    })

    it('updates category, consumable toggle, slot size, and weight', () => {
        const item = new Item('it_bread', 'Czerstwy Chleb')
        ctx.projectItems.push(item)
        const historyItem = vm.selectElement(item, 'item')
        renderItemDetails(detailsContent, item, historyItem, ctx)

        const catSelect = detailsContent.querySelector(
            '#details-item-category-select'
        ) as HTMLSelectElement
        const consumableChk = detailsContent.querySelector(
            '#details-item-is-consumable'
        ) as HTMLInputElement
        const slotInput = detailsContent.querySelector(
            '#details-item-slot-size'
        ) as HTMLInputElement
        const weightInput = detailsContent.querySelector('#details-item-weight') as HTMLInputElement

        catSelect.value = 'consumable'
        catSelect.dispatchEvent(new Event('change'))
        expect(item.getCategory()).toBe('consumable')

        consumableChk.checked = true
        consumableChk.dispatchEvent(new Event('change'))
        expect(item.isConsumable()).toBe(true)

        slotInput.value = '0'
        slotInput.dispatchEvent(new Event('change'))
        expect(item.getSlotSize()).toBe(0)
        expect(detailsContent.querySelector('#details-item-slot-summary')!.textContent).toContain(
            '0 sloty'
        )

        weightInput.value = '0.2'
        weightInput.dispatchEvent(new Event('change'))
        expect(item.getWeight()).toBe(0.2)
    })

    it('synchronizes inStartingInventory with PlayerCharacter', () => {
        const potion = new Item('it_hp', 'Mikstura Lecznicza', new Description(), [], [], {
            category: 'consumable',
            slotSize: 1,
        })
        ctx.projectItems.push(potion)
        const historyItem = vm.selectElement(potion, 'item')
        renderItemDetails(detailsContent, potion, historyItem, ctx)

        const startChk = detailsContent.querySelector(
            '#details-item-in-starting-inv'
        ) as HTMLInputElement
        const targetSelect = detailsContent.querySelector(
            '#details-item-target-inv-select'
        ) as HTMLSelectElement

        // Initially not in starting inventory
        expect(hero.hasItem('it_hp')).toBe(false)

        // Select belt inventory and check starting inventory
        targetSelect.value = 'inv_belt'
        startChk.checked = true
        startChk.dispatchEvent(new Event('change'))

        expect(potion.isInStartingInventory()).toBe(true)
        expect(hero.hasItem('it_hp')).toBe(true)
        const belt = hero.getInventory('inv_belt')!
        expect(belt.hasItem('it_hp')).toBe(true)

        // Uncheck starting inventory
        startChk.checked = false
        startChk.dispatchEvent(new Event('change'))
        expect(potion.isInStartingInventory()).toBe(false)
        expect(hero.hasItem('it_hp')).toBe(false)
    })

    it('adds and removes tags from item', () => {
        const item = new Item('it_ring', 'Złoty Pierścień')
        ctx.projectItems.push(item)
        const historyItem = vm.selectElement(item, 'item')
        renderItemDetails(detailsContent, item, historyItem, ctx)

        const tagSelect = detailsContent.querySelector(
            '#details-add-item-tag-select'
        ) as HTMLSelectElement
        const btnAddTag = detailsContent.querySelector(
            '#btn-details-add-item-tag'
        ) as HTMLButtonElement

        // Add tag_magic
        tagSelect.value = 'tag_magic'
        btnAddTag.click()

        expect(item.hasTag('tag_magic')).toBe(true)
        expect(detailsContent.textContent).toContain('#Magia')

        // Remove tag
        const btnRemoveTag = detailsContent.querySelector('.btn-remove-tag') as HTMLButtonElement
        btnRemoveTag.click()

        expect(item.hasTag('tag_magic')).toBe(false)
        expect(detailsContent.querySelector('#details-item-tags-list')!.textContent).not.toContain(
            '#Magia'
        )
    })

    it('adds and removes RPG modifiers from item', () => {
        const item = new Item('it_armor', 'Kolczuga Krasnoludzka')
        ctx.projectItems.push(item)
        const historyItem = vm.selectElement(item, 'item')
        renderItemDetails(detailsContent, item, historyItem, ctx)

        const typeSelect = detailsContent.querySelector('#details-mod-type') as HTMLSelectElement
        const targetInput = detailsContent.querySelector('#details-mod-target') as HTMLInputElement
        const opSelect = detailsContent.querySelector('#details-mod-operator') as HTMLSelectElement
        const valInput = detailsContent.querySelector('#details-mod-value') as HTMLInputElement
        const btnAddMod = detailsContent.querySelector(
            '#btn-add-item-modifier'
        ) as HTMLButtonElement

        typeSelect.value = 'stat'
        targetInput.value = 'Pancerz'
        opSelect.value = '+'
        valInput.value = '8'
        btnAddMod.click()

        expect(item.getModifiers().length).toBe(1)
        expect(item.getModifiers()[0].targetName).toBe('Pancerz')
        expect(item.getModifiers()[0].value).toBe(8)
        expect(detailsContent.textContent).toContain('Pancerz')
        expect(detailsContent.textContent).toContain('+8')

        // Remove modifier
        const btnRemoveMod = detailsContent.querySelector('.btn-remove-mod') as HTMLButtonElement
        btnRemoveMod.click()

        expect(item.getModifiers().length).toBe(0)
        expect(detailsContent.textContent).not.toContain('+8')
    })

    it('displays paragraph usages and clicking jumps to paragraph', () => {
        const item = new Item('it_skull', 'Kryształowa Czaszka')
        ctx.projectItems.push(item)

        const p1 = new Paragraph('p_altar', 'Ołtarz Bogów')
        p1.addItemAction({
            itemId: 'it_skull',
            itemName: 'Kryształowa Czaszka',
            action: 'require',
            quantity: 1,
        })

        const p2 = new Paragraph('p_crypt', 'Krypta Pradawnych')
        p2.addItemAction({
            itemId: 'it_skull',
            itemName: 'Kryształowa Czaszka',
            action: 'give',
            quantity: 2,
        })

        ctx.projectParagraphs.push(p1, p2)

        const historyItem = vm.selectElement(item, 'item')
        renderItemDetails(detailsContent, item, historyItem, ctx)

        expect(detailsContent.textContent).toContain('Ołtarz Bogów')
        expect(detailsContent.textContent).toContain('Krypta Pradawnych')
        expect(detailsContent.textContent).toContain('Wymagaj')
        expect(detailsContent.textContent).toContain('Otrzymaj x2')

        // Click first usage to jump to paragraph
        const usageRows = detailsContent.querySelectorAll(
            '#details-item-usages-list .cursor-pointer'
        )
        expect(usageRows.length).toBe(2)
        ;(usageRows[0] as HTMLElement).click()

        expect(ctx.selectEntity).toHaveBeenCalledWith(p1, 'paragraph')
        expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('p_altar')
    })

    it('clicking item in heroReadOnlyDetails triggers item selection', () => {
        const sword = new Item('it_sword', 'Miecz Świtu', new Description(), [], [], {
            slotSize: 2,
        })
        ctx.projectItems.push(sword)

        hero.addItem(sword, 'inv_main')

        const heroHistoryItem = vm.selectElement(
            hero as unknown as IIdentifiableEntity,
            'player_character'
        )
        renderHeroReadOnlyDetails(detailsContent, hero, heroHistoryItem, 'player_character', ctx)

        const inspectBtn = detailsContent.querySelector('.btn-hero-inspect-item') as HTMLElement
        expect(inspectBtn).not.toBeNull()
        expect(inspectBtn.textContent).toContain('Miecz Świtu')
        expect(inspectBtn.textContent).toContain('(2)')

        inspectBtn.click()
        expect(ctx.selectEntity).toHaveBeenCalledWith(sword, 'item')
    })

    it('triggers export actions from item inspector', () => {
        const item = new Item('it_scroll', 'Zwój Iluzji')
        ctx.projectItems.push(item)
        const historyItem = vm.selectElement(item, 'item')
        renderItemDetails(detailsContent, item, historyItem, ctx)

        const btnCopyJson = detailsContent.querySelector('#btn-copy-item-json') as HTMLElement
        const btnDownloadJson = detailsContent.querySelector(
            '#btn-download-item-json'
        ) as HTMLElement
        const btnExportCsv = detailsContent.querySelector('#btn-export-all-csv') as HTMLElement
        const btnExportMd = detailsContent.querySelector('#btn-export-all-md') as HTMLElement

        expect(btnCopyJson).not.toBeNull()
        expect(btnDownloadJson).not.toBeNull()
        expect(btnExportCsv).not.toBeNull()
        expect(btnExportMd).not.toBeNull()

        btnCopyJson.click()
        btnExportCsv.click()
        btnExportMd.click()
    })
})
