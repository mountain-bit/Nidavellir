/**
 * @fileoverview Dice check (skill test) section component for Choice entities.
 * Configures base stats, modifiers, and multi-threshold result branches (e.g. Failure, Success, Critical)
 * with dedicated narrative descriptions and target paragraph overrides.
 *
 * @module choiceDiceSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Retrieves the dice check configuration object from a Choice instance or plain object.
 *
 * @param {object} [choice]
 * @returns {object | null}
 */
export function getChoiceDiceCheck(choice) {
    if (!choice) return null
    if (typeof choice.getDiceCheck === 'function') {
        return choice.getDiceCheck() || null
    }
    return choice.diceCheck || null
}

/**
 * Updates the dice check configuration on a Choice instance or plain object.
 *
 * @param {object} choice
 * @param {object | null} diceCheck
 */
export function setChoiceDiceCheck(choice, diceCheck) {
    if (!choice) return
    if (typeof choice.setDiceCheck === 'function') {
        choice.setDiceCheck(diceCheck)
    } else {
        choice.diceCheck = diceCheck
    }
}

/**
 * Returns the branches array of the choice's dice check configuration.
 *
 * @param {object} [choice]
 * @returns {Array<object>}
 */
export function getDiceCheckBranches(choice) {
    const dc = getChoiceDiceCheck(choice)
    return Array.isArray(dc?.branches) ? dc.branches : []
}

/**
 * Adds a new branch to the choice's dice check configuration.
 *
 * @param {object} choice
 * @param {object} branch
 */
export function addDiceCheckBranch(choice, branch) {
    if (!choice || !branch) return
    const dc = getChoiceDiceCheck(choice)
    if (!dc) return
    if (!Array.isArray(dc.branches)) {
        dc.branches = []
    }
    dc.branches.push(branch)
}

/**
 * Removes a branch at the specified index from the choice's dice check configuration.
 *
 * @param {object} choice
 * @param {number} index
 * @param {Function} [onSave]
 * @returns {boolean} True if removed, false otherwise
 */
export function removeDiceCheckBranch(choice, index, onSave) {
    if (!choice || typeof index !== 'number' || index < 0) return false
    const branches = getDiceCheckBranches(choice)
    if (index >= branches.length) return false
    branches.splice(index, 1)
    if (typeof onSave === 'function') {
        onSave()
    }
    return true
}

/**
 * Updates properties of a branch at the specified index.
 *
 * @param {object} choice
 * @param {number} index
 * @param {object} patch
 * @param {Function} [onSave]
 * @returns {boolean} True if updated, false otherwise
 */
export function updateDiceCheckBranch(choice, index, patch, onSave) {
    if (!choice || typeof index !== 'number' || index < 0 || !patch) return false
    const branches = getDiceCheckBranches(choice)
    const branch = branches[index]
    if (!branch) return false

    if (patch.min !== undefined) branch.min = patch.min
    if (patch.max !== undefined) branch.max = patch.max
    if (patch.description !== undefined) branch.description = patch.description
    if (patch.targetParagraphId !== undefined) branch.targetParagraphId = patch.targetParagraphId

    if (typeof onSave === 'function') {
        onSave()
    }
    return true
}

/**
 * Renders target paragraph options for a branch select element.
 *
 * @param {Array<object>} [paragraphs]
 * @param {string} [selectedTargetId]
 * @returns {string}
 */
export function renderTargetOptionsHtml(paragraphs = [], selectedTargetId = '') {
    const safeParagraphs = Array.isArray(paragraphs) ? paragraphs : []
    const placeholder = `<option value="">${escapeHtml(t('details.select_target_placeholder'))}</option>`

    const optionsHtml = safeParagraphs
        .map(p => {
            if (!p) return ''
            const pId = typeof p.getId === 'function' ? p.getId() : p.id || ''
            const pTitle = typeof p.getTitle === 'function' ? p.getTitle() : p.title || pId
            const isSel = pId === selectedTargetId
            return `<option value="${escapeHtml(pId)}" ${isSel ? 'selected' : ''}>§ ${escapeHtml(pTitle)}</option>`
        })
        .join('')

    return `${placeholder}${optionsHtml}`
}

/**
 * Renders HTML for a single dice branch item.
 *
 * @param {object} branch
 * @param {number} index
 * @param {Array<object>} [paragraphs]
 * @returns {string}
 */
export function renderBranchItemHtml(branch, index, paragraphs = []) {
    if (!branch) return ''
    const deleteTitle = escapeHtml(t('buttons.delete'))
    const outcomeLabel = escapeHtml(t('details.dice_branch_result_label'))
    const descPlaceholder = escapeHtml(t('details.dice_branch_desc'))
    const branchDesc = escapeHtml(branch.description || '')
    const targetOptions = renderTargetOptionsHtml(paragraphs, branch.targetParagraphId || '')

    return `
        <div class="bg-[#18181b] border border-[#27272a] rounded p-2 space-y-1.5 text-xs" role="listitem">
            <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 text-[11px] text-gray-300 font-mono">
                    <span>${outcomeLabel}</span>
                    <input type="number" data-branch-field="min" data-idx="${index}" value="${branch.min ?? 1}"
                        class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white focus:outline-none focus:border-purple-500"
                        aria-label="${outcomeLabel} min" />
                    <span>–</span>
                    <input type="number" data-branch-field="max" data-idx="${index}" value="${branch.max ?? 6}"
                        class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white focus:outline-none focus:border-purple-500"
                        aria-label="${outcomeLabel} max" />
                </div>
                <button type="button" data-branch-remove="${index}" class="text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${deleteTitle}" aria-label="${deleteTitle}">
                    <span aria-hidden="true">${getIconSvg('trash', 'w-3 h-3')}</span>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-1.5">
                <div>
                    <input type="text" data-branch-field="desc" data-idx="${index}" value="${branchDesc}" placeholder="${descPlaceholder}"
                        class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500"
                        aria-label="${descPlaceholder}" />
                </div>
                <div>
                    <select data-branch-field="target" data-idx="${index}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-1.5 py-1 text-[11px] text-white focus:outline-none focus:border-purple-500"
                        aria-label="${escapeHtml(t('details.dice_branch_target'))}">
                        ${targetOptions}
                    </select>
                </div>
            </div>
        </div>
    `
}

/**
 * Renders HTML for the list of branches or empty fallback.
 *
 * @param {Array<object>} [branches]
 * @param {Array<object>} [paragraphs]
 * @returns {string}
 */
export function renderBranchesListHtml(branches = [], paragraphs = []) {
    const list = Array.isArray(branches) ? branches : []
    if (list.length === 0) {
        return `<div class="text-[11px] text-gray-500 italic py-1">${escapeHtml(t('details.dice_no_branches'))}</div>`
    }
    return list.map((b, idx) => renderBranchItemHtml(b, idx, paragraphs)).join('')
}

/**
 * Synchronizes the top input values (dice type, stat, description) from choice to form fields.
 *
 * @param {HTMLElement} [sectionEl]
 * @param {object} [choice]
 */
export function syncDiceInputs(sectionEl, choice) {
    if (!sectionEl) return
    const diceTypeSelect = sectionEl.querySelector('#choice-dice-type')
    const diceStatInput = sectionEl.querySelector('#choice-dice-stat')
    const diceDescInput = sectionEl.querySelector('#choice-dice-desc')

    const dc = getChoiceDiceCheck(choice)
    if (dc) {
        if (diceTypeSelect) diceTypeSelect.value = dc.dice || '1k6'
        if (diceStatInput) diceStatInput.value = dc.stat || ''
        if (diceDescInput) diceDescInput.value = dc.description || ''
    }
}

/**
 * Creates the dice check section for choices.
 *
 * @param {object} [params]
 * @param {object} [params.choice]
 * @param {object} [params.ctx]
 * @param {Function} [params.onSave]
 * @param {Function} [params.onRemove]
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderBranches: () => void,
 *   syncDiceInputs: () => void
 * }}
 */
export function createChoiceDiceSection({ choice, ctx = {}, onSave = () => {}, onRemove } = {}) {
    const removeDiceTitle = escapeHtml(t('details.remove_dice_check'))
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400" aria-hidden="true">${getIconSvg('dice', 'w-3.5 h-3.5')}</span>
                ${escapeHtml(t('details.dice_check_title'))}
            </span>
            <button type="button" id="btn-remove-dice-check" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${removeDiceTitle}" aria-label="${removeDiceTitle}">
                <span aria-hidden="true">${getIconSvg('close', 'w-3 h-3')}</span>
            </button>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${escapeHtml(t('details.dice_check_help'))}</p>
        <div id="choice-dice-config-body" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.dice_type'))}</label>
                    <select id="choice-dice-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500">
                        <option value="1k6">1k6 (1-6)</option>
                        <option value="2k6">2k6 (2-12)</option>
                        <option value="1k20">1k20 (1-20)</option>
                        <option value="1k100">1k100 (1-100)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.dice_stat'))}</label>
                    <input id="choice-dice-stat" type="text" list="choice-stats-datalist" value="" placeholder="${escapeHtml(t('details.dice_stat_placeholder'))}"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${escapeHtml(t('details.dice_desc'))}</label>
                <input id="choice-dice-desc" type="text" value="" placeholder="${escapeHtml(t('details.dice_desc_placeholder'))}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] text-gray-400 uppercase font-semibold">${escapeHtml(t('details.dice_branches_title'))}</span>
                    <button type="button" id="btn-add-dice-branch" class="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                        <span class="shrink-0" aria-hidden="true">${getIconSvg('plus', 'w-2.5 h-2.5')}</span>
                        <span>${escapeHtml(t('details.add_dice_branch'))}</span>
                    </button>
                </div>
                <div id="choice-dice-branches-list" class="space-y-1.5" role="list"></div>
            </div>
        </div>
    `
    )

    const diceTypeSelect = sectionEl.querySelector('#choice-dice-type')
    const diceStatInput = sectionEl.querySelector('#choice-dice-stat')
    const diceDescInput = sectionEl.querySelector('#choice-dice-desc')
    const branchesList = sectionEl.querySelector('#choice-dice-branches-list')

    const getParagraphs = () => {
        return ctx?.projectParagraphs || ctx?.projectData?.projectParagraphs || []
    }

    const renderBranches = () => {
        if (!branchesList) return
        const branches = getDiceCheckBranches(choice)
        const paragraphs = getParagraphs()
        branchesList.innerHTML = renderBranchesListHtml(branches, paragraphs)

        branchesList.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => {
                const idx = parseInt(el.getAttribute('data-idx'), 10)
                const field = el.getAttribute('data-branch-field')
                const patch = {}

                if (field === 'min') patch.min = parseInt(el.value, 10) || 1
                if (field === 'max') patch.max = parseInt(el.value, 10) || 6
                if (field === 'desc') patch.description = el.value.trim()
                if (field === 'target') patch.targetParagraphId = el.value

                updateDiceCheckBranch(choice, idx, patch, onSave)
            })
        })

        branchesList.querySelectorAll('[data-branch-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-branch-remove'), 10)
                removeDiceCheckBranch(choice, idx, () => {
                    renderBranches()
                    onSave()
                })
            })
        })
    }

    if (diceTypeSelect) {
        diceTypeSelect.addEventListener('change', () => {
            const dc = getChoiceDiceCheck(choice)
            if (dc) {
                dc.dice = diceTypeSelect.value
                onSave()
            }
        })
    }

    if (diceStatInput) {
        diceStatInput.addEventListener('input', () => {
            const dc = getChoiceDiceCheck(choice)
            if (dc) {
                dc.stat = diceStatInput.value.trim() || undefined
                onSave()
            }
        })
    }

    if (diceDescInput) {
        diceDescInput.addEventListener('input', () => {
            const dc = getChoiceDiceCheck(choice)
            if (dc) {
                dc.description = diceDescInput.value.trim() || undefined
                onSave()
            }
        })
    }

    const addBranchBtn = sectionEl.querySelector('#btn-add-dice-branch')
    if (addBranchBtn) {
        addBranchBtn.addEventListener('click', () => {
            let dc = getChoiceDiceCheck(choice)
            if (!dc) {
                dc = { dice: '1k6', branches: [] }
                setChoiceDiceCheck(choice, dc)
            }
            const fallbackTargetId =
                typeof choice?.getToParagraphId === 'function'
                    ? choice.getToParagraphId()
                    : choice?.toParagraphId || ''
            addDiceCheckBranch(choice, {
                min: 1,
                max: 6,
                targetParagraphId: fallbackTargetId,
                description: t('details.dice_default_branch_desc'),
            })
            renderBranches()
            onSave()
        })
    }

    const removeDiceBtn = sectionEl.querySelector('#btn-remove-dice-check')
    if (removeDiceBtn) {
        removeDiceBtn.addEventListener('click', () => {
            setChoiceDiceCheck(choice, null)
            if (typeof onRemove === 'function') {
                onRemove()
            } else if (typeof onSave === 'function') {
                onSave()
            }
        })
    }

    return {
        sectionEl,
        renderBranches,
        syncDiceInputs: () => syncDiceInputs(sectionEl, choice),
    }
}
