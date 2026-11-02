/**
 * @fileoverview Rewards section component for Choice entities in the details panel.
 * Manages narrative rewards (granting inventory items, increasing player stats)
 * upon player branch selection with prompt dialogs, badge previews, and empty states.
 *
 * @module choiceRewardsSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Retrieves the array of rewards from a Choice instance or plain object.
 *
 * @param {object} [choice]
 * @returns {Array<object>}
 */
export function getChoiceRewards(choice) {
    if (!choice) return []
    if (typeof choice.getRewards === 'function') {
        const rewards = choice.getRewards()
        return Array.isArray(rewards) ? rewards : []
    }
    return Array.isArray(choice.rewards) ? choice.rewards : []
}

/**
 * Updates the rewards on a Choice instance or plain object.
 *
 * @param {object} choice
 * @param {Array<object>} rewards
 */
export function setChoiceRewards(choice, rewards) {
    if (!choice) return
    const safeRewards = Array.isArray(rewards) ? rewards : []
    if (typeof choice.setRewards === 'function') {
        choice.setRewards(safeRewards)
    } else {
        choice.rewards = safeRewards
    }
}

/**
 * Adds a reward item to a Choice instance or plain object.
 *
 * @param {object} choice
 * @param {object} reward
 */
export function addChoiceReward(choice, reward) {
    if (!choice || !reward) return
    if (typeof choice.addReward === 'function') {
        choice.addReward(reward)
    } else {
        if (!Array.isArray(choice.rewards)) {
            choice.rewards = []
        }
        choice.rewards.push(reward)
    }
}

/**
 * Removes a reward at the specified index and calls onSave if provided.
 *
 * @param {object} choice
 * @param {number} index
 * @param {Function} [onSave]
 * @returns {boolean} True if removed, false otherwise
 */
export function removeRewardAtIndex(choice, index, onSave) {
    if (!choice || typeof index !== 'number' || index < 0) return false
    const rewards = [...getChoiceRewards(choice)]
    if (index >= rewards.length) return false
    rewards.splice(index, 1)
    setChoiceRewards(choice, rewards)
    if (typeof onSave === 'function') {
        onSave()
    }
    return true
}

/**
 * Renders HTML for a single reward item badge and action.
 *
 * @param {object} reward
 * @param {number} index
 * @returns {string}
 */
export function renderRewardItemHtml(reward, index) {
    if (!reward) return ''
    const isItem = reward.type === 'item'
    const typeBadgeClass = isItem
        ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
    const typeLabel = isItem ? t('details.modifier_item') : t('details.modifier_param')
    const rewardName = escapeHtml(reward.name || '')
    const rewardValue =
        typeof reward.value === 'number' ? reward.value : parseInt(reward.value, 10) || 1
    const deleteTitle = escapeHtml(t('buttons.delete'))

    return `
        <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1 text-xs" role="listitem">
            <div class="flex items-center gap-2 min-w-0">
                <span class="px-1.5 py-0.2 rounded text-[10px] ${typeBadgeClass} font-medium">
                    ${escapeHtml(typeLabel)}
                </span>
                <span class="text-white font-medium truncate">${rewardName}</span>
                <span class="text-emerald-400 font-mono">+${rewardValue}</span>
            </div>
            <button type="button" data-reward-idx="${index}" class="btn-remove-reward text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${deleteTitle}" aria-label="${deleteTitle}">
                <span aria-hidden="true">${getIconSvg('trash', 'w-3 h-3')}</span>
            </button>
        </div>
    `
}

/**
 * Renders HTML for the full rewards list or an empty fallback message.
 *
 * @param {Array<object>} [rewards]
 * @returns {string}
 */
export function renderRewardsListHtml(rewards) {
    const list = Array.isArray(rewards) ? rewards : []
    if (list.length === 0) {
        return `<div class="text-[11px] text-gray-500 italic py-1">${escapeHtml(t('details.no_rewards'))}</div>`
    }
    return list.map((r, idx) => renderRewardItemHtml(r, idx)).join('')
}

/**
 * Prompts the user to create and add a new reward to the choice.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {Function} [params.onSave]
 * @param {Function} [params.renderRewards]
 * @param {HTMLElement} [params.sectionEl]
 * @param {Function} [params.promptFn]
 * @param {Function} [params.confirmFn]
 * @returns {object | null} The created reward object or null if cancelled
 */
export function promptAddReward({
    choice,
    onSave = () => {},
    renderRewards = () => {},
    sectionEl = null,
    promptFn = typeof window !== 'undefined' ? (msg, def) => window.prompt(msg, def) : () => null,
    confirmFn = typeof window !== 'undefined' ? msg => window.confirm(msg) : () => false,
}) {
    if (!choice) return null

    const name = promptFn(t('details.reward_prompt_name'))
    if (!name || !name.trim()) return null

    const valStr = promptFn(t('details.reward_prompt_value'), '1')
    const parsedVal = parseInt(valStr, 10)
    const val = Math.max(1, !isNaN(parsedVal) ? parsedVal : 1)

    const isItem = confirmFn(t('details.reward_prompt_is_item'))
    const type = isItem ? 'item' : 'parameter'

    const newReward = {
        id: `reward_${Date.now()}`,
        type,
        name: name.trim(),
        value: val,
    }

    addChoiceReward(choice, newReward)
    renderRewards()
    if (typeof onSave === 'function') {
        onSave()
    }
    if (sectionEl && typeof sectionEl.scrollIntoView === 'function') {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    return newReward
}

/**
 * Creates the rewards / gain section for choices.
 *
 * @param {object} [params]
 * @param {object} [params.choice]
 * @param {Function} [params.onSave]
 * @param {Function} [params.onRemoveAll]
 * @param {Function} [params.promptFn]
 * @param {Function} [params.confirmFn]
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderRewards: () => void,
 *   promptAddReward: () => object | null
 * }}
 */
export function createChoiceRewardsSection({
    choice,
    onSave = () => {},
    onRemoveAll,
    promptFn,
    confirmFn,
} = {}) {
    const removeRewardsTitle = escapeHtml(t('details.remove_rewards'))
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400" aria-hidden="true">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                ${escapeHtml(t('details.rewards_title'))}
            </span>
            <div class="flex items-center gap-2">
                <button type="button" id="btn-add-choice-reward" class="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer">
                    ${escapeHtml(t('details.add_reward'))}
                </button>
                <button type="button" id="btn-remove-all-rewards" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${removeRewardsTitle}" aria-label="${removeRewardsTitle}">
                    <span aria-hidden="true">${getIconSvg('close', 'w-3 h-3')}</span>
                </button>
            </div>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${escapeHtml(t('details.rewards_help'))}</p>
        <div id="choice-rewards-list" class="space-y-1.5" role="list"></div>
    `
    )

    const rewardsList = sectionEl.querySelector('#choice-rewards-list')

    const renderRewards = () => {
        if (!rewardsList) return
        const rewards = getChoiceRewards(choice)
        rewardsList.innerHTML = renderRewardsListHtml(rewards)

        rewardsList.querySelectorAll('.btn-remove-reward').forEach(btn => {
            btn.addEventListener('click', () => {
                const idxStr = btn.getAttribute('data-reward-idx')
                const idx = parseInt(idxStr, 10)
                if (!isNaN(idx)) {
                    removeRewardAtIndex(choice, idx, onSave)
                    renderRewards()
                }
            })
        })
    }

    const triggerPromptAddReward = () => {
        return promptAddReward({
            choice,
            onSave,
            renderRewards,
            sectionEl,
            promptFn,
            confirmFn,
        })
    }

    const addBtn = sectionEl.querySelector('#btn-add-choice-reward')
    if (addBtn) {
        addBtn.addEventListener('click', triggerPromptAddReward)
    }

    const removeAllBtn = sectionEl.querySelector('#btn-remove-all-rewards')
    if (removeAllBtn) {
        removeAllBtn.addEventListener('click', () => {
            setChoiceRewards(choice, [])
            renderRewards()
            if (typeof onRemoveAll === 'function') {
                onRemoveAll()
            } else if (typeof onSave === 'function') {
                onSave()
            }
        })
    }

    return {
        sectionEl,
        renderRewards,
        promptAddReward: triggerPromptAddReward,
    }
}
