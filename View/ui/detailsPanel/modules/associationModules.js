import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    DEFAULT_TAG_COLOR,
    Description,
    Feature,
    Parameter,
    Skill,
    Stat,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { evaluateFormula } from '../../npcModal/formulaEvaluator.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'

/**
 * Helper to trigger details panel refresh.
 *
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
function refreshDetails(ctx, onRefreshDetails) {
    if (typeof onRefreshDetails === 'function') {
        onRefreshDetails(ctx)
    } else if (typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
}

/**
 * Renders associated locations module.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderLocationsModule(container, entity, type, ctx, onRefreshDetails) {
    if (
        typeof entity.getLocations !== 'function' &&
        typeof entity.getLocation !== 'function' &&
        typeof entity.addLocation !== 'function'
    ) {
        return
    }

    const currentLocs =
        typeof entity.getLocations === 'function'
            ? entity.getLocations()
            : entity.getLocation && entity.getLocation()
              ? [entity.getLocation()]
              : []

    const locationMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                <span>${t('details.locations')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentLocs.length}</span>
        </div>
        <div id="details-locations-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-location-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_location')} --</option>
            </select>
            <button id="btn-details-add-location" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_location')}
            </button>
        </div>
    `
    )

    const locsListEl = locationMod.querySelector('#details-locations-list')
    if (currentLocs.length === 0) {
        locsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_locations')}</span>`
    } else {
        currentLocs.forEach(l => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
            row.innerHTML = `
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                    <span class="truncate">${escapeHtml(l.getName())}</span>
                </span>
                <button class="text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            `
            row.querySelector('button').addEventListener('click', () => {
                ctx.vm.removeLocationFromSelected(l.getId())
                refreshDetails(ctx, onRefreshDetails)
                ctx.refreshActiveSection(type)
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })
            locsListEl.appendChild(row)
        })
    }

    const locSelect = locationMod.querySelector('#details-add-location-select')
    locSelect.innerHTML =
        `<option value="">-- ${t('details.select_location')} --</option>` +
        ctx.projectLocations
            .map(
                l => `<option value="${escapeHtml(l.getId())}">${escapeHtml(l.getName())}</option>`
            )
            .join('')

    locationMod.querySelector('#btn-details-add-location').addEventListener('click', () => {
        const selectedId = locSelect.value
        const locObj = ctx.projectLocations.find(l => l.getId() === selectedId)
        if (locObj) {
            ctx.vm.addLocationToSelected(locObj)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(locationMod)
}

/**
 * Renders associated characters module.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderCharactersModule(container, entity, type, ctx, onRefreshDetails) {
    if (
        typeof entity.getCharacters !== 'function' ||
        typeof entity.addCharacter !== 'function' ||
        typeof entity.removeCharacter !== 'function'
    ) {
        return
    }

    const currentChars = entity.getCharacters() || []

    const charsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                <span>${t('details.characters')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${currentChars.length}</span>
        </div>
        <div id="details-characters-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-char-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_character')} --</option>
            </select>
            <button id="btn-details-add-char" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_character')}
            </button>
        </div>
    `
    )

    const charsListEl = charsMod.querySelector('#details-characters-list')
    if (currentChars.length === 0) {
        charsListEl.innerHTML = `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_characters')}</span>`
    } else {
        currentChars.forEach(c => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
            row.innerHTML = `
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                    <span class="truncate">${escapeHtml(c.getName())}</span>
                </span>
                <button class="text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
                    ${getIconSvg('close', 'w-3 h-3')}
                </button>
            `
            row.querySelector('button').addEventListener('click', () => {
                ctx.vm.removeCharacterFromSelected(c.getId())
                refreshDetails(ctx, onRefreshDetails)
                ctx.refreshActiveSection(type)
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })
            charsListEl.appendChild(row)
        })
    }

    const charSelect = charsMod.querySelector('#details-add-char-select')
    charSelect.innerHTML =
        `<option value="">-- ${t('details.select_character')} --</option>` +
        ctx.projectCharacters
            .map(
                c => `<option value="${escapeHtml(c.getId())}">${escapeHtml(c.getName())}</option>`
            )
            .join('')

    charsMod.querySelector('#btn-details-add-char').addEventListener('click', () => {
        const charId = charSelect.value
        const charObj = ctx.projectCharacters.find(c => c.getId() === charId)
        if (charObj) {
            ctx.vm.addCharacterToSelected(charObj)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(charsMod)
}

/**
 * Renders associated tags module.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderTagsModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getTags || !entity.addTag || !entity.removeTag) return

    const currentTags = entity.getTags() || []

    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.tags')}</div>
        <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">${t('left_panel.no_tags')}</option>
            </select>
            <button id="btn-details-add-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_tag')}
            </button>
        </div>
    `
    )

    const tagsListEl = tagsMod.querySelector('#details-tags-list')
    currentTags.forEach(tObj => {
        const chip = document.createElement('span')
        chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white'
        chip.style.backgroundColor = tObj.getColor() || DEFAULT_TAG_COLOR
        chip.innerHTML = `<span>#${escapeHtml(tObj.getName())}</span><button class="hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-2.5 h-2.5')}</button>`
        chip.querySelector('button').addEventListener('click', () => {
            ctx.vm.removeTagFromSelected(tObj.getId())
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        })
        tagsListEl.appendChild(chip)
    })

    const tagSelect = tagsMod.querySelector('#details-add-tag-select')
    tagSelect.innerHTML =
        `<option value="">-- ${t('details.tags')} --</option>` +
        ctx.projectTags
            .map(
                tObj =>
                    `<option value="${escapeHtml(tObj.getId())}">${escapeHtml(tObj.getName())}</option>`
            )
            .join('')

    tagsMod.querySelector('#btn-details-add-tag').addEventListener('click', () => {
        const selectedId = tagSelect.value
        const tagObj = ctx.projectTags.find(t => t.getId() === selectedId)
        if (tagObj) {
            ctx.vm.addTagToSelected(tagObj)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(tagsMod)
}

/**
 * Renders associated traits/stats module with inline values and add dropdown.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderTraitsModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getStats || !entity.addStat || !entity.removeStat) return

    const statsList = entity.getStats() || []

    const statsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${t('details.traits')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsList.length}</span>
        </div>
        <div id="details-stats-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('left_panel.no_stats')}</span>` : ''}
        </div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-stat-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.traits')} --</option>
            </select>
            <button id="btn-details-add-stat" type="button" class="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_trait')}
            </button>
        </div>
    `
    )

    const statsListEl = statsMod.querySelector('#details-stats-list')
    statsList.forEach(st => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-amber-500/40 text-xs transition-colors'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(st.getName())}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                <input type="text" class="stat-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(st.getValue ? st.getValue() : ''))}" placeholder="10" />
                <button type="button" class="btn-remove-stat text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
            </div>
        `

        const valInput = row.querySelector('.stat-val-input')
        if (valInput) {
            valInput.addEventListener('change', () => {
                if (st.setValue) st.setValue(valInput.value.trim())
                ctx.refreshActiveSection(type)
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    if (st.setValue) st.setValue(valInput.value.trim())
                    valInput.blur()
                    ctx.refreshActiveSection(type)
                }
            })
        }

        row.querySelector('.btn-remove-stat').addEventListener('click', () => {
            ctx.vm.removeStatFromSelected(st.getId())
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        })

        statsListEl.appendChild(row)
    })

    const statSelect = statsMod.querySelector('#details-add-stat-select')
    const availableStats = (ctx.projectStats || []).filter(
        stObj =>
            !statsList.some(st => st.getId() === stObj.getId() || st.getName() === stObj.getName())
    )
    statSelect.innerHTML =
        `<option value="">-- ${t('details.traits')} --</option>` +
        availableStats
            .map(
                st =>
                    `<option value="${escapeHtml(st.getId())}">${escapeHtml(st.getName())}</option>`
            )
            .join('')

    statsMod.querySelector('#btn-details-add-stat').addEventListener('click', () => {
        const statId = statSelect.value
        const statObj = (ctx.projectStats || []).find(s => s.getId() === statId)
        if (statObj) {
            const clone = new Stat(
                statObj.getId(),
                statObj.getName(),
                statObj.getDescription ? statObj.getDescription() : new Description(),
                statObj.getValue ? statObj.getValue() : ''
            )
            ctx.vm.addStatToSelected(clone)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(statsMod)
}

/**
 * Renders associated parameters module with inline values / formula preview and add dropdown.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderParametersModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getParameters || !entity.addParameter || !entity.removeParameter) return

    const paramsList = entity.getParameters() || []
    const charStatsMap = buildStatsMap(entity.getStats ? entity.getStats() : [])

    const paramsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span>${t('details.parameters')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${paramsList.length}</span>
        </div>
        <div id="details-params-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${paramsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_parameters')}</span>` : ''}
        </div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-param-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_parameter')} --</option>
            </select>
            <button id="btn-details-add-param" type="button" class="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_parameter')}
            </button>
        </div>
    `
    )

    const paramsListEl = paramsMod.querySelector('#details-params-list')
    paramsList.forEach(p => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-rose-500/40 text-xs transition-colors'

        let valueDisplay = ''
        if (p.getMode && p.getMode() === 'formula') {
            const formula = p.getFormula ? p.getFormula() : ''
            const evalRes = evaluateFormula(formula, charStatsMap)
            const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
            valueDisplay = `<span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate max-w-[140px]" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
        } else {
            valueDisplay = `<input type="text" class="param-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-rose-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(p.getValue ? p.getValue() : ''))}" placeholder="100" />`
        }

        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(p.getName())}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
                <button type="button" class="btn-remove-param text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
            </div>
        `

        const valInput = row.querySelector('.param-val-input')
        if (valInput) {
            valInput.addEventListener('change', () => {
                if (p.setValue) p.setValue(valInput.value.trim())
                ctx.refreshActiveSection(type)
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    if (p.setValue) p.setValue(valInput.value.trim())
                    valInput.blur()
                    ctx.refreshActiveSection(type)
                }
            })
        }

        row.querySelector('.btn-remove-param').addEventListener('click', () => {
            ctx.vm.removeParameterFromSelected(p.getId())
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        })

        paramsListEl.appendChild(row)
    })

    const paramSelect = paramsMod.querySelector('#details-add-param-select')
    const availableParams = (ctx.projectParameters || []).filter(
        pObj => !paramsList.some(p => p.getId() === pObj.getId() || p.getName() === pObj.getName())
    )
    paramSelect.innerHTML =
        `<option value="">-- ${t('details.select_parameter')} --</option>` +
        availableParams
            .map(
                pObj =>
                    `<option value="${escapeHtml(pObj.getId())}">${escapeHtml(pObj.getName())}</option>`
            )
            .join('')

    paramsMod.querySelector('#btn-details-add-param').addEventListener('click', () => {
        const paramId = paramSelect.value
        const paramObj = (ctx.projectParameters || []).find(p => p.getId() === paramId)
        if (paramObj) {
            const clone = new Parameter(
                paramObj.getId(),
                paramObj.getName(),
                paramObj.getDescription ? paramObj.getDescription() : new Description(),
                paramObj.getMode ? paramObj.getMode() : 'direct',
                paramObj.getValue ? paramObj.getValue() : '',
                paramObj.getFormula ? paramObj.getFormula() : '',
                paramObj.getCalculatedValue ? paramObj.getCalculatedValue() : null
            )
            ctx.vm.addParameterToSelected(clone)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(paramsMod)
}

/**
 * Renders associated skills module with inline values / modifier preview and add dropdown.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderSkillsModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getSkills || !entity.addSkill || !entity.removeSkill) return

    const skillsList = entity.getSkills() || []

    const skillsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span>${t('details.skills')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${skillsList.length}</span>
        </div>
        <div id="details-skills-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${skillsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_skills')}</span>` : ''}
        </div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-skill-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_skill')} --</option>
            </select>
            <button id="btn-details-add-skill" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_skill')}
            </button>
        </div>
    `
    )

    const skillsListEl = skillsMod.querySelector('#details-skills-list')
    skillsList.forEach(sk => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-blue-500/40 text-xs transition-colors'

        let valueDisplay = ''
        if (sk.getMode && sk.getMode() === 'stat_mod') {
            const statName = sk.getStatName ? sk.getStatName() : ''
            const mod = sk.getModifier ? sk.getModifier() : '+0'
            valueDisplay = `<span class="px-1.5 py-0.5 rounded text-[9px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate max-w-[120px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
        } else {
            valueDisplay = `<input type="text" class="skill-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-blue-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(sk.getValue ? sk.getValue() : ''))}" placeholder="+1" />`
        }

        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(sk.getName())}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
                <button type="button" class="btn-remove-skill text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
            </div>
        `

        const valInput = row.querySelector('.skill-val-input')
        if (valInput) {
            valInput.addEventListener('change', () => {
                if (sk.setValue) sk.setValue(valInput.value.trim())
                ctx.refreshActiveSection(type)
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    if (sk.setValue) sk.setValue(valInput.value.trim())
                    valInput.blur()
                    ctx.refreshActiveSection(type)
                }
            })
        }

        row.querySelector('.btn-remove-skill').addEventListener('click', () => {
            ctx.vm.removeSkillFromSelected(sk.getId())
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        })

        skillsListEl.appendChild(row)
    })

    const skillSelect = skillsMod.querySelector('#details-add-skill-select')
    const availableSkills = (ctx.projectSkills || []).filter(
        skObj =>
            !skillsList.some(sk => sk.getId() === skObj.getId() || sk.getName() === skObj.getName())
    )
    skillSelect.innerHTML =
        `<option value="">-- ${t('details.select_skill')} --</option>` +
        availableSkills
            .map(
                skObj =>
                    `<option value="${escapeHtml(skObj.getId())}">${escapeHtml(skObj.getName())}</option>`
            )
            .join('')

    skillsMod.querySelector('#btn-details-add-skill').addEventListener('click', () => {
        const skillId = skillSelect.value
        const skillObj = (ctx.projectSkills || []).find(sk => sk.getId() === skillId)
        if (skillObj) {
            const clone = new Skill(
                skillObj.getId(),
                skillObj.getName(),
                skillObj.getDescription ? skillObj.getDescription() : new Description(),
                skillObj.getMode ? skillObj.getMode() : 'direct',
                skillObj.getValue ? skillObj.getValue() : '',
                skillObj.getStatName ? skillObj.getStatName() : '',
                skillObj.getModifier ? skillObj.getModifier() : ''
            )
            ctx.vm.addSkillToSelected(clone)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(skillsMod)
}

/**
 * Renders associated features module with description snippets and add dropdown.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderFeaturesModule(container, entity, type, ctx, onRefreshDetails) {
    if (!entity.getFeatures || !entity.addFeature || !entity.removeFeature) return

    const featuresList = entity.getFeatures() || []

    const featMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 inline-flex items-center">${getIconSvg('feature', 'w-3.5 h-3.5')}</span>
                <span>${t('details.features')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${featuresList.length}</span>
        </div>
        <div id="details-features-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${featuresList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_features')}</span>` : ''}
        </div>
        <div class="flex gap-1 pt-1">
            <select id="details-add-feature-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                <option value="">-- ${t('details.select_feature')} --</option>
            </select>
            <button id="btn-details-add-feature" type="button" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_feature')}
            </button>
        </div>
    `
    )

    const featuresListEl = featMod.querySelector('#details-features-list')
    featuresList.forEach(f => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-purple-500/40 text-xs transition-colors'

        const descText =
            f.getDescription && typeof f.getDescription === 'function'
                ? f.getDescription().getText() || f.getDescription().getSummary()
                : ''

        row.innerHTML = `
            <div class="min-w-0 flex flex-col flex-1 pr-2">
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-purple-400 shrink-0 inline-flex items-center">${getIconSvg('feature', 'w-3 h-3')}</span>
                    <span class="truncate">${escapeHtml(f.getName())}</span>
                </span>
                ${descText ? `<span class="text-[10px] text-gray-400 truncate pl-3.5 italic" title="${escapeHtml(descText)}">${escapeHtml(descText)}</span>` : ''}
            </div>
            <button type="button" class="btn-remove-feature text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        `

        row.querySelector('.btn-remove-feature').addEventListener('click', () => {
            ctx.vm.removeFeatureFromSelected(f.getId())
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        })

        featuresListEl.appendChild(row)
    })

    const featureSelect = featMod.querySelector('#details-add-feature-select')
    const availableFeatures = (ctx.projectFeatures || []).filter(
        fObj =>
            !featuresList.some(f => f.getId() === fObj.getId() || f.getName() === fObj.getName())
    )
    featureSelect.innerHTML =
        `<option value="">-- ${t('details.select_feature')} --</option>` +
        availableFeatures
            .map(
                fObj =>
                    `<option value="${escapeHtml(fObj.getId())}">${escapeHtml(fObj.getName())}</option>`
            )
            .join('')

    featMod.querySelector('#btn-details-add-feature').addEventListener('click', () => {
        const featId = featureSelect.value
        const featObj = (ctx.projectFeatures || []).find(f => f.getId() === featId)
        if (featObj) {
            const clone = new Feature(
                featObj.getId(),
                featObj.getName(),
                featObj.getDescription ? featObj.getDescription() : new Description()
            )
            ctx.vm.addFeatureToSelected(clone)
            refreshDetails(ctx, onRefreshDetails)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(featMod)
}
