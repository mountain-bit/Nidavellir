// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Combat } from '../../Model/Combat'
import { Paragraph } from '../../Model/Paragraph'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import { renderCombatOutcomesSection } from '../../View/ui/detailsPanel/combat/combatOutcomesSection.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockCombatCtx {
    vm: MainWindowViewModel
    projectParagraphs: Paragraph[]
    projectData: {
        projectParagraphs: Paragraph[]
    }
    selectEntity: ReturnType<typeof vi.fn>
    markProjectDirty: ReturnType<typeof vi.fn>
    storyGraphInstance: {
        render: ReturnType<typeof vi.fn>
    }
}

describe('CombatOutcomesSection Component', () => {
    let vm: MainWindowViewModel
    let container: HTMLElement
    let sourceParagraph: Paragraph
    let targetParagraph1: Paragraph
    let combat: Combat
    let ctx: IMockCombatCtx
    let onModify: () => void
    let onFullRefresh: () => void

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = '<div id="container"></div>'
        container = document.getElementById('container')!

        vm = new MainWindowViewModel()
        sourceParagraph = new Paragraph('p_source', 'Jaskinia Potwora')
        sourceParagraph.setPosition({ x: 100, y: 150 })

        targetParagraph1 = new Paragraph('p_target1', 'Wioska')
        targetParagraph1.setIsNumberLocked(true)
        targetParagraph1.setNumber(1)

        combat = new Combat('c_1', 'Starcie z Trollem')
        sourceParagraph.setCombat(combat)
        sourceParagraph.setHasCombat(true)

        onModify = vi.fn()
        onFullRefresh = vi.fn()

        ctx = {
            vm,
            projectParagraphs: [sourceParagraph, targetParagraph1],
            projectData: {
                projectParagraphs: [sourceParagraph, targetParagraph1],
            },
            selectEntity: vi.fn(),
            markProjectDirty: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
            },
        }
    })

    it('renders outcomes section with title and empty list message initially', () => {
        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        expect(container.querySelector('#btn-toggle-add-outcome')).not.toBeNull()
        expect(container.textContent).toContain('Możliwe wyniki walki')
        expect(container.textContent).toContain('Brak zdefiniowanych wyników')
    })

    it('toggles add outcome form visibility', () => {
        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        const form = container.querySelector('#combat-add-outcome-form')!
        const toggleBtn = container.querySelector('#btn-toggle-add-outcome') as HTMLButtonElement

        expect(form.classList.contains('hidden')).toBe(true)

        toggleBtn.click()
        expect(form.classList.contains('hidden')).toBe(false)

        const cancelBtn = container.querySelector('#btn-cancel-add-outcome') as HTMLButtonElement
        cancelBtn.click()
        expect(form.classList.contains('hidden')).toBe(true)
    })

    it('switches between existing target mode and new paragraph mode', () => {
        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        const toggleBtn = container.querySelector('#btn-toggle-add-outcome') as HTMLButtonElement
        toggleBtn.click()

        const btnModeExisting = container.querySelector(
            '#btn-outcome-target-mode-existing'
        ) as HTMLButtonElement
        const btnModeNew = container.querySelector(
            '#btn-outcome-target-mode-new'
        ) as HTMLButtonElement
        const existingWrap = container.querySelector('#outcome-target-existing-wrap')!
        const newWrap = container.querySelector('#outcome-target-new-wrap')!
        const nameInput = container.querySelector('#combat-add-outcome-name') as HTMLInputElement
        const newTitleInput = container.querySelector(
            '#combat-add-outcome-new-title'
        ) as HTMLInputElement

        expect(existingWrap.classList.contains('hidden')).toBe(false)
        expect(newWrap.classList.contains('hidden')).toBe(true)

        nameInput.value = 'Ucieczka do lasu'

        btnModeNew.click()
        expect(existingWrap.classList.contains('hidden')).toBe(true)
        expect(newWrap.classList.contains('hidden')).toBe(false)
        expect(newTitleInput.value).toBe('Ucieczka do lasu')

        btnModeExisting.click()
        expect(existingWrap.classList.contains('hidden')).toBe(false)
        expect(newWrap.classList.contains('hidden')).toBe(true)
    })

    it('adds outcome targeting existing paragraph', () => {
        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        const toggleBtn = container.querySelector('#btn-toggle-add-outcome') as HTMLButtonElement
        toggleBtn.click()

        const nameInput = container.querySelector('#combat-add-outcome-name') as HTMLInputElement
        const targetSelect = container.querySelector(
            '#combat-add-outcome-target'
        ) as HTMLSelectElement
        const submitBtn = container.querySelector('#btn-submit-add-outcome') as HTMLButtonElement

        nameInput.value = 'Powrót do wioski'
        targetSelect.value = targetParagraph1.getId()

        submitBtn.click()

        expect(onFullRefresh).toHaveBeenCalled()
        const outcomes = combat.getOutcomes()
        expect(outcomes.length).toBe(1)
        expect(outcomes[0].name).toBe('Powrót do wioski')
        expect(outcomes[0].targetParagraphId).toBe(targetParagraph1.getId())

        const choice = sourceParagraph
            .getChoices()
            .find(c => c.getToParagraphId() === targetParagraph1.getId())
        expect(choice).toBeDefined()
        expect(choice?.getIsCombatOutcome()).toBe(true)
    })

    it('creates a new paragraph and links outcome when in new paragraph mode', () => {
        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        const toggleBtn = container.querySelector('#btn-toggle-add-outcome') as HTMLButtonElement
        toggleBtn.click()

        const btnModeNew = container.querySelector(
            '#btn-outcome-target-mode-new'
        ) as HTMLButtonElement
        btnModeNew.click()

        const nameInput = container.querySelector('#combat-add-outcome-name') as HTMLInputElement
        const newTitleInput = container.querySelector(
            '#combat-add-outcome-new-title'
        ) as HTMLInputElement
        const submitBtn = container.querySelector('#btn-submit-add-outcome') as HTMLButtonElement

        nameInput.value = 'Zwycięstwo'
        newTitleInput.value = 'Nagroda za pokonanie Trolla'

        submitBtn.click()

        expect(onFullRefresh).toHaveBeenCalled()

        // Verify combat outcome was added
        const outcomes = combat.getOutcomes()
        expect(outcomes.length).toBe(1)
        expect(outcomes[0].name).toBe('Zwycięstwo')

        // Verify new paragraph was added to ctx.projectParagraphs
        const newP = ctx.projectParagraphs.find(
            (p: Paragraph) => p.getTitle() === 'Nagroda za pokonanie Trolla'
        )
        expect(newP).toBeDefined()
        expect(outcomes[0].targetParagraphId).toBe(newP?.getId())

        // Verify position was computed relative to source paragraph
        const pos = newP?.getPosition()
        const sourcePos = sourceParagraph.getPosition()
        expect(pos?.x).toBe((sourcePos?.x ?? 0) + 260)
        expect(pos?.y).toBe((sourcePos?.y ?? 0) + 0)

        // Verify combat outcome choice was created and connected
        const choice = sourceParagraph
            .getChoices()
            .find(c => c.getToParagraphId() === newP?.getId())
        expect(choice).toBeDefined()
        expect(choice?.getName()).toBe('Zwycięstwo')
        expect(choice?.getIsCombatOutcome()).toBe(true)
    })

    it('navigates to target paragraph when clicking on target paragraph badge', () => {
        combat.addOutcome({
            id: 'out_win',
            name: 'Zwycięstwo',
            targetParagraphId: targetParagraph1.getId(),
            description: '',
        })

        renderCombatOutcomesSection(
            container,
            sourceParagraph,
            combat,
            [sourceParagraph, targetParagraph1],
            ctx,
            onModify,
            onFullRefresh
        )

        const badge = container.querySelector('.outcome-target-badge') as HTMLButtonElement
        expect(badge).not.toBeNull()
        badge.click()

        expect(ctx.selectEntity).toHaveBeenCalledWith(targetParagraph1, 'paragraph')
    })
})
