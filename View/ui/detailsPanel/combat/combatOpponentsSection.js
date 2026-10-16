/**
 * Combat Opponents Section Component
 * Handles adding, modifying, duplicating, stat overriding, and removing opponents.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { CombatSyncService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'

/**
 * Renders opponents manager section.
 *
 * @param {HTMLElement} container
 * @param {object} combat
 * @param {Array} allNpcs
 * @param {Array} availableTraits
 * @param {Function} onModify
 * @param {Function} onFullRefresh
 */
export function renderCombatOpponentsSection(
    container,
    combat,
    allNpcs,
    availableTraits,
    onModify,
    onFullRefresh
) {
    const opponents = combat.getCombatOpponents ? combat.getCombatOpponents() : []
    const visibleStatIds = combat.getVisibleStatIds ? combat.getVisibleStatIds() : []

    const section = document.createElement('div')
    section.className = 'bg-[#18181b] border border-[#2e3037] rounded-lg p-2.5 space-y-2.5'
    section.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
                <span class="text-amber-400">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                <span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">
                    ${t('combat.opponents_title') || 'Przeciwnicy'}
                </span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                    ${opponents.length}
                </span>
            </div>
            <button id="btn-toggle-add-opponent" type="button" class="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1">
                <span>${getIconSvg('plus', 'w-3 h-3')}</span>
                <span>${t('combat.add_opponent') || 'Dodaj przeciwnika'}</span>
            </button>
        </div>

        <!-- Add Opponent Inline Form -->
        <div id="combat-add-opponent-form" class="hidden bg-[#202124] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${t('combat.select_npc_placeholder') || 'Wybierz postać (NPC)'}
                </label>
                <select id="combat-add-opponent-select" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                </select>
            </div>
            <div>
                <label class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${t('combat.opponent_custom_name') || 'Nazwa w tej walce (opcjonalnie)'}
                </label>
                <input id="combat-add-opponent-name" type="text" placeholder="${t('combat.opponent_custom_name') || 'np. Wilk alfa, Strażnik...'}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-opponent" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">
                    ${t('buttons.cancel') || 'Anuluj'}
                </button>
                <button id="btn-submit-add-opponent" type="button" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white font-medium cursor-pointer">
                    ${t('buttons.add') || 'Dodaj'}
                </button>
            </div>
        </div>

        <!-- Opponents List -->
        <div id="combat-opponents-list" class="space-y-2 pt-1">
            ${
                opponents.length === 0
                    ? `<div class="text-[11px] text-zinc-500 italic p-2 bg-zinc-900/40 rounded border border-zinc-800 text-center">
                        ${t('combat.no_opponents') || 'Brak dodanych przeciwników. Kliknij „Dodaj przeciwnika”, aby dodać wroga.'}
                       </div>`
                    : ''
            }
        </div>
    `

    container.appendChild(section)

    const toggleAddOpponentBtn = section.querySelector('#btn-toggle-add-opponent')
    const addOpponentForm = section.querySelector('#combat-add-opponent-form')
    const opponentSelect = section.querySelector('#combat-add-opponent-select')
    const opponentNameInput = section.querySelector('#combat-add-opponent-name')
    const cancelAddOpponentBtn = section.querySelector('#btn-cancel-add-opponent')
    const submitAddOpponentBtn = section.querySelector('#btn-submit-add-opponent')
    const opponentsListContainer = section.querySelector('#combat-opponents-list')

    // Populate NPC dropdown
    if (opponentSelect) {
        opponentSelect.innerHTML = `<option value="">${t('combat.select_npc_placeholder') || '-- Wybierz postać (NPC) --'}</option>`
        allNpcs.forEach(npc => {
            const id = typeof npc.getId === 'function' ? npc.getId() : npc.id
            const name = typeof npc.getName === 'function' ? npc.getName() : npc.name
            if (id && name) {
                const opt = document.createElement('option')
                opt.value = id
                opt.textContent = name
                opponentSelect.appendChild(opt)
            }
        })
    }

    toggleAddOpponentBtn?.addEventListener('click', () => {
        addOpponentForm?.classList.toggle('hidden')
        if (!addOpponentForm?.classList.contains('hidden')) {
            opponentSelect?.focus()
        }
    })

    cancelAddOpponentBtn?.addEventListener('click', () => {
        addOpponentForm?.classList.add('hidden')
    })

    submitAddOpponentBtn?.addEventListener('click', () => {
        const selectedId = opponentSelect?.value
        if (!selectedId) {
            toast.error(t('combat.select_npc_placeholder') || 'Wybierz postać!')
            return
        }

        const selectedNpc = allNpcs.find(
            n => (typeof n.getId === 'function' ? n.getId() : n.id) === selectedId
        )
        const baseName = selectedNpc
            ? typeof selectedNpc.getName === 'function'
                ? selectedNpc.getName()
                : selectedNpc.name
            : 'Przeciwnik'
        const avatar = selectedNpc
            ? typeof selectedNpc.getAvatar === 'function'
                ? selectedNpc.getAvatar()
                : selectedNpc.avatar || 'warrior'
            : 'warrior'

        const customName = opponentNameInput?.value?.trim() || baseName

        // Pre-fill parameters and stats with initial values from the selected NPC
        const initialStats = {}
        availableTraits.forEach(trait => {
            const val = CombatSyncService.resolveNpcTraitValue(selectedNpc, trait.id, trait)
            if (val !== undefined && val !== null && val !== '') {
                initialStats[trait.id] = val
            }
        })

        const newOpponent = {
            id: 'opp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            npcId: selectedId,
            name: customName,
            avatar: avatar,
            overriddenStats: initialStats,
        }

        combat.addCombatOpponent(newOpponent)
        if (selectedNpc) {
            combat.addOpponent(selectedNpc)
        }

        onFullRefresh()
        toast.success(`${t('buttons.add') || 'Dodano'}: ${customName}`)
    })

    // Render individual opponent cards
    if (opponentsListContainer && opponents.length > 0) {
        opponents.forEach(opp => {
            const card = document.createElement('div')
            card.className =
                'p-2 bg-[#202124] border border-[#2e3037] hover:border-amber-500/40 rounded space-y-2 transition-colors'

            const avatarObj = getAvatarById(opp.avatar || 'warrior')
            const avatarSvg = avatarObj ? avatarObj.svg : getIconSvg('character', 'w-4 h-4')

            // Opponent Header with avatar, inline name edit, duplicate & remove buttons
            const cardHeader = document.createElement('div')
            cardHeader.className = 'flex items-center justify-between gap-2'
            cardHeader.innerHTML = `
                <div class="flex items-center gap-2 min-w-0 flex-1">
                    <div class="w-6 h-6 rounded bg-zinc-800 p-0.5 border border-zinc-700/60 shrink-0 flex items-center justify-center text-amber-400">
                        ${avatarSvg}
                    </div>
                    <input type="text" value="${escapeHtml(opp.name)}" class="opp-name-input bg-[#27272a] hover:bg-[#2d2e33] focus:bg-[#27272a] border border-transparent focus:border-amber-500 rounded px-1.5 py-0.5 text-xs text-white font-medium w-full min-w-0 focus:outline-none transition-colors" title="Edytuj nazwę przeciwnika" />
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" class="btn-clone-opp p-1 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors" title="${t('combat.duplicate_opponent') || 'Zduplikuj'}">
                        ${getIconSvg('plus', 'w-3 h-3')}
                    </button>
                    <button type="button" class="btn-remove-opp p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors" title="${t('combat.remove_opponent') || 'Usuń'}">
                        ${getIconSvg('trash', 'w-3 h-3')}
                    </button>
                </div>
            `
            card.appendChild(cardHeader)

            // Name edit event
            const nameInput = cardHeader.querySelector('.opp-name-input')
            nameInput?.addEventListener('change', e => {
                const val = e.target.value.trim() || opp.name
                combat.updateCombatOpponent(opp.id, { name: val })
                onModify()
            })

            // Duplicate opponent event
            const cloneBtn = cardHeader.querySelector('.btn-clone-opp')
            cloneBtn?.addEventListener('click', () => {
                const clone = {
                    ...opp,
                    id: 'opp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    name: `${opp.name} (kopia)`,
                    overriddenStats: { ...opp.overriddenStats },
                }
                combat.addCombatOpponent(clone)
                onFullRefresh()
            })

            // Remove opponent event
            const removeBtn = cardHeader.querySelector('.btn-remove-opp')
            removeBtn?.addEventListener('click', () => {
                combat.removeCombatOpponent(opp.id)
                onFullRefresh()
            })

            // Visible traits override grid
            if (visibleStatIds.length > 0) {
                const statsGrid = document.createElement('div')
                statsGrid.className = 'grid grid-cols-2 gap-1.5 pt-1 border-t border-[#2e3037]'

                const originalNpc = allNpcs.find(
                    n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId
                )

                visibleStatIds.forEach(traitId => {
                    const traitDef = availableTraits.find(t => t.id === traitId)
                    const traitName = traitDef ? traitDef.name : traitId
                    const baseVal = CombatSyncService.resolveNpcTraitValue(
                        originalNpc,
                        traitId,
                        traitDef
                    )

                    let currentVal =
                        opp.overriddenStats && opp.overriddenStats[traitId] !== undefined
                            ? opp.overriddenStats[traitId]
                            : ''

                    if (
                        (currentVal === '' || currentVal === undefined) &&
                        baseVal !== undefined &&
                        baseVal !== null &&
                        baseVal !== ''
                    ) {
                        currentVal = baseVal
                        if (!opp.overriddenStats) opp.overriddenStats = {}
                        opp.overriddenStats[traitId] = baseVal
                    }

                    const statItem = document.createElement('div')
                    statItem.className =
                        'flex items-center justify-between gap-1 bg-[#1a1b1e] border border-zinc-700/50 rounded px-1.5 py-0.5'
                    statItem.innerHTML = `
                        <span class="text-[10px] text-zinc-400 truncate font-medium" title="${escapeHtml(traitName)}">
                            ${escapeHtml(traitName)}:
                        </span>
                        <input type="text" value="${escapeHtml(String(currentVal))}" placeholder="${escapeHtml(String(baseVal))}" class="opp-stat-input w-14 bg-[#27272a] border border-zinc-600 rounded px-1 py-0.2 text-[11px] text-right text-amber-200 focus:outline-none focus:border-amber-500 font-mono" />
                    `

                    const statInput = statItem.querySelector('.opp-stat-input')
                    statInput?.addEventListener('change', e => {
                        const val = e.target.value.trim()
                        const newOverrides = { ...(opp.overriddenStats || {}) }
                        if (val === '') {
                            delete newOverrides[traitId]
                        } else {
                            newOverrides[traitId] = val
                        }
                        combat.updateCombatOpponent(opp.id, { overriddenStats: newOverrides })
                        onModify()
                    })

                    statsGrid.appendChild(statItem)
                })

                card.appendChild(statsGrid)
            }

            opponentsListContainer.appendChild(card)
        })
    }
}
