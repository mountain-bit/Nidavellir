/**
 * Combat Header Component
 * Displays combat module title, state badge, and enable/disable toggle button.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'

/**
 * Renders combat header into the container.
 *
 * @param {HTMLElement} container
 * @param {boolean} hasCombat
 * @param {Function} onToggle
 */
export function renderCombatHeader(container, hasCombat, onToggle) {
    const headerDiv = document.createElement('div')
    headerDiv.className = 'flex items-center justify-between gap-2'
    headerDiv.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
            <span class="text-amber-400 shrink-0">${getIconSvg('combat', 'w-4 h-4') || getIconSvg('swords', 'w-4 h-4')}</span>
            <span class="text-xs font-bold text-zinc-200 uppercase tracking-wide truncate">
                ${t('combat.title') || 'Starcie z przeciwnikami'}
            </span>
            ${
                hasCombat
                    ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold tracking-wide uppercase">
                        ${t('combat.badge') || 'Walka'}
                       </span>`
                    : `<span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700/60 font-mono">
                        OFF
                       </span>`
            }
        </div>
        <button id="btn-toggle-combat-state" type="button" class="px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${
            hasCombat
                ? 'bg-zinc-800 hover:bg-rose-950/70 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-700/50'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
        }">
            <span>${hasCombat ? t('combat.disable') || 'Wyłącz walkę' : t('combat.enable') || 'Włącz walkę'}</span>
        </button>
    `

    container.appendChild(headerDiv)

    const toggleBtn = headerDiv.querySelector('#btn-toggle-combat-state')
    toggleBtn?.addEventListener('click', () => {
        if (typeof onToggle === 'function') {
            onToggle()
        }
    })
}
