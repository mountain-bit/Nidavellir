/**
 * @fileoverview Combat Header Component for Details Panel.
 * Displays combat module title, state badge (active/disabled),
 * and an interactive button to toggle combat encounter for the active paragraph.
 *
 * @module combatHeader
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Returns the HTML badge markup indicating combat encounter state.
 *
 * @param {boolean} hasCombat Whether combat is active
 * @returns {string} HTML markup string
 */
export function renderCombatBadgeHtml(hasCombat) {
    if (hasCombat) {
        return `<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold tracking-wide uppercase">${escapeHtml(t('combat.badge') || 'Walka')}</span>`
    }
    return `<span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700/60 font-mono uppercase">${escapeHtml(t('combat.badge_off') || 'Wyłączona')}</span>`
}

/**
 * Returns the full HTML string for the combat header.
 *
 * @param {boolean} hasCombat Whether combat is active
 * @returns {string} HTML markup string
 */
export function renderCombatHeaderHtml(hasCombat) {
    const iconSvg = getIconSvg('combat', 'w-4 h-4') || getIconSvg('swords', 'w-4 h-4') || ''
    const titleText = t('combat.title') || 'Starcie z przeciwnikami'
    const buttonText = hasCombat
        ? t('combat.toggle_disable') || t('combat.disable') || 'Wyłącz walkę'
        : t('combat.toggle_enable') || t('combat.enable') || 'Włącz walkę'

    const buttonClass = hasCombat
        ? 'bg-zinc-800 hover:bg-rose-950/70 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-700/50'
        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'

    return `
        <div class="flex items-center gap-2 min-w-0">
            <span class="text-amber-400 shrink-0" aria-hidden="true">${iconSvg}</span>
            <span class="text-xs font-bold text-zinc-200 uppercase tracking-wide truncate">
                ${escapeHtml(titleText)}
            </span>
            ${renderCombatBadgeHtml(hasCombat)}
        </div>
        <button id="btn-toggle-combat-state" data-action="toggle-combat" type="button" aria-pressed="${Boolean(hasCombat)}" class="px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${buttonClass}">
            <span>${escapeHtml(buttonText)}</span>
        </button>
    `
}

/**
 * Renders combat header into the container.
 *
 * @param {HTMLElement} container Parent DOM element
 * @param {boolean} hasCombat Whether combat encounter is currently active
 * @param {Function} [onToggle] Callback triggered when toggle button is clicked
 * @returns {HTMLDivElement | null} The created header element, or null if container is invalid
 */
export function renderCombatHeader(container, hasCombat, onToggle) {
    if (!container || typeof container.appendChild !== 'function') {
        return null
    }

    const headerDiv = document.createElement('div')
    headerDiv.className = 'flex items-center justify-between gap-2'
    headerDiv.innerHTML = renderCombatHeaderHtml(Boolean(hasCombat))

    container.appendChild(headerDiv)

    const toggleBtn =
        headerDiv.querySelector('[data-action="toggle-combat"]') ||
        headerDiv.querySelector('#btn-toggle-combat-state')

    if (toggleBtn && typeof onToggle === 'function') {
        toggleBtn.addEventListener('click', () => {
            onToggle()
        })
    }

    return headerDiv
}
