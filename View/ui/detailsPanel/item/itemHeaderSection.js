/**
 * @fileoverview Header & ID Section for the Item Details Panel.
 * Displays item entity badge, close button, and interactive item ID with copy-to-clipboard functionality.
 *
 * @module itemHeaderSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Returns HTML string for the item header content.
 *
 * @param {string} itemId The unique item identifier
 * @returns {string} HTML markup string
 */
export function renderItemHeaderHtml(itemId = '') {
    const title = t('details.item_inspector_title') || t('details.type_item') || 'Przedmiot'
    const closeTitle = t('buttons.close') || 'Zamknij'
    const copyTitle = t('details.copy_id') || 'Kopiuj ID'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center" aria-hidden="true">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(title)}</span>
            </span>
            <div class="flex items-center gap-1">
                <button id="btn-details-close-item" data-action="close-item-details" type="button" class="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer" title="${escapeHtml(closeTitle)}">
                    <span aria-hidden="true">${getIconSvg('close', 'w-3.5 h-3.5')}</span>
                </button>
            </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-zinc-400 font-mono bg-[#141416] px-2 py-1 rounded border border-zinc-800/80">
            <span class="truncate">ID: <span class="text-zinc-200 select-all">${escapeHtml(itemId)}</span></span>
            <button id="btn-copy-item-id" data-action="copy-item-id" type="button" class="text-zinc-400 hover:text-amber-300 ml-1 cursor-pointer transition-colors" title="${escapeHtml(copyTitle)}">
                <span aria-hidden="true">${getIconSvg('copy', 'w-3 h-3')}</span>
            </button>
        </div>
    `
}

/**
 * Creates the Header & ID Section for the Item Details Panel.
 *
 * @param {object} entity The Item entity instance
 * @param {string} [itemId=''] Identifier of the item
 * @param {object} [item] The history item wrapper { id, name, type, entity }
 * @param {object} [ctx] Application UI Context
 * @param {Function} [onRefreshDetails] Callback triggered on details refresh
 * @returns {HTMLElement | null} Created section element or null if entity is missing
 */
export function createItemHeaderSection(
    entity,
    itemId = '',
    item = null,
    ctx = {},
    onRefreshDetails = null
) {
    if (!entity) return null

    const resolvedId = String(
        itemId ||
            (typeof entity.getId === 'function' ? entity.getId() : entity.id) ||
            item?.id ||
            ''
    )

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderItemHeaderHtml(resolvedId)
    )

    const closeBtn = headerMod.querySelector('#btn-details-close-item')
    closeBtn?.addEventListener('click', () => {
        const historyId = item?.id || resolvedId
        if (ctx?.vm && typeof ctx.vm.closeHistoryItem === 'function') {
            ctx.vm.closeHistoryItem(historyId)
        }
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
        if (typeof ctx?.refreshActiveSection === 'function') {
            ctx.refreshActiveSection('item')
        }
    })

    const copyBtn = headerMod.querySelector('#btn-copy-item-id')
    copyBtn?.addEventListener('click', () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(resolvedId)
                .then(() => {
                    const copiedMsg = t('details.id_copied') || 'Skopiowano ID do schowka'
                    toast.success(copiedMsg)
                })
                .catch(() => {})
        }
    })

    return headerMod
}
