/**
 * @fileoverview Actions section component for Choice entities in the details panel.
 * Provides controls for focusing choices in the story graph and deleting choices
 * with safety confirmation modals and UI synchronisation.
 *
 * @module choiceActionsSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Focuses the choice or its source paragraph in the story graph workspace.
 *
 * @param {object} [choice] Choice instance or data object
 * @param {object} [ctx] UI context object
 */
export function handleShowGraph(choice, ctx) {
    if (!ctx) return

    const layout = ctx?.vm?.layout
    if (typeof layout?.setActiveMainView === 'function') {
        layout.setActiveMainView('graph')
    }
    if (typeof ctx.updateMainWorkspaceUI === 'function') {
        ctx.updateMainWorkspaceUI()
    }

    const targetId =
        (typeof choice?.getFromParagraphId === 'function'
            ? choice.getFromParagraphId()
            : choice?.fromParagraphId) ||
        (typeof choice?.getId === 'function' ? choice.getId() : choice?.id) ||
        ''

    if (targetId && typeof ctx.storyGraphInstance?.focusOnElement === 'function') {
        ctx.storyGraphInstance.focusOnElement(targetId)
    }
}

/**
 * Deletes a choice after user confirmation, updating project state and UI lists.
 *
 * @param {object} [params]
 * @param {object} [params.choice] Choice instance to delete
 * @param {object} [params.ctx] UI context object
 * @param {Function} [params.onRefreshDetails] Callback to refresh details panel
 * @param {(message: string) => boolean} [params.confirmFn] Optional confirmation prompt function
 * @returns {boolean} True if the choice was deleted, false otherwise
 */
export function handleDeleteChoice({ choice, ctx, onRefreshDetails, confirmFn } = {}) {
    if (!choice || !ctx) return false

    const choiceName =
        (typeof choice.getName === 'function' ? choice.getName() : choice.name) ||
        (typeof choice.getId === 'function' ? choice.getId() : choice.id) ||
        ''

    const promptConfirm =
        typeof confirmFn === 'function'
            ? confirmFn
            : typeof window !== 'undefined' && typeof window.confirm === 'function'
              ? window.confirm.bind(window)
              : typeof confirm === 'function'
                ? confirm
                : () => true

    const confirmMsg = t('context_menu.confirm_delete', { name: choiceName })
    if (!promptConfirm(confirmMsg)) {
        return false
    }

    const choiceId = typeof choice.getId === 'function' ? choice.getId() : choice.id
    if (!choiceId) return false

    const graph = ctx?.vm?.graph
    if (typeof graph?.deleteChoice === 'function') {
        graph.deleteChoice(choiceId, ctx.projectParagraphs || [])
    }

    if (typeof ctx.markProjectDirty === 'function') {
        ctx.markProjectDirty()
    } else if (typeof ctx.markDirty === 'function') {
        ctx.markDirty()
    } else if (typeof ctx.projectStateTracker?.markDirty === 'function') {
        ctx.projectStateTracker.markDirty()
    }

    if (typeof ctx.renderConnectionsList === 'function') {
        ctx.renderConnectionsList()
    }
    if (typeof ctx.renderParagraphsList === 'function') {
        ctx.renderParagraphsList()
    }

    if (typeof renderHistoryBar === 'function') {
        renderHistoryBar(ctx, onRefreshDetails)
    }

    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }

    if (typeof ctx.storyGraphInstance?.render === 'function') {
        ctx.storyGraphInstance.render(true)
    }

    if (typeof toast?.success === 'function') {
        toast.success(t('toast.connection_deleted'))
    }

    return true
}

/**
 * Creates the quick actions section for choices (Show Graph, Delete).
 *
 * @param {object} [params]
 * @param {object} [params.choice]
 * @param {object} [params.ctx]
 * @param {Function} [params.onRefreshDetails]
 * @param {(message: string) => boolean} [params.confirmFn]
 * @returns {HTMLElement}
 */
export function createChoiceActionsSection({ choice, ctx, onRefreshDetails, confirmFn } = {}) {
    const actionsMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(t('right_panel.quick_actions'))}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button" aria-label="${escapeHtml(t('right_panel.show_story_graph'))}">
            <span>${escapeHtml(t('right_panel.show_story_graph'))}</span>
            <span class="text-blue-400 shrink-0" aria-hidden="true">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        <button id="btn-details-delete-choice" class="w-full py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs text-left text-red-300 flex items-center justify-between cursor-pointer" type="button" aria-label="${escapeHtml(t('details.delete_connection'))}">
            <span>${escapeHtml(t('details.delete_connection'))}</span>
            <span class="text-red-400 shrink-0" aria-hidden="true">${getIconSvg('trash', 'w-3.5 h-3.5')}</span>
        </button>
    `
    )

    const showGraphBtn = actionsMod.querySelector('#btn-details-show-graph')
    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', () => {
            handleShowGraph(choice, ctx)
        })
    }

    const deleteChoiceBtn = actionsMod.querySelector('#btn-details-delete-choice')
    if (deleteChoiceBtn) {
        deleteChoiceBtn.addEventListener('click', () => {
            handleDeleteChoice({ choice, ctx, onRefreshDetails, confirmFn })
        })
    }

    return actionsMod
}
