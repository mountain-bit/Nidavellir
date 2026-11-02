/**
 * @fileoverview Combat section component for post-battle Choice transitions.
 * Displays read-only badges, combat outcome states, opponent avatars,
 * and origin paragraph links when a choice originates from a battle encounter.
 *
 * @module choiceCombatSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Resolves combat data associated with a choice, or returns null if not applicable.
 *
 * @param {object} [choice]
 * @param {object} [ctx]
 * @returns {{ fromP: object, combat: object, opponents: Array<object>, combatName: string, pTitle: string } | null}
 */
export function resolveChoiceCombatData(choice, ctx) {
    if (!choice || !ctx) return null

    const isCombat = Boolean(
        (typeof choice.getIsCombatOutcome === 'function' && choice.getIsCombatOutcome()) ||
        choice.isCombatOutcome
    )
    if (!isCombat) return null

    const fromId =
        (typeof choice.getFromParagraphId === 'function'
            ? choice.getFromParagraphId()
            : choice.fromParagraphId) || ''
    if (!fromId) return null

    const paragraphs = ctx.projectParagraphs || []
    const fromP = paragraphs.find(
        p => (typeof p.getId === 'function' ? p.getId() : p.id) === fromId
    )
    if (!fromP) return null

    const hasCombat = Boolean(
        (typeof fromP.getHasCombat === 'function' && fromP.getHasCombat()) || fromP.hasCombat
    )
    if (!hasCombat) return null

    const combat = typeof fromP.getCombat === 'function' ? fromP.getCombat() : fromP.combat
    if (!combat) return null

    const opponents =
        (typeof combat.getCombatOpponents === 'function'
            ? combat.getCombatOpponents()
            : combat.combatOpponents || combat.opponents) || []
    const combatName = (typeof combat.getName === 'function' ? combat.getName() : combat.name) || ''
    const pTitle = (typeof fromP.getTitle === 'function' ? fromP.getTitle() : fromP.title) || fromId

    return { fromP, combat, opponents, combatName, pTitle }
}

/**
 * Renders HTML markup for the opponents list or an empty-state message.
 *
 * @param {Array<object>} [opponents=[]]
 * @returns {string}
 */
export function renderCombatOpponentsListHtml(opponents = []) {
    if (!Array.isArray(opponents) || opponents.length === 0) {
        const emptyMsg = escapeHtml(t('combat.no_opponents_defined'))
        return `<div class="text-[11px] text-zinc-500 italic p-1.5 bg-zinc-900/40 rounded border border-zinc-800 text-center">${emptyMsg}</div>`
    }

    return opponents
        .map(opp => {
            const oppAvatar =
                opp.avatar || (typeof opp.getAvatar === 'function' ? opp.getAvatar() : 'warrior')
            const avatarObj = getAvatarById(oppAvatar)
            const avatarSvg = avatarObj ? avatarObj.svg : getIconSvg('character', 'w-3 h-3')
            const oppName =
                opp.name ||
                (typeof opp.getName === 'function' ? opp.getName() : '') ||
                t('combat.markdown_default_opponent')

            return `
                <div class="flex items-center gap-2 p-1.5 bg-[#202124] border border-[#2e3037] rounded">
                    <div class="w-5 h-5 rounded bg-zinc-800 p-0.5 border border-zinc-700/60 shrink-0 flex items-center justify-center text-amber-400" aria-hidden="true">
                        ${avatarSvg}
                    </div>
                    <span class="text-xs text-white font-medium truncate">${escapeHtml(oppName)}</span>
                </div>
            `
        })
        .join('')
}

/**
 * Navigates to the source paragraph of the combat encounter.
 *
 * @param {object} [fromP]
 * @param {object} [ctx]
 */
export function handleGoToCombat(fromP, ctx) {
    if (!fromP || !ctx) return
    if (typeof ctx.selectEntity === 'function') {
        ctx.selectEntity(fromP, 'paragraph')
    }
}

/**
 * Renders combat details section when a choice is a combat outcome.
 *
 * @param {object} [choice]
 * @param {object} [ctx]
 * @returns {HTMLElement | null}
 */
export function createChoiceCombatSection(choice, ctx) {
    const combatData = resolveChoiceCombatData(choice, ctx)
    if (!combatData) return null

    const { fromP, opponents, combatName, pTitle } = combatData
    const opponentsListHtml = renderCombatOpponentsListHtml(opponents)

    const sectionTitle = escapeHtml(t('combat.details_title'))
    const outcomeBadge = escapeHtml(t('details.combat_outcome'))
    const sourceLabel = escapeHtml(t('combat.source_paragraph'))
    const encounterLabel = escapeHtml(t('combat.encounter_label'))
    const opponentsLabel = escapeHtml(t('combat.opponents_in_encounter'))
    const configureBtnText = escapeHtml(t('combat.configure_in_paragraph', { title: pTitle }))

    const section = createSection(
        'border-b border-[#333338] p-3 space-y-2.5 bg-[#181216]/50',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 shrink-0" aria-hidden="true">${getIconSvg('swords', 'w-3.5 h-3.5')}</span>
                <span>${sectionTitle}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono">
                ${outcomeBadge}
            </span>
        </div>

        <div class="text-[11px] text-zinc-300 space-y-1">
            <div class="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                <span>${sourceLabel}</span>
                <span class="font-semibold text-white">§ ${escapeHtml(pTitle)}</span>
            </div>
            ${combatName ? `<div class="text-[10px] text-zinc-400">${encounterLabel} <span class="text-amber-300">${escapeHtml(combatName)}</span></div>` : ''}
        </div>

        <div class="space-y-1">
            <label class="block text-[10px] text-zinc-400 uppercase font-semibold">
                ${opponentsLabel} (${opponents.length})
            </label>
            <div class="space-y-1">
                ${opponentsListHtml}
            </div>
        </div>

        <button id="btn-choice-go-to-combat" type="button" class="w-full py-1.5 px-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600 rounded text-xs text-rose-200 font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5" aria-label="${configureBtnText}">
            <span aria-hidden="true">${getIconSvg('combat', 'w-3.5 h-3.5')}</span>
            <span>${configureBtnText}</span>
        </button>
    `
    )

    const goToCombatBtn = section.querySelector('#btn-choice-go-to-combat')
    if (goToCombatBtn) {
        goToCombatBtn.addEventListener('click', () => {
            handleGoToCombat(fromP, ctx)
        })
    }

    return section
}
