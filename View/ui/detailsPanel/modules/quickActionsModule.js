import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Pure template for quick actions module.
 *
 * @returns {string}
 */
export function renderQuickActionsModuleHtml() {
    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
    `
}

/**
 * Renders quick actions section (e.g. Focus on graph canvas).
 *
 * @param {HTMLElement} container
 * @param {object} item
 * @param {string} type
 * @param {object} ctx
 */
export function renderQuickActionsModule(container, item, type, ctx) {
    if (!container) return
    const actionsMod = createSection('p-3 space-y-2', renderQuickActionsModuleHtml())

    const showGraphBtn = actionsMod.querySelector('#btn-details-show-graph')
    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', () => {
            const layout = ctx?.vm?.layout
            if (layout && typeof layout.setActiveMainView === 'function') {
                layout.setActiveMainView('graph')
            }
            if (ctx && typeof ctx.updateMainWorkspaceUI === 'function') {
                ctx.updateMainWorkspaceUI()
            }
            const targetId = item?.id
            if (
                ctx?.storyGraphInstance &&
                typeof ctx.storyGraphInstance.focusOnElement === 'function' &&
                targetId
            ) {
                ctx.storyGraphInstance.focusOnElement(targetId)
            }
            if (type === 'scene' && ctx && typeof ctx.renderScenesList === 'function') {
                ctx.renderScenesList()
            }
        })
    }
    container.appendChild(actionsMod)
}
