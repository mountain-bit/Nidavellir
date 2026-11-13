/**
 * HTML string templates for NPC Creation Window elements.
 * Generates organic RPG character-sheet styling, badges, and tiles.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'

/**
 * Safely looks up a translation key with a fallback string.
 *
 * @param {string} key
 * @param {string} fallback
 * @returns {string}
 */
export function safeT(key, fallback) {
    try {
        if (typeof t === 'function') {
            const val = t(key)
            if (val && val !== key) return val
        }
    } catch {
        // ignore
    }
    return fallback
}

/**
 * Escapes characters in attributes/HTML to prevent XSS. Re-exports canonical escapeHtml.
 */
export const escapeAttr = escapeHtml

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
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-zinc-800 hover:border-[#4a5e74]/60 bg-[#1b1c20] hover:bg-[#222429] transition-all cursor-pointer group select-none text-center shadow-sm"
        >
            <div class="w-8 h-8 rounded-lg p-1.5 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border: 1px solid ${avatar.borderColor}">
                ${avatar.svg}
            </div>
            <span class="text-[10px] font-semibold text-zinc-300 group-hover:text-[#adc7e2] truncate max-w-full">
                ${escapeAttr(avatar.name)}
            </span>
        </button>
    `
}

/**
 * Renders an attribute row with flag, value, or list support based on project feature definitions.
 *
 * @param {{ id: string, name: string, value: string, isEditing?: boolean, featureKind?: string, options?: string[] }} attr
 * @param {Array<object>} [projectFeatures=[]]
 * @returns {string}
 */
export function renderAttributeRowHtml(attr, projectFeatures = []) {
    const isEditing = attr.isEditing !== false
    const attrName = (attr?.name || '').trim().toLowerCase()

    const fDef = (Array.isArray(projectFeatures) ? projectFeatures : []).find(f => {
        const fName = (typeof f.getName === 'function' ? f.getName() : f.name || '')
            .trim()
            .toLowerCase()
        return fName && fName === attrName
    })

    const kind =
        (fDef && typeof fDef.getFeatureKind === 'function'
            ? fDef.getFeatureKind()
            : fDef && fDef.featureKind
              ? fDef.featureKind
              : attr?.featureKind) || (fDef ? 'flag' : 'value')

    const rawOptions =
        (fDef && typeof fDef.getOptions === 'function'
            ? fDef.getOptions()
            : fDef && fDef.options
              ? fDef.options
              : attr?.options) || []
    const options = Array.isArray(rawOptions) ? rawOptions : []

    if (isEditing) {
        let valueControlHtml = ''
        if (kind === 'flag') {
            valueControlHtml = `<span class="text-[11px] text-purple-400 italic px-1 select-none shrink-0" data-i18n="details.feature_type_flag">${escapeAttr(safeT('details.feature_type_flag', 'Flaga'))}</span>`
        } else if (kind === 'list' && options.length > 0) {
            valueControlHtml = `
            <select
                data-attr-field="value"
                class="flex-1 min-w-[90px] bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none transition-colors cursor-pointer"
            >
                ${options.map(opt => `<option value="${escapeAttr(opt)}" ${String(opt) === String(attr.value) ? 'selected' : ''}>${escapeAttr(opt)}</option>`).join('')}
            </select>`
        } else {
            valueControlHtml = `
            <input
                type="text"
                data-attr-field="value"
                value="${escapeAttr(attr.value ?? '')}"
                placeholder="${escapeAttr(safeT('npc.attr_value_placeholder', 'Wartość (np. Leśny Elf)'))}"
                data-i18n-placeholder="npc.attr_value_placeholder"
                class="flex-1 min-w-[90px] bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
            />`
        }

        const nameInputWidth = kind === 'flag' ? 'flex-1' : 'w-1/3 min-w-[80px]'

        return `
        <div class="npc-attribute-row flex items-center gap-1.5 p-1 rounded-lg bg-zinc-900/80 border border-[#4a5e74]/50 shadow-sm transition-all group" data-attr-id="${escapeAttr(attr.id)}" data-attr-name="${escapeAttr(attr.name)}" data-state="edit">
            <span class="text-[#9bb7d4] pl-1 select-none shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
            <span class="sr-only">${escapeAttr(attr.name)}</span>
            <input
                type="text"
                data-attr-field="name"
                value="${escapeAttr(attr.name)}"
                placeholder="${escapeAttr(safeT('npc.attr_name_placeholder', 'Atrybut (np. Rasa)'))}"
                data-i18n-placeholder="npc.attr_name_placeholder"
                class="${nameInputWidth} bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-100 font-semibold placeholder-zinc-500 focus:outline-none transition-colors"
            />
            ${valueControlHtml}
            <button
                type="button"
                data-action="confirm-attribute"
                data-attr-id="${escapeAttr(attr.id)}"
                class="p-1 rounded bg-[#3d4e61]/40 hover:bg-[#3d4e61]/70 text-[#adc7e2] hover:text-white border border-[#4a5e74]/50 transition-colors cursor-pointer shrink-0"
                title="${escapeAttr(safeT('npc.confirm', 'Zatwierdź'))}"
                data-i18n-title="npc.confirm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
            <button
                type="button"
                data-action="remove-attribute"
                data-attr-id="${escapeAttr(attr.id)}"
                class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="${escapeAttr(safeT('npc.remove_attribute', 'Usuń atrybut'))}"
                data-i18n-title="npc.remove_attribute"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
    }

    const hasValue =
        kind !== 'flag' &&
        attr.value !== undefined &&
        attr.value !== null &&
        String(attr.value).trim() !== ''
    const valueDisplay = hasValue
        ? `<span class="text-xs text-zinc-400 font-medium shrink-0">${escapeAttr(attr.name || safeT('npc.attr_unnamed', 'Atrybut'))}:</span>
           <span class="text-xs font-semibold text-zinc-100 truncate">${escapeAttr(attr.value)}</span>`
        : `<span class="text-xs font-semibold text-zinc-100 truncate">${escapeAttr(attr.name || safeT('npc.attr_unnamed', 'Atrybut'))}</span>`

    return `
        <div class="npc-attribute-row flex items-center justify-between gap-2 py-1 px-2.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-[#4a5e74]/40 transition-all group cursor-pointer" data-attr-id="${escapeAttr(attr.id)}" data-attr-name="${escapeAttr(attr.name)}" data-state="read" title="${escapeAttr(safeT('npc.click_to_edit', 'Kliknij, aby edytować'))}">
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-[#9bb7d4] pl-0.5 select-none shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                ${valueDisplay}
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    data-action="edit-attribute"
                    data-attr-id="${escapeAttr(attr.id)}"
                    class="p-1 rounded text-zinc-400 hover:text-[#adc7e2] hover:bg-[#3d4e61]/20 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.edit', 'Edytuj'))}"
                    data-i18n-title="npc.edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-attribute"
                    data-attr-id="${escapeAttr(attr.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_attribute', 'Usuń atrybut'))}"
                    data-i18n-title="npc.remove_attribute"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `
}

/**
 * Renders a stat row.
 *
 * @param {{ id: string, name: string, value: string, isEditing?: boolean }} stat
 * @returns {string}
 */
export function renderStatRowHtml(stat) {
    const isEditing = stat.isEditing !== false
    const isList =
        stat.statKind === 'list' && Array.isArray(stat.options) && stat.options.length > 0

    if (isEditing) {
        const valControlHtml = isList
            ? `<select
                data-stat-field="value"
                class="flex-1 min-w-[70px] bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-[#adc7e2] font-mono font-bold focus:outline-none transition-colors"
               >
                ${stat.options
                    .map(
                        opt =>
                            `<option value="${escapeAttr(opt)}" ${String(opt) === String(stat.value) ? 'selected' : ''}>${escapeAttr(opt)}</option>`
                    )
                    .join('')}
               </select>`
            : `<input
                type="text"
                data-stat-field="value"
                value="${escapeAttr(stat.value)}"
                placeholder="${escapeAttr(safeT('npc.stat_value_placeholder', 'Kość / wartość (np. 14, 2d6)'))}"
                data-i18n-placeholder="npc.stat_value_placeholder"
                class="flex-1 min-w-[70px] bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-[#adc7e2] font-mono font-bold placeholder-zinc-500 focus:outline-none transition-colors text-right sm:text-left"
               />`

        return `
        <div class="npc-stat-row flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900/80 border border-[#4a5e74]/50 shadow-sm transition-all" data-stat-id="${escapeAttr(stat.id)}" data-state="edit">
            <span class="text-[#9bb7d4] pl-1 select-none shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
            <input
                type="text"
                data-stat-field="name"
                value="${escapeAttr(stat.name)}"
                placeholder="${escapeAttr(safeT('npc.stat_name_placeholder', 'Cecha (np. Siła)'))}"
                data-i18n-placeholder="npc.stat_name_placeholder"
                class="w-1/2 min-w-[85px] bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-100 font-semibold placeholder-zinc-500 focus:outline-none transition-colors"
            />
            ${valControlHtml}
            <button
                type="button"
                data-action="confirm-stat"
                data-stat-id="${escapeAttr(stat.id)}"
                class="p-1 rounded bg-[#3d4e61]/40 hover:bg-[#3d4e61]/70 text-[#adc7e2] hover:text-white border border-[#4a5e74]/50 transition-colors cursor-pointer shrink-0"
                title="${escapeAttr(safeT('npc.confirm', 'Zatwierdź'))}"
                data-i18n-title="npc.confirm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
            <button
                type="button"
                data-action="remove-stat"
                data-stat-id="${escapeAttr(stat.id)}"
                class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                title="${escapeAttr(safeT('npc.remove_stat', 'Usuń cechę'))}"
                data-i18n-title="npc.remove_stat"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `
    }

    return `
        <div class="npc-stat-row flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-[#4a5e74]/40 transition-all group cursor-pointer" data-stat-id="${escapeAttr(stat.id)}" data-state="read" title="${escapeAttr(safeT('npc.click_to_edit', 'Kliknij, aby edytować'))}">
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-[#9bb7d4] select-none shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span class="text-xs font-semibold text-zinc-200 truncate">${escapeAttr(stat.name || safeT('npc.stat_unnamed', 'Bezimienna'))}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <span class="px-2 py-0.5 rounded-md bg-[#242d38] text-[#adc7e2] border border-[#3d4e61]/50 text-xs font-mono font-bold shadow-sm">
                    ${escapeAttr(stat.value || '-')}
                </span>
                <button
                    type="button"
                    data-action="edit-stat"
                    data-stat-id="${escapeAttr(stat.id)}"
                    class="p-1 rounded text-zinc-400 hover:text-[#adc7e2] hover:bg-[#3d4e61]/20 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.edit', 'Edytuj'))}"
                    data-i18n-title="npc.edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-stat"
                    data-stat-id="${escapeAttr(stat.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_stat', 'Usuń cechę'))}"
                    data-i18n-title="npc.remove_stat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
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
    const defaultLabel = safeT('npc.select_stat_default', '-- Wybierz cechę --')
    return [
        `<option value="" data-i18n="npc.select_stat_default">${escapeAttr(defaultLabel)}</option>`,
    ]
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
 * @param {{ id: string, name: string, mode: string, value: string, statName: string, modifier: string, isEditing?: boolean }} skill
 * @param {string[]} availableStats
 * @returns {string}
 */
export function renderSkillRowHtml(skill, availableStats) {
    const isEditing = skill.isEditing !== false
    const isStatMod = skill.mode === 'stat_mod'
    const optionsHtml = renderSkillStatOptionsHtml(availableStats, skill.statName)

    if (isEditing) {
        return `
        <div class="npc-skill-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-[#4a5e74]/50 shadow-sm transition-all" data-skill-id="${escapeAttr(skill.id)}" data-state="edit">
            <div class="flex items-center gap-2 flex-1 min-w-[170px]">
                <span class="text-[#9bb7d4] pl-0.5 select-none shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <input
                    type="text"
                    data-skill-field="name"
                    value="${escapeAttr(skill.name)}"
                    placeholder="${escapeAttr(safeT('npc.skill_name_placeholder', 'Umiejętność (np. Skradanie)'))}"
                    data-i18n-placeholder="npc.skill_name_placeholder"
                    class="flex-1 bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-100 font-semibold placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <select
                    data-skill-field="mode"
                    class="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-medium focus:outline-none focus:border-[#4a5e74] transition-colors cursor-pointer shrink-0"
                >
                    <option value="direct" ${!isStatMod ? 'selected' : ''} data-i18n="npc.mode_direct">${escapeAttr(safeT('npc.mode_direct', 'Wartość'))}</option>
                    <option value="stat_mod" ${isStatMod ? 'selected' : ''} data-i18n="npc.mode_stat_mod">${escapeAttr(safeT('npc.mode_stat_mod', 'Cecha + mod'))}</option>
                </select>
            </div>

            <!-- Direct Value Mode -->
            <div class="skill-direct-mode-container flex items-center gap-2 flex-1 ${isStatMod ? 'hidden' : ''}">
                <input
                    type="text"
                    data-skill-field="value"
                    value="${escapeAttr(skill.value)}"
                    placeholder="${escapeAttr(safeT('npc.skill_direct_value_placeholder', 'Wartość / kość (np. +2, d6, 2d6)'))}"
                    data-i18n-placeholder="npc.skill_direct_value_placeholder"
                    class="w-full bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                />
            </div>

            <!-- Stat + Mod Mode -->
            <div class="skill-stat-mod-container flex items-center gap-2 flex-1 ${!isStatMod ? 'hidden' : ''}">
                <select
                    data-skill-field="statName"
                    class="flex-1 bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-200 transition-colors cursor-pointer"
                >
                    ${optionsHtml}
                </select>
                <span class="text-xs text-[#9bb7d4] font-bold">+</span>
                <input
                    type="text"
                    data-skill-field="modifier"
                    value="${escapeAttr(skill.modifier)}"
                    placeholder="${escapeAttr(safeT('npc.skill_modifier_placeholder', 'Mod (+2)'))}"
                    data-i18n-placeholder="npc.skill_modifier_placeholder"
                    class="w-20 bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-[#adc7e2] placeholder-zinc-500 focus:outline-none transition-colors font-mono font-bold text-center"
                />
            </div>

            <div class="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                    type="button"
                    data-action="confirm-skill"
                    data-skill-id="${escapeAttr(skill.id)}"
                    class="p-1 rounded bg-[#3d4e61]/40 hover:bg-[#3d4e61]/70 text-[#adc7e2] hover:text-white border border-[#4a5e74]/50 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.confirm', 'Zatwierdź'))}"
                    data-i18n-title="npc.confirm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-skill"
                    data-skill-id="${escapeAttr(skill.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_skill', 'Usuń umiejętność'))}"
                    data-i18n-title="npc.remove_skill"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `
    }

    return `
        <div class="npc-skill-row flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-[#4a5e74]/40 transition-all group cursor-pointer" data-skill-id="${escapeAttr(skill.id)}" data-state="read" title="${escapeAttr(safeT('npc.click_to_edit', 'Kliknij, aby edytować'))}">
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-[#9bb7d4] select-none shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-zinc-200 truncate">${escapeAttr(skill.name || safeT('npc.skill_unnamed', 'Umiejętność'))}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${
                    isStatMod
                        ? `
                    <span class="text-[11px] text-zinc-300 bg-zinc-800/90 px-2 py-0.5 rounded border border-zinc-700/60 font-medium">
                        ${escapeAttr(skill.statName || safeT('npc.select_stat_default', 'Cecha'))}
                        <span class="text-[#adc7e2] font-mono font-bold ml-1">${escapeAttr(skill.modifier ? (skill.modifier.startsWith('+') || skill.modifier.startsWith('-') ? skill.modifier : `+${skill.modifier}`) : '+0')}</span>
                    </span>
                `
                        : `
                    <span class="px-2.5 py-0.5 rounded-md bg-[#242d38] text-[#adc7e2] border border-[#3d4e61]/50 text-xs font-mono font-bold shadow-sm">
                        ${escapeAttr(skill.value || '-')}
                    </span>
                `
                }
                <button
                    type="button"
                    data-action="edit-skill"
                    data-skill-id="${escapeAttr(skill.id)}"
                    class="p-1 rounded text-zinc-400 hover:text-[#adc7e2] hover:bg-[#3d4e61]/20 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.edit', 'Edytuj'))}"
                    data-i18n-title="npc.edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-skill"
                    data-skill-id="${escapeAttr(skill.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_skill', 'Usuń umiejętność'))}"
                    data-i18n-title="npc.remove_skill"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `
}

/**
 * Renders the preview badge for formula calculations in character sheet style.
 *
 * @param {{ result: number|null, error?: string }|null} calc
 * @param {boolean} isFormula
 * @param {string} formula
 * @returns {string}
 */
export function renderVitalPreviewBadgeHtml(calc, isFormula, formula) {
    if (!isFormula) return ''
    if (!formula || !formula.trim()) {
        const enterLabel = safeT('npc.vital_enter_formula', 'Wpisz wzór')
        return `<span class="npc-vital-preview px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-zinc-700 select-none" data-i18n="npc.vital_enter_formula">${escapeAttr(enterLabel)}</span>`
    }
    if (calc && calc.result !== null && !calc.error) {
        const titleText = safeT('npc.vital_calculated_value', 'Obliczona wartość')
        return `<span class="npc-vital-preview px-2 py-0.5 rounded-md bg-[#242d38] text-[#adc7e2] text-[10px] font-mono font-bold border border-[#3d4e61]/50 select-none shadow-sm" title="${escapeAttr(titleText)}" data-i18n-title="npc.vital_calculated_value">= ${calc.result}</span>`
    }
    const err = calc?.error || safeT('npc.vital_formula_syntax_error', 'Błąd wzoru')
    return `<span class="npc-vital-preview px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 text-[10px] font-mono border border-rose-500/40 select-none" title="${escapeAttr(err)}">${escapeAttr(err)}</span>`
}

/**
 * Renders a vital parameter row.
 *
 * @param {{ id: string, name: string, mode: string, value: string, formula: string, isEditing?: boolean }} vital
 * @param {Record<string, any>} statsMap
 * @param {Function} evaluateFormulaFn
 * @returns {string}
 */
export function renderVitalRowHtml(vital, statsMap, evaluateFormulaFn) {
    const isEditing = vital.isEditing !== false
    const isFormula = vital.mode === 'formula'
    const calc =
        isFormula && typeof evaluateFormulaFn === 'function'
            ? evaluateFormulaFn(vital.formula, statsMap)
            : null
    const badgeHtml = renderVitalPreviewBadgeHtml(calc, isFormula, vital.formula)

    if (isEditing) {
        return `
        <div class="npc-vital-row flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-zinc-900/80 border border-[#4a5e74]/50 shadow-sm transition-all" data-vital-id="${escapeAttr(vital.id)}" data-state="edit">
            <div class="flex items-center gap-2 flex-1 min-w-[170px]">
                <span class="text-[#9bb7d4] pl-0.5 select-none shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <input
                    type="text"
                    data-vital-field="name"
                    value="${escapeAttr(vital.name)}"
                    placeholder="${escapeAttr(safeT('npc.vital_name_placeholder', 'Parametr (np. Punkty Życia)'))}"
                    data-i18n-placeholder="npc.vital_name_placeholder"
                    class="flex-1 bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2 py-1 text-xs text-zinc-100 font-semibold placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <select
                    data-vital-field="mode"
                    class="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 font-medium focus:outline-none focus:border-[#4a5e74] transition-colors cursor-pointer shrink-0"
                >
                    <option value="direct" ${!isFormula ? 'selected' : ''} data-i18n="npc.mode_direct">${escapeAttr(safeT('npc.mode_direct', 'Wartość'))}</option>
                    <option value="formula" ${isFormula ? 'selected' : ''} data-i18n="npc.mode_formula">${escapeAttr(safeT('npc.mode_formula', 'Wzór'))}</option>
                </select>
            </div>

            <!-- Direct Value Mode Container -->
            <div class="vital-direct-container flex items-center gap-2 flex-1 ${isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="value"
                    value="${escapeAttr(vital.value)}"
                    placeholder="${escapeAttr(safeT('npc.vital_direct_value_placeholder', 'Wartość / kość (np. 100, 2d10)'))}"
                    data-i18n-placeholder="npc.vital_direct_value_placeholder"
                    class="w-full bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2.5 py-1 text-xs text-[#adc7e2] placeholder-zinc-500 focus:outline-none transition-colors font-mono font-bold"
                />
            </div>

            <!-- Formula Mode Container -->
            <div class="vital-formula-container flex items-center gap-2 flex-1 ${!isFormula ? 'hidden' : ''}">
                <input
                    type="text"
                    data-vital-field="formula"
                    value="${escapeAttr(vital.formula)}"
                    placeholder="${escapeAttr(safeT('npc.vital_formula_placeholder', 'Wzór (np. Siła * 4 + 10)'))}"
                    data-i18n-placeholder="npc.vital_formula_placeholder"
                    class="flex-1 bg-zinc-950/70 border border-zinc-700/80 focus:border-[#4a5e74] rounded px-2.5 py-1 text-xs text-[#adc7e2] placeholder-zinc-500 focus:outline-none transition-colors font-mono"
                />
                <div class="vital-preview-slot shrink-0">
                    ${badgeHtml}
                </div>
            </div>

            <div class="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                    type="button"
                    data-action="confirm-vital"
                    data-vital-id="${escapeAttr(vital.id)}"
                    class="p-1 rounded bg-[#3d4e61]/40 hover:bg-[#3d4e61]/70 text-[#adc7e2] hover:text-white border border-[#4a5e74]/50 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.confirm', 'Zatwierdź'))}"
                    data-i18n-title="npc.confirm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-vital"
                    data-vital-id="${escapeAttr(vital.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_vital', 'Usuń parametr'))}"
                    data-i18n-title="npc.remove_vital"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `
    }

    return `
        <div class="npc-vital-row flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-[#4a5e74]/40 transition-all group cursor-pointer" data-vital-id="${escapeAttr(vital.id)}" data-state="read" title="${escapeAttr(safeT('npc.click_to_edit', 'Kliknij, aby edytować'))}">
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-[#9bb7d4] select-none shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-zinc-200 truncate">${escapeAttr(vital.name || safeT('npc.vital_unnamed', 'Parametr'))}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${
                    isFormula
                        ? `
                    <span class="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 hidden sm:inline-block">${escapeAttr(vital.formula)}</span>
                    ${badgeHtml}
                `
                        : `
                    <span class="px-2.5 py-0.5 rounded-md bg-[#242d38] text-[#adc7e2] border border-[#3d4e61]/50 text-xs font-mono font-bold shadow-sm">
                        ${escapeAttr(vital.value || '-')}
                    </span>
                `
                }
                <button
                    type="button"
                    data-action="edit-vital"
                    data-vital-id="${escapeAttr(vital.id)}"
                    class="p-1 rounded text-zinc-400 hover:text-[#adc7e2] hover:bg-[#3d4e61]/20 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.edit', 'Edytuj'))}"
                    data-i18n-title="npc.edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button
                    type="button"
                    data-action="remove-vital"
                    data-vital-id="${escapeAttr(vital.id)}"
                    class="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="${escapeAttr(safeT('npc.remove_vital', 'Usuń parametr'))}"
                    data-i18n-title="npc.remove_vital"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    `
}

/**
 * Renders a character tag chip in the NPC creation sheet.
 *
 * @param {{ id: string, name: string, color?: string }} tag
 * @returns {string}
 */
export function renderNpcTagChipHtml(tag) {
    const color = tag.color || '#3b82f6'
    const name = tag.name || ''
    const id = tag.id || name
    return `
        <span
            class="npc-tag-chip inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm transition-all select-none group"
            style="background-color: ${escapeAttr(color)}15; border-color: ${escapeAttr(color)}50; color: ${escapeAttr(color)};"
            data-tag-id="${escapeAttr(id)}"
            data-tag-name="${escapeAttr(name)}"
        >
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${escapeAttr(color)};"></span>
            <span class="text-zinc-200 group-hover:text-white transition-colors">${escapeAttr(name)}</span>
            <button
                type="button"
                data-action="remove-npc-tag"
                data-tag-id="${escapeAttr(id)}"
                class="hover:opacity-100 opacity-60 text-zinc-400 hover:text-rose-400 ml-0.5 cursor-pointer leading-none"
                title="${escapeAttr(safeT('npc.remove_tag', 'Usuń tag'))}"
            >
                &times;
            </button>
        </span>
    `
}

/**
 * Renders an available tag pill inside the tag selector popover.
 *
 * @param {{ id: string, name: string, color?: string }} tag
 * @param {boolean} [isSelected=false]
 * @returns {string}
 */
export function renderAvailableTagItemHtml(tag, isSelected = false) {
    const color = tag.color || '#3b82f6'
    const name = tag.name || ''
    const id = tag.id || name
    return `
        <button
            type="button"
            data-action="select-available-tag"
            data-tag-id="${escapeAttr(id)}"
            data-tag-name="${escapeAttr(name)}"
            data-tag-color="${escapeAttr(color)}"
            class="px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 select-none ${
                isSelected ? 'opacity-40 pointer-events-none' : 'hover:scale-105 active:scale-95'
            }"
            style="background-color: ${escapeAttr(color)}20; border-color: ${escapeAttr(color)}60; color: ${escapeAttr(color)};"
            title="${isSelected ? escapeAttr(t('npc.tag_already_assigned')) : escapeAttr(t('npc.add_tag_name', { name }))}"
        >
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${escapeAttr(color)};"></span>
            <span>${escapeAttr(name)}</span>
            ${isSelected ? `<span class="inline-flex items-center">${getIconSvg('check', 'w-2.5 h-2.5')}</span>` : '+'}
        </button>
    `
}

/**
 * Renders a dynamic suggested chip for horizontal scrolling bar.
 *
 * @param {{ type: 'stat'|'vital'|'skill'|'attribute'|'tag', name: string, extraData?: string }} options
 * @returns {string}
 */
export function renderSuggestedChipHtml({ type, name, extraData = '' }) {
    let chipClass =
        'px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-[#adc7e2] border border-zinc-700/60 text-[10px] transition-colors cursor-pointer select-none shrink-0 whitespace-nowrap'
    let dataAttr = ''

    if (type === 'stat') {
        chipClass += ' npc-stat-preset-chip'
        dataAttr = `data-preset-stat="${escapeAttr(name)}"`
    } else if (type === 'vital') {
        chipClass += ' npc-vital-preset-chip'
        dataAttr = `data-preset-vital="${escapeAttr(name)}"`
    } else if (type === 'skill') {
        chipClass += ' npc-skill-preset-chip'
        dataAttr = `data-preset-skill="${escapeAttr(name)}"`
    } else if (type === 'attribute') {
        chipClass += ' npc-preset-chip'
        dataAttr = `data-preset-name="${escapeAttr(name)}"`
    } else if (type === 'tag') {
        chipClass += ' npc-tag-preset-chip'
        dataAttr = `data-preset-tag="${escapeAttr(name)}"`
    }

    return `
        <button type="button" class="${chipClass}" ${dataAttr} ${extraData}>
            + <span>${escapeAttr(name)}</span>
        </button>
    `
}

/**
 * Renders an applied template badge/chip with remove button.
 *
 * @param {{ id: string, name: string, avatar?: string }} tpl
 * @returns {string}
 */
export function renderAppliedTemplateChipHtml(tpl) {
    const name = tpl.name || 'Szablon'
    const id = tpl.id || ''
    return `
        <div class="npc-applied-template-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-medium shadow-sm group select-none transition-all hover:border-purple-400" data-template-id="${escapeAttr(id)}">
            <span class="inline-flex items-center text-purple-400 shrink-0">${getIconSvg('template', 'w-3 h-3')}</span>
            <span class="truncate font-semibold tracking-wide">${escapeHtml(name)}</span>
            <button
                type="button"
                class="btn-remove-applied-template ml-1 p-0.5 rounded text-purple-400/70 hover:text-red-300 hover:bg-red-500/20 cursor-pointer inline-flex items-center transition-colors"
                data-template-id="${escapeAttr(id)}"
                title="${safeT('buttons.delete', 'Usuń')}"
            >
                ${getIconSvg('close', 'w-3 h-3')}
            </button>
        </div>
    `
}

/**
 * Renders an item in the template dropdown menu.
 *
 * @param {object} tpl
 * @param {boolean} isApplied
 * @returns {string}
 */
export function renderTemplateDropdownItemHtml(tpl, isApplied = false) {
    const id = tpl.id || (typeof tpl.getId === 'function' ? tpl.getId() : '')
    const name = tpl.name || (typeof tpl.getName === 'function' ? tpl.getName() : 'Szablon')
    const summary =
        typeof tpl.getSummary === 'function' ? tpl.getSummary() : tpl.description?.summary || ''

    const statsCount =
        typeof tpl.getStats === 'function'
            ? tpl.getStats().length
            : Array.isArray(tpl.stats)
              ? tpl.stats.length
              : 0

    const vitalsCount =
        typeof tpl.getParameters === 'function'
            ? tpl.getParameters().length
            : Array.isArray(tpl.parameters)
              ? tpl.parameters.length
              : 0

    const traitsBadge =
        statsCount || vitalsCount
            ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">${statsCount} cech, ${vitalsCount} param.</span>`
            : ''

    return `
        <button
            type="button"
            class="template-dropdown-item w-full flex items-center justify-between p-2 rounded-lg hover:bg-purple-950/50 border border-transparent hover:border-purple-500/30 transition-all cursor-pointer text-left group select-none"
            data-template-id="${escapeAttr(id)}"
            data-template-name="${escapeAttr(name)}"
        >
            <div class="flex items-center gap-2 min-w-0 pr-2">
                <div class="w-6 h-6 rounded flex items-center justify-center bg-purple-900/50 text-purple-300 border border-purple-700/40 shrink-0 group-hover:scale-105 transition-transform">
                    ${getIconSvg('template', 'w-3.5 h-3.5')}
                </div>
                <div class="flex flex-col min-w-0">
                    <span class="text-xs font-semibold text-zinc-200 group-hover:text-purple-200 truncate">${escapeHtml(name)}</span>
                    ${summary ? `<span class="text-[10px] text-zinc-400 truncate">${escapeHtml(summary)}</span>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                ${traitsBadge}
                ${
                    isApplied
                        ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 font-mono font-semibold">${safeT('npc.template_already_applied_badge', 'Użyty')}</span>`
                        : `<span class="text-xs text-purple-400 group-hover:text-purple-200 font-bold group-hover:scale-125 transition-transform">+</span>`
                }
            </div>
        </button>
    `
}
