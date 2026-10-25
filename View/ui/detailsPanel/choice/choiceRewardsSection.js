import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the rewards / gain section for choices.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {Function} params.onSave
 * @param {Function} params.onRemoveAll
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderRewards: () => void,
 *   promptAddReward: () => void
 * }}
 */
export function createChoiceRewardsSection({ choice, onSave, onRemoveAll }) {
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                ${t('details.rewards_title')}
            </span>
            <div class="flex items-center gap-2">
                <button type="button" id="btn-add-choice-reward" class="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
                    ${t('details.add_reward')}
                </button>
                <button type="button" id="btn-remove-all-rewards" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('details.remove_rewards', 'Usuń nagrody')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            </div>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.rewards_help')}</p>
        <div id="choice-rewards-list" class="space-y-1.5"></div>
    `
    )

    const rewardsList = sectionEl.querySelector('#choice-rewards-list')

    const renderRewards = () => {
        const rewards = choice.getRewards() || []
        if (rewards.length === 0) {
            rewardsList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">${t('details.no_rewards')}</div>`
            return
        }
        rewardsList.innerHTML = rewards
            .map(
                (r, idx) => `
            <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="px-1.5 py-0.2 rounded text-[10px] ${r.type === 'item' ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'} font-medium">
                        ${r.type === 'item' ? t('details.modifier_item') : t('details.modifier_param')}
                    </span>
                    <span class="text-white font-medium truncate">${escapeHtml(r.name)}</span>
                    <span class="text-emerald-400 font-mono">+${r.value || 1}</span>
                </div>
                <button type="button" data-reward-idx="${idx}" class="btn-remove-reward text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${t('buttons.delete')}">
                    ${getIconSvg('trash', 'w-3 h-3')}
                </button>
            </div>
        `
            )
            .join('')

        rewardsList.querySelectorAll('.btn-remove-reward').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-reward-idx'), 10)
                const arr = choice.getRewards()
                arr.splice(idx, 1)
                choice.setRewards(arr)
                renderRewards()
                onSave()
            })
        })
    }

    const promptAddReward = () => {
        const name = prompt(
            'Podaj nazwę przedmiotu lub parametru do zyskania (np. Złoty klucz, Złoto):'
        )
        if (!name || !name.trim()) return
        const valStr = prompt('Podaj ilość (np. 1 lub 20):', '1')
        const val = parseInt(valStr, 10) || 1
        const type = confirm(
            'Czy to jest przedmiot? (Kliknij OK dla przedmiotu, Anuluj dla parametru/złota)'
        )
            ? 'item'
            : 'parameter'
        choice.addReward({
            id: `reward_${Date.now()}`,
            type,
            name: name.trim(),
            value: val,
        })
        renderRewards()
        onSave()
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    sectionEl.querySelector('#btn-add-choice-reward').addEventListener('click', promptAddReward)
    sectionEl.querySelector('#btn-remove-all-rewards').addEventListener('click', () => {
        choice.setRewards([])
        renderRewards()
        if (typeof onRemoveAll === 'function') {
            onRemoveAll()
        } else {
            onSave()
        }
    })

    return {
        sectionEl,
        renderRewards,
        promptAddReward,
    }
}
