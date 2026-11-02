// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { type IItemModifier, Item } from '../../Model/Item.js'
import {
    createItemModifiersSection,
    createModifierCard,
    renderItemModifiersHtml,
    renderModifierCardHtml,
} from '../../View/ui/detailsPanel/item/itemModifiersSection.js'

describe('itemModifiersSection Component', () => {
    let itemEntity: Item
    let modStrength: IItemModifier
    let ctx: {
        markDirty: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_sword_1', 'Miecz Rycerski')
        modStrength = {
            id: 'mod_str_1',
            targetType: 'stat',
            targetName: 'Siła',
            operator: '+',
            value: 5,
        }

        ctx = {
            markDirty: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderItemModifiersHtml', () => {
        it('renders section header, count badge, and add modifier form inputs', () => {
            const html = renderItemModifiersHtml(1)
            expect(html).toContain('Modyfikatory RPG')
            expect(html).toContain('details-item-mod-count')
            expect(html).toContain('>1<')
            expect(html).toContain('Dodaj nowy modyfikator:')
            expect(html).toContain('Typ celu:')
            expect(html).toContain('Statystyka (Cecha)')
            expect(html).toContain('Nazwa celu:')
            expect(html).toContain('Operator:')
            expect(html).toContain('Wartość:')
            expect(html).toContain('+ Dodaj')
        })
    })

    describe('renderModifierCardHtml', () => {
        it('renders modifier details with operator sign and delete button', () => {
            const html = renderModifierCardHtml(modStrength)
            expect(html).toContain('stat')
            expect(html).toContain('Siła')
            expect(html).toContain('+5')
            expect(html).toContain('btn-remove-mod')
            expect(html).toContain('title="Usuń modyfikator"')
        })

        it('safely escapes special characters in modifier values', () => {
            const html = renderModifierCardHtml({
                id: 'mod_x',
                targetType: 'custom',
                targetName: '<script>alert(1)</script>',
                operator: '=',
                value: '100% & max',
            })
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
            expect(html).toContain('=100% &amp; max')
        })
    })

    describe('createModifierCard', () => {
        it('creates modifier card element and attaches remove listener', () => {
            const onRemove = vi.fn()
            const card = createModifierCard(modStrength, onRemove)

            expect(card.textContent).toContain('Siła')
            expect(card.textContent).toContain('+5')

            const removeBtn = card.querySelector('.btn-remove-mod') as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            removeBtn.click()

            expect(onRemove).toHaveBeenCalledWith('mod_str_1')
        })
    })

    describe('createItemModifiersSection', () => {
        it('displays empty state when item has no modifiers', () => {
            const section = createItemModifiersSection(itemEntity, [], ctx)
            expect(section.textContent).toContain('Brak modyfikatorów RPG')
            const countBadge = section.querySelector('#details-item-mod-count')
            expect(countBadge?.textContent).toBe('0')
        })

        it('displays existing modifiers list', () => {
            itemEntity.addModifier(modStrength)
            const section = createItemModifiersSection(itemEntity, itemEntity.getModifiers(), ctx)

            expect(section.textContent).toContain('Siła')
            expect(section.textContent).toContain('+5')
            const countBadge = section.querySelector('#details-item-mod-count')
            expect(countBadge?.textContent).toBe('1')
        })

        it('adds a new modifier when form is filled and submitted', () => {
            const section = createItemModifiersSection(itemEntity, [], ctx)
            const inpTarget = section.querySelector('#details-mod-target') as HTMLInputElement
            const inpValue = section.querySelector('#details-mod-value') as HTMLInputElement
            const selType = section.querySelector('#details-mod-type') as HTMLSelectElement
            const selOp = section.querySelector('#details-mod-operator') as HTMLSelectElement
            const addBtn = section.querySelector('#btn-add-item-modifier') as HTMLButtonElement
            const countBadge = section.querySelector('#details-item-mod-count')

            selType.value = 'skill'
            selOp.value = '+'
            inpTarget.value = 'Broń biała'
            inpValue.value = '2'
            addBtn.click()

            expect(itemEntity.getModifiers().length).toBe(1)
            const created = itemEntity.getModifiers()[0]
            expect(created.targetName).toBe('Broń biała')
            expect(created.value).toBe(2)
            expect(section.textContent).toContain('Broń biała')
            expect(countBadge?.textContent).toBe('1')
            expect(inpTarget.value).toBe('')
            expect(inpValue.value).toBe('')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('ignores addition when target name or value is empty', () => {
            const section = createItemModifiersSection(itemEntity, [], ctx)
            const addBtn = section.querySelector('#btn-add-item-modifier') as HTMLButtonElement

            addBtn.click()
            expect(itemEntity.getModifiers().length).toBe(0)
            expect(ctx.markDirty).not.toHaveBeenCalled()
        })

        it('removes modifier when clicking remove button on card', () => {
            itemEntity.addModifier(modStrength)
            const section = createItemModifiersSection(itemEntity, itemEntity.getModifiers(), ctx)
            const countBadge = section.querySelector('#details-item-mod-count')
            expect(countBadge?.textContent).toBe('1')

            const removeBtn = section.querySelector('.btn-remove-mod') as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            removeBtn.click()

            expect(itemEntity.getModifiers().length).toBe(0)
            expect(section.textContent).toContain('Brak modyfikatorów RPG')
            expect(countBadge?.textContent).toBe('0')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('handles omitted currentModifiers parameter safely', () => {
            itemEntity.addModifier(modStrength)
            const section = createItemModifiersSection(itemEntity, undefined, ctx)
            expect(section.textContent).toContain('Siła')
            const countBadge = section.querySelector('#details-item-mod-count')
            expect(countBadge?.textContent).toBe('1')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemModifiersSection(itemEntity, [], ctx)
            expect(sectionEn.textContent).toContain('RPG Modifiers')
            expect(sectionEn.textContent).toContain('No RPG modifiers')
            expect(sectionEn.textContent).toContain('Add new modifier:')
            expect(sectionEn.textContent).toContain('Target type:')
            expect(sectionEn.textContent).toContain('Stat (Trait)')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemModifiersSection(itemEntity, [], ctx)
            expect(sectionDe.textContent).toContain('RPG-Modifikatoren')
            expect(sectionDe.textContent).toContain('Keine RPG-Modifikatoren')
            expect(sectionDe.textContent).toContain('Neuen Modifikator hinzufügen:')
            expect(sectionDe.textContent).toContain('Zieltyp:')
            expect(sectionDe.textContent).toContain('Statistik (Attribut)')
        })
    })
})
