import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Creates the quick actions section for choices (Show Graph, Delete).
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {object} params.ctx
 * @param {Function} [params.onRefreshDetails]
 * @returns {HTMLElement}
 */
export function createChoiceActionsSection({ choice, ctx, onRefreshDetails }) {
    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const actionsMod = createSection(
        'p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        <button id="btn-details-delete-choice" class="w-full py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs text-left text-red-300 flex items-center justify-between cursor-pointer" type="button">
            <span>${t('details.delete_connection')}</span>
            <span class="text-red-400 shrink-0">${getIconSvg('trash', 'w-3.5 h-3.5')}</span>
        </button>
    `
    )

    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = choice.getFromParagraphId() || choice.getId()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
    })

    actionsMod.querySelector('#btn-details-delete-choice').addEventListener('click', () => {
        if (confirm(t('context_menu.confirm_delete', { name: choice.getName() }))) {
            ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
            ctx.renderConnectionsList()
            ctx.renderParagraphsList()
            renderHistoryBar(ctx, onRefreshDetails)
            refreshDetails()
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            toast.success(t('toast.connection_deleted'))
        }
    })

    return actionsMod
}
