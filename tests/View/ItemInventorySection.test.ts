// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Item } from '../../Model/Item.js'
import {
    createItemInventorySection,
    formatSlotSummary,
    renderItemInventoryHtml,
    syncPlayerCharacterStartingInventory,
} from '../../View/ui/detailsPanel/item/itemInventorySection.js'

describe('itemInventorySection Component', () => {
    let itemEntity: Item
    let config: {
        category: string
        slotSize: number
        weight: number
        isConsumable: boolean
        inStartingInventory: boolean
        targetInventoryId: string
    }
    let hero: {
        hasItem: ReturnType<typeof vi.fn>
        addItem: ReturnType<typeof vi.fn>
        removeItem: ReturnType<typeof vi.fn>
        getInventories: () => Array<{ id: string; name: string }>
    }
    let ctx: {
        projectPlayerCharacter: typeof hero
        markDirty: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_potion_1', 'Eliksir Siły')
        config = {
            category: 'consumable',
            slotSize: 1,
            weight: 0.5,
            isConsumable: true,
            inStartingInventory: false,
            targetInventoryId: '',
        }

        hero = {
            hasItem: vi.fn().mockReturnValue(false),
            addItem: vi.fn(),
            removeItem: vi.fn(),
            getInventories: (): Array<{ id: string; name: string }> => [
                { id: 'inv_belt', name: 'Pas podręczny' },
                { id: 'inv_bag', name: 'Plecak' },
            ],
        }

        ctx = {
            projectPlayerCharacter: hero,
            markDirty: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('formatSlotSummary', () => {
        it('formats 1 slot with singular and >1 with plural in Polish', () => {
            expect(formatSlotSummary(1)).toBe('1 slot')
            expect(formatSlotSummary(2)).toBe('2 sloty')
            expect(formatSlotSummary(0)).toBe('0 sloty')
        })

        it('supports localization for English and German', async () => {
            await initTranslationsWithLocale('en')
            expect(formatSlotSummary(1)).toBe('1 slot')
            expect(formatSlotSummary(3)).toBe('3 slots')

            await initTranslationsWithLocale('de')
            expect(formatSlotSummary(1)).toBe('1 Slot')
            expect(formatSlotSummary(4)).toBe('4 Slots')
        })
    })

    describe('syncPlayerCharacterStartingInventory', () => {
        it('safely exits if entity or hero is missing', () => {
            expect(() => {
                syncPlayerCharacterStartingInventory(null, true, '', ctx)
                syncPlayerCharacterStartingInventory(
                    itemEntity,
                    true,
                    '',
                    {} as unknown as typeof ctx
                )
            }).not.toThrow()
            expect(hero.addItem).not.toHaveBeenCalled()
        })

        it('adds item to hero starting inventory if not already present', () => {
            hero.hasItem.mockReturnValue(false)
            syncPlayerCharacterStartingInventory(itemEntity, true, 'inv_belt', ctx)

            expect(hero.hasItem).toHaveBeenCalledWith('it_potion_1')
            expect(hero.addItem).toHaveBeenCalledWith(itemEntity, 'inv_belt')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('does not re-add item if hero already has it', () => {
            hero.hasItem.mockReturnValue(true)
            syncPlayerCharacterStartingInventory(itemEntity, true, 'inv_belt', ctx)

            expect(hero.addItem).not.toHaveBeenCalled()
        })

        it('removes item from hero inventory when inStarting is false', () => {
            hero.hasItem.mockReturnValue(true)
            syncPlayerCharacterStartingInventory(itemEntity, false, '', ctx)

            expect(hero.removeItem).toHaveBeenCalledWith('it_potion_1')
            expect(ctx.markDirty).toHaveBeenCalled()
        })
    })

    describe('renderItemInventoryHtml', () => {
        it('renders slot size, weight, and inventory options', () => {
            const html = renderItemInventoryHtml(config, hero.getInventories())
            expect(html).toContain('Zasady Ekwipunku')
            expect(html).toContain('Zajmowane sloty:')
            expect(html).toContain('value="1"')
            expect(html).toContain('value="0.5"')
            expect(html).toContain('Pas podręczny')
            expect(html).toContain('Plecak')
            expect(html).toContain('hidden')
        })

        it('displays target inventory row when inStartingInventory is true', () => {
            const html = renderItemInventoryHtml(
                { ...config, inStartingInventory: true, targetInventoryId: 'inv_bag' },
                hero.getInventories()
            )
            expect(html).toContain('flex')
            expect(html).toContain('value="inv_bag" selected')
        })
    })

    describe('createItemInventorySection', () => {
        it('updates slot size on input change and updates slot summary badge', () => {
            const section = createItemInventorySection(itemEntity, config, ctx)
            const input = section.querySelector('#details-item-slot-size') as HTMLInputElement
            const summary = section.querySelector('#details-item-slot-summary') as HTMLElement

            expect(input.value).toBe('1')
            expect(summary.textContent).toBe('1 slot')

            input.value = '3'
            input.dispatchEvent(new Event('change'))

            expect(config.slotSize).toBe(3)
            expect(itemEntity.getInventoryConfig().slotSize).toBe(3)
            expect(summary.textContent).toBe('3 sloty')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('clamps negative slot size to 0', () => {
            const section = createItemInventorySection(itemEntity, config, ctx)
            const input = section.querySelector('#details-item-slot-size') as HTMLInputElement

            input.value = '-5'
            input.dispatchEvent(new Event('change'))

            expect(config.slotSize).toBe(0)
            expect(input.value).toBe('0')
        })

        it('updates weight on input change', () => {
            const section = createItemInventorySection(itemEntity, config, ctx)
            const input = section.querySelector('#details-item-weight') as HTMLInputElement

            input.value = '2.5'
            input.dispatchEvent(new Event('change'))

            expect(config.weight).toBe(2.5)
            expect(itemEntity.getInventoryConfig().weight).toBe(2.5)
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('toggles starting inventory checkbox and synchronizes with hero', () => {
            const section = createItemInventorySection(itemEntity, config, ctx)
            const checkbox = section.querySelector(
                '#details-item-in-starting-inv'
            ) as HTMLInputElement
            const targetRow = section.querySelector(
                '#details-item-target-inv-row'
            ) as HTMLDivElement

            expect(checkbox.checked).toBe(false)
            expect(targetRow.classList.contains('hidden')).toBe(true)

            checkbox.checked = true
            checkbox.dispatchEvent(new Event('change'))

            expect(targetRow.classList.contains('hidden')).toBe(false)
            expect(config.inStartingInventory).toBe(true)
            expect(itemEntity.getInventoryConfig().inStartingInventory).toBe(true)
            expect(hero.addItem).toHaveBeenCalledWith(itemEntity, '')

            checkbox.checked = false
            checkbox.dispatchEvent(new Event('change'))

            expect(targetRow.classList.contains('hidden')).toBe(true)
            expect(config.inStartingInventory).toBe(false)
        })

        it('updates target inventory selection and re-syncs if checked', () => {
            config.inStartingInventory = true
            const section = createItemInventorySection(itemEntity, config, ctx)
            const select = section.querySelector(
                '#details-item-target-inv-select'
            ) as HTMLSelectElement

            select.value = 'inv_bag'
            select.dispatchEvent(new Event('change'))

            expect(config.targetInventoryId).toBe('inv_bag')
            expect(itemEntity.getInventoryConfig().targetInventoryId).toBe('inv_bag')
            expect(hero.addItem).toHaveBeenCalledWith(itemEntity, 'inv_bag')
        })

        it('handles omitted config parameter safely', () => {
            itemEntity.setSlotSize(2)
            itemEntity.setWeight(4.2)
            const section = createItemInventorySection(itemEntity, undefined, ctx)
            const slotInput = section.querySelector('#details-item-slot-size') as HTMLInputElement
            const weightInput = section.querySelector('#details-item-weight') as HTMLInputElement

            expect(slotInput.value).toBe('2')
            expect(weightInput.value).toBe('4.2')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemInventorySection(itemEntity, config, ctx)
            expect(sectionEn.textContent).toContain('Inventory Rules')
            expect(sectionEn.textContent).toContain('Occupied slots:')
            expect(sectionEn.textContent).toContain('Weight (kg/unit):')
            expect(sectionEn.textContent).toContain('In player starting inventory')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemInventorySection(itemEntity, config, ctx)
            expect(sectionDe.textContent).toContain('Inventarregeln')
            expect(sectionDe.textContent).toContain('Belegte Slots:')
            expect(sectionDe.textContent).toContain('Gewicht (kg/Einh.):')
            expect(sectionDe.textContent).toContain('Im Startinventar des Spielers')
        })
    })
})
