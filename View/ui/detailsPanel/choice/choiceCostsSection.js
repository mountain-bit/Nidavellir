/**
 * @fileoverview Costs section component for Choice entities in the details panel.
 * Manages upfront requirements and deductions (consuming items, deducting stat points)
 * with prompt dialogs, badge previews, and instant deletion.
 *
 * @module choiceCostsSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Retrieves the array of costs from a Choice instance or plain object.
 *
 * @param {object} [choice]
 * @returns {Array<object>}
 */
export function getChoiceCosts(choice) {
    if (!choice) return []
    if (typeof choice.getCosts === 'function') {
        const costs = choice.getCosts()
        return Array.isArray(costs) ? costs : []
    }
    return Array.isArray(choice.costs) ? choice.costs : []
}

/**
 * Updates the costs on a Choice instance or plain object.
 *
 * @param {object} choice
 * @param {Array<object>} costs
 */
export function setChoiceCosts(choice, costs) {
    if (!choice) return
    const safeCosts = Array.isArray(costs) ? costs : []
    if (typeof choice.setCosts === 'function') {
        choice.setCosts(safeCosts)
    } else {
        choice.costs = safeCosts
    }
}

/**
 * Adds a cost item to a Choice instance or plain object.
 *
 * @param {object} choice
 * @param {object} cost
 */
export function addChoiceCost(choice, cost) {
    if (!choice || !cost) return
    if (typeof choice.addCost === 'function') {
        choice.addCost(cost)
    } else {
        if (!Array.isArray(choice.costs)) {
            choice.costs = []
        }
        choice.costs.push(cost)
    }
}

/**
 * Removes a cost at the specified index and calls onSave if provided.
 *
 * @param {object} choice
 * @param {number} index
 * @param {Function} [onSave]
 * @returns {boolean} True if removed, false otherwise
 */
export function removeCostAtIndex(choice, index, onSave) {
    if (!choice || typeof index !== 'number' || index < 0) return false
    const costs = [...getChoiceCosts(choice)]
    if (index >= costs.length) return false
    costs.splice(index, 1)
    setChoiceCosts(choice, costs)
    if (typeof onSave === 'function') {
        onSave()
    }
    return true
}

/**
 * Renders HTML for a single cost item badge and action.
 *
 * @param {object} cost
 * @param {number} index
 * @returns {string}
 */
export function renderCostItemHtml(cost, index) {
    if (!cost) return ''
    const isItem = cost.type === 'item'
    const typeBadgeClass = isItem
        ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
        : 'bg-red-950/60 text-red-300 border-red-800/40'
    const typeLabel = isItem ? t('details.modifier_item') : t('details.modifier_param')
    const costName = escapeHtml(cost.name || '')
    const costValue = typeof cost.value === 'number' ? cost.value : parseInt(cost.value, 10) || 1
    const deleteTitle = escapeHtml(t('buttons.delete'))

    return `
        <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs" role="listitem">
            <div class="flex items-center gap-2 min-w-0">
                <span class="px-1.5 py-0.2 rounded text-[10px] ${typeBadgeClass} font-medium">
                    ${escapeHtml(typeLabel)}
                </span>
                <span class="text-white font-medium truncate">${costName}</span>
                <span class="text-red-400 font-mono">-${costValue}</span>
            </div>
            <button type="button" data-cost-idx="${index}" class="btn-remove-cost text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${deleteTitle}" aria-label="${deleteTitle}">
                <span aria-hidden="true">${getIconSvg('trash', 'w-3 h-3')}</span>
            </button>
        </div>
    `
}

/**
 * Renders HTML for the full costs list or an empty fallback message.
 *
 * @param {Array<object>} [costs]
 * @returns {string}
 */
export function renderCostsListHtml(costs) {
    const list = Array.isArray(costs) ? costs : []
    if (list.length === 0) {
        return `<div class="text-[11px] text-gray-500 italic py-1">${escapeHtml(t('details.no_costs'))}</div>`
    }
    return list.map((c, idx) => renderCostItemHtml(c, idx)).join('')
}

/**
 * Prompts the user to create and add a new cost to the choice.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {Function} [params.onSave]
 * @param {Function} [params.renderCosts]
 * @param {HTMLElement} [params.sectionEl]
 * @param {Function} [params.promptFn]
 * @param {Function} [params.confirmFn]
 * @returns {object | null} The created cost object or null if cancelled
 */
export function promptAddCost({
    choice,
    onSave = () => {},
    renderCosts = () => {},
    sectionEl = null,
    promptFn = typeof window !== 'undefined' ? (msg, def) => window.prompt(msg, def) : () => null,
    confirmFn = typeof window !== 'undefined' ? msg => window.confirm(msg) : () => false,
}) {
    if (!choice) return null

    const name = promptFn(t('details.cost_prompt_name'))
    if (!name || !name.trim()) return null

    const valStr = promptFn(t('details.cost_prompt_value'), '1')
    const parsedVal = parseInt(valStr, 10)
    const val = Math.max(1, !isNaN(parsedVal) ? parsedVal : 1)

    const isItem = confirmFn(t('details.cost_prompt_is_item'))
    const type = isItem ? 'item' : 'parameter'

    const newCost = {
        id: `cost_${Date.now()}`,
        type,
        name: name.trim(),
        value: val,
    }

    addChoiceCost(choice, newCost)
    renderCosts()
    if (typeof onSave === 'function') {
        onSave()
    }
    if (sectionEl && typeof sectionEl.scrollIntoView === 'function') {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    return newCost
}

/**
 * Creates the costs / loss section for choices.
 *
 * @param {object} [params]
 * @param {object} [params.choice]
 * @param {Function} [params.onSave]
 * @param {Function} [params.onRemoveAll]
 * @param {Function} [params.promptFn]
 * @param {Function} [params.confirmFn]
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderCosts: () => void,
 *   promptAddCost: () => object | null
 * }}
 */
export function createChoiceCostsSection({
    choice,
    onSave = () => {},
    onRemoveAll,
    promptFn,
    confirmFn,
} = {}) {
    const removeCostsTitle = escapeHtml(t('details.remove_costs'))
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-red-400" aria-hidden="true">${getIconSvg('close', 'w-3 h-3')}</span>
                ${escapeHtml(t('details.costs_title'))}
            </span>
            <div class="flex items-center gap-2">
                <button type="button" id="btn-add-choice-cost" class="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                    ${escapeHtml(t('details.add_cost'))}
                </button>
                <button type="button" id="btn-remove-all-costs" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${removeCostsTitle}" aria-label="${removeCostsTitle}">
                    <span aria-hidden="true">${getIconSvg('close', 'w-3 h-3')}</span>
                </button>
            </div>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${escapeHtml(t('details.costs_help'))}</p>
        <div id="choice-costs-list" class="space-y-1.5" role="list"></div>
    `
    )

    const costsList = sectionEl.querySelector('#choice-costs-list')

    const renderCosts = () => {
        if (!costsList) return
        const costs = getChoiceCosts(choice)
        costsList.innerHTML = renderCostsListHtml(costs)

        costsList.querySelectorAll('.btn-remove-cost').forEach(btn => {
            btn.addEventListener('click', () => {
                const idxStr = btn.getAttribute('data-cost-idx')
                const idx = parseInt(idxStr, 10)
                if (!isNaN(idx)) {
                    removeCostAtIndex(choice, idx, onSave)
                    renderCosts()
                }
            })
        })
    }

    const triggerPromptAddCost = () => {
        return promptAddCost({
            choice,
            onSave,
            renderCosts,
            sectionEl,
            promptFn,
            confirmFn,
        })
    }

    const addBtn = sectionEl.querySelector('#btn-add-choice-cost')
    if (addBtn) {
        addBtn.addEventListener('click', triggerPromptAddCost)
    }

    const removeAllBtn = sectionEl.querySelector('#btn-remove-all-costs')
    if (removeAllBtn) {
        removeAllBtn.addEventListener('click', () => {
            setChoiceCosts(choice, [])
            renderCosts()
            if (typeof onRemoveAll === 'function') {
                onRemoveAll()
            } else if (typeof onSave === 'function') {
                onSave()
            }
        })
    }

    return {
        sectionEl,
        renderCosts,
        promptAddCost: triggerPromptAddCost,
    }
}
