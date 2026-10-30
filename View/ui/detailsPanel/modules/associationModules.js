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
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'
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
    } else if (ctx && typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
}

/**
 * Pure template for locations module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderLocationsModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                <span>${t('details.locations')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty locations state.
 *
 * @returns {string}
 */
export function renderEmptyLocationsHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_locations')}</span>`
}

/**
 * Pure template for a single location row item.
 *
 * @param {object} location
 * @returns {string}
 */
export function renderLocationItemHtml(location) {
    if (!location) return ''
    const name = typeof location.getName === 'function' ? location.getName() : location.name || ''
    return `
        <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
            <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
            <span class="truncate">${escapeHtml(name)}</span>
        </span>
        <button type="button" class="btn-remove-location text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
            ${getIconSvg('close', 'w-3 h-3')}
        </button>
    `
}

/**
 * Pure template for location select options.
 *
 * @param {Array<object>} [locations=[]]
 * @returns {string}
 */
export function renderLocationOptionsHtml(locations = []) {
    const defaultOption = `<option value="">-- ${t('details.select_location')} --</option>`
    const options = (locations || [])
        .map(l => {
            const id = typeof l.getId === 'function' ? l.getId() : l.id || ''
            const name = typeof l.getName === 'function' ? l.getName() : l.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign location bar.
 *
 * @param {Array<object>} [locations=[]]
 * @returns {string}
 */
export function renderAssignLocationBarHtml(locations = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-location-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderLocationOptionsHtml(locations)}
            </select>
            <button id="btn-details-add-location" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_location')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire locations module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [locations=[]]
 * @returns {string}
 */
export function renderLocationsModuleHtml(count = 0, locations = []) {
    return `
        ${renderLocationsModuleHeaderHtml(count)}
        <div id="details-locations-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        ${renderAssignLocationBarHtml(locations)}
    `
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
        !container ||
        !entity ||
        (typeof entity.getLocations !== 'function' &&
            typeof entity.getLocation !== 'function' &&
            typeof entity.addLocation !== 'function')
    ) {
        return
    }

    const currentLocs =
        typeof entity.getLocations === 'function'
            ? entity.getLocations()
            : entity.getLocation && entity.getLocation()
              ? [entity.getLocation()]
              : []

    const projectLocations = (ctx && ctx.projectLocations) || []
    const locationMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderLocationsModuleHtml(currentLocs.length, projectLocations)
    )

    const locsListEl = locationMod.querySelector('#details-locations-list')
    if (locsListEl) {
        if (currentLocs.length === 0) {
            locsListEl.innerHTML = renderEmptyLocationsHtml()
        } else {
            currentLocs.forEach(l => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
                row.innerHTML = renderLocationItemHtml(l)

                const deleteBtn =
                    row.querySelector('.btn-remove-location') || row.querySelector('button')
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        const locId = typeof l.getId === 'function' ? l.getId() : l.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeLocationFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeLocationFromSelected(locId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                        if (
                            ctx &&
                            ctx.storyGraphInstance &&
                            typeof ctx.storyGraphInstance.render === 'function'
                        ) {
                            ctx.storyGraphInstance.render(true)
                        }
                    })
                }
                locsListEl.appendChild(row)
            })
        }
    }

    const locSelect = locationMod.querySelector('#details-add-location-select')
    const addBtn = locationMod.querySelector('#btn-details-add-location')
    if (addBtn && locSelect) {
        addBtn.addEventListener('click', () => {
            const selectedId = locSelect.value
            const locObj = projectLocations.find(l => {
                const id = typeof l.getId === 'function' ? l.getId() : l.id
                return id === selectedId
            })
            if (locObj) {
                if (
                    ctx &&
                    ctx.vm &&
                    typeof ctx?.vm?.selection?.addLocationToSelected === 'function'
                ) {
                    ctx?.vm?.selection?.addLocationToSelected(locObj)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
                if (
                    ctx &&
                    ctx.storyGraphInstance &&
                    typeof ctx.storyGraphInstance.render === 'function'
                ) {
                    ctx.storyGraphInstance.render(true)
                }
            }
        })
    }

    container.appendChild(locationMod)
}

/**
 * Pure template for characters module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderCharactersModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                <span>${t('details.characters')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty characters state.
 *
 * @returns {string}
 */
export function renderEmptyCharactersHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_characters')}</span>`
}

/**
 * Pure template for a single character row item.
 *
 * @param {object} character
 * @returns {string}
 */
export function renderCharacterItemHtml(character) {
    if (!character) return ''
    const name =
        typeof character.getName === 'function' ? character.getName() : character.name || ''
    return `
        <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
            <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
            <span class="truncate">${escapeHtml(name)}</span>
        </span>
        <button type="button" class="btn-remove-character text-gray-400 hover:text-red-400 ml-1 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">
            ${getIconSvg('close', 'w-3 h-3')}
        </button>
    `
}

/**
 * Pure template for character select options.
 *
 * @param {Array<object>} [characters=[]]
 * @returns {string}
 */
export function renderCharacterOptionsHtml(characters = []) {
    const defaultOption = `<option value="">-- ${t('details.select_character')} --</option>`
    const options = (characters || [])
        .map(c => {
            const id = typeof c.getId === 'function' ? c.getId() : c.id || ''
            const name = typeof c.getName === 'function' ? c.getName() : c.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign character bar.
 *
 * @param {Array<object>} [characters=[]]
 * @returns {string}
 */
export function renderAssignCharacterBarHtml(characters = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-char-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderCharacterOptionsHtml(characters)}
            </select>
            <button id="btn-details-add-char" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_character')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire characters module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [characters=[]]
 * @returns {string}
 */
export function renderCharactersModuleHtml(count = 0, characters = []) {
    return `
        ${renderCharactersModuleHeaderHtml(count)}
        <div id="details-characters-list" class="flex flex-col gap-1 min-h-[20px]"></div>
        ${renderAssignCharacterBarHtml(characters)}
    `
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
        !container ||
        !entity ||
        typeof entity.getCharacters !== 'function' ||
        typeof entity.addCharacter !== 'function' ||
        typeof entity.removeCharacter !== 'function'
    ) {
        return
    }

    const currentChars = entity.getCharacters() || []
    const projectCharacters = (ctx && ctx.projectCharacters) || []

    const charsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderCharactersModuleHtml(currentChars.length, projectCharacters)
    )

    const charsListEl = charsMod.querySelector('#details-characters-list')
    if (charsListEl) {
        if (currentChars.length === 0) {
            charsListEl.innerHTML = renderEmptyCharactersHtml()
        } else {
            currentChars.forEach(c => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
                row.innerHTML = renderCharacterItemHtml(c)

                const deleteBtn =
                    row.querySelector('.btn-remove-character') || row.querySelector('button')
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        const charId = typeof c.getId === 'function' ? c.getId() : c.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeCharacterFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeCharacterFromSelected(charId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                        if (
                            ctx &&
                            ctx.storyGraphInstance &&
                            typeof ctx.storyGraphInstance.render === 'function'
                        ) {
                            ctx.storyGraphInstance.render(true)
                        }
                    })
                }
                charsListEl.appendChild(row)
            })
        }
    }

    const charSelect = charsMod.querySelector('#details-add-char-select')
    const addBtn = charsMod.querySelector('#btn-details-add-char')
    if (addBtn && charSelect) {
        addBtn.addEventListener('click', () => {
            const charId = charSelect.value
            const charObj = projectCharacters.find(c => {
                const id = typeof c.getId === 'function' ? c.getId() : c.id
                return id === charId
            })
            if (charObj) {
                if (
                    ctx &&
                    ctx.vm &&
                    typeof ctx?.vm?.selection?.addCharacterToSelected === 'function'
                ) {
                    ctx?.vm?.selection?.addCharacterToSelected(charObj)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
                if (
                    ctx &&
                    ctx.storyGraphInstance &&
                    typeof ctx.storyGraphInstance.render === 'function'
                ) {
                    ctx.storyGraphInstance.render(true)
                }
            }
        })
    }

    container.appendChild(charsMod)
}

/**
 * Pure template for tags module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderTagsModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-emerald-400 shrink-0">${getIconSvg('tag', 'w-3.5 h-3.5')}</span>
                <span>${t('details.tags')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty tags state.
 *
 * @returns {string}
 */
export function renderEmptyTagsHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_tags')}</span>`
}

/**
 * Pure template for a single tag chip element.
 *
 * @param {object} tag
 * @returns {string}
 */
export function renderTagChipHtml(tag) {
    if (!tag) return ''
    const name = typeof tag.getName === 'function' ? tag.getName() : tag.name || ''
    const color =
        (typeof tag.getColor === 'function' ? tag.getColor() : tag.color) || DEFAULT_TAG_COLOR
    return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white" style="background-color: ${escapeHtml(color)}">
            <span>#${escapeHtml(name)}</span>
            <button type="button" class="btn-remove-tag hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">
                ${getIconSvg('close', 'w-2.5 h-2.5')}
            </button>
        </span>
    `
}

/**
 * Pure template for tag select options.
 *
 * @param {Array<object>} [tags=[]]
 * @returns {string}
 */
export function renderTagOptionsHtml(tags = []) {
    const defaultOption = `<option value="">-- ${t('details.select_tag')} --</option>`
    const options = (tags || [])
        .map(tObj => {
            const id = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id || ''
            const name = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign tag bar.
 *
 * @param {Array<object>} [tags=[]]
 * @returns {string}
 */
export function renderAssignTagBarHtml(tags = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderTagOptionsHtml(tags)}
            </select>
            <button id="btn-details-add-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                ${t('details.add_tag')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire tags module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [tags=[]]
 * @returns {string}
 */
export function renderTagsModuleHtml(count = 0, tags = []) {
    return `
        ${renderTagsModuleHeaderHtml(count)}
        <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
        ${renderAssignTagBarHtml(tags)}
    `
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
    if (!container || !entity || !entity.getTags || !entity.addTag || !entity.removeTag) return

    const currentTags = entity.getTags() || []
    const projectTags = (ctx && ctx.projectTags) || []

    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderTagsModuleHtml(currentTags.length, projectTags)
    )

    const tagsListEl = tagsMod.querySelector('#details-tags-list')
    if (tagsListEl) {
        if (currentTags.length === 0) {
            tagsListEl.innerHTML = renderEmptyTagsHtml()
        } else {
            currentTags.forEach(tObj => {
                const wrapper = document.createElement('div')
                wrapper.innerHTML = renderTagChipHtml(tObj).trim()
                const chip = wrapper.firstElementChild
                if (chip) {
                    const removeBtn =
                        chip.querySelector('.btn-remove-tag') || chip.querySelector('button')
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            const tagId = typeof tObj.getId === 'function' ? tObj.getId() : tObj.id
                            if (
                                ctx &&
                                ctx.vm &&
                                typeof ctx?.vm?.selection?.removeTagFromSelected === 'function'
                            ) {
                                ctx?.vm?.selection?.removeTagFromSelected(tagId)
                            }
                            refreshDetails(ctx, onRefreshDetails)
                            if (ctx && typeof ctx.refreshActiveSection === 'function') {
                                ctx.refreshActiveSection(type)
                            }
                        })
                    }
                    tagsListEl.appendChild(chip)
                }
            })
        }
    }

    const tagSelect = tagsMod.querySelector('#details-add-tag-select')
    const addBtn = tagsMod.querySelector('#btn-details-add-tag')
    if (addBtn && tagSelect) {
        addBtn.addEventListener('click', () => {
            const selectedId = tagSelect.value
            const tagObj = projectTags.find(t => {
                const id = typeof t.getId === 'function' ? t.getId() : t.id
                return id === selectedId
            })
            if (tagObj) {
                if (ctx && ctx.vm && typeof ctx?.vm?.selection?.addTagToSelected === 'function') {
                    ctx?.vm?.selection?.addTagToSelected(tagObj)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
            }
        })
    }

    container.appendChild(tagsMod)
}

/**
 * Pure template for traits module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderTraitsModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${t('details.traits')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty traits state.
 *
 * @returns {string}
 */
export function renderEmptyTraitsHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('left_panel.no_stats')}</span>`
}

/**
 * Pure template for a single trait/stat row.
 *
 * @param {object} stat
 * @returns {string}
 */
export function renderTraitItemHtml(stat) {
    if (!stat) return ''
    const name = typeof stat.getName === 'function' ? stat.getName() : stat.name || ''
    const val = typeof stat.getValue === 'function' ? stat.getValue() : (stat.value ?? '')
    return `
        <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
            <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
            <span class="truncate">${escapeHtml(name)}</span>
        </span>
        <div class="flex items-center gap-1.5 shrink-0">
            <input type="text" class="stat-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-amber-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(val))}" placeholder="10" />
            <button type="button" class="btn-remove-stat text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        </div>
    `
}

/**
 * Pure template for trait select options.
 *
 * @param {Array<object>} [availableStats=[]]
 * @returns {string}
 */
export function renderTraitOptionsHtml(availableStats = []) {
    const defaultOption = `<option value="">-- ${t('details.traits')} --</option>`
    const options = (availableStats || [])
        .map(st => {
            const id = typeof st.getId === 'function' ? st.getId() : st.id || ''
            const name = typeof st.getName === 'function' ? st.getName() : st.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign trait bar.
 *
 * @param {Array<object>} [availableStats=[]]
 * @returns {string}
 */
export function renderAssignTraitBarHtml(availableStats = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-stat-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderTraitOptionsHtml(availableStats)}
            </select>
            <button id="btn-details-add-stat" type="button" class="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_trait')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire traits module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [availableStats=[]]
 * @returns {string}
 */
export function renderTraitsModuleHtml(count = 0, availableStats = []) {
    return `
        ${renderTraitsModuleHeaderHtml(count)}
        <div id="details-stats-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>
        ${renderAssignTraitBarHtml(availableStats)}
    `
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
    if (!container || !entity || !entity.getStats || !entity.addStat || !entity.removeStat) return

    const statsList = entity.getStats() || []
    const availableStats = (ctx && ctx.projectStats ? ctx.projectStats : []).filter(stObj => {
        const stObjId = typeof stObj.getId === 'function' ? stObj.getId() : stObj.id
        const stObjName = typeof stObj.getName === 'function' ? stObj.getName() : stObj.name
        return !statsList.some(st => {
            const id = typeof st.getId === 'function' ? st.getId() : st.id
            const name = typeof st.getName === 'function' ? st.getName() : st.name
            return id === stObjId || name === stObjName
        })
    })

    const statsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderTraitsModuleHtml(statsList.length, availableStats)
    )

    const statsListEl = statsMod.querySelector('#details-stats-list')
    if (statsListEl) {
        if (statsList.length === 0) {
            statsListEl.innerHTML = renderEmptyTraitsHtml()
        } else {
            statsList.forEach(st => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-amber-500/40 text-xs transition-colors'
                row.innerHTML = renderTraitItemHtml(st)

                const valInput = row.querySelector('.stat-val-input')
                if (valInput) {
                    valInput.addEventListener('change', () => {
                        if (st.setValue) st.setValue(valInput.value.trim())
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                    valInput.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            if (st.setValue) st.setValue(valInput.value.trim())
                            valInput.blur()
                            if (ctx && typeof ctx.refreshActiveSection === 'function') {
                                ctx.refreshActiveSection(type)
                            }
                        }
                    })
                }

                const removeBtn =
                    row.querySelector('.btn-remove-stat') || row.querySelector('button')
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        const statId = typeof st.getId === 'function' ? st.getId() : st.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeStatFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeStatFromSelected(statId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                }

                statsListEl.appendChild(row)
            })
        }
    }

    const statSelect = statsMod.querySelector('#details-add-stat-select')
    const addBtn = statsMod.querySelector('#btn-details-add-stat')
    if (addBtn && statSelect) {
        addBtn.addEventListener('click', () => {
            const statId = statSelect.value
            const statObj = (ctx && ctx.projectStats ? ctx.projectStats : []).find(s => {
                const id = typeof s.getId === 'function' ? s.getId() : s.id
                return id === statId
            })
            if (statObj) {
                const clone = new Stat(
                    typeof statObj.getId === 'function' ? statObj.getId() : statObj.id,
                    typeof statObj.getName === 'function' ? statObj.getName() : statObj.name,
                    statObj.getDescription ? statObj.getDescription() : new Description(),
                    statObj.getValue ? statObj.getValue() : ''
                )
                if (ctx && ctx.vm && typeof ctx?.vm?.selection?.addStatToSelected === 'function') {
                    ctx?.vm?.selection?.addStatToSelected(clone)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
            }
        })
    }

    container.appendChild(statsMod)
}

/**
 * Pure template for parameters module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderParametersModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span>${t('details.parameters')}</span>
            </span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty parameters state.
 *
 * @returns {string}
 */
export function renderEmptyParametersHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_parameters')}</span>`
}

/**
 * Pure template for a single parameter row.
 *
 * @param {object} p
 * @param {Record<string, number>} [charStatsMap={}]
 * @returns {string}
 */
export function renderParameterItemHtml(p, charStatsMap = {}) {
    if (!p) return ''
    const name = typeof p.getName === 'function' ? p.getName() : p.name || ''
    const mode = typeof p.getMode === 'function' ? p.getMode() : p.mode || 'direct'

    let valueDisplay = ''
    if (mode === 'formula') {
        const formula = typeof p.getFormula === 'function' ? p.getFormula() : p.formula || ''
        const evalRes = evaluateFormula(formula, charStatsMap)
        const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
        valueDisplay = `<span class="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate max-w-[140px]" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
    } else {
        const val = typeof p.getValue === 'function' ? p.getValue() : (p.value ?? '')
        valueDisplay = `<input type="text" class="param-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-rose-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(val))}" placeholder="100" />`
    }

    return `
        <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
            <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
            <span class="truncate">${escapeHtml(name)}</span>
        </span>
        <div class="flex items-center gap-1.5 shrink-0">
            ${valueDisplay}
            <button type="button" class="btn-remove-param text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        </div>
    `
}

/**
 * Pure template for parameter select options.
 *
 * @param {Array<object>} [availableParams=[]]
 * @returns {string}
 */
export function renderParameterOptionsHtml(availableParams = []) {
    const defaultOption = `<option value="">-- ${t('details.select_parameter')} --</option>`
    const options = (availableParams || [])
        .map(pObj => {
            const id = typeof pObj.getId === 'function' ? pObj.getId() : pObj.id || ''
            const name = typeof pObj.getName === 'function' ? pObj.getName() : pObj.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign parameter bar.
 *
 * @param {Array<object>} [availableParams=[]]
 * @returns {string}
 */
export function renderAssignParameterBarHtml(availableParams = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-param-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderParameterOptionsHtml(availableParams)}
            </select>
            <button id="btn-details-add-param" type="button" class="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_parameter')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire parameters module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [availableParams=[]]
 * @returns {string}
 */
export function renderParametersModuleHtml(count = 0, availableParams = []) {
    return `
        ${renderParametersModuleHeaderHtml(count)}
        <div id="details-params-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>
        ${renderAssignParameterBarHtml(availableParams)}
    `
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
    if (
        !container ||
        !entity ||
        !entity.getParameters ||
        !entity.addParameter ||
        !entity.removeParameter
    )
        return

    const paramsList = entity.getParameters() || []
    const charStatsMap = buildStatsMap(entity.getStats ? entity.getStats() : [])
    const availableParams = (ctx && ctx.projectParameters ? ctx.projectParameters : []).filter(
        pObj => {
            const pObjId = typeof pObj.getId === 'function' ? pObj.getId() : pObj.id
            const pObjName = typeof pObj.getName === 'function' ? pObj.getName() : pObj.name
            return !paramsList.some(p => {
                const id = typeof p.getId === 'function' ? p.getId() : p.id
                const name = typeof p.getName === 'function' ? p.getName() : p.name
                return id === pObjId || name === pObjName
            })
        }
    )

    const paramsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderParametersModuleHtml(paramsList.length, availableParams)
    )

    const paramsListEl = paramsMod.querySelector('#details-params-list')
    if (paramsListEl) {
        if (paramsList.length === 0) {
            paramsListEl.innerHTML = renderEmptyParametersHtml()
        } else {
            paramsList.forEach(p => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-rose-500/40 text-xs transition-colors'
                row.innerHTML = renderParameterItemHtml(p, charStatsMap)

                const valInput = row.querySelector('.param-val-input')
                if (valInput) {
                    valInput.addEventListener('change', () => {
                        if (p.setValue) p.setValue(valInput.value.trim())
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                    valInput.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            if (p.setValue) p.setValue(valInput.value.trim())
                            valInput.blur()
                            if (ctx && typeof ctx.refreshActiveSection === 'function') {
                                ctx.refreshActiveSection(type)
                            }
                        }
                    })
                }

                const removeBtn =
                    row.querySelector('.btn-remove-param') || row.querySelector('button')
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        const paramId = typeof p.getId === 'function' ? p.getId() : p.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeParameterFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeParameterFromSelected(paramId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                }

                paramsListEl.appendChild(row)
            })
        }
    }

    const paramSelect = paramsMod.querySelector('#details-add-param-select')
    const addBtn = paramsMod.querySelector('#btn-details-add-param')
    if (addBtn && paramSelect) {
        addBtn.addEventListener('click', () => {
            const paramId = paramSelect.value
            const paramObj = (ctx && ctx.projectParameters ? ctx.projectParameters : []).find(p => {
                const id = typeof p.getId === 'function' ? p.getId() : p.id
                return id === paramId
            })
            if (paramObj) {
                const clone = new Parameter(
                    typeof paramObj.getId === 'function' ? paramObj.getId() : paramObj.id,
                    typeof paramObj.getName === 'function' ? paramObj.getName() : paramObj.name,
                    paramObj.getDescription ? paramObj.getDescription() : new Description(),
                    paramObj.getMode ? paramObj.getMode() : 'direct',
                    paramObj.getValue ? paramObj.getValue() : '',
                    paramObj.getFormula ? paramObj.getFormula() : '',
                    paramObj.getCalculatedValue ? paramObj.getCalculatedValue() : null
                )
                if (
                    ctx &&
                    ctx.vm &&
                    typeof ctx?.vm?.selection?.addParameterToSelected === 'function'
                ) {
                    ctx?.vm?.selection?.addParameterToSelected(clone)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
            }
        })
    }

    container.appendChild(paramsMod)
}

/**
 * Pure template for skills module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderSkillsModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span>${t('details.skills')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty skills state.
 *
 * @returns {string}
 */
export function renderEmptySkillsHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_skills')}</span>`
}

/**
 * Pure template for a single skill row.
 *
 * @param {object} sk
 * @returns {string}
 */
export function renderSkillItemHtml(sk) {
    if (!sk) return ''
    const name = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
    const mode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'

    let valueDisplay = ''
    if (mode === 'stat_mod') {
        const statName = typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
        const mod = typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || '+0'
        valueDisplay = `<span class="px-1.5 py-0.5 rounded text-[9px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate max-w-[120px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
    } else {
        const val = typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? '')
        valueDisplay = `<input type="text" class="skill-val-input w-16 bg-[#202023] border border-[#3f3f46] focus:border-blue-500/60 rounded px-1.5 py-0.5 text-xs text-white text-right font-mono" value="${escapeHtml(String(val))}" placeholder="+1" />`
    }

    return `
        <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
            <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
            <span class="truncate">${escapeHtml(name)}</span>
        </span>
        <div class="flex items-center gap-1.5 shrink-0">
            ${valueDisplay}
            <button type="button" class="btn-remove-skill text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        </div>
    `
}

/**
 * Pure template for skill select options.
 *
 * @param {Array<object>} [availableSkills=[]]
 * @returns {string}
 */
export function renderSkillOptionsHtml(availableSkills = []) {
    const defaultOption = `<option value="">-- ${t('details.select_skill')} --</option>`
    const options = (availableSkills || [])
        .map(skObj => {
            const id = typeof skObj.getId === 'function' ? skObj.getId() : skObj.id || ''
            const name = typeof skObj.getName === 'function' ? skObj.getName() : skObj.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign skill bar.
 *
 * @param {Array<object>} [availableSkills=[]]
 * @returns {string}
 */
export function renderAssignSkillBarHtml(availableSkills = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-skill-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderSkillOptionsHtml(availableSkills)}
            </select>
            <button id="btn-details-add-skill" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_skill')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire skills module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [availableSkills=[]]
 * @returns {string}
 */
export function renderSkillsModuleHtml(count = 0, availableSkills = []) {
    return `
        ${renderSkillsModuleHeaderHtml(count)}
        <div id="details-skills-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>
        ${renderAssignSkillBarHtml(availableSkills)}
    `
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
    if (!container || !entity || !entity.getSkills || !entity.addSkill || !entity.removeSkill)
        return

    const skillsList = entity.getSkills() || []
    const availableSkills = (ctx && ctx.projectSkills ? ctx.projectSkills : []).filter(skObj => {
        const skObjId = typeof skObj.getId === 'function' ? skObj.getId() : skObj.id
        const skObjName = typeof skObj.getName === 'function' ? skObj.getName() : skObj.name
        return !skillsList.some(sk => {
            const id = typeof sk.getId === 'function' ? sk.getId() : sk.id
            const name = typeof sk.getName === 'function' ? sk.getName() : sk.name
            return id === skObjId || name === skObjName
        })
    })

    const skillsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderSkillsModuleHtml(skillsList.length, availableSkills)
    )

    const skillsListEl = skillsMod.querySelector('#details-skills-list')
    if (skillsListEl) {
        if (skillsList.length === 0) {
            skillsListEl.innerHTML = renderEmptySkillsHtml()
        } else {
            skillsList.forEach(sk => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-blue-500/40 text-xs transition-colors'
                row.innerHTML = renderSkillItemHtml(sk)

                const valInput = row.querySelector('.skill-val-input')
                if (valInput) {
                    valInput.addEventListener('change', () => {
                        if (sk.setValue) sk.setValue(valInput.value.trim())
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                    valInput.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            if (sk.setValue) sk.setValue(valInput.value.trim())
                            valInput.blur()
                            if (ctx && typeof ctx.refreshActiveSection === 'function') {
                                ctx.refreshActiveSection(type)
                            }
                        }
                    })
                }

                const removeBtn =
                    row.querySelector('.btn-remove-skill') || row.querySelector('button')
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        const skillId = typeof sk.getId === 'function' ? sk.getId() : sk.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeSkillFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeSkillFromSelected(skillId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                }

                skillsListEl.appendChild(row)
            })
        }
    }

    const skillSelect = skillsMod.querySelector('#details-add-skill-select')
    const addBtn = skillsMod.querySelector('#btn-details-add-skill')
    if (addBtn && skillSelect) {
        addBtn.addEventListener('click', () => {
            const skillId = skillSelect.value
            const skillObj = (ctx && ctx.projectSkills ? ctx.projectSkills : []).find(sk => {
                const id = typeof sk.getId === 'function' ? sk.getId() : sk.id
                return id === skillId
            })
            if (skillObj) {
                const clone = new Skill(
                    typeof skillObj.getId === 'function' ? skillObj.getId() : skillObj.id,
                    typeof skillObj.getName === 'function' ? skillObj.getName() : skillObj.name,
                    skillObj.getDescription ? skillObj.getDescription() : new Description(),
                    skillObj.getMode ? skillObj.getMode() : 'direct',
                    skillObj.getValue ? skillObj.getValue() : '',
                    skillObj.getStatName ? skillObj.getStatName() : '',
                    skillObj.getModifier ? skillObj.getModifier() : ''
                )
                if (ctx && ctx.vm && typeof ctx?.vm?.selection?.addSkillToSelected === 'function') {
                    ctx?.vm?.selection?.addSkillToSelected(clone)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
            }
        })
    }

    container.appendChild(skillsMod)
}

/**
 * Pure template for features module header.
 *
 * @param {number} [count=0]
 * @returns {string}
 */
export function renderFeaturesModuleHeaderHtml(count = 0) {
    const num = Number(count) || 0
    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 inline-flex items-center">${getIconSvg('feature', 'w-3.5 h-3.5')}</span>
                <span>${t('details.features')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${num}</span>
        </div>
    `
}

/**
 * Pure template for empty features state.
 *
 * @returns {string}
 */
export function renderEmptyFeaturesHtml() {
    return `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_features')}</span>`
}

/**
 * Pure template for a single feature row.
 *
 * @param {object} f
 * @returns {string}
 */
export function renderFeatureItemHtml(f) {
    if (!f) return ''
    const name = typeof f.getName === 'function' ? f.getName() : f.name || ''
    const descText =
        f.getDescription && typeof f.getDescription === 'function'
            ? f.getDescription().getText() || f.getDescription().getSummary()
            : ''

    return `
        <div class="min-w-0 flex flex-col flex-1 pr-2">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                <span class="text-purple-400 shrink-0 inline-flex items-center">${getIconSvg('feature', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(name)}</span>
            </span>
            ${descText ? `<span class="text-[10px] text-gray-400 truncate pl-3.5 italic" title="${escapeHtml(descText)}">${escapeHtml(descText)}</span>` : ''}
        </div>
        <button type="button" class="btn-remove-feature text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
    `
}

/**
 * Pure template for feature select options.
 *
 * @param {Array<object>} [availableFeatures=[]]
 * @returns {string}
 */
export function renderFeatureOptionsHtml(availableFeatures = []) {
    const defaultOption = `<option value="">-- ${t('details.select_feature')} --</option>`
    const options = (availableFeatures || [])
        .map(fObj => {
            const id = typeof fObj.getId === 'function' ? fObj.getId() : fObj.id || ''
            const name = typeof fObj.getName === 'function' ? fObj.getName() : fObj.name || ''
            return `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`
        })
        .join('')
    return defaultOption + options
}

/**
 * Pure template for the assign feature bar.
 *
 * @param {Array<object>} [availableFeatures=[]]
 * @returns {string}
 */
export function renderAssignFeatureBarHtml(availableFeatures = []) {
    return `
        <div class="flex gap-1 pt-1">
            <select id="details-add-feature-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                ${renderFeatureOptionsHtml(availableFeatures)}
            </select>
            <button id="btn-details-add-feature" type="button" class="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                ${t('details.add_feature')}
            </button>
        </div>
    `
}

/**
 * Pure template for the entire features module.
 *
 * @param {number} [count=0]
 * @param {Array<object>} [availableFeatures=[]]
 * @returns {string}
 */
export function renderFeaturesModuleHtml(count = 0, availableFeatures = []) {
    return `
        ${renderFeaturesModuleHeaderHtml(count)}
        <div id="details-features-list" class="flex flex-col gap-1.5 min-h-[20px]"></div>
        ${renderAssignFeatureBarHtml(availableFeatures)}
    `
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
    if (!container || !entity || !entity.getFeatures || !entity.addFeature || !entity.removeFeature)
        return

    const featuresList = entity.getFeatures() || []
    const availableFeatures = (ctx && ctx.projectFeatures ? ctx.projectFeatures : []).filter(
        fObj => {
            const fObjId = typeof fObj.getId === 'function' ? fObj.getId() : fObj.id
            const fObjName = typeof fObj.getName === 'function' ? fObj.getName() : fObj.name
            return !featuresList.some(f => {
                const id = typeof f.getId === 'function' ? f.getId() : f.id
                const name = typeof f.getName === 'function' ? f.getName() : f.name
                return id === fObjId || name === fObjName
            })
        }
    )

    const featMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderFeaturesModuleHtml(featuresList.length, availableFeatures)
    )

    const featuresListEl = featMod.querySelector('#details-features-list')
    if (featuresListEl) {
        if (featuresList.length === 0) {
            featuresListEl.innerHTML = renderEmptyFeaturesHtml()
        } else {
            featuresList.forEach(f => {
                const row = document.createElement('div')
                row.className =
                    'flex items-center justify-between bg-[#18181b] px-2 py-1.5 rounded border border-[#27272a] hover:border-purple-500/40 text-xs transition-colors'
                row.innerHTML = renderFeatureItemHtml(f)

                const removeBtn =
                    row.querySelector('.btn-remove-feature') || row.querySelector('button')
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        const featId = typeof f.getId === 'function' ? f.getId() : f.id
                        if (
                            ctx &&
                            ctx.vm &&
                            typeof ctx?.vm?.selection?.removeFeatureFromSelected === 'function'
                        ) {
                            ctx?.vm?.selection?.removeFeatureFromSelected(featId)
                        }
                        refreshDetails(ctx, onRefreshDetails)
                        if (ctx && typeof ctx.refreshActiveSection === 'function') {
                            ctx.refreshActiveSection(type)
                        }
                    })
                }

                featuresListEl.appendChild(row)
            })
        }
    }

    const featureSelect = featMod.querySelector('#details-add-feature-select')
    const addBtn = featMod.querySelector('#btn-details-add-feature')
    if (addBtn && featureSelect) {
        addBtn.addEventListener('click', () => {
            const featId = featureSelect.value
            const featObj = (ctx && ctx.projectFeatures ? ctx.projectFeatures : []).find(f => {
                const id = typeof f.getId === 'function' ? f.getId() : f.id
                return id === featId
            })
            if (featObj) {
                const clone = new Feature(
                    typeof featObj.getId === 'function' ? featObj.getId() : featObj.id,
                    typeof featObj.getName === 'function' ? featObj.getName() : featObj.name,
                    featObj.getDescription ? featObj.getDescription() : new Description()
                )
                if (
                    ctx &&
                    ctx.vm &&
                    typeof ctx?.vm?.selection?.addFeatureToSelected === 'function'
                ) {
                    ctx?.vm?.selection?.addFeatureToSelected(clone)
                }
                refreshDetails(ctx, onRefreshDetails)
                if (ctx && typeof ctx.refreshActiveSection === 'function') {
                    ctx.refreshActiveSection(type)
                }
            }
        })
    }

    container.appendChild(featMod)
}
