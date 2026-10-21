import { escapeHtml } from '../../common/htmlTemplates.js'
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'

/**
 * Creates a standard details panel <section> container.
 *
 * @param {string} [className]
 * @param {string} [innerHTML]
 * @returns {HTMLElement}
 */
export function createSection(
    className = 'border-b border-[#333338] p-3 space-y-2',
    innerHTML = ''
) {
    const section = document.createElement('section')
    section.className = className
    if (innerHTML) {
        section.innerHTML = innerHTML
    }
    return section
}

/**
 * Builds a name-to-value map from a list of stats.
 *
 * @param {Array<object>} statsList
 * @returns {Record<string, unknown>}
 */
export function buildStatsMap(statsList = []) {
    const map = {}
    statsList.forEach(st => {
        const name = typeof st.getName === 'function' ? st.getName() : st.name
        const val = typeof st.getValue === 'function' ? st.getValue() : st.value
        if (name) {
            map[name] = val
        }
    })
    return map
}

/**
 * Evaluates a formula and returns the badge HTML for formula parameters.
 *
 * @param {string} formula
 * @param {Record<string, unknown>} statsMap
 * @param {string} [maxWidthClass='max-w-[150px]']
 * @returns {string}
 */
export function renderFormulaBadgeHtml(formula, statsMap, maxWidthClass = 'max-w-[150px]') {
    const evalRes = evaluateFormula(formula, statsMap)
    const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
    return `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate ${maxWidthClass}" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
}

/**
 * Returns the badge HTML for skill stat modifiers.
 *
 * @param {string} statName
 * @param {string} mod
 * @param {string} [maxWidthClass='max-w-[140px]']
 * @returns {string}
 */
export function renderSkillModBadgeHtml(statName, mod, maxWidthClass = 'max-w-[140px]') {
    return `<span class="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate ${maxWidthClass}">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
}
