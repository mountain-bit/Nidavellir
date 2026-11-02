// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice, IChoiceModifier } from '../../Model/Choice'
import {
    addChoiceReward,
    createChoiceRewardsSection,
    getChoiceRewards,
    promptAddReward,
    removeRewardAtIndex,
    renderRewardItemHtml,
    renderRewardsListHtml,
    setChoiceRewards,
} from '../../View/ui/detailsPanel/choice/choiceRewardsSection.js'

describe('choiceRewardsSection', () => {
    let choice: Choice

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''
        choice = new Choice('choice_1', 'Przejdź do skarbca', 'p1', 'p2')
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('getChoiceRewards, setChoiceRewards, addChoiceReward', () => {
        it('returns empty array when choice is null or undefined', () => {
            expect(getChoiceRewards(null)).toEqual([])
            expect(getChoiceRewards(undefined)).toEqual([])
        })

        it('retrieves rewards from Choice model instance and plain objects', () => {
            const reward1: IChoiceModifier = {
                id: 'r1',
                type: 'item',
                name: 'Złoty klucz',
                value: 1,
            }
            choice.addReward(reward1)
            expect(getChoiceRewards(choice)).toEqual([reward1])

            const plainObj = { rewards: [reward1] }
            expect(getChoiceRewards(plainObj)).toEqual([reward1])
        })

        it('returns empty array if plain object has non-array rewards property', () => {
            expect(
                getChoiceRewards({ rewards: 'invalid' as unknown as IChoiceModifier[] })
            ).toEqual([])
        })

        it('updates rewards via setChoiceRewards for both Choice and plain objects', () => {
            const newRewards: IChoiceModifier[] = [
                { id: 'r2', type: 'parameter', name: 'Złoto', value: 100 },
            ]

            setChoiceRewards(choice, newRewards)
            expect(choice.getRewards()).toEqual(newRewards)

            const plainObj: { rewards?: IChoiceModifier[] } = {}
            setChoiceRewards(plainObj, newRewards)
            expect(plainObj.rewards).toEqual(newRewards)

            // No-op for null choice
            setChoiceRewards(null, newRewards)
        })

        it('adds rewards via addChoiceReward for both Choice and plain objects', () => {
            const reward: IChoiceModifier = { id: 'r3', type: 'item', name: 'Pierścień', value: 1 }

            addChoiceReward(choice, reward)
            expect(choice.getRewards()).toContainEqual(reward)

            const plainObj: { rewards?: IChoiceModifier[] } = {}
            addChoiceReward(plainObj, reward)
            expect(plainObj.rewards).toEqual([reward])

            // Gracefully handles null/undefined inputs
            addChoiceReward(null, reward)
            addChoiceReward(plainObj, null as unknown as IChoiceModifier)
        })
    })

    describe('removeRewardAtIndex', () => {
        it('returns false and does not call onSave if choice is missing or index is out of bounds', () => {
            const onSave = vi.fn()
            expect(removeRewardAtIndex(null, 0, onSave)).toBe(false)
            expect(removeRewardAtIndex(choice, -1, onSave)).toBe(false)
            expect(removeRewardAtIndex(choice, 0, onSave)).toBe(false)
            expect(onSave).not.toHaveBeenCalled()
        })

        it('removes reward at given index and invokes onSave callback', () => {
            const onSave = vi.fn()
            choice.addReward({ id: 'r1', type: 'item', name: 'Diament', value: 1 })
            choice.addReward({
                id: 'r2',
                type: 'parameter',
                name: 'Punkty Doświadczenia',
                value: 50,
            })

            const result = removeRewardAtIndex(choice, 0, onSave)
            expect(result).toBe(true)
            expect(choice.getRewards().length).toBe(1)
            expect(choice.getRewards()[0].name).toBe('Punkty Doświadczenia')
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('renderRewardItemHtml', () => {
        it('returns empty string when reward is null or undefined', () => {
            expect(renderRewardItemHtml(null, 0)).toBe('')
            expect(renderRewardItemHtml(undefined, 0)).toBe('')
        })

        it('renders item badge for item type', () => {
            const html = renderRewardItemHtml(
                { type: 'item', name: 'Magiczna Różdżka', value: 1 },
                0
            )
            expect(html).toContain('bg-amber-950/60')
            expect(html).toContain('text-amber-300')
            expect(html).toContain('Przedmiot')
            expect(html).toContain('Magiczna Różdżka')
            expect(html).toContain('+1')
            expect(html).toContain('data-reward-idx="0"')
        })

        it('renders parameter badge for parameter type', () => {
            const html = renderRewardItemHtml({ type: 'parameter', name: 'Charyzma', value: 2 }, 1)
            expect(html).toContain('bg-emerald-950/60')
            expect(html).toContain('text-emerald-300')
            expect(html).toContain('Parametr / Zasób')
            expect(html).toContain('Charyzma')
            expect(html).toContain('+2')
            expect(html).toContain('data-reward-idx="1"')
        })

        it('escapes malicious HTML in reward name to prevent XSS', () => {
            const maliciousName = '<img src=x onerror=alert(1)>'
            const html = renderRewardItemHtml({ type: 'item', name: maliciousName, value: 5 }, 0)
            expect(html).not.toContain('<img src=x onerror=alert(1)>')
            expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
        })
    })

    describe('renderRewardsListHtml', () => {
        it('renders empty message when there are no rewards', () => {
            expect(renderRewardsListHtml([])).toContain('Brak zdefiniowanych nagród')
            expect(renderRewardsListHtml(null as unknown as IChoiceModifier[])).toContain(
                'Brak zdefiniowanych nagród'
            )
        })

        it('renders multiple reward items in order', () => {
            const list: IChoiceModifier[] = [
                { id: '1', type: 'item', name: 'Złoty klucz', value: 1 },
                { id: '2', type: 'parameter', name: 'Złoto', value: 50 },
            ]
            const html = renderRewardsListHtml(list)
            expect(html).toContain('Złoty klucz')
            expect(html).toContain('Złoto')
            expect(html).toContain('+1')
            expect(html).toContain('+50')
        })
    })

    describe('promptAddReward', () => {
        it('returns null if choice is null', () => {
            expect(promptAddReward({ choice: null })).toBeNull()
        })

        it('aborts and returns null if user cancels name prompt', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValue(null)

            const result = promptAddReward({ choice, onSave, promptFn })
            expect(result).toBeNull()
            expect(onSave).not.toHaveBeenCalled()
            expect(choice.getRewards().length).toBe(0)
        })

        it('aborts and returns null if user inputs only whitespace', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValue('   ')

            const result = promptAddReward({ choice, onSave, promptFn })
            expect(result).toBeNull()
            expect(onSave).not.toHaveBeenCalled()
        })

        it('adds an item reward when confirm returns true', () => {
            const onSave = vi.fn()
            const renderRewards = vi.fn()
            const scrollIntoView = vi.fn()
            const sectionEl = { scrollIntoView } as unknown as HTMLElement

            const promptFn = vi
                .fn()
                .mockReturnValueOnce(' Amulet Ochronny ')
                .mockReturnValueOnce('1')
            const confirmFn = vi.fn().mockReturnValue(true)

            const created = promptAddReward({
                choice,
                onSave,
                renderRewards,
                sectionEl,
                promptFn,
                confirmFn,
            })

            expect(created).not.toBeNull()
            expect(created?.type).toBe('item')
            expect(created?.name).toBe('Amulet Ochronny')
            expect(created?.value).toBe(1)
            expect(choice.getRewards().length).toBe(1)
            expect(onSave).toHaveBeenCalledTimes(1)
            expect(renderRewards).toHaveBeenCalledTimes(1)
            expect(scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest',
            })
        })

        it('adds a parameter reward when confirm returns false', () => {
            const promptFn = vi.fn().mockReturnValueOnce('Doświadczenie').mockReturnValueOnce('100')
            const confirmFn = vi.fn().mockReturnValue(false)

            const created = promptAddReward({ choice, promptFn, confirmFn })
            expect(created?.type).toBe('parameter')
            expect(created?.name).toBe('Doświadczenie')
            expect(created?.value).toBe(100)
        })

        it('defaults value to 1 if quantity is invalid or less than 1', () => {
            const promptFn = vi
                .fn()
                .mockReturnValueOnce('Moneta')
                .mockReturnValueOnce('not-a-number')
            const confirmFn = vi.fn().mockReturnValue(true)

            const created = promptAddReward({ choice, promptFn, confirmFn })
            expect(created?.value).toBe(1)
        })
    })

    describe('createChoiceRewardsSection UI component', () => {
        it('renders section structure with localized headers and action buttons', () => {
            const { sectionEl } = createChoiceRewardsSection({ choice })

            expect(sectionEl.textContent).toContain('Nagrody i Zysk')
            expect(sectionEl.textContent).toContain('+ Dodaj nagrodę')
            expect(sectionEl.textContent).toContain('Przedmioty lub punkty zasobów')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-rewards')
            expect(removeAllBtn).not.toBeNull()
            expect(removeAllBtn?.getAttribute('title')).toBe('Usuń nagrody')
            expect(removeAllBtn?.getAttribute('aria-label')).toBe('Usuń nagrody')
        })

        it('renders initial rewards when renderRewards is called', () => {
            choice.addReward({ id: 'r1', type: 'item', name: 'Księga Zaklęć', value: 1 })
            const { sectionEl, renderRewards } = createChoiceRewardsSection({ choice })

            renderRewards()
            expect(sectionEl.textContent).toContain('Księga Zaklęć')
            expect(sectionEl.textContent).toContain('+1')
        })

        it('triggers promptAddReward and updates list when add button is clicked', () => {
            const onSave = vi.fn()
            const promptFn = vi.fn().mockReturnValueOnce('Złota Moneta').mockReturnValueOnce('10')
            const confirmFn = vi.fn().mockReturnValue(false)

            const { sectionEl } = createChoiceRewardsSection({
                choice,
                onSave,
                promptFn,
                confirmFn,
            })

            const addBtn = sectionEl.querySelector('#btn-add-choice-reward') as HTMLButtonElement
            expect(addBtn).not.toBeNull()
            addBtn.click()

            expect(choice.getRewards().length).toBe(1)
            expect(sectionEl.textContent).toContain('Złota Moneta')
            expect(sectionEl.textContent).toContain('+10')
            expect(onSave).toHaveBeenCalled()
        })

        it('removes single reward when its delete button is clicked', () => {
            const onSave = vi.fn()
            choice.addReward({ id: 'r1', type: 'item', name: 'Srebrny Sztylet', value: 1 })

            const { sectionEl, renderRewards } = createChoiceRewardsSection({
                choice,
                onSave,
            })
            renderRewards()

            const deleteBtn = sectionEl.querySelector('.btn-remove-reward') as HTMLButtonElement
            expect(deleteBtn).not.toBeNull()
            deleteBtn.click()

            expect(choice.getRewards().length).toBe(0)
            expect(sectionEl.textContent).toContain('Brak zdefiniowanych nagród')
            expect(onSave).toHaveBeenCalled()
        })

        it('clears all rewards when remove-all button is clicked', () => {
            const onRemoveAll = vi.fn()
            choice.addReward({ id: 'r1', type: 'item', name: 'Złoty Klucz', value: 1 })
            choice.addReward({ id: 'r2', type: 'parameter', name: 'Złoto', value: 50 })

            const { sectionEl, renderRewards } = createChoiceRewardsSection({
                choice,
                onRemoveAll,
            })
            renderRewards()

            const removeAllBtn = sectionEl.querySelector(
                '#btn-remove-all-rewards'
            ) as HTMLButtonElement
            expect(removeAllBtn).not.toBeNull()
            removeAllBtn.click()

            expect(choice.getRewards().length).toBe(0)
            expect(sectionEl.textContent).toContain('Brak zdefiniowanych nagród')
            expect(onRemoveAll).toHaveBeenCalledTimes(1)
        })

        it('falls back to onSave when remove-all button is clicked and onRemoveAll is not provided', () => {
            const onSave = vi.fn()
            choice.addReward({ id: 'r1', type: 'item', name: 'Klejnot', value: 1 })

            const { sectionEl, renderRewards } = createChoiceRewardsSection({
                choice,
                onSave,
            })
            renderRewards()

            const removeAllBtn = sectionEl.querySelector(
                '#btn-remove-all-rewards'
            ) as HTMLButtonElement
            removeAllBtn.click()

            expect(choice.getRewards().length).toBe(0)
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('multilingual support', () => {
        it('renders German translations correctly', async () => {
            await initTranslationsWithLocale('de')
            const { sectionEl } = createChoiceRewardsSection({ choice })

            expect(sectionEl.textContent).toContain('Belohnungen & Gewinn')
            expect(sectionEl.textContent).toContain('+ Belohnung hinzufügen')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-rewards')
            expect(removeAllBtn?.getAttribute('title')).toBe('Belohnungen entfernen')
        })

        it('renders English translations correctly', async () => {
            await initTranslationsWithLocale('en')
            const { sectionEl } = createChoiceRewardsSection({ choice })

            expect(sectionEl.textContent).toContain('Rewards & Gain')
            expect(sectionEl.textContent).toContain('+ Add reward')

            const removeAllBtn = sectionEl.querySelector('#btn-remove-all-rewards')
            expect(removeAllBtn?.getAttribute('title')).toBe('Remove rewards')
        })
    })
})
