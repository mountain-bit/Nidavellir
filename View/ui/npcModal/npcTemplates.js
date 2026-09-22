/**
 * HTML string templates for NPC Creation Window elements.
 * Isolates markup generation from DOM event listeners and controllers.
 */

/**
 * Escapes characters in attributes/HTML to prevent XSS.
 *
 * @param {any} str
 * @returns {string}
 */
export function escapeAttr(str) {
    if (str === undefined || str === null) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/**
 * Renders a fantasy avatar item button in the selection grid.
 *
 * @param {{ id: string, name: string, svg: string, bgColor: string, color: string, borderColor: string }} avatar
 * @returns {string}
 */
export function renderAvatarGridItemHtml(avatar) {
    return `
        <button
            type="button"
            data-avatar-id="${escapeAttr(avatar.id)}"
            title="${escapeAttr(avatar.name)}"
            class="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[#2d2d32] hover:border-blue-500/60 bg-[#1f1f23] hover:bg-[#27272a] transition-all cursor-pointer group select-none text-center"
        >
            <div class="w-8 h-8 rounded-md p-1.5 flex items-center justify-center transition-transform group-hover:scale-110" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border: 1px solid ${avatar.borderColor}">
                ${avatar.svg}
            </div>
            <span class="text-[10px] font-medium text-gray-300 group-hover:text-white truncate max-w-full">
                ${escapeAttr(avatar.name)}
            </span>
        </button>
    `
}

/**
 * Renders a custom attribute row.
 *
 * @param {{ id: string, name: string, value: string }} attr
 * @returns {string}
 */
export function renderAttributeRowHtml(attr) {
    return `
        <div class="npc-attribute-row flex items-center gap-2 group" data-attr-id="${escapeAttr(attr.id)}">
            <input
                type="text"
                data-attr-field="name"
                value="${escapeAttr(attr.name)}"
                placeholder="Nazwa (np. Rasa)"
                class="w-1/3 min-w-[90px] bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
                type="text"
                data-attr-field="value"
                value="${escapeAttr(attr.value)}"
                placeholder="Wartość (np. Elf)"
                class="flex-1 bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
                type="button"
                data-action="remove-attribute"
                data-attr-id="${escapeAttr(attr.id)}"
                class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Usuń atrybut"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
}

/**
 * Renders a stat row.
 *
 * @param {{ id: string, name: string, value: string }} stat
 * @returns {string}
 */
export function renderStatRowHtml(stat) {
    return `
        <div class="npc-stat-row flex items-center gap-2 group" data-stat-id="${escapeAttr(stat.id)}">
            <input
                type="text"
                data-stat-field="name"
                value="${escapeAttr(stat.name)}"
                placeholder="Nazwa cechy (np. Siła)"
                class="w-1/3 min-w-[90px] bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <input
                type="text"
                data-stat-field="value"
                value="${escapeAttr(stat.value)}"
                placeholder="Wartość / kość (np. 14, d6, 6d6)"
                class="flex-1 bg-[#202023] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <button
                type="button"
                data-action="remove-stat"
                data-stat-id="${escapeAttr(stat.id)}"
                class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                title="Usuń cechę"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
}

/**
 * Renders `<option>` tags for stat name selection in skill rows.
 *
 * @param {string[]} availableStats
 * @param {string} [selectedValue='']
 * @returns {string}
 */
export function renderSkillStatOptionsHtml(availableStats, selectedValue = '') {
    return ['<option value="">-- Wybierz cechę --</option>']
        .concat(
            availableStats.map(
                statName =>
                    `<option value="${escapeAttr(statName)}" ${statName === selectedValue ? 'selected' : ''}>${escapeAttr(statName)}</option>`
            )
        )
        .join('')
}

/**
 * Renders a skill row.
 *
 * @param {{ id: string, name: string, mode: string, value: string, statName: string, modifier: string }} skill
 * @param {string[]} availableStats
 * @returns {string}
 */
export function renderSkillRowHtml(skill, availableStats) {
    const isStatMod = skill.mode === 'stat_mod'
    const optionsHtml = renderSkillStatOptionsHtml(availableStats, skill.statName)

    return `
        <div class="npc-skill-row flex flex-col gap-2 p-2.5 rounded-lg bg-[#202023] border border-[#2d2d32]" data-skill-id="${escapeAttr(skill.id)}">
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    data-skill-field="name"
                    value="${escapeAttr(skill.name)}"
                    placeholder="Nazwa umiejętności (np. Skradanie)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <select
                    data-skill-field="mode"
                    class="bg-[#18181b] border border-[#3f3f46] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    <option value="direct" ${!isStatMod ? 'selected' : ''}>Wartość / Kość</option>
                    <option value="stat_mod" ${isStatMod ? 'selected' : ''}>Cecha + mod</option>
                </select>
                <button
                    type="button"
                    data-action="remove-skill"
                    data-skill-id="${escapeAttr(skill.id)}"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Usuń umiejętność"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Direct Value Mode -->
            <div class="skill-direct-mode-container flex items-center gap-2 ${isStatMod ? 'hidden' : ''}">
                <input
                    type="text"
                    data-skill-field="value"
                    value="${escapeAttr(skill.value)}"
                    placeholder="Wartość / kość (np. +2, d6, 2d6)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>

            <!-- Stat + Mod Mode -->
            <div class="skill-stat-mod-container flex items-center gap-2 ${!isStatMod ? 'hidden' : ''}">
                <select
                    data-skill-field="statName"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    ${optionsHtml}
                </select>
                <span class="text-xs text-gray-400 font-bold">+</span>
                <input
                    type="text"
                    data-skill-field="modifier"
                    value="${escapeAttr(skill.modifier)}"
                    placeholder="Mod (np. +2, +d6)"
                    class="w-28 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>
        </div>
    `
}

/**
 * Renders the preview badge for formula calculations.
 *
 * @param {{ result: number|null, error?: string }|null} calc
 * @param {boolean} isFormula
 * @param {string} formula
 * @returns {string}
 */
export function renderVitalPreviewBadgeHtml(calc, isFormula, formula) {
    if (!isFormula) return ''
    if (!formula || !formula.trim()) {
        return `<span class="npc-vital-preview px-2 py-1 rounded bg-gray-800 text-gray-500 text-[11px] font-mono border border-gray-700 select-none">Wpisz wzór</span>`
    }
    if (calc && calc.result !== null && !calc.error) {
        return `<span class="npc-vital-preview px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-semibold border border-emerald-500/30 select-none" title="Obliczona wartość">= ${calc.result}</span>`
    }
    const err = calc?.error || 'Błąd wzoru'
    return `<span class="npc-vital-preview px-2 py-1 rounded bg-amber-500/15 text-amber-400 text-[11px] font-mono border border-amber-500/30 select-none" title="${escapeAttr(err)}">${escapeAttr(err)}</span>`
}

/**
 * Renders a vital parameter row.
 *
 * @param {{ id: string, name: string, mode: string, value: string, formula: string }} vital
 * @param {Record<string, any>} statsMap
 * @param {Function} evaluateFormulaFn
 * @returns {string}
 */
export function renderVitalRowHtml(vital, statsMap, evaluateFormulaFn) {
    const isFormula = vital.mode === 'formula'
    const calc =
        isFormula && typeof evaluateFormulaFn === 'function'
            ? evaluateFormulaFn(vital.formula, statsMap)
            : null
    const badgeHtml = renderVitalPreviewBadgeHtml(calc, isFormula, vital.formula)

    return `
        <div class="npc-vital-row flex flex-col gap-2 p-2.5 rounded-lg bg-[#202023] border border-[#2d2d32]" data-vital-id="${escapeAttr(vital.id)}">
            <div class="flex items-center gap-2">
                <input
                    type="text"
                    data-vital-field="name"
                    value="${escapeAttr(vital.name)}"
                    placeholder="Nazwa parametru (np. Punkty Życia)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <select
                    data-vital-field="mode"
                    class="bg-[#18181b] border border-[#3f3f46] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                    <option value="direct" ${!isFormula ? 'selected' : ''}>Wartość / Kość</option>
                    <option value="formula" ${isFormula ? 'selected' : ''}>Wzór matematyczny</option>
                </select>
                <button
                    type="button"
                    data-action="remove-vital"
                    data-vital-id="${escapeAttr(vital.id)}"
                    class="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    title="Usuń parametr"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- Direct Value Mode Container -->
            <div class="vital-direct-container flex items-center gap-2 ${isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="value"
                    value="${escapeAttr(vital.value)}"
                    placeholder="Wartość / kość (np. 100, 2d10)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
            </div>

            <!-- Formula Mode Container -->
            <div class="vital-formula-container flex items-center gap-2 ${!isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="formula"
                    value="${escapeAttr(vital.formula)}"
                    placeholder="Wzór (np. Siła * 4 + 10)"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
                <div class="vital-preview-slot shrink-0">
                    ${badgeHtml}
                </div>
            </div>
        </div>
    `
}
