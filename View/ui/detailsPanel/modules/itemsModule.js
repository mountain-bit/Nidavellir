import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Triggers refresh of details panel and active workspace views.
 *
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 * @param {string} [type='paragraph']
 */
function refreshDetails(ctx, onRefreshDetails, type = 'paragraph') {
    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
    if (typeof ctx.refreshActiveSection === 'function') {
        ctx.refreshActiveSection(type)
    }
    if (ctx.storyGraphInstance && typeof ctx.storyGraphInstance.render === 'function') {
        ctx.storyGraphInstance.render(true)
    }
}

/**
 * Resolves the action badge styling and translation label.
 *
 * @param {string} action
 * @returns {{ label: string, badgeClass: string }}
 */
function getActionDisplayInfo(action) {
    switch (action) {
        case 'require':
            return {
                label: t('details.action_badge_require') || 'Wymagaj w ekwipunku',
                badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
            }
        case 'remove':
            return {
                label: t('details.action_badge_remove') || 'Utrata / Zużycie',
                badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/50',
            }
        case 'give':
        default:
            return {
                label: t('details.action_badge_give') || 'Znajdź / Otrzymaj',
                badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50',
            }
    }
}

/**
 * Renders associated items and item actions module in the Right Details Panel.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderItemsModule(container, entity, type, ctx, onRefreshDetails) {
    if (
        !entity ||
        (type !== 'paragraph' && type !== 'scene' && typeof entity.getItemActions !== 'function')
    ) {
        return
    }

    if (typeof entity.getIsStart === 'function' && entity.getIsStart()) {
        return
    }

    const currentActions =
        typeof entity.getItemActions === 'function'
            ? entity.getItemActions()
            : Array.isArray(entity.itemActions)
              ? entity.itemActions
              : []

    const projectItems =
        ctx.projectItems ||
        ctx.projectData?.projectItems ||
        ctx.projectData?.items ||
        (ctx.vm?.project?.getItems ? ctx.vm.project.getItems() : [])

    const findProjectItem = idOrName => {
        if (!idOrName) return null
        return (
            projectItems.find(it => {
                const id = typeof it.getId === 'function' ? it.getId() : it.id
                const name = typeof it.getName === 'function' ? it.getName() : it.name
                return id === idOrName || name === idOrName
            }) || null
        )
    }

    const itemsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                <span>${t('details.items') || 'Przedmioty'}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentActions.length}</span>
        </div>
        <div id="details-items-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>
        
        <!-- Formularz dodawania przedmiotu do paragrafu -->
        <div class="flex flex-col gap-1.5 pt-1 border-t border-zinc-800/80">
            <div class="flex gap-1 items-center">
                <select id="details-add-item-select" class="flex-1 min-w-0 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 truncate">
                    <option value="">-- ${t('details.select_item') || 'Wybierz przedmiot z projektu...'} --</option>
                </select>
                <select id="details-add-item-action-select" class="w-[110px] shrink-0 bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-amber-500">
                    <option value="give">${t('details.action_badge_give') || 'Znajdź / Otrzymaj'}</option>
                    <option value="require">${t('details.action_badge_require') || 'Wymagaj'}</option>
                    <option value="remove">${t('details.action_badge_remove') || 'Utrata'}</option>
                </select>
            </div>
            <div class="flex gap-1.5 items-center justify-between">
                <button id="btn-details-create-new-item" type="button" class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 rounded text-[11px] text-zinc-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors">
                    <span class="text-amber-400 inline-flex items-center">${getIconSvg('plus', 'w-3 h-3')}</span>
                    <span>${t('details.new_item') || 'Nowy...'}</span>
                </button>
                <button id="btn-details-add-item" type="button" class="px-3 py-1 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] rounded text-xs text-white font-medium cursor-pointer transition-colors shadow-sm">
                    ${t('details.add_item') || 'Dodaj'}
                </button>
            </div>
        </div>
    `
    )

    const itemsListEl = itemsMod.querySelector('#details-items-list')

    if (currentActions.length === 0) {
        itemsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_items') || 'Brak powiązanych przedmiotów'}</span>`
    } else {
        currentActions.forEach(action => {
            const projectItem = findProjectItem(action.itemId || action.itemName)
            const itemName =
                (projectItem &&
                    (typeof projectItem.getName === 'function'
                        ? projectItem.getName()
                        : projectItem.name)) ||
                action.itemName ||
                action.itemId ||
                'Przedmiot'
            const actionInfo = getActionDisplayInfo(action.action)

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

            const card = document.createElement('div')
            card.className =
                'flex flex-col gap-1.5 bg-[#18181b] p-2 rounded border border-[#27272a] hover:border-zinc-700 transition-colors text-xs'

            card.innerHTML = `
                <div class="flex items-center justify-between gap-1.5">
                    <span class="flex items-center gap-1.5 min-w-0 flex-1">
                        <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3.5 h-3.5')}</span>
                        <button type="button" class="btn-inspect-item font-semibold text-white hover:text-amber-300 text-left truncate cursor-pointer transition-colors" title="${escapeHtml(itemName)}">
                            ${escapeHtml(itemName)}
                        </button>
                    </span>
                    <button type="button" class="btn-remove-item text-gray-400 hover:text-red-400 p-0.5 rounded cursor-pointer shrink-0 transition-colors" title="${t('buttons.delete') || 'Usuń'}">
                        ${getIconSvg('close', 'w-3 h-3')}
                    </button>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
                    <div class="flex items-center gap-1">
                        <select class="select-item-action bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 focus:outline-none focus:border-amber-500">
                            <option value="give" ${action.action === 'give' ? 'selected' : ''}>${t('details.action_badge_give') || 'Zdobycie'}</option>
                            <option value="require" ${action.action === 'require' ? 'selected' : ''}>${t('details.action_badge_require') || 'Wymóg'}</option>
                            <option value="remove" ${action.action === 'remove' ? 'selected' : ''}>${t('details.action_badge_remove') || 'Utrata'}</option>
                        </select>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${actionInfo.badgeClass}">
                            ${action.action || 'give'}
                        </span>
                    </div>

                    <div class="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span class="text-[10px] text-zinc-500 font-mono">${t('details.item_quantity') || 'Ilość'}:</span>
                        <input type="number" min="1" max="999" value="${action.quantity || 1}" class="input-item-quantity w-11 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-[11px] font-mono text-center text-white focus:outline-none focus:border-amber-500" />
                    </div>
                </div>

                ${
                    tags.length > 0 || modifiers.length > 0 || slotSize > 1
                        ? `
                    <div class="flex flex-wrap items-center gap-1 pt-0.5">
                        ${
                            slotSize > 1
                                ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400">${slotSize} sloty</span>`
                                : ''
                        }
                        ${tags
                            .map(tg => {
                                const tgName =
                                    typeof tg.getName === 'function' ? tg.getName() : tg.name
                                const tgColor =
                                    typeof tg.getColor === 'function'
                                        ? tg.getColor()
                                        : tg.color || '#4a5b6d'
                                return `<span class="px-1.5 py-0.2 rounded text-[9px] font-medium text-white truncate max-w-[90px]" style="background-color: ${escapeHtml(tgColor)}80; border: 1px solid ${escapeHtml(tgColor)}">${escapeHtml(tgName)}</span>`
                            })
                            .join('')}
                        ${modifiers
                            .map(m => {
                                const sign = typeof m.value === 'number' && m.value > 0 ? '+' : ''
                                return `<span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-950/70 text-blue-300 border border-blue-700/50 font-bold">${escapeHtml(m.targetName)}: ${sign}${m.value}</span>`
                            })
                            .join('')}
                    </div>
                `
                        : ''
                }
            `

            // Inspect item when clicked
            const btnInspect = card.querySelector('.btn-inspect-item')
            btnInspect.addEventListener('click', () => {
                if (projectItem && typeof ctx.selectEntity === 'function') {
                    ctx.selectEntity(projectItem, 'item')
                } else if (ctx.vm && projectItem) {
                    ctx.vm.selectElement(projectItem, 'item')
                    refreshDetails(ctx, onRefreshDetails, type)
                }
            })

            // Remove item action
            const btnRemove = card.querySelector('.btn-remove-item')
            btnRemove.addEventListener('click', () => {
                if (typeof entity.removeItemAction === 'function') {
                    entity.removeItemAction(action.id || action.itemId)
                } else if (Array.isArray(entity.itemActions)) {
                    entity.itemActions = entity.itemActions.filter(
                        a => a.id !== (action.id || action.itemId) && a.itemId !== action.itemId
                    )
                }
                if (typeof ctx.markDirty === 'function') ctx.markDirty()
                refreshDetails(ctx, onRefreshDetails, type)
            })

            // Change action type (give / require / remove)
            const selAction = card.querySelector('.select-item-action')
            selAction.addEventListener('change', e => {
                action.action = e.target.value
                if (typeof entity.addItemAction === 'function') {
                    entity.addItemAction(action)
                }
                if (typeof ctx.markDirty === 'function') ctx.markDirty()
                refreshDetails(ctx, onRefreshDetails, type)
            })

            // Change quantity
            const inputQty = card.querySelector('.input-item-quantity')
            inputQty.addEventListener('change', e => {
                const val = parseInt(e.target.value, 10)
                action.quantity = !isNaN(val) && val > 0 ? val : 1
                inputQty.value = action.quantity
                if (typeof entity.addItemAction === 'function') {
                    entity.addItemAction(action)
                }
                if (typeof ctx.markDirty === 'function') ctx.markDirty()
            })

            itemsListEl.appendChild(card)
        })
    }

    // Populate Add Item Select dropdown
    const itemSelect = itemsMod.querySelector('#details-add-item-select')
    itemSelect.innerHTML =
        `<option value="">-- ${t('details.select_item') || 'Wybierz przedmiot z projektu...'} --</option>` +
        projectItems
            .map(it => {
                const id = typeof it.getId === 'function' ? it.getId() : it.id
                const name = typeof it.getName === 'function' ? it.getName() : it.name || id
                const cat =
                    typeof it.getCategory === 'function' ? it.getCategory() : it.category || 'misc'
                return `<option value="${escapeHtml(id)}">${escapeHtml(name)} (${escapeHtml(cat)})</option>`
            })
            .join('')

    // Button: Add existing item action
    itemsMod.querySelector('#btn-details-add-item').addEventListener('click', () => {
        const selectedId = itemSelect.value
        if (!selectedId) return

        const foundObj = findProjectItem(selectedId)
        const actionType = itemsMod.querySelector('#details-add-item-action-select').value || 'give'

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

        if (typeof ctx.markDirty === 'function') ctx.markDirty()
        refreshDetails(ctx, onRefreshDetails, type)
    })

    // Button: Create brand new Item inline and attach
    itemsMod.querySelector('#btn-details-create-new-item').addEventListener('click', () => {
        const defaultName = `Nowy przedmiot ${projectItems.length + 1}`
        const promptText = t('details.new_item_prompt') || 'Podaj nazwę nowego przedmiotu:'
        const nameInput =
            typeof window !== 'undefined' && typeof window.prompt === 'function'
                ? window.prompt(promptText, defaultName)
                : defaultName

        if (nameInput === null) return // cancelled
        const finalName = (nameInput || '').trim() || defaultName

        let newItem
        if (ctx.vm && typeof ctx.vm.createItem === 'function') {
            newItem = ctx.vm.createItem(finalName, defaultName)
        } else {
            newItem = {
                id: `item_${Date.now()}`,
                name: finalName,
                category: 'misc',
            }
        }

        // Add to projectItems collection
        if (Array.isArray(ctx.projectItems)) {
            ctx.projectItems.push(newItem)
        } else if (Array.isArray(ctx.projectData?.projectItems)) {
            ctx.projectData.projectItems.push(newItem)
        } else if (Array.isArray(ctx.projectData?.items)) {
            ctx.projectData.items.push(newItem)
        }

        const actionType = itemsMod.querySelector('#details-add-item-action-select').value || 'give'
        const itemId = typeof newItem.getId === 'function' ? newItem.getId() : newItem.id

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

        if (typeof ctx.markDirty === 'function') ctx.markDirty()
        refreshDetails(ctx, onRefreshDetails, type)
    })

    container.appendChild(itemsMod)
}
