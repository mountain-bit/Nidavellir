import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Creates the Header & ID Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} itemId
 * @param {object} item The history item wrapper { id, name, type, entity }
 * @param {object} ctx Application UI Context
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement}
 */
export function createItemHeaderSection(entity, itemId, item, ctx, onRefreshDetails) {
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_inspector_title', 'Przedmiot')}</span>
            </span>
            <div class="flex items-center gap-1">
                <button id="btn-details-close-item" type="button" class="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer" title="${tr('buttons.close', 'Zamknij')}">
                    ${getIconSvg('close', 'w-3.5 h-3.5')}
                </button>
            </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-[#141416] px-2 py-1 rounded border border-zinc-800/80">
            <span class="truncate">ID: <span class="text-zinc-200 select-all">${escapeHtml(itemId)}</span></span>
            <button id="btn-copy-item-id" type="button" class="text-zinc-400 hover:text-amber-300 ml-1 cursor-pointer transition-colors" title="Kopiuj ID">
                ${getIconSvg('copy', 'w-3 h-3')}
            </button>
        </div>
    `
    )

    headerMod.querySelector('#btn-details-close-item').addEventListener('click', () => {
        if (ctx?.vm && typeof ctx.vm.closeHistoryItem === 'function') {
            ctx.vm.closeHistoryItem(item.id)
            if (typeof onRefreshDetails === 'function') {
                onRefreshDetails(ctx)
            } else if (typeof ctx.renderDetailsPanel === 'function') {
                ctx.renderDetailsPanel(ctx)
            }
            if (typeof ctx.refreshActiveSection === 'function') {
                ctx.refreshActiveSection('item')
            }
        }
    })

    headerMod.querySelector('#btn-copy-item-id').addEventListener('click', () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(itemId)
        }
    })

    return headerMod
}
