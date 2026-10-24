import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { createSection } from '../common/domHelpers.js'

/**
 * Renders combat details section when a choice is a combat outcome.
 *
 * @param {object} choice
 * @param {object} ctx
 * @returns {HTMLElement | null}
 */
export function createChoiceCombatSection(choice, ctx) {
    const isCombat = Boolean(
        (typeof choice.getIsCombatOutcome === 'function' && choice.getIsCombatOutcome()) ||
        choice.isCombatOutcome
    )
    if (!isCombat) return null

    const fromId = choice.getFromParagraphId()
    const fromP = (ctx.projectParagraphs || []).find(p => p.getId() === fromId)
    if (!fromP || !fromP.getHasCombat || !fromP.getHasCombat()) return null

    const combat = fromP.getCombat ? fromP.getCombat() : null
    if (!combat) return null

    const opponents = combat.getCombatOpponents ? combat.getCombatOpponents() : []
    const combatName = combat.getName ? combat.getName() : ''
    const pTitle = fromP.getTitle ? fromP.getTitle() : fromId

    const opponentsListHtml =
        opponents.length > 0
            ? opponents
                  .map(opp => {
                      const avatarObj = getAvatarById(opp.avatar || 'warrior')
                      const avatarSvg = avatarObj
                          ? avatarObj.svg
                          : getIconSvg('character', 'w-3 h-3')
                      return `
                        <div class="flex items-center gap-2 p-1.5 bg-[#202124] border border-[#2e3037] rounded">
                            <div class="w-5 h-5 rounded bg-zinc-800 p-0.5 border border-zinc-700/60 shrink-0 flex items-center justify-center text-amber-400">
                                ${avatarSvg}
                            </div>
                            <span class="text-xs text-white font-medium truncate">${escapeHtml(opp.name)}</span>
                        </div>
                    `
                  })
                  .join('')
            : `<div class="text-[11px] text-zinc-500 italic p-1.5 bg-zinc-900/40 rounded border border-zinc-800 text-center">${t('combat.no_opponents_defined') || 'Brak zdefiniowanych przeciwników'}</div>`

    const section = createSection(
        'border-b border-[#333338] p-3 space-y-2.5 bg-[#181216]/50',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 shrink-0">${getIconSvg('swords', 'w-3.5 h-3.5')}</span>
                <span>${t('combat.details_title') || t('combat.detail_title') || 'Szczegóły walki'}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono">
                ${t('details.combat_outcome') || 'Po walce'}
            </span>
        </div>

        <div class="text-[11px] text-zinc-300 space-y-1">
            <div class="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                <span>${t('combat.source_paragraph') || 'Źródłowy paragraf walki:'}</span>
                <span class="font-semibold text-white">§ ${escapeHtml(pTitle)}</span>
            </div>
            ${combatName ? `<div class="text-[10px] text-zinc-400">${t('combat.encounter_label') || 'Starcie:'} <span class="text-amber-300">${escapeHtml(combatName)}</span></div>` : ''}
        </div>

        <div class="space-y-1">
            <label class="block text-[10px] text-zinc-400 uppercase font-semibold">
                ${t('combat.opponents_in_encounter') || t('combat.opponents_title') || 'Przeciwnicy w tym starciu'} (${opponents.length})
            </label>
            <div class="space-y-1">
                ${opponentsListHtml}
            </div>
        </div>

        <button id="btn-choice-go-to-combat" type="button" class="w-full py-1.5 px-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600 rounded text-xs text-rose-200 font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5">
            <span>${getIconSvg('combat', 'w-3.5 h-3.5')}</span>
            <span>${escapeHtml(t('combat.configure_in_paragraph', { title: pTitle }) || `Konfiguruj walkę w § ${pTitle}`)}</span>
        </button>
    `
    )

    section.querySelector('#btn-choice-go-to-combat')?.addEventListener('click', () => {
        if (typeof ctx.selectEntity === 'function') {
            ctx.selectEntity(fromP, 'paragraph')
        }
    })

    return section
}
