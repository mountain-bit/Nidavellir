/**
 * @fileoverview Combat Traits Section Component for Details Panel.
 * Handles selection of visible traits and parameters for opponents in combat.
 *
 * @module combatTraitsSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { CombatSyncService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Returns HTML string for the section top header.
 *
 * @param {number} visibleCount Number of currently visible traits
 * @param {number} totalCount Total number of available traits
 * @returns {string} HTML string
 */
export function renderTraitsHeaderHtml(visibleCount = 0, totalCount = 0) {
    const title = t('combat.visible_stats_title') || 'Widoczne cechy i parametry'
    const desc =
        t('combat.visible_stats_desc') ||
        'Wybierz, które statystyki i parametry mają być widoczne przy przeciwnikach:'

    return `
        <div class="flex items-center justify-between">
            <span class="text-[11px] font-bold text-amber-300/90 uppercase tracking-wide flex items-center gap-1.5">
                <span aria-hidden="true">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span>${escapeHtml(title)}</span>
            </span>
            <span class="text-[10px] text-zinc-400 font-mono">
                ${visibleCount} / ${totalCount}
            </span>
        </div>
        <p class="text-[10px] text-zinc-400">
            ${escapeHtml(desc)}
        </p>
    `
}

/**
 * Returns HTML string for empty traits state placeholder.
 *
 * @returns {string} HTML string
 */
export function renderEmptyTraitsHtml() {
    const message =
        t('combat.no_stats_available') || 'Brak zdefiniowanych cech lub parametrów w projekcie'
    return `<div class="text-[11px] text-zinc-500 italic p-1.5 bg-zinc-900/50 rounded border border-zinc-800">${escapeHtml(message)}</div>`
}

/**
 * Returns HTML string for an individual trait toggle chip.
 *
 * @param {object} trait Trait definition object
 * @param {boolean} isChecked Whether trait is currently visible
 * @returns {string} HTML string
 */
export function renderTraitChipHtml(trait, isChecked = false) {
    const checkIcon = getIconSvg('check', 'w-2 h-2') || '✓'
    const activeClasses = isChecked
        ? 'bg-amber-950/70 text-amber-200 border-amber-600/70 shadow-sm'
        : 'bg-[#27272a] text-zinc-400 border-zinc-700/60 hover:border-zinc-500 hover:text-zinc-200'
    const circleClasses = isChecked
        ? 'bg-amber-500 text-black font-bold'
        : 'bg-zinc-700 text-transparent'

    return `
        <button type="button" data-trait-id="${escapeHtml(trait.id)}" aria-pressed="${Boolean(isChecked)}" title="${escapeHtml(trait.name)}" class="combat-trait-chip px-2 py-0.5 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${activeClasses}">
            <span class="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[9px] ${circleClasses}" aria-hidden="true">${checkIcon}</span>
            <span>${escapeHtml(trait.name)}</span>
        </button>
    `
}

/**
 * Returns HTML string for the list of trait chips.
 *
 * @param {Array<object>} availableTraits
 * @param {Array<string>} visibleStatIds
 * @returns {string} HTML string
 */
export function renderTraitsChipsListHtml(availableTraits = [], visibleStatIds = []) {
    if (!availableTraits || availableTraits.length === 0) {
        return renderEmptyTraitsHtml()
    }

    const chips = availableTraits
        .map(trait => {
            const isChecked = visibleStatIds.includes(trait.id)
            return renderTraitChipHtml(trait, isChecked)
        })
        .join('')

    return `<div class="flex flex-wrap gap-1.5 pt-1" id="combat-traits-chips-list">${chips}</div>`
}

/**
 * Synchronizes base NPC values into opponents overriddenStats when a trait becomes visible.
 *
 * @param {string} traitId
 * @param {object|null} traitDef
 * @param {Array<object>} opponents
 * @param {Array<object>} allNpcs
 * @param {object} combat
 */
export function syncOpponentsBaseValuesForTrait(
    traitId,
    traitDef,
    opponents = [],
    allNpcs = [],
    combat
) {
    if (!traitId || !combat || typeof combat.updateCombatOpponent !== 'function') return

    opponents.forEach(opp => {
        const currentVal = opp.overriddenStats ? opp.overriddenStats[traitId] : undefined
        if (currentVal === undefined || currentVal === '') {
            const origNpc = allNpcs.find(
                n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId
            )
            const bVal = CombatSyncService.resolveNpcTraitValue(origNpc, traitId, traitDef)
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

/**
 * Renders traits selection section into container.
 *
 * @param {HTMLElement} container
 * @param {object} combat
 * @param {Array<object>} [availableTraits=[]]
 * @param {Array<object>} [allNpcs=[]]
 * @param {Function} [onChange]
 * @returns {HTMLElement | null} Created section element, or null if arguments are invalid
 */
export function renderCombatTraitsSection(
    container,
    combat,
    availableTraits = [],
    allNpcs = [],
    onChange
) {
    if (!container || typeof container.appendChild !== 'function' || !combat) {
        return null
    }

    const safeTraits = Array.isArray(availableTraits) ? availableTraits : []
    const safeNpcs = Array.isArray(allNpcs) ? allNpcs : []
    const safeChange = typeof onChange === 'function' ? onChange : () => {}

    const visibleStatIds =
        typeof combat.getVisibleStatIds === 'function' ? combat.getVisibleStatIds() : []
    const opponents =
        typeof combat.getCombatOpponents === 'function' ? combat.getCombatOpponents() : []

    const section = document.createElement('div')
    section.className = 'bg-[#18181b] border border-[#2e3037] rounded-lg p-2.5 space-y-2'
    section.innerHTML = `
        ${renderTraitsHeaderHtml(visibleStatIds.length, safeTraits.length)}
        ${renderTraitsChipsListHtml(safeTraits, visibleStatIds)}
    `

    container.appendChild(section)

    // Events
    const traitChips = section.querySelectorAll('.combat-trait-chip')
    traitChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const traitId = chip.getAttribute('data-trait-id')
            if (!traitId) return
            const willBeVisible = !visibleStatIds.includes(traitId)

            if (typeof combat.toggleVisibleStatId === 'function') {
                combat.toggleVisibleStatId(traitId)
            }

            if (willBeVisible) {
                const traitDef = safeTraits.find(t => t.id === traitId) || null
                syncOpponentsBaseValuesForTrait(traitId, traitDef, opponents, safeNpcs, combat)
            }

            safeChange()
        })
    })

    return section
}
