import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the costs / loss section for choices.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {Function} params.onSave
 * @param {Function} params.onRemoveAll
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderCosts: () => void,
 *   promptAddCost: () => void
 * }}
 */
export function createChoiceCostsSection({ choice, onSave, onRemoveAll }) {
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-red-400">${getIconSvg('close', 'w-3 h-3')}</span>
                ${t('details.costs_title')}
            </span>
            <div class="flex items-center gap-2">
                <button type="button" id="btn-add-choice-cost" class="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                    ${t('details.add_cost')}
                </button>
                <button type="button" id="btn-remove-all-costs" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('details.remove_costs', 'Usuń koszty')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.costs_help')}</p>
        <div id="choice-costs-list" class="space-y-1.5"></div>
    `
    )

    const costsList = sectionEl.querySelector('#choice-costs-list')

    const renderCosts = () => {
        const costs = choice.getCosts() || []
        if (costs.length === 0) {
            costsList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">${t('details.no_costs')}</div>`
            return
        }
        costsList.innerHTML = costs
            .map(
                (c, idx) => `
            <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[10px] ${c.type === 'item' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-red-950/60 text-red-300 border border-red-800/40'} font-medium">
                        ${c.type === 'item' ? t('details.modifier_item') : t('details.modifier_param')}
                    </span>
                    <span class="text-white font-medium truncate">${escapeHtml(c.name)}</span>
                    <span class="text-red-400 font-mono">-${c.value || 1}</span>
                </div>
                <button type="button" data-cost-idx="${idx}" class="btn-remove-cost text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${t('buttons.delete')}">
                    ${getIconSvg('trash', 'w-3 h-3')}
                </button>
            </div>
        `
            )
            .join('')

        costsList.querySelectorAll('.btn-remove-cost').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-cost-idx'), 10)
                const arr = choice.getCosts()
                arr.splice(idx, 1)
                choice.setCosts(arr)
                renderCosts()
                onSave()
            })
        })
    }

    const promptAddCost = () => {
        const name = prompt(
            'Podaj nazwę przedmiotu lub parametru do utraty (np. Złoto, Pochodnia):'
        )
        if (!name || !name.trim()) return
        const valStr = prompt('Podaj ilość do utraty (np. 5 lub 1):', '1')
        const val = parseInt(valStr, 10) || 1
        const type = confirm(
            'Czy to jest przedmiot? (Kliknij OK dla przedmiotu, Anuluj dla parametru/złota)'
        )
            ? 'item'
            : 'parameter'
        choice.addCost({
            id: `cost_${Date.now()}`,
            type,
            name: name.trim(),
            value: val,
        })
        renderCosts()
        onSave()
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    sectionEl.querySelector('#btn-add-choice-cost').addEventListener('click', promptAddCost)
    sectionEl.querySelector('#btn-remove-all-costs').addEventListener('click', () => {
        choice.setCosts([])
        renderCosts()
        if (typeof onRemoveAll === 'function') {
            onRemoveAll()
        } else {
            onSave()
        }
    })

    return {
        sectionEl,
        renderCosts,
        promptAddCost,
    }
}
