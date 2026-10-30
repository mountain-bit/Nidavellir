// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Item } from '../../Model/Item.js'
import {
    createItemCategorySection,
    getItemCategories,
    ITEM_CATEGORIES,
    renderItemCategoryHtml,
} from '../../View/ui/detailsPanel/item/itemCategorySection.js'

describe('itemCategorySection Component', () => {
    let itemEntity: Item
    let config: {
        category: string
        isConsumable: boolean
    }
    let ctx: {
        markDirty: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_sword_1', 'Stary Miecz')
        config = {
            category: 'weapon',
            isConsumable: false,
        }
        ctx = {
            markDirty: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('ITEM_CATEGORIES & getItemCategories', () => {
        it('exports list of supported categories with localized labels', () => {
            const categories = getItemCategories()
            expect(categories.length).toBe(7)
            const ids = categories.map((c: { id: string }) => c.id)
            expect(ids).toEqual([
                'weapon',
                'armor',
                'consumable',
                'quest',
                'scroll',
                'artifact',
                'misc',
            ])

            const weapon = ITEM_CATEGORIES.find((c: { id: string }) => c.id === 'weapon')
            expect(weapon?.label).toBe('Broń (weapon)')
        })
    })

    describe('renderItemCategoryHtml', () => {
        it('renders dropdown with selected predefined category and unchecked consumable checkbox', () => {
            const html = renderItemCategoryHtml({ category: 'weapon', isConsumable: false })
            expect(html).toContain('Kategoria i Typ')
            expect(html).toContain('Kategoria przedmiotu:')
            expect(html).toContain('value="weapon" selected')
            expect(html).not.toContain('checked')
        })

        it('renders checked consumable checkbox when isConsumable is true', () => {
            const html = renderItemCategoryHtml({ category: 'consumable', isConsumable: true })
            expect(html).toContain('value="consumable" selected')
            expect(html).toContain('checked')
        })

        it('renders custom category option when category is not predefined', () => {
            const html = renderItemCategoryHtml({ category: 'relic', isConsumable: false })
            expect(html).toContain('value="relic" selected')
            expect(html).toContain('relic (własna)')
        })
    })

    describe('createItemCategorySection', () => {
        it('creates DOM section and attaches event listeners for category selection', () => {
            const section = createItemCategorySection(itemEntity, config, ctx)
            const select = section.querySelector(
                '#details-item-category-select'
            ) as HTMLSelectElement
            expect(select).not.toBeNull()
            expect(select.value).toBe('weapon')

            select.value = 'armor'
            select.dispatchEvent(new Event('change'))

            expect(config.category).toBe('armor')
            expect(itemEntity.getInventoryConfig().category).toBe('armor')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('attaches event listeners for consumable checkbox toggle', () => {
            const section = createItemCategorySection(itemEntity, config, ctx)
            const checkbox = section.querySelector(
                '#details-item-is-consumable'
            ) as HTMLInputElement
            expect(checkbox).not.toBeNull()
            expect(checkbox.checked).toBe(false)

            checkbox.checked = true
            checkbox.dispatchEvent(new Event('change'))

            expect(config.isConsumable).toBe(true)
            expect(itemEntity.getInventoryConfig().isConsumable).toBe(true)
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('falls back safely if config parameter is omitted', () => {
            const fallbackItem = new Item('it_fallback_1', 'Fallback Item')
            fallbackItem.setCategory('quest')
            const section = createItemCategorySection(fallbackItem, undefined, ctx)
            const select = section.querySelector(
                '#details-item-category-select'
            ) as HTMLSelectElement
            expect(select).not.toBeNull()
            expect(select.value).toBe('quest')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemCategorySection(
                itemEntity,
                { category: 'quest', isConsumable: false },
                ctx
            )
            expect(sectionEn.textContent).toContain('Category & Type')
            expect(sectionEn.textContent).toContain('Item category:')
            expect(sectionEn.textContent).toContain('Consumable item')
            const weaponOptionEn = sectionEn.querySelector('option[value="weapon"]')
            expect(weaponOptionEn?.textContent).toBe('Weapon (weapon)')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemCategorySection(
                itemEntity,
                { category: 'custom_cat', isConsumable: true },
                ctx
            )
            expect(sectionDe.textContent).toContain('Kategorie & Typ')
            expect(sectionDe.textContent).toContain('Gegenstandskategorie:')
            expect(sectionDe.textContent).toContain('Verbrauchsgegenstand')
            expect(sectionDe.textContent).toContain('custom_cat (benutzerdefiniert)')
            const weaponOptionDe = sectionDe.querySelector('option[value="weapon"]')
            expect(weaponOptionDe?.textContent).toBe('Waffe (weapon)')
        })
    })
})
