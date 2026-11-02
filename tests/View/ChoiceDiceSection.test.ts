// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice, ChoiceDiceCheck, DiceBranch } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import {
    addDiceCheckBranch,
    createChoiceDiceSection,
    getChoiceDiceCheck,
    getDiceCheckBranches,
    removeDiceCheckBranch,
    renderBranchesListHtml,
    renderBranchItemHtml,
    renderTargetOptionsHtml,
    setChoiceDiceCheck,
    syncDiceInputs,
    updateDiceCheckBranch,
} from '../../View/ui/detailsPanel/choice/choiceDiceSection.js'

describe('choiceDiceSection', () => {
    let choice: Choice
    let p1: Paragraph
    let p2: Paragraph
    let ctx: { projectParagraphs: Paragraph[] }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''
        choice = new Choice('choice_1', 'Przejdź przez most', 'p1', 'p2')
        p1 = new Paragraph('p1', 'Most Trolla')
        p2 = new Paragraph('p2', 'Druga strona rzeki')
        ctx = { projectParagraphs: [p1, p2] }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('getChoiceDiceCheck, setChoiceDiceCheck, getDiceCheckBranches', () => {
        it('returns null when choice is null or undefined', () => {
            expect(getChoiceDiceCheck(null)).toBeNull()
            expect(getChoiceDiceCheck(undefined)).toBeNull()
            expect(getDiceCheckBranches(null)).toEqual([])
        })

        it('retrieves and updates diceCheck on Choice instance and plain objects', () => {
            const dc: ChoiceDiceCheck = {
                dice: '2k6',
                stat: 'Zręczność',
                description: 'Skok nad przepaścią',
                branches: [{ min: 2, max: 7, targetParagraphId: 'p1', description: 'Porażka' }],
            }

            setChoiceDiceCheck(choice, dc)
            expect(getChoiceDiceCheck(choice)).toEqual(dc)
            expect(getDiceCheckBranches(choice)).toEqual(dc.branches)

            const plainObj: { diceCheck?: ChoiceDiceCheck | null } = {}
            setChoiceDiceCheck(plainObj, dc)
            expect(getChoiceDiceCheck(plainObj)).toEqual(dc)
            expect(getDiceCheckBranches(plainObj)).toEqual(dc.branches)

            // No-op for null choice
            setChoiceDiceCheck(null, dc)
        })
    })

    describe('addDiceCheckBranch, removeDiceCheckBranch, updateDiceCheckBranch', () => {
        let dc: ChoiceDiceCheck

        beforeEach(() => {
            dc = {
                dice: '1k6',
                branches: [
                    { min: 1, max: 3, targetParagraphId: 'p1', description: 'Porażka' },
                    { min: 4, max: 6, targetParagraphId: 'p2', description: 'Sukces' },
                ],
            }
            choice.setDiceCheck(dc)
        })

        it('adds a new branch to the dice check configuration', () => {
            const newBranch: DiceBranch = {
                min: 7,
                max: 10,
                targetParagraphId: 'p2',
                description: 'Krytyczny sukces',
            }
            addDiceCheckBranch(choice, newBranch)
            expect(getDiceCheckBranches(choice).length).toBe(3)
            expect(getDiceCheckBranches(choice)[2]).toEqual(newBranch)

            // Gracefully handles null inputs
            addDiceCheckBranch(null, newBranch)
            addDiceCheckBranch(choice, null as unknown as DiceBranch)
        })

        it('removes a branch at specified index and invokes onSave', () => {
            const onSave = vi.fn()
            expect(removeDiceCheckBranch(choice, -1, onSave)).toBe(false)
            expect(removeDiceCheckBranch(choice, 10, onSave)).toBe(false)
            expect(removeDiceCheckBranch(null, 0, onSave)).toBe(false)
            expect(onSave).not.toHaveBeenCalled()

            const success = removeDiceCheckBranch(choice, 0, onSave)
            expect(success).toBe(true)
            expect(getDiceCheckBranches(choice).length).toBe(1)
            expect(getDiceCheckBranches(choice)[0].description).toBe('Sukces')
            expect(onSave).toHaveBeenCalledTimes(1)
        })

        it('updates branch fields and invokes onSave callback', () => {
            const onSave = vi.fn()
            expect(updateDiceCheckBranch(choice, -1, { min: 2 }, onSave)).toBe(false)
            expect(updateDiceCheckBranch(choice, 10, { min: 2 }, onSave)).toBe(false)
            expect(updateDiceCheckBranch(null, 0, { min: 2 }, onSave)).toBe(false)

            const success = updateDiceCheckBranch(
                choice,
                0,
                { min: 2, max: 5, description: 'Zwykły sukces', targetParagraphId: 'p2' },
                onSave
            )
            expect(success).toBe(true)
            const updated = getDiceCheckBranches(choice)[0]
            expect(updated.min).toBe(2)
            expect(updated.max).toBe(5)
            expect(updated.description).toBe('Zwykły sukces')
            expect(updated.targetParagraphId).toBe('p2')
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('renderTargetOptionsHtml', () => {
        it('renders placeholder as first option', () => {
            const html = renderTargetOptionsHtml([], '')
            expect(html).toContain('<option value="">-- Wybierz cel --</option>')
        })

        it('renders paragraph options and marks the selected target', () => {
            const html = renderTargetOptionsHtml([p1, p2], 'p2')
            expect(html).toContain('value="p1"')
            expect(html).toContain('§ Most Trolla')
            expect(html).toContain('value="p2" selected')
            expect(html).toContain('§ Druga strona rzeki')
        })

        it('escapes paragraph titles and IDs to prevent HTML injection', () => {
            const maliciousP = new Paragraph('p_xss', '<script>alert(1)</script>')
            const html = renderTargetOptionsHtml([maliciousP], '')
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
        })
    })

    describe('renderBranchItemHtml and renderBranchesListHtml', () => {
        it('returns empty string when branch is null or undefined', () => {
            expect(renderBranchItemHtml(null, 0)).toBe('')
            expect(renderBranchItemHtml(undefined, 0)).toBe('')
        })

        it('renders branch card with inputs, options, and escaped description', () => {
            const branch: DiceBranch = {
                min: 3,
                max: 5,
                targetParagraphId: 'p1',
                description: 'Próba <zwinności>',
            }
            const html = renderBranchItemHtml(branch, 0, [p1])
            expect(html).toContain('Wynik:')
            expect(html).toContain('value="3"')
            expect(html).toContain('value="5"')
            expect(html).toContain('value="Próba &lt;zwinności&gt;"')
            expect(html).toContain('data-branch-remove="0"')
            expect(html).toContain('data-branch-field="desc"')
        })

        it('renders empty message when branches list is empty', () => {
            expect(renderBranchesListHtml([])).toContain('Brak zdefiniowanych przedziałów')
            expect(renderBranchesListHtml(null as unknown as DiceBranch[])).toContain(
                'Brak zdefiniowanych przedziałów'
            )
        })

        it('renders multiple branches in list', () => {
            const branches: DiceBranch[] = [
                { min: 1, max: 2, targetParagraphId: 'p1', description: 'Pech' },
                { min: 3, max: 6, targetParagraphId: 'p2', description: 'Szczęście' },
            ]
            const html = renderBranchesListHtml(branches, [p1, p2])
            expect(html).toContain('Pech')
            expect(html).toContain('Szczęście')
        })
    })

    describe('syncDiceInputs', () => {
        it('synchronizes select and input values from model into DOM', () => {
            const { sectionEl } = createChoiceDiceSection({ choice, ctx })
            choice.setDiceCheck({
                dice: '2k6',
                stat: 'Inteligencja',
                description: 'Test wiedzy tajemnej',
                branches: [],
            })

            syncDiceInputs(sectionEl, choice)

            const typeSelect = sectionEl.querySelector('#choice-dice-type') as HTMLSelectElement
            const statInput = sectionEl.querySelector('#choice-dice-stat') as HTMLInputElement
            const descInput = sectionEl.querySelector('#choice-dice-desc') as HTMLInputElement

            expect(typeSelect.value).toBe('2k6')
            expect(statInput.value).toBe('Inteligencja')
            expect(descInput.value).toBe('Test wiedzy tajemnej')
        })

        it('gracefully handles null sectionEl or null choice', () => {
            expect(() => syncDiceInputs(null, choice)).not.toThrow()
            expect(() => syncDiceInputs(document.createElement('div'), null)).not.toThrow()
        })
    })

    describe('createChoiceDiceSection UI component interactions', () => {
        let dc: ChoiceDiceCheck

        beforeEach(() => {
            dc = {
                dice: '1k6',
                stat: 'Siła',
                description: 'Wyważenie wrót',
                branches: [
                    { min: 1, max: 3, targetParagraphId: 'p1', description: 'Porażka' },
                    { min: 4, max: 6, targetParagraphId: 'p2', description: 'Sukces' },
                ],
            }
            choice.setDiceCheck(dc)
        })

        it('renders section headers, controls, and initial branches', () => {
            const { sectionEl, renderBranches, syncDiceInputs } = createChoiceDiceSection({
                choice,
                ctx,
            })
            syncDiceInputs()
            renderBranches()

            expect(sectionEl.textContent).toContain('Test Rzutu Kością')
            expect(sectionEl.textContent).toContain('Przedziały wyników i cele')
            const descInputs = sectionEl.querySelectorAll(
                'input[data-branch-field="desc"]'
            ) as NodeListOf<HTMLInputElement>
            expect(descInputs[0]?.value).toBe('Porażka')
            expect(descInputs[1]?.value).toBe('Sukces')

            const removeBtn = sectionEl.querySelector('#btn-remove-dice-check')
            expect(removeBtn).not.toBeNull()
            expect(removeBtn?.getAttribute('title')).toBe('Usuń test kością')
        })

        it('updates dice check properties and triggers onSave when inputs change', () => {
            const onSave = vi.fn()
            const { sectionEl } = createChoiceDiceSection({ choice, ctx, onSave })

            const typeSelect = sectionEl.querySelector('#choice-dice-type') as HTMLSelectElement
            typeSelect.value = '1k20'
            typeSelect.dispatchEvent(new Event('change'))
            expect(choice.getDiceCheck()?.dice).toBe('1k20')
            expect(onSave).toHaveBeenCalled()

            const statInput = sectionEl.querySelector('#choice-dice-stat') as HTMLInputElement
            statInput.value = 'Charyzma'
            statInput.dispatchEvent(new Event('input'))
            expect(choice.getDiceCheck()?.stat).toBe('Charyzma')

            const descInput = sectionEl.querySelector('#choice-dice-desc') as HTMLInputElement
            descInput.value = 'Próba perswazji'
            descInput.dispatchEvent(new Event('input'))
            expect(choice.getDiceCheck()?.description).toBe('Próba perswazji')
        })

        it('adds a new branch when add branch button is clicked', () => {
            const onSave = vi.fn()
            const { sectionEl, renderBranches } = createChoiceDiceSection({ choice, ctx, onSave })
            renderBranches()

            const addBtn = sectionEl.querySelector('#btn-add-dice-branch') as HTMLButtonElement
            addBtn.click()

            expect(choice.getDiceCheck()?.branches.length).toBe(3)
            const descInputs = sectionEl.querySelectorAll(
                'input[data-branch-field="desc"]'
            ) as NodeListOf<HTMLInputElement>
            expect(descInputs[2]?.value).toBe('Nowy wynik')
            expect(onSave).toHaveBeenCalled()
        })

        it('updates branch fields in model when branch inputs change', () => {
            const onSave = vi.fn()
            const { sectionEl, renderBranches } = createChoiceDiceSection({ choice, ctx, onSave })
            renderBranches()

            const minInput = sectionEl.querySelector(
                'input[data-branch-field="min"]'
            ) as HTMLInputElement
            minInput.value = '2'
            minInput.dispatchEvent(new Event('change'))
            expect(choice.getDiceCheck()?.branches[0].min).toBe(2)
            expect(onSave).toHaveBeenCalled()

            const descInput = sectionEl.querySelector(
                'input[data-branch-field="desc"]'
            ) as HTMLInputElement
            descInput.value = 'Częściowy sukces'
            descInput.dispatchEvent(new Event('change'))
            expect(choice.getDiceCheck()?.branches[0].description).toBe('Częściowy sukces')

            const targetSelect = sectionEl.querySelector(
                'select[data-branch-field="target"]'
            ) as HTMLSelectElement
            targetSelect.value = 'p2'
            targetSelect.dispatchEvent(new Event('change'))
            expect(choice.getDiceCheck()?.branches[0].targetParagraphId).toBe('p2')
        })

        it('removes branch when its trash button is clicked', () => {
            const onSave = vi.fn()
            const { sectionEl, renderBranches } = createChoiceDiceSection({ choice, ctx, onSave })
            renderBranches()

            const removeBtn = sectionEl.querySelector(
                '[data-branch-remove="0"]'
            ) as HTMLButtonElement
            removeBtn.click()

            expect(choice.getDiceCheck()?.branches.length).toBe(1)
            expect(choice.getDiceCheck()?.branches[0].description).toBe('Sukces')
            expect(onSave).toHaveBeenCalled()
        })

        it('removes dice check and calls onRemove when remove dice check button is clicked', () => {
            const onRemove = vi.fn()
            const { sectionEl } = createChoiceDiceSection({ choice, ctx, onRemove })

            const removeBtn = sectionEl.querySelector('#btn-remove-dice-check') as HTMLButtonElement
            removeBtn.click()

            expect(choice.getDiceCheck()).toBeNull()
            expect(onRemove).toHaveBeenCalledTimes(1)
        })

        it('falls back to onSave when remove dice check button is clicked and onRemove is not provided', () => {
            const onSave = vi.fn()
            const { sectionEl } = createChoiceDiceSection({ choice, ctx, onSave })

            const removeBtn = sectionEl.querySelector('#btn-remove-dice-check') as HTMLButtonElement
            removeBtn.click()

            expect(choice.getDiceCheck()).toBeNull()
            expect(onSave).toHaveBeenCalledTimes(1)
        })
    })

    describe('multilingual support', () => {
        it('renders German translations correctly', async () => {
            await initTranslationsWithLocale('de')
            const { sectionEl, renderBranches } = createChoiceDiceSection({ choice, ctx })
            renderBranches()

            expect(sectionEl.textContent).toContain('Würfelprobe')
            expect(sectionEl.textContent).toContain('Würfelart')
            expect(sectionEl.textContent).toContain('Ergebnisbereiche & Ziele')
            expect(sectionEl.textContent).toContain('+ Bereich hinzufügen')

            const removeBtn = sectionEl.querySelector('#btn-remove-dice-check')
            expect(removeBtn?.getAttribute('title')).toBe('Würfeltest entfernen')
        })

        it('renders English translations correctly', async () => {
            await initTranslationsWithLocale('en')
            const { sectionEl, renderBranches } = createChoiceDiceSection({ choice, ctx })
            renderBranches()

            expect(sectionEl.textContent).toContain('Dice Roll Check')
            expect(sectionEl.textContent).toContain('Dice type')
            expect(sectionEl.textContent).toContain('Outcome ranges & targets')
            expect(sectionEl.textContent).toContain('+ Add range')

            const removeBtn = sectionEl.querySelector('#btn-remove-dice-check')
            expect(removeBtn?.getAttribute('title')).toBe('Remove dice check')
        })
    })
})
