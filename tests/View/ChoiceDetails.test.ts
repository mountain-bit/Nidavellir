// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { renderChoiceDetails } from '../../View/ui/detailsPanel/choice/choiceDetails.js'
import * as ChoiceModule from '../../View/ui/detailsPanel/choice/index.js'
import { renderChoiceDetails as renderChoiceDetailsRoot } from '../../View/ui/detailsPanel/choiceDetails.js'

describe('choiceDetails module & choice index', () => {
    let container: HTMLElement
    let choice: Choice
    let fromParagraph: Paragraph
    let toParagraph: Paragraph
    let ctx: {
        projectParagraphs: Paragraph[]
        vm: {
            updateChoiceDetails: ReturnType<typeof vi.fn>
            deleteChoice: ReturnType<typeof vi.fn>
        }
        renderConnectionsList: ReturnType<typeof vi.fn>
        renderParagraphsList: ReturnType<typeof vi.fn>
        selectEntity: ReturnType<typeof vi.fn>
        storyGraphInstance: { render: ReturnType<typeof vi.fn> }
        selectionHistory: unknown[]
        historyIndex: number
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)

        choice = new Choice('choice_test_1', 'Przejdź przez drzwi', 'p_start', 'p_end')
        fromParagraph = new Paragraph('p_start', 'Komnata startowa')
        toParagraph = new Paragraph('p_end', 'Korytarz końcowy')

        ctx = {
            projectParagraphs: [fromParagraph, toParagraph],
            vm: {
                updateChoiceDetails: vi.fn(),
                deleteChoice: vi.fn(),
            },
            renderConnectionsList: vi.fn(),
            renderParagraphsList: vi.fn(),
            selectEntity: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
            },
            selectionHistory: [],
            historyIndex: -1,
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    it('exports renderChoiceDetails identically from root facade, submodule, and index', () => {
        expect(renderChoiceDetails).toBeDefined()
        expect(renderChoiceDetailsRoot).toBe(renderChoiceDetails)
        expect(ChoiceModule.renderChoiceDetails).toBe(renderChoiceDetails)
        expect(ChoiceModule.createChoiceHeader).toBeDefined()
        expect(ChoiceModule.createChoiceDiceSection).toBeDefined()
    })

    it('renders choice header, name input, and endpoints', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const nameInput = container.querySelector(
            '#details-choice-name-input'
        ) as HTMLInputElement | null
        expect(nameInput).not.toBeNull()
        expect(nameInput?.value).toBe('Przejdź przez drzwi')

        const nodesInfo = container.textContent || ''
        expect(nodesInfo).toContain('Komnata startowa')
        expect(nodesInfo).toContain('Korytarz końcowy')
    })

    it('handles adding an item condition via dropdown', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const dropdown = container.querySelector(
            '#choice-add-feature-select'
        ) as HTMLSelectElement | null
        expect(dropdown).not.toBeNull()

        if (dropdown) {
            dropdown.value = 'cond-item'
            dropdown.dispatchEvent(new Event('change'))
        }

        expect(choice.getCondition()).not.toBeNull()
        expect(choice.getCondition()?.getType()).toBe('item')
        expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
        expect(ctx.renderConnectionsList).toHaveBeenCalled()
    })

    it('handles adding a stat condition via dropdown', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const dropdown = container.querySelector(
            '#choice-add-feature-select'
        ) as HTMLSelectElement | null
        if (dropdown) {
            dropdown.value = 'cond-stat'
            dropdown.dispatchEvent(new Event('change'))
        }

        expect(choice.getCondition()).not.toBeNull()
        expect(choice.getCondition()?.getType()).toBe('stat')
        expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
    })

    it('handles adding a tag condition via dropdown', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const dropdown = container.querySelector(
            '#choice-add-feature-select'
        ) as HTMLSelectElement | null
        if (dropdown) {
            dropdown.value = 'cond-tag'
            dropdown.dispatchEvent(new Event('change'))
        }

        expect(choice.getCondition()).not.toBeNull()
        expect(choice.getCondition()?.getType()).toBe('tag')
        expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
    })

    it('handles adding a text condition via dropdown', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const dropdown = container.querySelector(
            '#choice-add-feature-select'
        ) as HTMLSelectElement | null
        if (dropdown) {
            dropdown.value = 'cond-text'
            dropdown.dispatchEvent(new Event('change'))
        }

        expect(choice.getCondition()).not.toBeNull()
        expect(choice.getCondition()?.getType()).toBe('text')
        expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
    })

    it('handles adding dice check via dropdown and updates branches', () => {
        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        const dropdown = container.querySelector(
            '#choice-add-feature-select'
        ) as HTMLSelectElement | null
        if (dropdown) {
            dropdown.value = 'dice'
            dropdown.dispatchEvent(new Event('change'))
        }

        const diceCheck = choice.getDiceCheck()
        expect(diceCheck).not.toBeNull()
        expect(diceCheck?.dice).toBe('1k6')
        expect(diceCheck?.branches?.length).toBe(2)
        expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
    })

    it('correctly handles choices with combat metadata', () => {
        choice.setIsCombatOutcome(true)
        fromParagraph.setHasCombat(true)
        fromParagraph.setCombat({
            getName: () => 'Walka z Goblinem',
            getCombatOpponents: () => [],
        } as unknown as import('../../Model/Combat').Combat)

        renderChoiceDetails(
            container,
            choice,
            { id: 'choice_test_1', name: 'Przejdź przez drzwi' },
            ctx
        )

        expect(container.textContent).toContain('Walka z Goblinem')
    })
})
