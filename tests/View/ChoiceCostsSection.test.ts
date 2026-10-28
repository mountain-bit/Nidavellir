// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice, IChoiceModifier } from '../../Model/Choice'
import {
    addChoiceCost,
    createChoiceCostsSection,
    getChoiceCosts,
    promptAddCost,
    removeCostAtIndex,
    renderCostItemHtml,
    renderCostsListHtml,
    setChoiceCosts,
} from '../../View/ui/detailsPanel/choice/choiceCostsSection.js'

describe('choiceCostsSection', () => {
    let choice: Choice

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''
        choice = new Choice('choice_1', 'Przejdź do jaskini', 'p1', 'p2')
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('getChoiceCosts, setChoiceCosts, addChoiceCost', () => {
        it('returns empty array when choice is null or undefined', () => {
            expect(getChoiceCosts(null)).toEqual([])
            expect(getChoiceCosts(undefined)).toEqual([])
        })

        it('retrieves costs from Choice model instance and plain objects', () => {
            const cost1: IChoiceModifier = {
                id: 'c1',
                type: 'item',
                name: 'Pochodnia',
                value: 2,
            }
            choice.addCost(cost1)
            expect(getChoiceCosts(choice)).toEqual([cost1])

            const plainObj = { costs: [cost1] }
            expect(getChoiceCosts(plainObj)).toEqual([cost1])
        })

        it('returns empty array if plain object has non-array costs property', () => {
            expect(getChoiceCosts({ costs: 'invalid' as unknown as IChoiceModifier[] })).toEqual([])
        })

        it('updates costs via setChoiceCosts for both Choice and plain objects', () => {
            const newCosts: IChoiceModifier[] = [
                { id: 'c2', type: 'parameter', name: 'Złoto', value: 50 },
            ]

            setChoiceCosts(choice, newCosts)
            expect(choice.getCosts()).toEqual(newCosts)

            const plainObj: { costs?: IChoiceModifier[] } = {}
            setChoiceCosts(plainObj, newCosts)
            expect(plainObj.costs).toEqual(newCosts)

            // No-op for null choice
            setChoiceCosts(null, newCosts)
        })

        it('adds costs via addChoiceCost for both Choice and plain objects', () => {
            const cost: IChoiceModifier = { id: 'c3', type: 'item', name: 'Klucz', value: 1 }

            addChoiceCost(choice, cost)
            expect(choice.getCosts()).toContainEqual(cost)

            const plainObj: { costs?: IChoiceModifier[] } = {}
            addChoiceCost(plainObj, cost)
            expect(plainObj.costs).toEqual([cost])

            // Gracefully handles null/undefined inputs
            addChoiceCost(null, cost)
            addChoiceCost(plainObj, null as unknown as IChoiceModifier)
        })
    })

    describe('removeCostAtIndex', () => {
        it('returns false and does not call onSave if choice is missing or index is out of bounds', () => {
            const onSave = vi.fn()
            expect(removeCostAtIndex(null, 0, onSave)).toBe(false)
            expect(removeCostAtIndex(choice, -1, onSave)).toBe(false)
            expect(removeCostAtIndex(choice, 0, onSave)).toBe(false)
            expect(onSave).not.toHaveBeenCalled()
        })

        it('removes cost at given index and invokes onSave callback', () => {
            const onSave = vi.fn()
            choice.addCost({ id: 'c1', type: 'item', name: 'Miecz', value: 1 })
            choice.addCost({ id: 'c2', type: 'parameter', name: 'Zdrowie', value: 10 })

            const result = removeCostAtIndex(choice, 0, onSave)
            expect(result).toBe(true)
            expect(choice.getCosts().length).toBe(1)
            expect(choice.getCosts()[0].name).toBe('Zdrowie')
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('renderCostItemHtml', () => {
        it('returns empty string when cost is null or undefined', () => {
            expect(renderCostItemHtml(null, 0)).toBe('')
            expect(renderCostItemHtml(undefined, 0)).toBe('')
        })

        it('renders item badge for item type', () => {
            const html = renderCostItemHtml({ type: 'item', name: 'Lina', value: 1 }, 0)
            expect(html).toContain('bg-amber-950/60')
            expect(html).toContain('text-amber-300')
            expect(html).toContain('Przedmiot')
            expect(html).toContain('Lina')
            expect(html).toContain('-1')
            expect(html).toContain('data-cost-idx="0"')
        })

        it('renders parameter badge for parameter type', () => {
            const html = renderCostItemHtml({ type: 'parameter', name: 'Mana', value: 15 }, 2)
            expect(html).toContain('bg-red-950/60')
            expect(html).toContain('text-red-300')
            expect(html).toContain('Parametr / Zasób')
            expect(html).toContain('Mana')
            expect(html).toContain('-15')
            expect(html).toContain('data-cost-idx="2"')
        })

        it('escapes malicious HTML in cost name to prevent XSS', () => {
            const maliciousName = '<img src=x onerror=alert(1)>'
            const html = renderCostItemHtml({ type: 'item', name: maliciousName, value: 3 }, 0)
            expect(html).not.toContain('<img src=x onerror=alert(1)>')
            expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
        })
    })

    describe('renderCostsListHtml', () => {
        it('renders empty message when there are no costs', () => {
            expect(renderCostsListHtml([])).toContain('Brak zdefiniowanych kosztów')
            expect(renderCostsListHtml(null as unknown as IChoiceModifier[])).toContain(
                'Brak zdefiniowanych kosztów'
            )
        })

        it('renders multiple cost items in order', () => {
            const list: IChoiceModifier[] = [
                { id: '1', type: 'item', name: 'Pochodnia', value: 1 },
                { id: '2', type: 'parameter', name: 'Złoto', value: 20 },
            ]
            const html = renderCostsListHtml(list)
            expect(html).toContain('Pochodnia')
            expect(html).toContain('Złoto')
            expect(html).toContain('-1')
            expect(html).toContain('-20')
        })
    })

    describe('promptAddCost', () => {
        it('returns null if choice is null', () => {
            expect(promptAddCost({ choice: null })).toBeNull()
        })

        it('aborts and returns null if user cancels name prompt', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValue(null)

            const result = promptAddCost({ choice, onSave, promptFn })
            expect(result).toBeNull()
            expect(onSave).not.toHaveBeenCalled()
            expect(choice.getCosts().length).toBe(0)
        })

        it('aborts and returns null if user inputs only whitespace', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValue('   ')

            const result = promptAddCost({ choice, onSave, promptFn })
            expect(result).toBeNull()
            expect(onSave).not.toHaveBeenCalled()
        })

        it('adds an item cost when confirm returns true', () => {
            const onSave = vi.fn()
            const renderCosts = vi.fn()
            const scrollIntoView = vi.fn()
            const sectionEl = { scrollIntoView } as unknown as HTMLElement

            const promptFn = vi
                .fn()
                .mockReturnValueOnce(' Magiczny Kryształ ')
                .mockReturnValueOnce('3')
            const confirmFn = vi.fn().mockReturnValue(true)

            const created = promptAddCost({
                choice,
                onSave,
                renderCosts,
                sectionEl,
                promptFn,
                confirmFn,
            })

            expect(created).not.toBeNull()
            expect(created?.type).toBe('item')
            expect(created?.name).toBe('Magiczny Kryształ')
            expect(created?.value).toBe(3)
            expect(choice.getCosts().length).toBe(1)
            expect(onSave).toHaveBeenCalledTimes(1)
            expect(renderCosts).toHaveBeenCalledTimes(1)
            expect(scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest',
            })
        })

        it('adds a parameter cost when confirm returns false', () => {
            const promptFn = vi.fn().mockReturnValueOnce('Energia').mockReturnValueOnce('10')
            const confirmFn = vi.fn().mockReturnValue(false)

            const created = promptAddCost({ choice, promptFn, confirmFn })
            expect(created?.type).toBe('parameter')
            expect(created?.name).toBe('Energia')
            expect(created?.value).toBe(10)
        })

        it('defaults value to 1 if quantity is invalid or less than 1', () => {
            const promptFn = vi
                .fn()
                .mockReturnValueOnce('Klucz')
                .mockReturnValueOnce('not-a-number')
            const confirmFn = vi.fn().mockReturnValue(true)

            const created = promptAddCost({ choice, promptFn, confirmFn })
            expect(created?.value).toBe(1)
        })
    })

    describe('createChoiceCostsSection UI component', () => {
        it('renders section structure with localized headers and action buttons', () => {
            const { sectionEl } = createChoiceCostsSection({ choice })

            expect(sectionEl.textContent).toContain('Koszty i Utrata')
            expect(sectionEl.textContent).toContain('+ Dodaj koszt')
            expect(sectionEl.textContent).toContain('Przedmioty lub punkty zasobów')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-costs')
            expect(removeAllBtn).not.toBeNull()
            expect(removeAllBtn?.getAttribute('title')).toBe('Usuń koszty')
            expect(removeAllBtn?.getAttribute('aria-label')).toBe('Usuń koszty')
        })

        it('renders initial costs when renderCosts is called', () => {
            choice.addCost({ id: 'c1', type: 'item', name: 'Mikstura', value: 2 })
            const { sectionEl, renderCosts } = createChoiceCostsSection({ choice })

            renderCosts()
            expect(sectionEl.textContent).toContain('Mikstura')
            expect(sectionEl.textContent).toContain('-2')
        })

        it('triggers promptAddCost and updates list when add button is clicked', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValueOnce('Topór').mockReturnValueOnce('1')
            const confirmFn = vi.fn().mockReturnValue(true)

            const { sectionEl } = createChoiceCostsSection({
                choice,
                onSave,
                promptFn,
                confirmFn,
            })

            const addBtn = sectionEl.querySelector('#btn-add-choice-cost') as HTMLButtonElement
            expect(addBtn).not.toBeNull()
            addBtn.click()

            expect(choice.getCosts().length).toBe(1)
            expect(sectionEl.textContent).toContain('Topór')
            expect(onSave).toHaveBeenCalled()
        })

        it('removes single cost when its delete button is clicked', () => {
            const onSave = vi.fn()
            choice.addCost({ id: 'c1', type: 'item', name: 'Złoty Klucz', value: 1 })

            const { sectionEl, renderCosts } = createChoiceCostsSection({
                choice,
                onSave,
            })
            renderCosts()

            const deleteBtn = sectionEl.querySelector('.btn-remove-cost') as HTMLButtonElement
            expect(deleteBtn).not.toBeNull()
            deleteBtn.click()

            expect(choice.getCosts().length).toBe(0)
            expect(sectionEl.textContent).toContain('Brak zdefiniowanych kosztów')
            expect(onSave).toHaveBeenCalled()
        })

        it('clears all costs when remove-all button is clicked', () => {
            const onRemoveAll = vi.fn()
            choice.addCost({ id: 'c1', type: 'item', name: 'Złoty Klucz', value: 1 })
            choice.addCost({ id: 'c2', type: 'parameter', name: 'Siła', value: 5 })

            const { sectionEl, renderCosts } = createChoiceCostsSection({
                choice,
                onRemoveAll,
            })
            renderCosts()

            const removeAllBtn = sectionEl.querySelector(
                '#btn-remove-all-costs'
            ) as HTMLButtonElement
            expect(removeAllBtn).not.toBeNull()
            removeAllBtn.click()

            expect(choice.getCosts().length).toBe(0)
            expect(sectionEl.textContent).toContain('Brak zdefiniowanych kosztów')
            expect(onRemoveAll).toHaveBeenCalledTimes(1)
        })

        it('falls back to onSave when remove-all button is clicked and onRemoveAll is not provided', () => {
            const onSave = vi.fn()
            choice.addCost({ id: 'c1', type: 'item', name: 'Tarcza', value: 1 })

            const { sectionEl, renderCosts } = createChoiceCostsSection({
                choice,
                onSave,
            })
            renderCosts()

            const removeAllBtn = sectionEl.querySelector(
                '#btn-remove-all-costs'
            ) as HTMLButtonElement
            removeAllBtn.click()

            expect(choice.getCosts().length).toBe(0)
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('multilingual support', () => {
        it('renders German translations correctly', async () => {
            await initTranslationsWithLocale('de')
            const { sectionEl } = createChoiceCostsSection({ choice })

            expect(sectionEl.textContent).toContain('Kosten & Verlust')
            expect(sectionEl.textContent).toContain('+ Kosten hinzufügen')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-costs')
            expect(removeAllBtn?.getAttribute('title')).toBe('Kosten entfernen')
        })

        it('renders English translations correctly', async () => {
            await initTranslationsWithLocale('en')
            const { sectionEl } = createChoiceCostsSection({ choice })

            expect(sectionEl.textContent).toContain('Costs & Loss')
            expect(sectionEl.textContent).toContain('+ Add cost')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-costs')
            expect(removeAllBtn?.getAttribute('title')).toBe('Remove costs')
        })
    })
})
