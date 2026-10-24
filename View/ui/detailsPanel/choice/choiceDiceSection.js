import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Creates the dice check section for choices.
 *
 * @param {object} params
 * @param {object} params.choice
 * @param {object} params.ctx
 * @param {Function} params.onSave
 * @param {Function} params.onRemove
 * @returns {{
 *   sectionEl: HTMLElement,
 *   renderBranches: () => void,
 *   syncDiceInputs: () => void
 * }}
 */
export function createChoiceDiceSection({ choice, ctx, onSave, onRemove }) {
    const sectionEl = createSection(
        'border-b border-[#333338] p-3 space-y-2.5',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400">${getIconSvg('dice', 'w-3.5 h-3.5')}</span>
                ${t('details.dice_check_title')}
            </span>
            <button type="button" id="btn-remove-dice-check" class="p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('details.remove_dice_check', 'Usuń test kością')}">
                ${getIconSvg('close', 'w-3 h-3')}
            </button>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.dice_check_help')}</p>
        <div id="choice-dice-config-body" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_type')}</label>
                    <select id="choice-dice-type" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500">
                        <option value="1k6">1k6 (1-6)</option>
                        <option value="2k6">2k6 (2-12)</option>
                        <option value="1k20">1k20 (1-20)</option>
                        <option value="1k100">1k100 (1-100)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_stat')}</label>
                    <input id="choice-dice-stat" type="text" list="choice-stats-datalist" value="" placeholder="np. Zręczność"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 mb-1 uppercase font-semibold">${t('details.dice_desc')}</label>
                <input id="choice-dice-desc" type="text" value="" placeholder="np. Test zręczności przy skoku"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
            </div>

            <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] text-gray-400 uppercase font-semibold">${t('details.dice_branches_title')}</span>
                    <button type="button" id="btn-add-dice-branch" class="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer">
                        <span class="shrink-0">${getIconSvg('plus', 'w-2.5 h-2.5')}</span>
                        <span>${t('details.add_dice_branch')}</span>
                    </button>
                </div>
                <div id="choice-dice-branches-list" class="space-y-1.5"></div>
            </div>
        </div>
    `
    )

    const diceTypeSelect = sectionEl.querySelector('#choice-dice-type')
    const diceStatInput = sectionEl.querySelector('#choice-dice-stat')
    const diceDescInput = sectionEl.querySelector('#choice-dice-desc')
    const branchesList = sectionEl.querySelector('#choice-dice-branches-list')

    const syncDiceInputs = () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            diceTypeSelect.value = dc.dice || '1k6'
            diceStatInput.value = dc.stat || ''
            diceDescInput.value = dc.description || ''
        }
    }

    const renderBranches = () => {
        const dc = choice.getDiceCheck()
        const branches = dc?.branches || []
        if (branches.length === 0) {
            branchesList.innerHTML = `<div class="text-[11px] text-gray-500 italic py-1">Brak zdefiniowanych przedziałów. Dodaj przynajmniej jeden przedział wyniku.</div>`
            return
        }

        branchesList.innerHTML = branches
            .map(
                (b, idx) => `
            <div class="bg-[#18181b] border border-[#27272a] rounded p-2 space-y-1.5 text-xs">
                <div class="flex items-center justify-between gap-1">
                    <div class="flex items-center gap-1.5 text-[11px] text-gray-300 font-mono">
                        <span>Wynik:</span>
                        <input type="number" data-branch-field="min" data-idx="${idx}" value="${b.min}" class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white" />
                        <span>–</span>
                        <input type="number" data-branch-field="max" data-idx="${idx}" value="${b.max}" class="w-12 bg-[#27272a] border border-[#3f3f46] rounded px-1 text-center text-white" />
                    </div>
                    <button type="button" data-branch-remove="${idx}" class="text-gray-500 hover:text-red-400 p-1 cursor-pointer transition-colors" title="${t('buttons.delete')}">
                        ${getIconSvg('trash', 'w-3 h-3')}
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                    <div>
                        <input type="text" data-branch-field="desc" data-idx="${idx}" value="${escapeHtml(b.description || '')}" placeholder="Etykieta (np. Sukces)"
                            class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-[11px] text-white focus:outline-none" />
                    </div>
                    <div>
                        <select data-branch-field="target" data-idx="${idx}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-1.5 py-1 text-[11px] text-white focus:outline-none">
                            <option value="">-- Wybierz cel --</option>
                            ${ctx.projectParagraphs
                                .map(p => {
                                    const isSel = p.getId() === b.targetParagraphId
                                    return `<option value="${escapeHtml(p.getId())}" ${isSel ? 'selected' : ''}>§ ${escapeHtml(p.getTitle() || p.getId())}</option>`
                                })
                                .join('')}
                        </select>
                    </div>
                </div>
            </div>
        `
            )
            .join('')

        branchesList.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('change', () => {
                const idx = parseInt(el.getAttribute('data-idx'), 10)
                const field = el.getAttribute('data-branch-field')
                const dc = choice.getDiceCheck()
                if (!dc || !dc.branches[idx]) return
                if (field === 'min') dc.branches[idx].min = parseInt(el.value, 10) || 1
                if (field === 'max') dc.branches[idx].max = parseInt(el.value, 10) || 6
                if (field === 'desc') dc.branches[idx].description = el.value.trim()
                if (field === 'target') dc.branches[idx].targetParagraphId = el.value
                onSave()
            })
        })

        branchesList.querySelectorAll('[data-branch-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-branch-remove'), 10)
                const dc = choice.getDiceCheck()
                if (!dc) return
                dc.branches.splice(idx, 1)
                renderBranches()
                onSave()
            })
        })
    }

    diceTypeSelect.addEventListener('change', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.dice = diceTypeSelect.value
            onSave()
        }
    })
    diceStatInput.addEventListener('input', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.stat = diceStatInput.value.trim() || undefined
            onSave()
        }
    })
    diceDescInput.addEventListener('input', () => {
        const dc = choice.getDiceCheck()
        if (dc) {
            dc.description = diceDescInput.value.trim() || undefined
            onSave()
        }
    })

    sectionEl.querySelector('#btn-add-dice-branch').addEventListener('click', () => {
        const dc = choice.getDiceCheck()
        if (!dc) return
        dc.branches.push({
            min: 1,
            max: 6,
            targetParagraphId: choice.getToParagraphId(),
            description: 'Nowy wynik',
        })
        renderBranches()
        onSave()
    })

    sectionEl.querySelector('#btn-remove-dice-check').addEventListener('click', () => {
        choice.setDiceCheck(null)
        if (typeof onRemove === 'function') {
            onRemove()
        } else {
            onSave()
        }
    })

    return {
        sectionEl,
        renderBranches,
        syncDiceInputs,
    }
}
