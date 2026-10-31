/**
 * Start Node Details Inspection Module
 *
 * Dedicated technical inspection panel for the START node in the story graph.
 * Displays start node information, outgoing exits, and quick graph focus action.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'
import { renderEntityHeaderModule } from './entityConfigModules.js'
import { renderExitsModule } from './exitsModule.js'
import { renderQuickActionsModule } from './quickActionsModule.js'

/**
 * Pure HTML template for Start Node informational section.
 *
 * @returns {string}
 */
export function renderStartNodeInfoHtml() {
    const entryPointTitle = t('graph.start_node_entry_point') || 'Punkt startowy'
    const technicalHint =
        t('graph.start_node_technical_hint') ||
        'Punkt wyjścia historii. Połącz z pierwszym paragrafem.'
    return `
        <div class="flex items-center gap-2">
            <span class="text-emerald-400 shrink-0">${getIconSvg('play', 'w-3.5 h-3.5')}</span>
            <span class="text-xs font-semibold text-zinc-200">
                ${escapeHtml(entryPointTitle)}
            </span>
        </div>
        <p class="text-[11px] text-zinc-400 leading-relaxed">
            ${escapeHtml(technicalHint)}
        </p>
    `
}

/**
 * Renders dedicated technical inspection panel for the START node.
 * Contains technical badge, instructional steps for the author,
 * outgoing exits, and graph focus action.
 * Omits markdown files, narrative summary, tags, locations, characters and stats.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {object} ctx
 * @param {Function} [onRefresh]
 */
export function renderStartNodeDetails(container, entity, item, ctx, onRefresh) {
    if (!container || !entity) return

    // 1. Standard entity header (type badge + ID)
    renderEntityHeaderModule(container, {
        type: 'start',
        id: entity.getId ? entity.getId() : item?.id || 'start',
    })

    // 2. Clean, elegant information section (consistent with details panel styling)
    const infoSection = createSection(
        'border-b border-[#333338] p-3 space-y-1',
        renderStartNodeInfoHtml()
    )
    container.appendChild(infoSection)

    // 3. Render outgoing exits from this start node
    renderExitsModule(container, entity, 'paragraph', ctx, onRefresh)

    // 4. Quick actions (focus on graph canvas)
    renderQuickActionsModule(container, item, 'paragraph', ctx)
}
