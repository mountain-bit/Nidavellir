/**
 * Combat Traits Section Component
 * Handles selection of visible attributes/parameters for opponents.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { CombatSyncService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Renders traits selection section.
 *
 * @param {HTMLElement} container
 * @param {object} combat
 * @param {Array} availableTraits
 * @param {Array} allNpcs
 * @param {Function} onChange
 */
export function renderCombatTraitsSection(container, combat, availableTraits, allNpcs, onChange) {
    const visibleStatIds = combat.getVisibleStatIds ? combat.getVisibleStatIds() : []
    const opponents = combat.getCombatOpponents ? combat.getCombatOpponents() : []

    const section = document.createElement('div')
    section.className = 'bg-[#18181b] border border-[#2e3037] rounded-lg p-2.5 space-y-2'
    section.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-300/90 uppercase tracking-wide flex items-center gap-1.5">
                ${getIconSvg('stat', 'w-3 h-3')}
                ${t('combat.visible_stats_title') || 'Widoczne cechy i parametry'}
            </span>
            <span class="text-[10px] text-zinc-400 font-mono">
                ${visibleStatIds.length} / ${availableTraits.length}
            </span>
        </div>
        <p class="text-[10px] text-zinc-400">
            ${t('combat.visible_stats_desc') || 'Zaznacz, które cechy/parametry mają być widoczne u przeciwników:'}
        </p>

        ${
            availableTraits.length === 0
                ? `<div class="text-[11px] text-zinc-500 italic p-1.5 bg-zinc-900/50 rounded border border-zinc-800">
                    ${t('combat.no_stats_available') || 'Brak zdefiniowanych cech lub parametrów w projekcie.'}
                   </div>`
                : `<div class="flex flex-wrap gap-1.5 pt-1" id="combat-traits-chips-list">
                    ${availableTraits
                        .map(trait => {
                            const isChecked = visibleStatIds.includes(trait.id)
                            return `
                            <button type="button" data-trait-id="${escapeHtml(trait.id)}" class="combat-trait-chip px-2 py-0.5 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                isChecked
                                    ? 'bg-amber-950/70 text-amber-200 border-amber-600/70 shadow-sm'
                                    : 'bg-[#27272a] text-zinc-400 border-zinc-700/60 hover:border-zinc-500 hover:text-zinc-200'
                            }">
                                <span class="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[9px] ${
                                    isChecked
                                        ? 'bg-amber-500 text-black font-bold'
                                        : 'bg-zinc-700 text-transparent'
                                }">✓</span>
                                <span>${escapeHtml(trait.name)}</span>
                            </button>
                        `
                        })
                        .join('')}
                   </div>`
        }
    `

    container.appendChild(section)

    // Events
    const traitChips = section.querySelectorAll('.combat-trait-chip')
    traitChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const traitId = chip.getAttribute('data-trait-id')
            if (!traitId) return
            const willBeVisible = !visibleStatIds.includes(traitId)
            combat.toggleVisibleStatId(traitId)

            if (willBeVisible) {
                const traitDef = availableTraits.find(t => t.id === traitId)
                opponents.forEach(opp => {
                    const currentVal = opp.overriddenStats
                        ? opp.overriddenStats[traitId]
                        : undefined
                    if (currentVal === undefined || currentVal === '') {
                        const origNpc = allNpcs.find(
                            n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId
                        )
                        const bVal = CombatSyncService.resolveNpcTraitValue(
                            origNpc,
                            traitId,
                            traitDef
                        )
                        if (bVal !== undefined && bVal !== null && bVal !== '') {
                            combat.updateCombatOpponent(opp.id, {
                                overriddenStats: {
                                    ...(opp.overriddenStats || {}),
                                    [traitId]: bVal,
                                },
                            })
                        }
                    }
                })
            }

            if (typeof onChange === 'function') {
                onChange()
            }
        })
    })
}
