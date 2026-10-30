import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml, getTypeIconSvg } from '../../common/htmlTemplates.js'

/**
 * Pure HTML template for empty history state.
 */
export function renderEmptyHistoryHtml() {
    const historyTitle = t('details.history') || 'Historia'
    const emptyTitle = t('details.history_empty') || 'brak'
    return `<span class="text-[10px] text-gray-500 italic px-1 select-none">${escapeHtml(historyTitle)}: ${escapeHtml(emptyTitle)}</span>`
}

/**
 * Pure HTML template for a single history tab button.
 */
export function renderHistoryTabHtml({ item, isActive }) {
    const activeClasses = isActive
        ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
        : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'

    const typeIconHtml = getTypeIconSvg(item?.type, 'w-3 h-3')
    const closeIconHtml = getIconSvg('close', 'w-3 h-3')
    const closeTitle = t('buttons.close') || 'Zamknij'
    const itemName = item?.name || item?.id || ''

    return `
        <button type="button" data-history-id="${escapeHtml(item?.id || '')}" class="history-tab-btn group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${activeClasses}">
            <span class="text-[10px] opacity-80 shrink-0 inline-flex items-center">${typeIconHtml}</span>
            <span class="truncate max-w-[100px]">${escapeHtml(itemName)}</span>
            <span class="btn-close-history-item ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5 inline-flex items-center" title="${escapeHtml(closeTitle)}">
                ${closeIconHtml}
            </span>
        </button>
    `
}

/**
 * Pure HTML template for close-all button.
 */
export function renderCloseAllButtonHtml() {
    const closeAllTitle = t('details.close_all') || 'Zamknij wszystko'
    const iconHtml = getIconSvg('close-all', 'w-3.5 h-3.5')
    return `
        <button id="btn-close-all-history" type="button" class="shrink-0 ml-auto px-1.5 py-0.5 text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]" title="${escapeHtml(closeAllTitle)}">
            ${iconHtml}
        </button>
    `
}

/**
 * Renders the top history tabs bar in the right sidebar.
 *
 * @param {object} ctx Application UI Context
 * @param {Function} [onRefreshDetails] Optional callback to refresh details panel
 */
export function renderHistoryBar(ctx, onRefreshDetails) {
    const container = document.getElementById('history-tabs-container')
    if (!container) return
    container.innerHTML = ''

    const history = ctx?.vm?.getHistory ? ctx.vm.getHistory() : []
    const selected = ctx?.vm?.getSelectedItem ? ctx.vm.getSelectedItem() : null

    if (!history || history.length === 0) {
        container.innerHTML = renderEmptyHistoryHtml()
        return
    }

    const refresh = () => {
        renderHistoryBar(ctx, onRefreshDetails)
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'

    history.forEach(item => {
        const isActive = selected && selected.id === item.id && selected.type === item.type
        const tabWrapper = document.createElement('div')
        tabWrapper.innerHTML = renderHistoryTabHtml({ item, isActive })
        const tabBtn = tabWrapper.firstElementChild

        if (tabBtn) {
            tabBtn.addEventListener('click', () => {
                ctx.vm.selectHistoryItem(item.id)
                refresh()
            })

            const closeBtn = tabBtn.querySelector('.btn-close-history-item')
            if (closeBtn) {
                closeBtn.addEventListener('click', e => {
                    e.stopPropagation()
                    ctx.vm.closeHistoryItem(item.id)
                    refresh()
                })
            }

            scrollWrapper.appendChild(tabBtn)
        }
    })

    const closeAllWrapper = document.createElement('div')
    closeAllWrapper.innerHTML = renderCloseAllButtonHtml()
    const closeAllBtn = closeAllWrapper.firstElementChild
    if (closeAllBtn) {
        closeAllBtn.addEventListener('click', () => {
            ctx.vm.closeAllHistory()
            refresh()
        })
    }

    container.appendChild(scrollWrapper)
    if (closeAllBtn) {
        container.appendChild(closeAllBtn)
    }
}
