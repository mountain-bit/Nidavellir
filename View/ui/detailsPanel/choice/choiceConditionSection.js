import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    ItemCondition,
    StatCondition,
    TextCondition,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the condition editor section for choices.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {Function} params.onSave
 * @param {Function} params.onRemove
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderCondBody: () => void,
 *   getConditionType: () => string,
 *   setConditionType: (type: string) => void,
 *   buildConditionObject: () => object|null
 * }}
 */
export function createChoiceConditionSection({ choice, onSave, onRemove }) {
    const initialCond = choice.getCondition()
    let currentCondType = 'none'
    if (initialCond instanceof ItemCondition || initialCond?.getType?.() === 'item') {
        currentCondType = 'item'
    } else if (initialCond instanceof StatCondition || initialCond?.getType?.() === 'stat') {
        currentCondType = 'stat'
    } else if (initialCond) {
        currentCondType = 'text'
    }

    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400">${getIconSvg('filter', 'w-3.5 h-3.5')}</span>
                ${t('details.condition_title')}
            </span>
            <div class="flex items-center gap-1.5">
                <select id="choice-condition-type-select" class="bg-[#18181b] border border-[#3f3f46] text-white text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="item" ${currentCondType === 'item' ? 'selected' : ''}>${t('details.condition_type_item')}</option>
                    <option value="stat" ${currentCondType === 'stat' ? 'selected' : ''}>${t('details.condition_type_stat')}</option>
                    <option value="text" ${currentCondType === 'text' ? 'selected' : ''}>${t('condition.type_text')}</option>
                </select>
                <button type="button" id="btn-remove-choice-condition" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('details.remove_condition', 'Usuń warunek')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        </div>
        <p id="choice-condition-help" class="text-[11px] text-gray-400 leading-snug">${t('details.condition_help')}</p>
        <div id="choice-condition-body" class="space-y-2"></div>
    `
    )

    const condTypeSelect = sectionEl.querySelector('#choice-condition-type-select')
    const removeCondBtn = sectionEl.querySelector('#btn-remove-choice-condition')
    const condBody = sectionEl.querySelector('#choice-condition-body')

    const buildConditionObject = () => {
        if (currentCondType === 'item') {
            const itemName = sectionEl.querySelector('#choice-cond-item-name')?.value.trim() || ''
            const qty = parseInt(sectionEl.querySelector('#choice-cond-item-qty')?.value, 10) || 1
            return new ItemCondition(
                choice.getCondition()?.getId() || `cond_${Date.now()}`,
                'Wymagany przedmiot',
                itemName,
                qty
            )
        } else if (currentCondType === 'stat') {
            const statName = sectionEl.querySelector('#choice-cond-stat-name')?.value.trim() || ''
            const op = sectionEl.querySelector('#choice-cond-stat-op')?.value || '>='
            const val = parseFloat(sectionEl.querySelector('#choice-cond-stat-val')?.value) || 0
            return new StatCondition(
                choice.getCondition()?.getId() || `cond_${Date.now()}`,
                'Wymagana cecha',
                statName,
                op,
                val
            )
        } else if (currentCondType === 'text') {
            const textVal = sectionEl.querySelector('#details-condition-text')?.value.trim() || ''
            return new TextCondition(
                choice.getCondition()?.getId() || `cond_${Date.now()}`,
                'Warunek',
                textVal
            )
        }
        return null
    }

    const renderCondBody = () => {
        const currentCond = choice.getCondition()
        if (currentCondType === 'item') {
            const currentItemName =
                currentCond instanceof ItemCondition
                    ? currentCond.getItemName()
                    : currentCond?.itemName || ''
            const currentQty =
                currentCond instanceof ItemCondition
                    ? currentCond.getQuantity()
                    : currentCond?.quantity || 1
            condBody.innerHTML = `
                <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2">
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_item_name')}</label>
                        <input id="choice-cond-item-name" type="text" list="choice-items-datalist" value="${escapeHtml(currentItemName)}" placeholder="np. Złoty klucz"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_quantity')}</label>
                        <input id="choice-cond-item-qty" type="number" min="1" value="${currentQty}"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            `
            condBody.querySelector('#choice-cond-item-name').addEventListener('input', onSave)
            condBody.querySelector('#choice-cond-item-qty').addEventListener('input', onSave)
        } else if (currentCondType === 'stat') {
            const currentStatName =
                currentCond instanceof StatCondition
                    ? currentCond.getStatName()
                    : currentCond?.statName || ''
            const currentOp =
                currentCond instanceof StatCondition
                    ? currentCond.getOperator()
                    : currentCond?.operator || '>='
            const currentVal =
                currentCond instanceof StatCondition
                    ? currentCond.getValue()
                    : (currentCond?.value ?? 10)
            condBody.innerHTML = `
                <div class="grid grid-cols-4 gap-1.5">
                    <div class="col-span-2">
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_stat_name')}</label>
                        <input id="choice-cond-stat-name" type="text" list="choice-stats-datalist" value="${escapeHtml(currentStatName)}" placeholder="np. Siła"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_operator')}</label>
                        <select id="choice-cond-stat-op" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                            <option value=">=" ${currentOp === '>=' ? 'selected' : ''}>&ge;</option>
                            <option value=">" ${currentOp === '>' ? 'selected' : ''}>&gt;</option>
                            <option value="==" ${currentOp === '==' ? 'selected' : ''}>=</option>
                            <option value="<=" ${currentOp === '<=' ? 'selected' : ''}>&le;</option>
                            <option value="<" ${currentOp === '<' ? 'selected' : ''}>&lt;</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.condition_value')}</label>
                        <input id="choice-cond-stat-val" type="number" value="${currentVal}"
                            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                </div>
            `
            condBody.querySelector('#choice-cond-stat-name').addEventListener('input', onSave)
            condBody.querySelector('#choice-cond-stat-op').addEventListener('change', onSave)
            condBody.querySelector('#choice-cond-stat-val').addEventListener('input', onSave)
        } else if (currentCondType === 'text') {
            const textVal =
                currentCond instanceof TextCondition
                    ? currentCond.getText()
                    : currentCond
                      ? currentCond.getSummary()
                      : ''
            condBody.innerHTML = `
                <textarea id="details-condition-text" rows="2" placeholder="${t('details.condition_placeholder')}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(textVal)}</textarea>
            `
            condBody.querySelector('#details-condition-text').addEventListener('input', onSave)
        }
    }

    condTypeSelect.addEventListener('change', () => {
        currentCondType = condTypeSelect.value
        const existingCond = choice.getCondition()
        if (currentCondType === 'item') {
            choice.setCondition(
                new ItemCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Wymagany przedmiot',
                    existingCond instanceof ItemCondition ? existingCond.getItemName() : '',
                    existingCond instanceof ItemCondition ? existingCond.getQuantity() : 1
                )
            )
        } else if (currentCondType === 'stat') {
            choice.setCondition(
                new StatCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Wymagana cecha',
                    existingCond instanceof StatCondition ? existingCond.getStatName() : '',
                    existingCond instanceof StatCondition ? existingCond.getOperator() : '>=',
                    existingCond instanceof StatCondition ? existingCond.getValue() : 10
                )
            )
        } else if (currentCondType === 'text') {
            choice.setCondition(
                new TextCondition(
                    existingCond?.getId() || `cond_${Date.now()}`,
                    'Warunek',
                    existingCond instanceof TextCondition ? existingCond.getText() : ''
                )
            )
        }
        renderCondBody()
        onSave()
    })

    removeCondBtn.addEventListener('click', () => {
        currentCondType = 'none'
        if (typeof onRemove === 'function') {
            onRemove()
        }
    })

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
