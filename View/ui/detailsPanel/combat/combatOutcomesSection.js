/**
 * Combat Outcomes Section Component
 * Handles creating, updating, and removing combat outcomes synced with story graph choices.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { CombatSyncService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Renders outcomes manager section.
 *
 * @param {HTMLElement} container
 * @param {object} entity Source paragraph
 * @param {object} combat Combat entity
 * @param {Array} allParagraphs
 * @param {object} ctx Application context
 * @param {Function} onModify
 * @param {Function} onFullRefresh
 */
export function renderCombatOutcomesSection(
    container,
    entity,
    combat,
    allParagraphs,
    ctx,
    onModify,
    onFullRefresh
) {
    const outcomes = combat.getOutcomes ? combat.getOutcomes() : []

    const section = document.createElement('div')
    section.className = 'bg-[#18181b] border border-[#2e3037] rounded-lg p-2.5 space-y-2.5'
    section.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
                <span class="text-teal-400">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                <span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">
                    ${t('combat.outcomes_title') || 'Możliwe wyniki walki'}
                </span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                    ${outcomes.length}
                </span>
            </div>
            <button id="btn-toggle-add-outcome" type="button" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1">
                <span>${getIconSvg('plus', 'w-3 h-3')}</span>
                <span>${t('combat.add_outcome') || 'Dodaj wynik'}</span>
            </button>
        </div>
        <p class="text-[10px] text-zinc-400">
            ${t('combat.outcomes_desc') || 'Zdefiniuj rezultaty starcia i paragrafy docelowe, do których prowadzą:'}
        </p>

        <!-- Add Outcome Inline Form -->
        <div id="combat-add-outcome-form" class="hidden bg-[#202124] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${t('combat.outcome_name_placeholder') || 'Nazwa wyniku starcia'}
                </label>
                <input id="combat-add-outcome-name" type="text" placeholder="${t('combat.outcome_name_placeholder') || 'np. Zwycięstwo, Ucieczka przez okno, Porażka...'}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${t('combat.target_paragraph') || 'Docelowy paragraf'}
                </label>
                <select id="combat-add-outcome-target" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                </select>
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-outcome" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">
                    ${t('buttons.cancel') || 'Anuluj'}
                </button>
                <button id="btn-submit-add-outcome" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                    ${t('buttons.add') || 'Dodaj wynik'}
                </button>
            </div>
        </div>

        <!-- Outcomes List -->
        <div id="combat-outcomes-list" class="space-y-1.5 pt-1">
            ${
                outcomes.length === 0
                    ? `<div class="text-[11px] text-zinc-500 italic p-2 bg-zinc-900/40 rounded border border-zinc-800 text-center">
                        ${t('combat.no_outcomes') || 'Brak zdefiniowanych wyników. Dodaj przynajmniej jedno wyjście z walki.'}
                       </div>`
                    : ''
            }
        </div>
    `

    container.appendChild(section)

    const toggleAddOutcomeBtn = section.querySelector('#btn-toggle-add-outcome')
    const addOutcomeForm = section.querySelector('#combat-add-outcome-form')
    const outcomeNameInput = section.querySelector('#combat-add-outcome-name')
    const outcomeTargetSelect = section.querySelector('#combat-add-outcome-target')
    const cancelAddOutcomeBtn = section.querySelector('#btn-cancel-add-outcome')
    const submitAddOutcomeBtn = section.querySelector('#btn-submit-add-outcome')
    const outcomesListContainer = section.querySelector('#combat-outcomes-list')

    // Populate target paragraph select
    if (outcomeTargetSelect) {
        outcomeTargetSelect.innerHTML = `<option value="">${t('combat.select_target_placeholder') || '-- Wybierz docelowy paragraf --'}</option>`
        allParagraphs.forEach(p => {
            const pId = typeof p.getId === 'function' ? p.getId() : p.id
            const pNum = typeof p.getDisplayNumber === 'function' ? p.getDisplayNumber() : p.number
            const pTitle = typeof p.getTitle === 'function' ? p.getTitle() : p.title || ''
            if (pId) {
                const opt = document.createElement('option')
                opt.value = pId
                opt.textContent = `§ ${pNum || '?'} ${pTitle ? `(${pTitle})` : ''}`
                outcomeTargetSelect.appendChild(opt)
            }
        })
    }

    toggleAddOutcomeBtn?.addEventListener('click', () => {
        addOutcomeForm?.classList.toggle('hidden')
        if (!addOutcomeForm?.classList.contains('hidden')) {
            outcomeNameInput?.focus()
        }
    })

    cancelAddOutcomeBtn?.addEventListener('click', () => {
        addOutcomeForm?.classList.add('hidden')
    })

    submitAddOutcomeBtn?.addEventListener('click', () => {
        const nameVal = outcomeNameInput?.value?.trim()
        const targetId = outcomeTargetSelect?.value

        if (!nameVal) {
            toast.error(t('combat.outcome_name_placeholder') || 'Wpisz nazwę wyniku starcia!')
            outcomeNameInput?.focus()
            return
        }
        if (!targetId) {
            toast.error(t('combat.select_target_placeholder') || 'Wybierz docelowy paragraf!')
            outcomeTargetSelect?.focus()
            return
        }

        const fallbackOutcomeId =
            'outcome_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
        const targetP = allParagraphs.find(
            p => (typeof p.getId === 'function' ? p.getId() : p.id) === targetId
        )

        // Delegate choice creation to CombatSyncService
        const choiceId = CombatSyncService.createOutcomeChoice(
            entity,
            targetP,
            fallbackOutcomeId,
            nameVal,
            targetId,
            ctx.vm
        )

        const newOutcome = {
            id: choiceId,
            name: nameVal,
            targetParagraphId: targetId,
            description: '',
        }

        combat.addOutcome(newOutcome)
        onFullRefresh()
        toast.success(`${t('buttons.add') || 'Dodano wynik'}: ${nameVal}`)
    })

    // Render individual outcomes
    if (outcomesListContainer && outcomes.length > 0) {
        outcomes.forEach(outcome => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between gap-2 p-1.5 bg-[#202124] border border-[#2e3037] hover:border-blue-500/40 rounded transition-colors'

            const targetP = allParagraphs.find(
                p =>
                    (typeof p.getId === 'function' ? p.getId() : p.id) === outcome.targetParagraphId
            )
            const targetNum = targetP
                ? typeof targetP.getDisplayNumber === 'function'
                    ? targetP.getDisplayNumber()
                    : targetP.number
                : '?'
            const targetTitle = targetP
                ? typeof targetP.getTitle === 'function'
                    ? targetP.getTitle()
                    : targetP.title || ''
                : ''

            row.innerHTML = `
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3 h-3')}</span>
                    <input type="text" value="${escapeHtml(outcome.name)}" class="outcome-name-input bg-[#27272a] hover:bg-[#2d2e33] focus:bg-[#27272a] border border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white font-medium w-36 shrink-0 focus:outline-none transition-colors" title="Zmień nazwę wyniku" />
                    <span class="text-zinc-500 text-xs shrink-0">→</span>
                    <span class="text-[11px] text-zinc-300 truncate font-mono bg-zinc-900/60 px-1.5 py-0.5 rounded border border-zinc-700/40" title="Docelowy paragraf: § ${targetNum} ${targetTitle}">
                        § ${targetNum} ${targetTitle ? `<span class="text-zinc-400 font-sans">(${escapeHtml(targetTitle)})</span>` : ''}
                    </span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" class="btn-remove-outcome p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors" title="${t('combat.remove_outcome') || 'Usuń wynik'}">
                        ${getIconSvg('trash', 'w-3 h-3')}
                    </button>
                </div>
            `

            // Outcome name change event
            const nameInput = row.querySelector('.outcome-name-input')
            nameInput?.addEventListener('change', e => {
                const val = e.target.value.trim() || outcome.name
                combat.updateOutcome(outcome.id, { name: val })
                CombatSyncService.updateOutcomeChoiceName(entity, outcome.id, val)
                onModify()
            })

            // Remove outcome event
            const removeBtn = row.querySelector('.btn-remove-outcome')
            removeBtn?.addEventListener('click', () => {
                combat.removeOutcome(outcome.id)
                CombatSyncService.removeOutcomeChoice(entity, outcome.id, allParagraphs, ctx.vm)
                onFullRefresh()
                toast.info(`${t('combat.remove_outcome') || 'Usunięto wynik'}: ${outcome.name}`)
            })

            outcomesListContainer.appendChild(row)
        })
    }
}
