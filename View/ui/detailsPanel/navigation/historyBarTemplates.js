import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml, getTypeIconSvg } from '../../common/htmlTemplates.js'

/**
 * Pure HTML template for empty history state.
 *
 * @returns {string}
 */
export function renderEmptyHistoryHtml() {
    const historyTitle = t('details.history') || 'Historia'
    const emptyTitle = t('details.history_empty') || 'brak'
    return `<span class="text-[10px] text-gray-500 italic px-1 select-none">${escapeHtml(historyTitle)}: ${escapeHtml(emptyTitle)}</span>`
}

/**
 * Pure HTML template for a single history tab button/item.
 * Uses role="tab" and separate button for tab closing to comply with HTML/W3C accessibility standards.
 *
 * @param {object} options
 * @param {object} options.item History item data
 * @param {boolean} [options.isActive=false] Whether this tab is currently selected
 * @returns {string}
 */
export function renderHistoryTabHtml({ item, isActive = false } = {}) {
    const activeClasses = isActive
        ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
        : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'

    const typeIconHtml = getTypeIconSvg(item?.type, 'w-3 h-3')
    const closeIconHtml = getIconSvg('close', 'w-3 h-3')
    const closeTitle = t('buttons.close') || 'Zamknij'
    const itemName = item?.name || item?.id || ''
    const itemId = item?.id || ''

    return `
        <div role="tab"
             tabindex="${isActive ? '0' : '-1'}"
             aria-selected="${isActive ? 'true' : 'false'}"
             data-history-id="${escapeHtml(itemId)}"
             class="history-tab-btn group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${activeClasses}">
            <span class="text-[10px] opacity-80 shrink-0 inline-flex items-center pointer-events-none">${typeIconHtml}</span>
            <span class="truncate max-w-[100px] pointer-events-none">${escapeHtml(itemName)}</span>
            <button type="button"
                    class="btn-close-history-item ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5 inline-flex items-center cursor-pointer transition-opacity"
                    title="${escapeHtml(closeTitle)}"
                    aria-label="${escapeHtml(closeTitle)}"
                    data-close-id="${escapeHtml(itemId)}">
                ${closeIconHtml}
            </button>
        </div>
    `
}

/**
 * Pure HTML template for close-all button.
 *
 * @returns {string}
 */
export function renderCloseAllButtonHtml() {
    const closeAllTitle = t('details.close_all') || 'Zamknij wszystko'
    const iconHtml = getIconSvg('close-all', 'w-3.5 h-3.5')
    return `
        <button id="btn-close-all-history"
                type="button"
                class="shrink-0 ml-auto px-1.5 py-0.5 text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
                title="${escapeHtml(closeAllTitle)}"
                aria-label="${escapeHtml(closeAllTitle)}">
            ${iconHtml}
        </button>
    `
}
