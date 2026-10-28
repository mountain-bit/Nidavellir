/**
 * @fileoverview Precondition configuration section component for Choice entities.
 * Supports authoring dynamic requirements (Item inventory checks, Stat thresholds,
 * Tag flags, and free-form narrative text rules) with validation and datalist suggestions.
 *
 * @module choiceConditionSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    ItemCondition,
    StatCondition,
    TagCondition,
    TextCondition,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Detects the condition type ('item', 'stat', 'tag', 'text', or 'none') from a condition instance or object.
 *
 * @param {object} [condition]
 * @returns {'none' | 'item' | 'stat' | 'tag' | 'text'}
 */
export function detectConditionType(condition) {
    if (!condition) return 'none'
    if (
        condition instanceof ItemCondition ||
        condition.getType?.() === 'item' ||
        condition.type === 'item'
    ) {
        return 'item'
    }
    if (
        condition instanceof StatCondition ||
        condition.getType?.() === 'stat' ||
        condition.type === 'stat'
    ) {
        return 'stat'
    }
    if (
        condition instanceof TagCondition ||
        condition.getType?.() === 'tag' ||
        condition.type === 'tag'
    ) {
        return 'tag'
    }
    return 'text'
}

/**
 * Instantiates a default condition object for a given type, preserving the ID if an existing condition exists.
 *
 * @param {'none' | 'item' | 'stat' | 'tag' | 'text'} type
 * @param {object} [existingCond]
 * @returns {object | null}
 */
export function createDefaultConditionForType(type, existingCond) {
    const condId =
        (typeof existingCond?.getId === 'function' ? existingCond.getId() : existingCond?.id) ||
        `cond_${Date.now()}`

    if (type === 'item') {
        const itemName =
            existingCond instanceof ItemCondition
                ? existingCond.getItemName()
                : existingCond?.itemName || ''
        const quantity =
            existingCond instanceof ItemCondition
                ? existingCond.getQuantity()
                : existingCond?.quantity || 1
        return new ItemCondition(condId, t('details.condition_type_item'), itemName, quantity)
    }

    if (type === 'stat') {
        const statName =
            existingCond instanceof StatCondition
                ? existingCond.getStatName()
                : existingCond?.statName || ''
        const op =
            existingCond instanceof StatCondition
                ? existingCond.getOperator()
                : existingCond?.operator || '>='
        const val =
            existingCond instanceof StatCondition
                ? existingCond.getValue()
                : (existingCond?.value ?? 10)
        return new StatCondition(condId, t('details.condition_type_stat'), statName, op, val)
    }

    if (type === 'tag') {
        const tagName =
            existingCond instanceof TagCondition
                ? existingCond.getTagName()
                : existingCond?.tagName || ''
        const isNegated =
            existingCond instanceof TagCondition
                ? existingCond.isNegated()
                : Boolean(existingCond?.negated)
        return new TagCondition(
            condId,
            isNegated ? t('details.condition_tag_not_has') : t('details.condition_type_tag'),
            tagName,
            isNegated
        )
    }

    if (type === 'text') {
        const text =
            existingCond instanceof TextCondition
                ? existingCond.getText()
                : existingCond?.text ||
                  (typeof existingCond?.getSummary === 'function' ? existingCond.getSummary() : '')
        return new TextCondition(condId, t('condition.type_text'), text)
    }

    return null
}

/**
 * Reads form input values from container element and builds the corresponding Condition instance.
 *
 * @param {'none' | 'item' | 'stat' | 'tag' | 'text'} type
 * @param {HTMLElement} [containerEl]
 * @param {object} [existingCond]
 * @returns {object | null}
 */
export function buildConditionFromInputs(type, containerEl, existingCond) {
    if (!containerEl) return null
    const condId =
        (typeof existingCond?.getId === 'function' ? existingCond.getId() : existingCond?.id) ||
        `cond_${Date.now()}`

    if (type === 'item') {
        const itemInput = containerEl.querySelector('#choice-cond-item-name')
        const qtyInput = containerEl.querySelector('#choice-cond-item-qty')
        const itemName = itemInput ? itemInput.value.trim() : ''
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1
        return new ItemCondition(condId, t('details.condition_type_item'), itemName, qty)
    }

    if (type === 'stat') {
        const nameInput = containerEl.querySelector('#choice-cond-stat-name')
        const opSelect = containerEl.querySelector('#choice-cond-stat-op')
        const valInput = containerEl.querySelector('#choice-cond-stat-val')
        const statName = nameInput ? nameInput.value.trim() : ''
        const op = opSelect ? opSelect.value || '>=' : '>='
        const val = valInput ? parseFloat(valInput.value) || 0 : 0
        return new StatCondition(condId, t('details.condition_type_stat'), statName, op, val)
    }

    if (type === 'tag') {
        const nameInput = containerEl.querySelector('#choice-cond-tag-name')
        const modeSelect = containerEl.querySelector('#choice-cond-tag-mode')
        const rawTagName = nameInput ? nameInput.value.trim() : ''
        const tagName = rawTagName.replace(/^#/, '')
        const negated = modeSelect ? modeSelect.value === 'not_has' : false
        return new TagCondition(
            condId,
            negated ? t('details.condition_tag_not_has') : t('details.condition_type_tag'),
            tagName,
            negated
        )
    }

    if (type === 'text') {
        const textInput = containerEl.querySelector('#details-condition-text')
        const textVal = textInput ? textInput.value.trim() : ''
        return new TextCondition(condId, t('condition.type_text'), textVal)
    }

    return null
}

/**
 * Renders HTML for ItemCondition body.
 *
 * @param {object} [cond]
 * @returns {string}
 */
export function renderItemConditionBodyHtml(cond) {
    const itemName = cond instanceof ItemCondition ? cond.getItemName() : cond?.itemName || ''
    const qty = cond instanceof ItemCondition ? cond.getQuantity() : cond?.quantity || 1

    return `
        <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2">
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_item_name'))}</label>
                <input id="choice-cond-item-name" type="text" list="choice-items-datalist" value="${escapeHtml(itemName)}" placeholder="${escapeHtml(t('details.item_name_placeholder'))}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_quantity'))}</label>
                <input id="choice-cond-item-qty" type="number" min="1" value="${qty}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
        </div>
    `
}

/**
 * Renders HTML for StatCondition body.
 *
 * @param {object} [cond]
 * @returns {string}
 */
export function renderStatConditionBodyHtml(cond) {
    const statName = cond instanceof StatCondition ? cond.getStatName() : cond?.statName || ''
    const op = cond instanceof StatCondition ? cond.getOperator() : cond?.operator || '>='
    const val = cond instanceof StatCondition ? cond.getValue() : (cond?.value ?? 10)

    return `
        <div class="grid grid-cols-4 gap-1.5">
            <div class="col-span-2">
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_stat_name'))}</label>
                <input id="choice-cond-stat-name" type="text" list="choice-stats-datalist" value="${escapeHtml(statName)}" placeholder="${escapeHtml(t('details.condition_stat_name'))}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_operator'))}</label>
                <select id="choice-cond-stat-op" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                    <option value=">=" ${op === '>=' ? 'selected' : ''}>&ge;</option>
                    <option value=">" ${op === '>' ? 'selected' : ''}>&gt;</option>
                    <option value="==" ${op === '==' ? 'selected' : ''}>=</option>
                    <option value="<=" ${op === '<=' ? 'selected' : ''}>&le;</option>
                    <option value="<" ${op === '<' ? 'selected' : ''}>&lt;</option>
                    <option value="!=" ${op === '!=' ? 'selected' : ''}>&ne;</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_value'))}</label>
                <input id="choice-cond-stat-val" type="number" value="${val}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
        </div>
    `
}

/**
 * Renders HTML for TagCondition body.
 *
 * @param {object} [cond]
 * @returns {string}
 */
export function renderTagConditionBodyHtml(cond) {
    const tagName = cond instanceof TagCondition ? cond.getTagName() : cond?.tagName || ''
    const isNegated = cond instanceof TagCondition ? cond.isNegated() : Boolean(cond?.negated)

    return `
        <div class="grid grid-cols-3 gap-2">
            <div class="col-span-2">
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_tag_name'))}</label>
                <div class="relative flex items-center">
                    <span class="absolute left-2 text-zinc-500 text-xs" aria-hidden="true">#</span>
                    <input id="choice-cond-tag-name" type="text" list="choice-tags-datalist" value="${escapeHtml(tagName)}" placeholder="${escapeHtml(t('details.tag_placeholder'))}"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.condition_tag_mode'))}</label>
                <select id="choice-cond-tag-mode" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                    <option value="has" ${!isNegated ? 'selected' : ''}>${escapeHtml(t('details.condition_tag_has'))}</option>
                    <option value="not_has" ${isNegated ? 'selected' : ''}>${escapeHtml(t('details.condition_tag_not_has'))}</option>
                </select>
            </div>
        </div>
    `
}

/**
 * Renders HTML for TextCondition body.
 *
 * @param {object} [cond]
 * @returns {string}
 */
export function renderTextConditionBodyHtml(cond) {
    const textVal =
        cond instanceof TextCondition
            ? cond.getText()
            : cond && typeof cond.getSummary === 'function'
              ? cond.getSummary()
              : cond?.text || ''

    return `
        <textarea id="details-condition-text" rows="2" placeholder="${escapeHtml(t('details.condition_placeholder'))}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(textVal)}</textarea>
    `
}

/**
 * Creates the condition editor section for choices.
 *
 * @param {object} [params]
 * @param {object} [params.choice]
 * @param {Function} [params.onSave]
 * @param {Function} [params.onRemove]
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderCondBody: () => void,
 *   getConditionType: () => 'none' | 'item' | 'stat' | 'tag' | 'text',
 *   setConditionType: (type: 'none' | 'item' | 'stat' | 'tag' | 'text') => void,
 *   buildConditionObject: () => object|null
 * }}
 */
export function createChoiceConditionSection({
    choice,
    onSave = () => {},
    onRemove = () => {},
} = {}) {
    const initialCond = choice?.getCondition?.() || choice?.condition
    let currentCondType = detectConditionType(initialCond)

    const sectionTitle = escapeHtml(t('details.condition_title'))
    const removeTitle = escapeHtml(t('details.remove_condition'))
    const conditionHelp = escapeHtml(t('details.condition_help'))
    const selectAriaLabel = escapeHtml(t('details.condition_type', 'Typ warunku'))

    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400" aria-hidden="true">${getIconSvg('filter', 'w-3.5 h-3.5')}</span>
                ${sectionTitle}
            </span>
            <div class="flex items-center gap-1.5">
                <select id="choice-condition-type-select" class="bg-[#18181b] border border-[#3f3f46] text-white text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer" aria-label="${selectAriaLabel}">
                    <option value="item" ${currentCondType === 'item' ? 'selected' : ''}>${escapeHtml(t('details.condition_type_item'))}</option>
                    <option value="stat" ${currentCondType === 'stat' ? 'selected' : ''}>${escapeHtml(t('details.condition_type_stat'))}</option>
                    <option value="tag" ${currentCondType === 'tag' ? 'selected' : ''}>${escapeHtml(t('details.condition_type_tag'))}</option>
                    <option value="text" ${currentCondType === 'text' ? 'selected' : ''}>${escapeHtml(t('condition.type_text'))}</option>
                </select>
                <button type="button" id="btn-remove-choice-condition" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${removeTitle}" aria-label="${removeTitle}">
                    <span aria-hidden="true">${getIconSvg('close', 'w-3 h-3')}</span>
                </button>
            </div>
        </div>
        <p id="choice-condition-help" class="text-[11px] text-gray-400 leading-snug">${conditionHelp}</p>
        <div id="choice-condition-body" class="space-y-2"></div>
    `
    )

    const condTypeSelect = sectionEl.querySelector('#choice-condition-type-select')
    const removeCondBtn = sectionEl.querySelector('#btn-remove-choice-condition')
    const condBody = sectionEl.querySelector('#choice-condition-body')

    const buildConditionObject = () => {
        return buildConditionFromInputs(
            currentCondType,
            sectionEl,
            choice?.getCondition?.() || choice?.condition
        )
    }

    const renderCondBody = () => {
        if (!condBody) return
        const currentCond = choice?.getCondition?.() || choice?.condition

        if (currentCondType === 'item') {
            condBody.innerHTML = renderItemConditionBodyHtml(currentCond)
            condBody.querySelector('#choice-cond-item-name')?.addEventListener('input', onSave)
            condBody.querySelector('#choice-cond-item-qty')?.addEventListener('input', onSave)
        } else if (currentCondType === 'stat') {
            condBody.innerHTML = renderStatConditionBodyHtml(currentCond)
            condBody.querySelector('#choice-cond-stat-name')?.addEventListener('input', onSave)
            condBody.querySelector('#choice-cond-stat-op')?.addEventListener('change', onSave)
            condBody.querySelector('#choice-cond-stat-val')?.addEventListener('input', onSave)
        } else if (currentCondType === 'tag') {
            condBody.innerHTML = renderTagConditionBodyHtml(currentCond)
            condBody.querySelector('#choice-cond-tag-name')?.addEventListener('input', onSave)
            condBody.querySelector('#choice-cond-tag-mode')?.addEventListener('change', onSave)
        } else if (currentCondType === 'text') {
            condBody.innerHTML = renderTextConditionBodyHtml(currentCond)
            condBody.querySelector('#details-condition-text')?.addEventListener('input', onSave)
        } else {
            condBody.innerHTML = ''
        }
    }

    if (condTypeSelect) {
        condTypeSelect.addEventListener('change', () => {
            currentCondType = condTypeSelect.value
            const existingCond = choice?.getCondition?.() || choice?.condition
            const newCond = createDefaultConditionForType(currentCondType, existingCond)
            if (typeof choice?.setCondition === 'function') {
                choice.setCondition(newCond)
            } else if (choice) {
                choice.condition = newCond
            }
            renderCondBody()
            onSave()
        })
    }

    if (removeCondBtn) {
        removeCondBtn.addEventListener('click', () => {
            currentCondType = 'none'
            if (typeof onRemove === 'function') {
                onRemove()
            }
        })
    }

    return {
        sectionEl,
        renderCondBody,
        getConditionType: () => currentCondType,
        setConditionType: type => {
            currentCondType = type
            if (condTypeSelect) condTypeSelect.value = type
        },
        buildConditionObject,
    }
}
