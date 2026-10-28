// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from '../../dist/Utils/toast.js'
import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import {
    createChoiceActionsSection,
    handleDeleteChoice,
    handleShowGraph,
} from '../../View/ui/detailsPanel/choice/choiceActionsSection.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockChoiceCtx {
    vm: MainWindowViewModel
    projectParagraphs: Paragraph[]
    updateMainWorkspaceUI: ReturnType<typeof vi.fn>
    renderConnectionsList: ReturnType<typeof vi.fn>
    renderParagraphsList: ReturnType<typeof vi.fn>
    renderDetailsPanel?: ReturnType<typeof vi.fn>
    markProjectDirty: ReturnType<typeof vi.fn>
    markDirty?: ReturnType<typeof vi.fn>
    projectStateTracker?: { markDirty: ReturnType<typeof vi.fn> }
    storyGraphInstance: {
        focusOnElement: ReturnType<typeof vi.fn>
        render: ReturnType<typeof vi.fn>
    }
}

describe('choiceActionsSection', () => {
    let vm: MainWindowViewModel
    let choice: Choice
    let ctx: IMockChoiceCtx
    let fromParagraph: Paragraph
    let toParagraph: Paragraph

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = `
            <div id="history-tabs-container"></div>
            <div id="toast-container"></div>
        `

        vm = new MainWindowViewModel()
        fromParagraph = new Paragraph('p_source', 'Wejście do lochów')
        toParagraph = new Paragraph('p_target', 'Sala tronowa')

        choice = new Choice('choice_1', 'Przejdź przez drzwi', 'p_source', 'p_target')
        fromParagraph.addChoice(choice)

        ctx = {
            vm,
            projectParagraphs: [fromParagraph, toParagraph],
            updateMainWorkspaceUI: vi.fn(),
            renderConnectionsList: vi.fn(),
            renderParagraphsList: vi.fn(),
            renderDetailsPanel: vi.fn(),
            markProjectDirty: vi.fn(),
            storyGraphInstance: {
                focusOnElement: vi.fn(),
                render: vi.fn(),
            },
        }
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('createChoiceActionsSection UI rendering', () => {
        it('renders quick actions section with buttons, icons, and accessible labels', () => {
            const section = createChoiceActionsSection({ choice, ctx })

            expect(section.tagName.toLowerCase()).toBe('section')
            expect(section.className).toContain('p-3 space-y-2')

            const showGraphBtn = section.querySelector(
                '#btn-details-show-graph'
            ) as HTMLButtonElement
            expect(showGraphBtn).not.toBeNull()
            expect(showGraphBtn.textContent).toContain('Pokaż graf historii')
            expect(showGraphBtn.getAttribute('aria-label')).toBe('Pokaż graf historii')
            expect(showGraphBtn.querySelector('svg')).not.toBeNull()

            const deleteBtn = section.querySelector(
                '#btn-details-delete-choice'
            ) as HTMLButtonElement
            expect(deleteBtn).not.toBeNull()
            expect(deleteBtn.textContent).toContain('Usuń przeskok')
            expect(deleteBtn.getAttribute('aria-label')).toBe('Usuń przeskok')
            expect(deleteBtn.querySelector('svg')).not.toBeNull()
        })

        it('does not crash when called with empty or undefined arguments', () => {
            expect(() => createChoiceActionsSection()).not.toThrow()
            const section = createChoiceActionsSection()
            expect(section.querySelector('#btn-details-show-graph')).not.toBeNull()
            expect(section.querySelector('#btn-details-delete-choice')).not.toBeNull()
        })

        it('triggers handleShowGraph on clicking show-graph button', () => {
            const spySetActiveView = vi.spyOn(vm, 'setActiveMainView')
            const section = createChoiceActionsSection({ choice, ctx })

            const showGraphBtn = section.querySelector(
                '#btn-details-show-graph'
            ) as HTMLButtonElement
            showGraphBtn.click()

            expect(spySetActiveView).toHaveBeenCalledWith('graph')
            expect(ctx.updateMainWorkspaceUI).toHaveBeenCalled()
            expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('p_source')
        })

        it('triggers handleDeleteChoice on clicking delete-choice button', () => {
            const onRefreshDetails = vi.fn()
            const confirmFn = vi.fn().mockReturnValue(true)

            const section = createChoiceActionsSection({
                choice,
                ctx,
                onRefreshDetails,
                confirmFn,
            })

            const deleteBtn = section.querySelector(
                '#btn-details-delete-choice'
            ) as HTMLButtonElement
            deleteBtn.click()

            expect(confirmFn).toHaveBeenCalled()
            expect(onRefreshDetails).toHaveBeenCalledWith(ctx)
        })
    })

    describe('handleShowGraph', () => {
        it('switches view to graph and focuses on source paragraph', () => {
            const spySetActiveView = vi.spyOn(vm, 'setActiveMainView')

            handleShowGraph(choice, ctx)

            expect(spySetActiveView).toHaveBeenCalledWith('graph')
            expect(ctx.updateMainWorkspaceUI).toHaveBeenCalled()
            expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('p_source')
        })

        it('falls back to choice ID when fromParagraphId is not available', () => {
            const orphanedChoice = new Choice('choice_orphan', 'Samotny wybór', '', 'p_target')

            handleShowGraph(orphanedChoice, ctx)

            expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('choice_orphan')
        })

        it('supports plain object choice representations', () => {
            const plainChoice = {
                fromParagraphId: 'plain_source',
                id: 'plain_choice',
            }

            handleShowGraph(plainChoice, ctx)

            expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('plain_source')
        })

        it('gracefully handles null ctx or missing graph instance without throwing', () => {
            expect(() => handleShowGraph(choice, undefined)).not.toThrow()
            expect(() =>
                handleShowGraph(choice, { vm: null } as unknown as IMockChoiceCtx)
            ).not.toThrow()
            expect(() =>
                handleShowGraph(choice, {
                    vm,
                    storyGraphInstance: null,
                } as unknown as IMockChoiceCtx)
            ).not.toThrow()
        })
    })

    describe('handleDeleteChoice', () => {
        it('returns false and performs no changes when user cancels confirmation', () => {
            const spyDelete = vi.spyOn(vm, 'deleteChoice')
            const confirmFn = vi.fn().mockReturnValue(false)
            const toastSpy = vi.spyOn(toast, 'success')

            const result = handleDeleteChoice({
                choice,
                ctx,
                confirmFn,
            })

            expect(result).toBe(false)
            expect(confirmFn).toHaveBeenCalledWith(expect.stringContaining('Przejdź przez drzwi'))
            expect(spyDelete).not.toHaveBeenCalled()
            expect(ctx.markProjectDirty).not.toHaveBeenCalled()
            expect(ctx.renderConnectionsList).not.toHaveBeenCalled()
            expect(toastSpy).not.toHaveBeenCalled()
        })

        it('deletes choice, marks project dirty, updates lists, history, and shows toast on confirmation', () => {
            const spyDelete = vi.spyOn(vm, 'deleteChoice')
            const confirmFn = vi.fn().mockReturnValue(true)
            const toastSpy = vi.spyOn(toast, 'success')
            const onRefreshDetails = vi.fn()

            const result = handleDeleteChoice({
                choice,
                ctx,
                onRefreshDetails,
                confirmFn,
            })

            expect(result).toBe(true)
            expect(spyDelete).toHaveBeenCalledWith('choice_1', ctx.projectParagraphs)
            expect(ctx.markProjectDirty).toHaveBeenCalled()
            expect(ctx.renderConnectionsList).toHaveBeenCalled()
            expect(ctx.renderParagraphsList).toHaveBeenCalled()
            expect(onRefreshDetails).toHaveBeenCalledWith(ctx)
            expect(ctx.storyGraphInstance.render).toHaveBeenCalledWith(true)
            expect(toastSpy).toHaveBeenCalledWith(
                expect.stringContaining('Połączenie zostało usunięte')
            )
            expect(document.getElementById('toast-container')?.textContent).toContain(
                'Połączenie zostało usunięte'
            )
        })

        it('falls back to ctx.renderDetailsPanel when onRefreshDetails is not provided', () => {
            const confirmFn = vi.fn().mockReturnValue(true)

            const result = handleDeleteChoice({
                choice,
                ctx,
                confirmFn,
            })

            expect(result).toBe(true)
            expect(ctx.renderDetailsPanel).toHaveBeenCalledWith(ctx)
        })

        it('falls back to ctx.markDirty or ctx.projectStateTracker.markDirty if markProjectDirty is absent', () => {
            const markDirtyMock = vi.fn()
            const fallbackCtx = {
                ...ctx,
                markProjectDirty: undefined as unknown as ReturnType<typeof vi.fn>,
                markDirty: markDirtyMock,
            }

            handleDeleteChoice({
                choice,
                ctx: fallbackCtx,
                confirmFn: () => true,
            })

            expect(markDirtyMock).toHaveBeenCalled()

            const stateTrackerMock = vi.fn()
            const trackerCtx = {
                ...ctx,
                markProjectDirty: undefined as unknown as ReturnType<typeof vi.fn>,
                markDirty: undefined,
                projectStateTracker: { markDirty: stateTrackerMock },
            }

            handleDeleteChoice({
                choice,
                ctx: trackerCtx,
                confirmFn: () => true,
            })

            expect(stateTrackerMock).toHaveBeenCalled()
        })

        it('uses choice ID in confirmation message if name is empty', () => {
            const unnamedChoice = new Choice('choice_empty_name', '', 'p_source', 'p_target')
            const confirmFn = vi.fn().mockReturnValue(false)

            handleDeleteChoice({
                choice: unnamedChoice,
                ctx,
                confirmFn,
            })

            expect(confirmFn).toHaveBeenCalledWith(expect.stringContaining('choice_empty_name'))
        })

        it('returns false gracefully when choice or ctx is missing', () => {
            expect(handleDeleteChoice()).toBe(false)
            expect(handleDeleteChoice({ choice: null, ctx })).toBe(false)
            expect(handleDeleteChoice({ choice, ctx: null })).toBe(false)
        })

        it('returns false gracefully when choice has no ID', () => {
            const noIdChoice = { name: 'Brak ID' }
            const confirmFn = vi.fn().mockReturnValue(true)

            expect(handleDeleteChoice({ choice: noIdChoice, ctx, confirmFn })).toBe(false)
        })
    })
})
