/**
 * @fileoverview Combat Opponents Section Component for Details Panel.
 * Handles adding, modifying, duplicating, stat overriding, and removing opponents (NPCs).
 *
 * @module combatOpponentsSection
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { CombatSyncService } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'

/**
 * Generates a unique opponent ID.
 *
 * @returns {string} Unique identifier
 */
export function generateOpponentId() {
    return 'opp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
}

/**
 * Returns HTML string for the empty opponents state placeholder.
 *
 * @returns {string} HTML string
 */
export function renderEmptyOpponentsListHtml() {
    const message =
        t('combat.no_opponents') ||
        'Brak dodanych przeciwników. Dodaj przynajmniej jednego wroga do starcia.'
    return `<div class="text-[11px] text-zinc-500 italic p-2 bg-zinc-900/40 rounded border border-zinc-800 text-center">${escapeHtml(message)}</div>`
}

/**
 * Returns HTML string for the section top header.
 *
 * @param {number} count Number of configured opponents
 * @returns {string} HTML string
 */
export function renderOpponentsHeaderHtml(count = 0) {
    const title = t('combat.opponents_title') || 'Przeciwnicy'
    const addLabel = t('combat.add_opponent') || 'Dodaj przeciwnika'

    return `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
                <span class="text-amber-400" aria-hidden="true">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                <span class="text-[11px] font-bold text-zinc-200 uppercase tracking-wide">
                    ${escapeHtml(title)}
                </span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
                    ${count}
                </span>
            </div>
            <button id="btn-toggle-add-opponent" data-action="toggle-add-opponent" type="button" class="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1">
                <span aria-hidden="true">${getIconSvg('plus', 'w-3 h-3')}</span>
                <span>${escapeHtml(addLabel)}</span>
            </button>
        </div>
    `
}

/**
 * Returns HTML string for the inline opponent addition form.
 *
 * @returns {string} HTML string
 */
export function renderAddOpponentFormHtml() {
    const selectLabel = t('combat.select_npc_placeholder') || 'Wybierz postać (NPC)'
    const nameLabel = t('combat.opponent_custom_name') || 'Nazwa w tej walce'
    const namePlaceholder = t('combat.opponent_name_placeholder') || 'np. Wilk alfa, Strażnik...'
    const cancelLabel = t('buttons.cancel') || 'Anuluj'
    const addLabel = t('buttons.add') || 'Dodaj'

    return `
        <div id="combat-add-opponent-form" class="hidden bg-[#202124] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label for="combat-add-opponent-select" class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${escapeHtml(selectLabel)}
                </label>
                <select id="combat-add-opponent-select" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                </select>
            </div>
            <div>
                <label for="combat-add-opponent-name" class="block text-[10px] text-zinc-400 uppercase font-semibold mb-1">
                    ${escapeHtml(nameLabel)}
                </label>
                <input id="combat-add-opponent-name" type="text" placeholder="${escapeHtml(namePlaceholder)}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-opponent" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">
                    ${escapeHtml(cancelLabel)}
                </button>
                <button id="btn-submit-add-opponent" type="button" class="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 rounded text-xs text-white font-medium cursor-pointer">
                    ${escapeHtml(addLabel)}
                </button>
            </div>
        </div>
    `
}

/**
 * Populates NPC select dropdown with available NPCs.
 *
 * @param {HTMLSelectElement} selectEl
 * @param {Array<object>} allNpcs
 */
export function populateNpcSelect(selectEl, allNpcs = []) {
    if (!selectEl) return

    const placeholderText = t('combat.select_npc_placeholder') || '-- Wybierz postać (NPC) --'
    selectEl.innerHTML = `<option value="">${escapeHtml(placeholderText)}</option>`

    allNpcs.forEach(npc => {
        const id = typeof npc.getId === 'function' ? npc.getId() : npc.id
        const name = typeof npc.getName === 'function' ? npc.getName() : npc.name
        if (id && name) {
            const opt = document.createElement('option')
            opt.value = id
            opt.textContent = name
            selectEl.appendChild(opt)
        }
    })
}

/**
 * Resolves initial stats for a new opponent based on available traits.
 *
 * @param {object} selectedNpc
 * @param {Array<object>} availableTraits
 * @returns {Record<string, unknown>}
 */
export function resolveInitialOpponentStats(selectedNpc, availableTraits = []) {
    const initialStats = {}
    availableTraits.forEach(trait => {
        const val = CombatSyncService.resolveNpcTraitValue(selectedNpc, trait.id, trait)
        if (val !== undefined && val !== null && val !== '') {
            initialStats[trait.id] = val
        }
    })
    return initialStats
}

/**
 * Creates the trait overrides grid element for an opponent card.
 *
 * @param {object} opp Opponent configuration object
 * @param {object|null} originalNpc Original NPC entity
 * @param {Array<string>} visibleStatIds IDs of traits marked as visible
 * @param {Array<object>} availableTraits All available traits in the project
 * @param {object} combat Combat entity
 * @param {Function} onModify Callback triggered when values are modified
 * @returns {HTMLElement} Grid element
 */
export function createStatsGrid(
    opp,
    originalNpc,
    visibleStatIds = [],
    availableTraits = [],
    combat,
    onModify
) {
    const statsGrid = document.createElement('div')
    statsGrid.className = 'grid grid-cols-2 gap-1.5 pt-1 border-t border-[#2e3037]'

    visibleStatIds.forEach(traitId => {
        const traitDef = availableTraits.find(t => t.id === traitId)
        const traitName = traitDef ? traitDef.name : traitId
        const baseVal = CombatSyncService.resolveNpcTraitValue(originalNpc, traitId, traitDef)

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
            <input type="text" value="${escapeHtml(String(currentVal))}" placeholder="${escapeHtml(String(baseVal !== undefined && baseVal !== null ? baseVal : ''))}" class="opp-stat-input w-14 bg-[#27272a] border border-zinc-600 rounded px-1 py-0.2 text-[11px] text-right text-amber-200 focus:outline-none focus:border-amber-500 font-mono" />
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
            if (typeof onModify === 'function') {
                onModify()
            }
        })

        statsGrid.appendChild(statItem)
    })

    return statsGrid
}

/**
 * Creates an opponent card element with avatar, inline name edit, clone/remove actions, and stats grid.
 *
 * @param {object} opp Opponent configuration object
 * @param {object} combat Combat entity
 * @param {Array<object>} allNpcs List of all project NPCs
 * @param {Array<string>} visibleStatIds IDs of traits marked visible
 * @param {Array<object>} availableTraits All available project traits
 * @param {Function} onModify Callback on modifications
 * @param {Function} onFullRefresh Callback on full UI refresh
 * @returns {HTMLElement} Card element
 */
export function createOpponentCard(
    opp,
    combat,
    allNpcs = [],
    visibleStatIds = [],
    availableTraits = [],
    onModify,
    onFullRefresh
) {
    const card = document.createElement('div')
    card.className =
        'p-2 bg-[#202124] border border-[#2e3037] hover:border-amber-500/40 rounded space-y-2 transition-colors'
    card.setAttribute('data-opponent-id', opp.id)

    const avatarObj = getAvatarById(opp.avatar || 'warrior')
    const avatarSvg = avatarObj ? avatarObj.svg : getIconSvg('character', 'w-4 h-4')

    const editNameTitle = t('combat.edit_opponent_name') || 'Edytuj nazwę przeciwnika'
    const duplicateTitle = t('combat.duplicate_opponent') || 'Zduplikuj przeciwnika'
    const removeTitle = t('combat.remove_opponent') || 'Usuń przeciwnika'

    // Opponent Header with avatar, inline name edit, duplicate & remove buttons
    const cardHeader = document.createElement('div')
    cardHeader.className = 'flex items-center justify-between gap-2'
    cardHeader.innerHTML = `
        <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="w-6 h-6 rounded bg-zinc-800 p-0.5 border border-zinc-700/60 shrink-0 flex items-center justify-center text-amber-400" aria-hidden="true">
                ${avatarSvg}
            </div>
            <input type="text" value="${escapeHtml(opp.name)}" class="opp-name-input bg-[#27272a] hover:bg-[#2d2e33] focus:bg-[#27272a] border border-transparent focus:border-amber-500 rounded px-1.5 py-0.5 text-xs text-white font-medium w-full min-w-0 focus:outline-none transition-colors" title="${escapeHtml(editNameTitle)}" />
        </div>
        <div class="flex items-center gap-1 shrink-0">
            <button type="button" class="btn-clone-opp p-1 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors" title="${escapeHtml(duplicateTitle)}">
                <span aria-hidden="true">${getIconSvg('plus', 'w-3 h-3')}</span>
            </button>
            <button type="button" class="btn-remove-opp p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors" title="${escapeHtml(removeTitle)}">
                <span aria-hidden="true">${getIconSvg('trash', 'w-3 h-3')}</span>
            </button>
        </div>
    `
    card.appendChild(cardHeader)

    // Name edit event
    const nameInput = cardHeader.querySelector('.opp-name-input')
    nameInput?.addEventListener('change', e => {
        const val = e.target.value.trim() || opp.name
        opp.name = val
        combat.updateCombatOpponent(opp.id, { name: val })
        if (typeof onModify === 'function') {
            onModify()
        }
    })

    // Duplicate opponent event
    const cloneBtn = cardHeader.querySelector('.btn-clone-opp')
    cloneBtn?.addEventListener('click', () => {
        const copySuffix = t('combat.copy_suffix') || 'kopia'
        const currentOpp =
            (typeof combat.getCombatOpponents === 'function'
                ? combat.getCombatOpponents().find(o => o.id === opp.id)
                : null) || opp

        const clone = {
            ...currentOpp,
            id: generateOpponentId(),
            name: `${currentOpp.name} (${copySuffix})`,
            overriddenStats: { ...(currentOpp.overriddenStats || {}) },
        }
        combat.addCombatOpponent(clone)
        if (typeof onFullRefresh === 'function') {
            onFullRefresh()
        }
    })

    // Remove opponent event
    const removeBtn = cardHeader.querySelector('.btn-remove-opp')
    removeBtn?.addEventListener('click', () => {
        combat.removeCombatOpponent(opp.id)
        if (typeof onFullRefresh === 'function') {
            onFullRefresh()
        }
    })

    // Visible traits override grid
    if (visibleStatIds.length > 0) {
        const originalNpc =
            allNpcs.find(n => (typeof n.getId === 'function' ? n.getId() : n.id) === opp.npcId) ||
            null

        const statsGrid = createStatsGrid(
            opp,
            originalNpc,
            visibleStatIds,
            availableTraits,
            combat,
            onModify
        )
        card.appendChild(statsGrid)
    }

    return card
}

/**
 * Renders the complete opponents management section into the container.
 *
 * @param {HTMLElement} container Parent DOM element
 * @param {object} combat Combat entity
 * @param {Array<object>} [allNpcs=[]] All available NPCs
 * @param {Array<object>} [availableTraits=[]] All available traits and stats
 * @param {Function} [onModify] Callback triggered when opponent properties are updated
 * @param {Function} [onFullRefresh] Callback triggered when opponents are added, cloned or removed
 * @returns {HTMLElement | null} Created section element, or null if arguments are invalid
 */
export function renderCombatOpponentsSection(
    container,
    combat,
    allNpcs = [],
    availableTraits = [],
    onModify,
    onFullRefresh
) {
    if (!container || typeof container.appendChild !== 'function' || !combat) {
        return null
    }

    const safeNpcs = Array.isArray(allNpcs) ? allNpcs : []
    const safeTraits = Array.isArray(availableTraits) ? availableTraits : []
    const safeModify = typeof onModify === 'function' ? onModify : () => {}
    const safeRefresh = typeof onFullRefresh === 'function' ? onFullRefresh : () => {}

    const opponents =
        typeof combat.getCombatOpponents === 'function' ? combat.getCombatOpponents() : []
    const visibleStatIds =
        typeof combat.getVisibleStatIds === 'function' ? combat.getVisibleStatIds() : []

    const section = document.createElement('div')
    section.className = 'bg-[#18181b] border border-[#2e3037] rounded-lg p-2.5 space-y-2.5'
    section.innerHTML = `
        ${renderOpponentsHeaderHtml(opponents.length)}
        ${renderAddOpponentFormHtml()}
        <div id="combat-opponents-list" class="space-y-2 pt-1">
            ${opponents.length === 0 ? renderEmptyOpponentsListHtml() : ''}
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
    populateNpcSelect(opponentSelect, safeNpcs)

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
            toast.error(t('combat.select_npc_required') || 'Wybierz postać!')
            return
        }

        const selectedNpc = safeNpcs.find(
            n => (typeof n.getId === 'function' ? n.getId() : n.id) === selectedId
        )
        const defaultName = t('combat.default_opponent_name') || 'Przeciwnik'
        const baseName = selectedNpc
            ? typeof selectedNpc.getName === 'function'
                ? selectedNpc.getName()
                : selectedNpc.name
            : defaultName

        const avatar = selectedNpc
            ? typeof selectedNpc.getAvatar === 'function'
                ? selectedNpc.getAvatar()
                : selectedNpc.avatar || 'warrior'
            : 'warrior'

        const customName = opponentNameInput?.value?.trim() || baseName

        // Pre-fill parameters and stats with initial values from the selected NPC
        const initialStats = resolveInitialOpponentStats(selectedNpc, safeTraits)

        const newOpponent = {
            id: generateOpponentId(),
            npcId: selectedId,
            name: customName,
            avatar: avatar,
            overriddenStats: initialStats,
        }

        if (typeof combat.addCombatOpponent === 'function') {
            combat.addCombatOpponent(newOpponent)
        }
        if (selectedNpc && typeof combat.addOpponent === 'function') {
            combat.addOpponent(selectedNpc)
        }

        safeRefresh()
        const addedMsg =
            t('combat.opponent_added', { name: customName }) ||
            `${t('buttons.add') || 'Dodano'}: ${customName}`
        toast.success(addedMsg)
    })

    // Render individual opponent cards
    if (opponentsListContainer && opponents.length > 0) {
        opponents.forEach(opp => {
            const card = createOpponentCard(
                opp,
                combat,
                safeNpcs,
                visibleStatIds,
                safeTraits,
                safeModify,
                safeRefresh
            )
            opponentsListContainer.appendChild(card)
        })
    }

    return section
}
