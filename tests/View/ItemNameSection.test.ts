// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Item } from '../../Model/Item.js'
import {
    checkItemNameCollision,
    createItemNameSection,
    renderItemNameHtml,
} from '../../View/ui/detailsPanel/item/itemNameSection.js'

describe('itemNameSection Component', () => {
    let itemEntity: Item
    let itemWrapper: { id: string; name: string; type: string; entity: Item }
    let ctx: {
        projectItems: Array<{
            id: string
            name: string
            getId?: () => string
            getName?: () => string
        }>
        markDirty: ReturnType<typeof vi.fn>
        refreshActiveSection: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_sword_1', 'Stary Miecz')
        itemWrapper = {
            id: 'it_sword_1',
            name: 'Stary Miecz',
            type: 'item',
            entity: itemEntity,
        }

        ctx = {
            projectItems: [
                { id: 'it_sword_1', name: 'Stary Miecz' },
                { id: 'it_shield_1', name: 'Drewniana Tarcza' },
                {
                    id: 'it_potion_1',
                    name: 'Mikstura Zdrowia',
                    getId(): string {
                        return this.id
                    },
                    getName(): string {
                        return this.name
                    },
                },
            ],
            markDirty: vi.fn(),
            refreshActiveSection: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderItemNameHtml', () => {
        it('renders label, input with value and placeholder, and error container', () => {
            const html = renderItemNameHtml('Sztylet Cienia')
            expect(html).toContain('Nazwa')
            expect(html).toContain('Sztylet Cienia')
            expect(html).toContain('details-item-name-input')
            expect(html).toContain('details-item-name-error')
        })

        it('safely escapes special characters in item name', () => {
            const html = renderItemNameHtml('Topór <"Krwi & Ognia">')
            expect(html).toContain('&lt;&quot;Krwi &amp; Ognia&quot;&gt;')
        })
    })

    describe('checkItemNameCollision', () => {
        it('returns false for empty or non-string names', () => {
            expect(checkItemNameCollision('', 'it_sword_1', ctx.projectItems)).toBe(false)
            expect(checkItemNameCollision('   ', 'it_sword_1', ctx.projectItems)).toBe(false)
            expect(
                checkItemNameCollision(null as unknown as string, 'it_sword_1', ctx.projectItems)
            ).toBe(false)
        })

        it('returns false when matching item has the same ID (self)', () => {
            expect(checkItemNameCollision('Stary Miecz', 'it_sword_1', ctx.projectItems)).toBe(
                false
            )
            expect(checkItemNameCollision('stary miecz', 'it_sword_1', ctx.projectItems)).toBe(
                false
            )
        })

        it('returns true when another item shares the same name (case-insensitive and trimmed)', () => {
            expect(checkItemNameCollision('Drewniana Tarcza', 'it_sword_1', ctx.projectItems)).toBe(
                true
            )
            expect(
                checkItemNameCollision('  drewniana tarcza  ', 'it_sword_1', ctx.projectItems)
            ).toBe(true)
            expect(checkItemNameCollision('mikstura zdrowia', 'it_sword_1', ctx.projectItems)).toBe(
                true
            )
        })

        it('safely handles items with null/undefined properties without throwing', () => {
            const malformedItems = [
                null,
                undefined,
                { id: 'it_bad_1' },
                { id: 'it_bad_2', name: null },
                { id: 'it_bad_3', getName: (): string | null => null },
            ]
            expect(
                checkItemNameCollision(
                    'Dowolna nazwa',
                    'it_sword_1',
                    malformedItems as unknown as Array<{ id: string; name: string }>
                )
            ).toBe(false)
        })
    })

    describe('createItemNameSection', () => {
        it('renders input with initial item name', () => {
            const section = createItemNameSection(
                itemEntity,
                'it_sword_1',
                'Stary Miecz',
                itemWrapper,
                ctx
            )
            const input = section.querySelector('#details-item-name-input') as HTMLInputElement
            expect(input).not.toBeNull()
            expect(input.value).toBe('Stary Miecz')
        })

        it('displays error when input is emptied and removes error when name is restored', () => {
            const section = createItemNameSection(
                itemEntity,
                'it_sword_1',
                'Stary Miecz',
                itemWrapper,
                ctx
            )
            const input = section.querySelector('#details-item-name-input') as HTMLInputElement
            const error = section.querySelector('#details-item-name-error') as HTMLDivElement

            input.value = ''
            input.dispatchEvent(new Event('input'))

            expect(error.classList.contains('hidden')).toBe(false)
            expect(error.textContent).toBe('Nazwa przedmiotu nie może być pusta')
            expect(input.classList.contains('border-red-500')).toBe(true)

            input.value = 'Lśniący Miecz'
            input.dispatchEvent(new Event('input'))

            expect(error.classList.contains('hidden')).toBe(true)
            expect(input.classList.contains('border-red-500')).toBe(false)
            expect(itemEntity.getName()).toBe('Lśniący Miecz')
            expect(itemWrapper.name).toBe('Lśniący Miecz')
            expect(ctx.markDirty).toHaveBeenCalled()
            expect(ctx.refreshActiveSection).toHaveBeenCalledWith('item')
        })

        it('displays collision error when entering a name used by another item', () => {
            const section = createItemNameSection(
                itemEntity,
                'it_sword_1',
                'Stary Miecz',
                itemWrapper,
                ctx
            )
            const input = section.querySelector('#details-item-name-input') as HTMLInputElement
            const error = section.querySelector('#details-item-name-error') as HTMLDivElement

            input.value = 'Drewniana Tarcza'
            input.dispatchEvent(new Event('input'))

            expect(error.classList.contains('hidden')).toBe(false)
            expect(error.textContent).toContain('Drewniana Tarcza')
            expect(error.textContent).toContain('już istnieje')
            expect(input.classList.contains('border-red-500')).toBe(true)
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemNameSection(
                itemEntity,
                'it_sword_1',
                'Stary Miecz',
                itemWrapper,
                ctx
            )
            const inputEn = sectionEn.querySelector('#details-item-name-input') as HTMLInputElement
            const errorEn = sectionEn.querySelector('#details-item-name-error') as HTMLDivElement

            expect(sectionEn.textContent).toContain('Name')
            inputEn.value = ''
            inputEn.dispatchEvent(new Event('input'))
            expect(errorEn.textContent).toBe('Item name cannot be empty')

            inputEn.value = 'Drewniana Tarcza'
            inputEn.dispatchEvent(new Event('input'))
            expect(errorEn.textContent).toContain('already exists')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemNameSection(
                itemEntity,
                'it_sword_1',
                'Stary Miecz',
                itemWrapper,
                ctx
            )
            const inputDe = sectionDe.querySelector('#details-item-name-input') as HTMLInputElement
            const errorDe = sectionDe.querySelector('#details-item-name-error') as HTMLDivElement

            expect(sectionDe.textContent).toContain('Name')
            inputDe.value = ''
            inputDe.dispatchEvent(new Event('input'))
            expect(errorDe.textContent).toBe('Der Gegenstandsname darf nicht leer sein')

            inputDe.value = 'Drewniana Tarcza'
            inputDe.dispatchEvent(new Event('input'))
            expect(errorDe.textContent).toContain('existiert bereits')
        })
    })
})
