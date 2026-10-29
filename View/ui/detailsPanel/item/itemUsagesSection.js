import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

function tr(key, fallback) {
    const val = t(key)
    return val && val !== key ? val : fallback
}

/**
 * Finds all usages of an item across project paragraphs.
 *
 * @param {string} itemId
 * @param {string} itemName
 * @param {Array<object>} paragraphs
 * @returns {Array<{ paragraph: object, action: string, quantity: number }>}
 */
export function findItemUsages(itemId, itemName, paragraphs = []) {
    const usages = []
    if (!Array.isArray(paragraphs)) return usages

    paragraphs.forEach(p => {
        if (!p) return
        const actions = typeof p.getItemActions === 'function' ? p.getItemActions() : p.itemActions
        if (Array.isArray(actions)) {
            actions.forEach(a => {
                if (!a) return
                if ((itemId && a.itemId === itemId) || (itemName && a.itemName === itemName)) {
                    usages.push({
                        paragraph: p,
                        action: a.action || 'give',
                        quantity: typeof a.quantity === 'number' && a.quantity > 0 ? a.quantity : 1,
                    })
                }
            })
        }
    })

    return usages
}

/**
 * Returns badge class and localized label for an item action.
 *
 * @param {string} action
 * @param {number} [quantity=1]
 * @returns {{ badgeClass: string, badgeLabel: string }}
 */
export function getActionBadgeConfig(action, quantity = 1) {
    let badgeClass = 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50'
    let badgeLabel = tr('details.item_action_give', 'Otrzymaj')

    if (action === 'require') {
        badgeClass = 'bg-amber-950/70 text-amber-300 border-amber-600/50'
        badgeLabel = tr('details.item_action_require', 'Wymagaj')
    } else if (action === 'remove') {
        badgeClass = 'bg-rose-950/70 text-rose-300 border-rose-600/50'
        badgeLabel = tr('details.item_action_remove', 'Utrata')
    }

    const qtySuffix = quantity > 1 ? ` x${quantity}` : ''
    return {
        badgeClass,
        badgeLabel: `${badgeLabel}${qtySuffix}`,
    }
}

/**
 * Renders the HTML template string for Item Usages Section.
 *
 * @param {number} [usagesCount=0]
 * @returns {string}
 */
export function renderItemUsagesHtml(usagesCount = 0) {
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-indigo-400 shrink-0 inline-flex items-center">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                <span>${tr('details.item_usages_title', 'Występowanie w paragrafach')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${usagesCount}</span>
        </div>
        <div id="details-item-usages-list" class="flex flex-col gap-1 min-h-[20px]">
            ${
                usagesCount === 0
                    ? `<span class="text-xs text-gray-500 italic py-0.5">${tr('details.item_usages_empty', 'Przedmiot nie jest jeszcze przypisany do żadnego paragrafu.')}</span>`
                    : ''
            }
        </div>
    `
}

/**
 * Renders HTML for a single paragraph usage row.
 *
 * @param {object} usage Usage object { paragraph, action, quantity }
 * @returns {string}
 */
export function renderUsageItemHtml(usage) {
    const p = usage?.paragraph
    const pNum = typeof p?.getDisplayNumber === 'function' ? p.getDisplayNumber() : p?.number || ''
    const pTitle = typeof p?.getName === 'function' ? p.getName() : p?.name || ''
    const { badgeClass, badgeLabel } = getActionBadgeConfig(usage?.action, usage?.quantity)

    return `
        <div class="flex items-center gap-1.5 min-w-0">
            <span class="font-mono text-[10px] text-zinc-400 shrink-0">${pNum ? `#${escapeHtml(String(pNum))}` : '§'}</span>
            <span class="font-medium text-zinc-200 group-hover:text-white truncate">${escapeHtml(pTitle)}</span>
        </div>
        <span class="px-1.5 py-0.2 rounded text-[9px] font-semibold border ${badgeClass} shrink-0">
            ${escapeHtml(badgeLabel)}
        </span>
    `
}

/**
 * Creates a DOM row representing a paragraph usage with click navigation.
 *
 * @param {object} usage Usage object
 * @param {object} [ctx] Application UI Context
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLDivElement}
 */
export function createUsageRow(usage, ctx, onRefreshDetails) {
    const row = document.createElement('div')
    row.className =
        'flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] text-xs hover:border-zinc-600 transition-colors cursor-pointer group'
    row.innerHTML = renderUsageItemHtml(usage)

    row.addEventListener('click', () => {
        const p = usage?.paragraph
        if (!p) return

        if (typeof ctx?.selectEntity === 'function') {
            ctx.selectEntity(p, 'paragraph')
        } else if (ctx?.vm) {
            if (typeof ctx.vm.selectElement === 'function') {
                ctx.vm.selectElement(p, 'paragraph')
            }
            if (typeof onRefreshDetails === 'function') {
                onRefreshDetails(ctx)
            } else if (typeof ctx.renderDetailsPanel === 'function') {
                ctx.renderDetailsPanel(ctx)
            }
        }

        if (
            ctx?.storyGraphInstance &&
            typeof ctx.storyGraphInstance.focusOnElement === 'function'
        ) {
            const pId = typeof p.getId === 'function' ? p.getId() : p.id
            if (pId) {
                ctx.storyGraphInstance.focusOnElement(pId)
            }
        }
    })

    return row
}

/**
 * Creates the Paragraph Usages Section for the Item Details Panel.
 *
 * @param {object} [entity] The Item entity instance
 * @param {string} [itemId='']
 * @param {string} [itemName='']
 * @param {object} [ctx] Application UI Context
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement}
 */
export function createItemUsagesSection(
    entity,
    itemId = '',
    itemName = '',
    ctx = {},
    onRefreshDetails
) {
    const safeItemId =
        itemId || (typeof entity?.getId === 'function' ? entity.getId() : entity?.id) || ''
    const safeItemName =
        itemName || (typeof entity?.getName === 'function' ? entity.getName() : entity?.name) || ''

    const paragraphs = ctx?.projectParagraphs || []
    const usages = findItemUsages(safeItemId, safeItemName, paragraphs)

    const usagesMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderItemUsagesHtml(usages.length)
    )

    const usagesListEl = usagesMod.querySelector('#details-item-usages-list')
    if (!usagesListEl) {
        return usagesMod
    }

    usages.forEach(u => {
        const row = createUsageRow(u, ctx, onRefreshDetails)
        usagesListEl.appendChild(row)
    })

    return usagesMod
}
