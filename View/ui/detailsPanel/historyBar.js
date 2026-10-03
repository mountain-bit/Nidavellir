import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { getTypeIconSvg } from '../htmlTemplates.js'

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

    const history = ctx.vm.getHistory()
    const selected = ctx.vm.getSelectedItem()

    if (history.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-gray-500 italic px-1 select-none">${t('details.history')}: ${t('details.history_empty')}</span>`
        return
    }

    const refresh = () => {
        renderHistoryBar(ctx, onRefreshDetails)
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'

    history.forEach(item => {
        const isActive = selected && selected.id === item.id && selected.type === item.type
        const tab = document.createElement('button')
        tab.type = 'button'
        tab.className = `group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            isActive
                ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
                : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'
        }`

        const icon = document.createElement('span')
        icon.className = 'text-[10px] opacity-80 shrink-0 inline-flex items-center'
        icon.innerHTML = getTypeIconSvg(item.type, 'w-3 h-3')

        const nameSpan = document.createElement('span')
        nameSpan.className = 'truncate max-w-[100px]'
        nameSpan.textContent = item.name

        const closeBtn = document.createElement('span')
        closeBtn.className =
            'ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5 inline-flex items-center'
        closeBtn.innerHTML = getIconSvg('close', 'w-3 h-3')
        closeBtn.title = t('buttons.close')
        closeBtn.addEventListener('click', e => {
            e.stopPropagation()
            ctx.vm.closeHistoryItem(item.id)
            refresh()
        })

        tab.appendChild(icon)
        tab.appendChild(nameSpan)
        tab.appendChild(closeBtn)

        tab.addEventListener('click', () => {
            ctx.vm.selectHistoryItem(item.id)
            refresh()
        })

        scrollWrapper.appendChild(tab)
    })

    const closeAllBtn = document.createElement('button')
    closeAllBtn.type = 'button'
    closeAllBtn.className =
        'shrink-0 ml-auto px-1.5 py-0.5 text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]'
    closeAllBtn.title = t('details.close_all')
    closeAllBtn.innerHTML = getIconSvg('close-all', 'w-3.5 h-3.5')
    closeAllBtn.addEventListener('click', () => {
        ctx.vm.closeAllHistory()
        refresh()
    })

    container.appendChild(scrollWrapper)
    container.appendChild(closeAllBtn)
}
