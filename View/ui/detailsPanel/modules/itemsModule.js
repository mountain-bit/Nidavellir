/**
 * @fileoverview Module for managing associated items and item actions (give, require, remove) on Paragraphs and Scenes.
 * Provides pure HTML template renderers and DOM interaction handlers with complete i18n, SVG icons, and XSS safety.
 *
 * @module itemsModule
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Triggers refresh of details panel and active workspace views.
 *
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @param {string} [type='paragraph']
 */
export function refreshDetails(ctx = {}, onRefreshDetails = null, type = 'paragraph') {
    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx?.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
    if (typeof ctx?.refreshActiveSection === 'function') {
        ctx.refreshActiveSection(type)
    }
    if (ctx?.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
        ctx.storyGraphInstance.render(true)
    }
}

/**
 * Resolves the action badge styling and translation label.
 *
 * @param {string} [action='give']
 * @returns {{ label: string, badgeClass: string }}
 */
export function getActionDisplayInfo(action = 'give') {
    switch (action) {
        case 'require':
            return {
                label: t('details.action_badge_require') || 'Wymagaj w ekwipunku',
                badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
            }
        case 'remove':
            return {
                label: t('details.action_badge_remove'),
                badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/50',
            }
        case 'give':
        default:
            return {
                label: t('details.action_badge_give'),
                badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
            }
    }
}

/**
 * Finds an item entity in the project items collection by ID or name.
 *
 * @param {Array<object>} [projectItems=[]]
 * @param {string} [idOrName='']
 * @returns {object | null}
 */
export function findProjectItem(projectItems = [], idOrName = '') {
    if (!idOrName || !Array.isArray(projectItems)) return null
    return (
        projectItems.find(it => {
            const id = typeof it?.getId === 'function' ? it.getId() : it?.id
            const name = typeof it?.getName === 'function' ? it.getName() : it?.name
            return id === idOrName || name === idOrName
        }) || null
    )
}

/**
 * Renders the header for items module with icon and counter.
 *
 * @param {number} [count=0]
 * @returns {string} HTML string
 */
export function renderItemsModuleHeaderHtml(count = 0) {
    const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(t('details.items'))}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${safeCount}</span>
        </div>`
}

/**
 * Renders empty state message for item actions.
 *
 * @returns {string} HTML string
 */
export function renderEmptyItemsHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(t('details.no_items'))}</span>`
}

/**
 * Renders option tags for action type select.
 *
 * @param {string} [selectedAction='give']
 * @returns {string} HTML string
 */
export function renderItemActionSelectOptionsHtml(selectedAction = 'give') {
    return `
        <option value="give" ${selectedAction === 'give' ? 'selected' : ''}>${escapeHtml(t('details.action_badge_give'))}</option>
        <option value="require" ${selectedAction === 'require' ? 'selected' : ''}>${escapeHtml(t('details.action_badge_require'))}</option>
        <option value="remove" ${selectedAction === 'remove' ? 'selected' : ''}>${escapeHtml(t('details.action_badge_remove'))}</option>
    `
}

/**
 * Renders dropdown options for project items.
 *
 * @param {Array<object>} [projectItems=[]]
 * @returns {string} HTML string
 */
export function renderProjectItemOptionsHtml(projectItems = []) {
    const defaultOption = `<option value="">-- ${escapeHtml(t('details.select_item'))} --</option>`
    const options = (Array.isArray(projectItems) ? projectItems : [])
        .map(it => {
            const id = typeof it?.getId === 'function' ? it.getId() : it?.id || ''
            const name = typeof it?.getName === 'function' ? it.getName() : it?.name || id
            const cat =
                typeof it?.getCategory === 'function' ? it.getCategory() : it?.category || 'misc'
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)} (${escapeHtml(cat)})</option>`
        })
        .join('')

    return defaultOption + options
}

/**
 * Renders tag badges for an item action card.
 *
 * @param {Array<object>} [tags=[]]
 * @returns {string} HTML string
 */
export function renderItemCardTagsHtml(tags = []) {
    if (!Array.isArray(tags) || tags.length === 0) return ''
    return tags
        .map(tg => {
            const tgName = typeof tg?.getName === 'function' ? tg.getName() : tg?.name || ''
            const tgColor =
                typeof tg?.getColor === 'function' ? tg.getColor() : tg?.color || '#4a5b6d'
            return `<span class="px-1.5 py-0.2 rounded text-[9px] font-medium text-white truncate max-w-[90px]" style="background-color: ${escapeHtml(tgColor)}80; border: 1px solid ${escapeHtml(tgColor)}">${escapeHtml(tgName)}</span>`
        })
        .join('')
}

/**
 * Renders modifier badges for an item action card.
 *
 * @param {Array<object>} [modifiers=[]]
 * @returns {string} HTML string
 */
export function renderItemCardModifiersHtml(modifiers = []) {
    if (!Array.isArray(modifiers) || modifiers.length === 0) return ''
    return modifiers
        .map(m => {
            const sign = typeof m?.value === 'number' && m.value > 0 ? '+' : ''
            return `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-950/70 text-blue-300 border border-blue-700/50 font-bold">${escapeHtml(m?.targetName || '')}: ${sign}${escapeHtml(String(m?.value ?? ''))}</span>`
        })
        .join('')
}

/**
 * Renders slot size badge if slot size > 1.
 *
 * @param {number} [slotSize=1]
 * @returns {string} HTML string
 */
export function renderItemSlotSizeBadgeHtml(slotSize = 1) {
    if (!Number.isFinite(slotSize) || slotSize <= 1) return ''
    const slotLabel =
        slotSize === 1 ? t('details.item_slot_singular') : t('details.item_slot_plural')
    return `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400">${slotSize} ${escapeHtml(slotLabel)}</span>`
}

/**
 * Renders an action card HTML for an item action.
 *
 * @param {object} action
 * @param {object | null} [projectItem=null]
 * @param {number} [index=0]
 * @returns {string} HTML string
 */
export function renderItemActionCardHtml(action, projectItem = null, index = 0) {
    const itemName =
        (projectItem &&
            (typeof projectItem.getName === 'function'
                ? projectItem.getName()
                : projectItem.name)) ||
        action?.itemName ||
        action?.itemId ||
        t('details.item') ||
        'Przedmiot'

    const actionType = action?.action || 'give'
    const actionInfo = getActionDisplayInfo(actionType)
    const quantity = Number.isFinite(action?.quantity) && action.quantity > 0 ? action.quantity : 1

    const tags =
        (projectItem &&
            (typeof projectItem.getTags === 'function'
                ? projectItem.getTags()
                : projectItem.tags)) ||
        []
    const modifiers =
        (projectItem &&
            (typeof projectItem.getModifiers === 'function'
                ? projectItem.getModifiers()
                : projectItem.modifiers)) ||
        []
    const slotSize =
        projectItem && typeof projectItem.getSlotSize === 'function'
            ? projectItem.getSlotSize()
            : (projectItem?.slotSize ?? 1)

    const tagsHtml = renderItemCardTagsHtml(tags)
    const modsHtml = renderItemCardModifiersHtml(modifiers)
    const slotHtml = renderItemSlotSizeBadgeHtml(slotSize)
    const hasBadges = Boolean(tagsHtml || modsHtml || slotHtml)

    const safeName = escapeHtml(itemName)
    const deleteTitle = escapeHtml(t('buttons.delete'))
    const quantityLabel = escapeHtml(t('details.item_quantity'))

    return `
        <div class="item-action-card flex flex-col gap-1.5 bg-[#18181b] p-2 rounded border border-[#27272a] hover:border-zinc-700 transition-colors text-xs" data-action-index="${index}">
            <div class="flex items-center justify-between gap-1.5">
                <span class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                    <button type="button" class="btn-inspect-item font-semibold text-white hover:text-amber-300 text-left truncate cursor-pointer transition-colors" title="${safeName}">
                        ${safeName}
                    </button>
                </span>
                <button type="button" class="btn-remove-item text-gray-400 hover:text-red-400 p-0.5 rounded cursor-pointer shrink-0 transition-colors" title="${deleteTitle}" aria-label="${deleteTitle}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>

            <div class="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
                <div class="flex items-center gap-1">
                    <select class="select-item-action bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 focus:outline-none focus:border-amber-500">
                        ${renderItemActionSelectOptionsHtml(actionType)}
                    </select>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${actionInfo.badgeClass}">
                        ${escapeHtml(actionType)}
                    </span>
                </div>

                <div class="flex items-center gap-1 text-[11px] text-zinc-400">
                    <span class="text-[10px] text-zinc-500 font-mono">${quantityLabel}:</span>
                    <input type="number" min="1" max="999" value="${quantity}" aria-label="${quantityLabel}" class="input-item-quantity w-11 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[11px] font-mono text-center text-white focus:outline-none focus:border-amber-500" />
                </div>
            </div>

            ${
                hasBadges
                    ? `
                <div class="flex flex-wrap items-center gap-1 pt-0.5">
                    ${slotHtml}
                    ${tagsHtml}
                    ${modsHtml}
                </div>`
                    : ''
            }
        </div>`
}

/**
 * Renders the add-item form section at the bottom of the items module.
 *
 * @param {Array<object>} [projectItems=[]]
 * @returns {string} HTML string
 */
export function renderAddItemBarHtml(projectItems = []) {
    const newItemLabel = escapeHtml(t('details.new_item') || 'Nowy...')
    const addItemLabel = escapeHtml(t('details.add_item') || 'Dodaj')

    return `
        <div class="flex flex-col gap-1.5 pt-1 border-t border-zinc-800/80">
            <div class="flex gap-1 items-center">
                <select id="details-add-item-select" aria-label="${escapeHtml(t('details.select_item'))}" class="flex-1 min-w-0 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 truncate">
                    ${renderProjectItemOptionsHtml(projectItems)}
                </select>
                <select id="details-add-item-action-select" class="w-[110px] shrink-0 bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-amber-500">
                    ${renderItemActionSelectOptionsHtml('give')}
                </select>
            </div>
            <div class="flex gap-1.5 items-center justify-between">
                <button id="btn-details-create-new-item" type="button" class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 rounded text-[11px] text-zinc-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors">
                    <span class="text-amber-400 inline-flex items-center">${getIconSvg('plus', 'w-3 h-3')}</span>
                    <span>${newItemLabel}</span>
                </button>
                <button id="btn-details-add-item" type="button" class="px-3 py-1 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm">
                    ${addItemLabel}
                </button>
            </div>
        </div>`
}

/**
 * Renders associated items and item actions module in the Right Details Panel.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderItemsModule(container, entity, type, ctx = {}, onRefreshDetails = null) {
    if (
        !container ||
        !entity ||
        (type !== 'paragraph' && type !== 'scene' && typeof entity.getItemActions !== 'function')
    ) {
        return null
    }

    if (typeof entity.getIsStart === 'function' && entity.getIsStart()) {
        return null
    }

    const currentActions =
        typeof entity.getItemActions === 'function'
            ? entity.getItemActions()
            : Array.isArray(entity.itemActions)
              ? entity.itemActions
              : []

    const projectItems =
        ctx?.projectItems ||
        ctx?.projectData?.projectItems ||
        ctx?.projectData?.items ||
        (ctx?.vm?.project?.getItems ? ctx.vm.project.getItems() : [])

    const itemsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        ${renderItemsModuleHeaderHtml(currentActions.length)}
        <div id="details-items-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${
                currentActions.length === 0
                    ? renderEmptyItemsHtml()
                    : currentActions
                          .map((action, idx) => {
                              const projectItem = findProjectItem(
                                  projectItems,
                                  action.itemId || action.itemName
                              )
                              return renderItemActionCardHtml(action, projectItem, idx)
                          })
                          .join('')
            }
        </div>
        ${renderAddItemBarHtml(projectItems)}
    `
    )

    // Wire up inspect, remove, action change, and quantity change for each card
    const cards = itemsMod.querySelectorAll('.item-action-card')
    cards.forEach(card => {
        const idx = Number(card.getAttribute('data-action-index'))
        const action = currentActions[idx]
        if (!action) return

        const projectItem = findProjectItem(projectItems, action.itemId || action.itemName)

        const btnInspect = card.querySelector('.btn-inspect-item')
        btnInspect?.addEventListener('click', () => {
            if (projectItem && typeof ctx?.selectEntity === 'function') {
                ctx.selectEntity(projectItem, 'item')
            } else if (ctx?.vm && projectItem) {
                ctx.vm.selectElement(projectItem, 'item')
                refreshDetails(ctx, onRefreshDetails, type)
            }
        })

        const btnRemove = card.querySelector('.btn-remove-item')
        btnRemove?.addEventListener('click', () => {
            if (typeof entity.removeItemAction === 'function') {
                entity.removeItemAction(action.id || action.itemId)
            } else if (Array.isArray(entity.itemActions)) {
                entity.itemActions = entity.itemActions.filter(
                    a => a.id !== (action.id || action.itemId) && a.itemId !== action.itemId
                )
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
            refreshDetails(ctx, onRefreshDetails, type)
        })

        const selAction = card.querySelector('.select-item-action')
        selAction?.addEventListener('change', e => {
            const targetVal = e?.target?.value || 'give'
            action.action = targetVal
            if (typeof entity.addItemAction === 'function') {
                entity.addItemAction(action)
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
            refreshDetails(ctx, onRefreshDetails, type)
        })

        const inputQty = card.querySelector('.input-item-quantity')
        inputQty?.addEventListener('change', e => {
            const val = parseInt(e?.target?.value, 10)
            action.quantity = !isNaN(val) && val > 0 ? val : 1
            if (inputQty) inputQty.value = String(action.quantity)
            if (typeof entity.addItemAction === 'function') {
                entity.addItemAction(action)
            }
            if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        })
    })

    const itemSelect = itemsMod.querySelector('#details-add-item-select')
    const actionSelect = itemsMod.querySelector('#details-add-item-action-select')
    const addBtn = itemsMod.querySelector('#btn-details-add-item')
    const createBtn = itemsMod.querySelector('#btn-details-create-new-item')

    // Add existing item action
    addBtn?.addEventListener('click', () => {
        const selectedId = itemSelect?.value
        if (!selectedId) return

        const foundObj = findProjectItem(projectItems, selectedId)
        const actionType = actionSelect?.value || 'give'

        const newAction = {
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            itemId: selectedId,
            itemName: foundObj
                ? (typeof foundObj.getName === 'function' ? foundObj.getName() : foundObj.name) ||
                  selectedId
                : selectedId,
            action: actionType,
            quantity: 1,
        }

        if (typeof entity.addItemAction === 'function') {
            entity.addItemAction(newAction)
        } else {
            if (!Array.isArray(entity.itemActions)) entity.itemActions = []
            entity.itemActions.push(newAction)
        }

        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        refreshDetails(ctx, onRefreshDetails, type)
    })

    // Create brand new item inline and attach
    createBtn?.addEventListener('click', () => {
        const defaultName = `${t('details.item_inspector_title')} ${projectItems.length + 1}`
        const promptText = t('details.new_item_prompt')
        const nameInput =
            typeof window !== 'undefined' && typeof window.prompt === 'function'
                ? window.prompt(promptText, defaultName)
                : defaultName

        if (nameInput === null) return // cancelled
        const finalName = (nameInput || '').trim() || defaultName

        let newItem
        if (ctx?.vm && typeof ctx.vm.createItem === 'function') {
            newItem = ctx.vm.createItem(finalName, defaultName)
        } else {
            newItem = {
                id: `item_${Date.now()}`,
                name: finalName,
                category: 'misc',
            }
        }

        if (Array.isArray(ctx?.projectItems)) {
            ctx.projectItems.push(newItem)
        } else if (Array.isArray(ctx?.projectData?.projectItems)) {
            ctx.projectData.projectItems.push(newItem)
        } else if (Array.isArray(ctx?.projectData?.items)) {
            ctx.projectData.items.push(newItem)
        }

        const actionType = actionSelect?.value || 'give'
        const itemId = typeof newItem?.getId === 'function' ? newItem.getId() : newItem?.id

        const newAction = {
            id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            itemId,
            itemName: finalName,
            action: actionType,
            quantity: 1,
        }

        if (typeof entity.addItemAction === 'function') {
            entity.addItemAction(newAction)
        } else {
            if (!Array.isArray(entity.itemActions)) entity.itemActions = []
            entity.itemActions.push(newAction)
        }

        if (typeof ctx?.markDirty === 'function') ctx.markDirty()
        refreshDetails(ctx, onRefreshDetails, type)
    })

    container.appendChild(itemsMod)
    return itemsMod
}
