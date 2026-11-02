/**
 * Drawer Items List Module
 *
 * Renders the list of Items in the Left Drawer, including category badges,
 * modifiers, starting inventory indicators, and drag-and-drop bindings.
 */

import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import {
    attachContextMenuListeners,
    attachDragStartListeners,
    attachItemSelectionListeners,
} from './drawerInteractions.js'

const CATEGORY_BADGE_COLORS = {
    weapon: 'bg-red-950/70 text-red-300 border-red-800/40',
    armor: 'bg-blue-950/70 text-blue-300 border-blue-800/40',
    consumable: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40',
    quest: 'bg-amber-950/70 text-amber-300 border-amber-800/40',
    scroll: 'bg-purple-950/70 text-purple-300 border-purple-800/40',
    artifact: 'bg-purple-950/70 text-purple-300 border-purple-800/40',
    misc: 'bg-zinc-800/70 text-zinc-300 border-zinc-700/40',
}

/**
 * Renders the list of Items in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderItemsList(ctx) {
    const container = document.getElementById('items-list-container')
    if (!container) return

    const rawItems =
        ctx?.projectItems || ctx?.projectData?.projectItems || ctx?.projectData?.items || []
    const filter = ctx?.vm?.filter
    const filtered =
        filter && typeof filter.searchAndFilterItems === 'function'
            ? filter.searchAndFilterItems(rawItems)
            : rawItems

    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_items">${t('left_panel.no_items') || 'Brak przedmiotów w projekcie'}</p>`
        return
    }

    container.innerHTML = filtered
        .map(it => {
            const id = typeof it.getId === 'function' ? it.getId() : it.id || ''
            const name = typeof it.getName === 'function' ? it.getName() : it.name || id
            const category =
                typeof it.getCategory === 'function'
                    ? it.getCategory()
                    : it.inventoryConfig?.category || 'misc'
            const badgeClass =
                CATEGORY_BADGE_COLORS[category] || 'bg-zinc-800/70 text-zinc-300 border-zinc-700/40'

            const modifiers =
                (typeof it.getModifiers === 'function' ? it.getModifiers() : it.modifiers) || []
            const tags = (typeof it.getTags === 'function' ? it.getTags() : it.tags) || []
            const inStarting = Boolean(
                typeof it.isInStartingInventory === 'function'
                    ? it.isInStartingInventory()
                    : it.inventoryConfig?.inStartingInventory
            )

            const tagsBadges = tags
                .map(tObj => {
                    const color =
                        typeof tObj.getColor === 'function'
                            ? tObj.getColor()
                            : tObj.color || '#3b82f6'
                    const tName =
                        typeof tObj.getName === 'function'
                            ? tObj.getName()
                            : tObj.name || (typeof tObj === 'string' ? tObj : '')
                    return `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(color)}">${escapeHtml(tName)}</span>`
                })
                .join(' ')

            const modBadge =
                modifiers.length > 0
                    ? `<span class="px-1 py-0.2 rounded text-[8px] bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono shrink-0">+${modifiers.length} mod</span>`
                    : ''

            const startBadge = inStarting
                ? `<span class="px-1 py-0.2 rounded text-[8px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 uppercase font-mono font-semibold shrink-0" title="W ekwipunku startowym">START</span>`
                : ''

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-amber-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="item" data-item-id="${escapeHtml(id)}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                    <div class="flex items-center justify-between gap-1.5">
                        <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                            <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('backpack', 'w-3.5 h-3.5')}</span>
                            <span class="truncate">${escapeHtml(name)}</span>
                        </span>
                        <div class="flex items-center gap-1 shrink-0">
                            <span class="px-1 py-0.2 rounded text-[8px] border uppercase font-mono font-semibold shrink-0 ${badgeClass}">${escapeHtml(category)}</span>
                            ${startBadge}
                        </div>
                    </div>
                    ${
                        tagsBadges || modBadge
                            ? `<div class="flex flex-wrap items-center gap-1 mt-1">${modBadge} ${tagsBadges}</div>`
                            : ''
                    }
                </div>
            `
        })
        .join('')

    attachDragStartListeners(container, 'item')
    attachContextMenuListeners(container, 'item', rawItems, ctx)
    attachItemSelectionListeners(container, 'item', rawItems, ctx)

    container.querySelectorAll('.drawer-item[data-item-type="item"]').forEach(el => {
        el.addEventListener('click', () => {
            const id = el.dataset.itemId
            const item = rawItems.find(
                x => (typeof x.getId === 'function' ? x.getId() : x.id) === id
            )
            if (item && ctx.selectEntity) {
                ctx.selectEntity(item, 'item')
            }
        })
    })
}
