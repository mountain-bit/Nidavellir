import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { escapeHtml } from './htmlTemplates.js'

/**
 * Renders the list of Paragraphs in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderParagraphsList(ctx) {
    const container = document.getElementById('paragraphs-list-container')
    if (!container) return

    const filtered = ctx.vm.searchAndFilterParagraphs(ctx.projectParagraphs)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_paragraphs">${t('left_panel.no_paragraphs')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(p => {
            const loc = p.getLocation ? p.getLocation() : null
            const locBadge = loc
                ? `<span class="px-1 py-0.5 rounded text-[9px] bg-rose-950/70 text-rose-300 border border-rose-800/40">${escapeHtml(loc.getName())}</span>`
                : ''
            const charsBadges = (p.getCharacters ? p.getCharacters() : [])
                .map(
                    c =>
                        `<span class="px-1 py-0.5 rounded text-[9px] bg-purple-950/70 text-purple-300 border border-purple-800/40">${escapeHtml(c.getName())}</span>`
                )
                .join(' ')
            const tagsBadges = p
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')

            return `
            <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer transition-colors" data-item-type="paragraph" data-item-id="${escapeHtml(p.getId())}">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1.5">
                        <span class="text-emerald-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                        <span>§ ${escapeHtml(p.getTitle() || p.getId())}</span>
                    </span>
                </div>
                ${locBadge || charsBadges || tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${locBadge} ${charsBadges} ${tagsBadges}</div>` : ''}
            </div>
        `
        })
        .join('')

    attachItemSelectionListeners(container, 'paragraph', ctx.projectParagraphs, ctx)
    attachDrawerDropListeners(container, 'paragraph', ctx.projectParagraphs, ctx)
}

/**
 * Renders the list of Scenes in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderScenesList(ctx) {
    const container = document.getElementById('scenes-list-container')
    if (!container) return

    const filtered = ctx.vm.searchAndFilterScenes(ctx.projectScenes)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_scenes">${t('left_panel.no_scenes')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(s => {
            const pCount = s.getParagraphs ? s.getParagraphs().length : 0
            const color = s.getColor ? s.getColor() : '#3b82f6'
            const isOnGraph = s.getPosition() !== null

            return `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing transition-all select-none" 
                data-item-type="scene" 
                data-item-id="${escapeHtml(s.getId())}" 
                draggable="true" 
                title="${t('left_panel.drag_scene_hint')}">
                <div class="flex items-center gap-1.5 min-w-0">
                    <span class="scene-color-badge w-3.5 h-3.5 rounded-sm shrink-0 border border-white/20 hover:scale-125 transition-transform cursor-pointer" style="background-color: ${escapeHtml(color)}" title="${escapeHtml(t('scene.change_color'))}"></span>
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1 min-w-0">
                        <span class="text-blue-400 shrink-0">${getIconSvg('scene', 'w-3.5 h-3.5')}</span>
                        <span class="truncate">${escapeHtml(s.getName() || s.getId())}</span>
                    </span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <span class="px-1.5 py-0.5 rounded text-[9px] ${isOnGraph ? 'bg-blue-900/50 text-blue-300 border border-blue-700/40' : 'bg-gray-800 text-gray-400'}" title="${t('scene.paragraphs_count', { count: pCount })}">
                        ${pCount} §
                    </span>
                </div>
            </div>
        `
        })
        .join('')

    attachDragStartListeners(container, 'scene')
    attachContextMenuListeners(container, 'scene', ctx.projectScenes, ctx)
    attachColorPickerListeners(container, ctx)
    attachItemSelectionListeners(container, 'scene', ctx.projectScenes, ctx)
    attachDrawerDropListeners(container, 'scene', ctx.projectScenes, ctx)
}

/**
 * Renders the list of Tags in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderTagsList(ctx) {
    const container = document.getElementById('tags-list-container')
    if (!container) return

    const filtered = ctx.vm.searchAndFilterTags(ctx.projectTags)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</p>`
        return
    }

    const changeColorTitle = t('tags.change_color')
    container.innerHTML = filtered
        .map(
            tag => `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing select-none" data-item-type="tag" data-item-id="${escapeHtml(tag.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="tag-color-badge w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer shrink-0" style="background-color: ${escapeHtml(tag.getColor())}" title="${escapeHtml(changeColorTitle)}"></span>
                    <span class="font-medium text-white truncate text-xs">${escapeHtml(tag.getName())}</span>
                </div>
            </div>
        `
        )
        .join('')

    attachDragStartListeners(container, 'tag')
    attachContextMenuListeners(container, 'tag', ctx.projectTags, ctx)
    attachColorPickerListeners(container, ctx)
    attachItemSelectionListeners(container, 'tag', ctx.projectTags, ctx)
}

/**
 * Renders the list of Characters in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderCharactersList(ctx) {
    const container = document.getElementById('characters-list-container')
    if (!container) return

    const filtered = ctx.vm.searchAndFilterCharacters(ctx.projectCharacters)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_characters">${t('left_panel.no_characters')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(c => {
            const tagsBadges = c
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')
            const traitsBadges = c
                .getStats()
                .map(
                    tr =>
                        `<span class="px-1 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[9px]">${escapeHtml(tr.getName())}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing select-none" data-item-type="character" data-item-id="${escapeHtml(c.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate flex items-center gap-1.5">
                            <span class="text-purple-400 shrink-0">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                            <span>${escapeHtml(c.getName())}</span>
                        </span>
                    </div>
                    ${tagsBadges || traitsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges} ${traitsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachDragStartListeners(container, 'character')
    attachContextMenuListeners(container, 'character', ctx.projectCharacters, ctx)
    attachItemSelectionListeners(container, 'character', ctx.projectCharacters, ctx)
}

/**
 * Renders the list of Locations in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderLocationsList(ctx) {
    const container = document.getElementById('locations-list-container')
    if (!container) return

    const filtered = ctx.vm.searchAndFilterLocations(ctx.projectLocations)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_locations">${t('left_panel.no_locations')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(l => {
            const tagsBadges = l
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing select-none" data-item-type="location" data-item-id="${escapeHtml(l.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate flex items-center gap-1.5">
                            <span class="text-rose-400 shrink-0">${getIconSvg('location', 'w-3.5 h-3.5')}</span>
                            <span>${escapeHtml(l.getName())}</span>
                        </span>
                    </div>
                    ${tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachDragStartListeners(container, 'location')
    attachContextMenuListeners(container, 'location', ctx.projectLocations, ctx)
    attachItemSelectionListeners(container, 'location', ctx.projectLocations, ctx)
}

/**
 * Renders the list of Traits / Stats in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderTraitsList(ctx) {
    const container = document.getElementById('traits-list-container')
    if (!container) return

    const stats = ctx.projectStats || []
    const parameters = ctx.projectParameters || []
    const skills = ctx.projectSkills || []
    const features = ctx.projectFeatures || []

    const filteredStats =
        typeof ctx.vm?.searchAndFilterStats === 'function'
            ? ctx.vm.searchAndFilterStats(stats)
            : stats
    const filteredParams =
        typeof ctx.vm?.searchAndFilterParameters === 'function'
            ? ctx.vm.searchAndFilterParameters(parameters)
            : parameters
    const filteredSkills =
        typeof ctx.vm?.searchAndFilterSkills === 'function'
            ? ctx.vm.searchAndFilterSkills(skills)
            : skills
    const filteredFeatures =
        typeof ctx.vm?.searchAndFilterFeatures === 'function'
            ? ctx.vm.searchAndFilterFeatures(features)
            : features

    const totalFiltered =
        filteredStats.length +
        filteredParams.length +
        filteredSkills.length +
        filteredFeatures.length

    if (totalFiltered === 0) {
        container.innerHTML = `<p class="italic text-gray-500 text-center py-3" data-i18n="left_panel.no_traits">${t('left_panel.no_traits')}</p>`
        return
    }

    let html = ''

    // 1. Cechy bazowe (Stats)
    if (filteredStats.length > 0) {
        html += `
            <div class="traits-section mb-3">
                <div class="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none">
                    <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center text-amber-400">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                        <span data-i18n="left_panel.stats_section">${t('left_panel.stats_section')}</span>
                    </span>
                    <span class="px-1.5 py-0.2 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[9px] font-mono">${filteredStats.length}</span>
                </div>
                <div class="space-y-1">
                    ${filteredStats
                        .map(
                            st => `
                        <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-amber-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="stat" data-item-id="${escapeHtml(st.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                            <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                                <span class="truncate">${escapeHtml(st.getName())}</span>
                            </span>
                            ${st.getValue !== undefined && st.getValue() !== '' ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-amber-300 font-mono border border-zinc-700/60 font-semibold shrink-0">${escapeHtml(String(st.getValue()))}</span>` : ''}
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `
    }

    // 2. Parametry życiowe (Parameters)
    if (filteredParams.length > 0) {
        html += `
            <div class="traits-section mb-3">
                <div class="flex items-center justify-between text-[11px] font-bold text-rose-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none">
                    <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center text-rose-400">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                        <span data-i18n="left_panel.parameters_section">${t('left_panel.parameters_section')}</span>
                    </span>
                    <span class="px-1.5 py-0.2 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[9px] font-mono">${filteredParams.length}</span>
                </div>
                <div class="space-y-1">
                    ${filteredParams
                        .map(
                            p => `
                        <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-rose-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="parameter" data-item-id="${escapeHtml(p.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                            <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                                <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
                                <span class="truncate">${escapeHtml(p.getName())}</span>
                            </span>
                            ${p.getMode && p.getMode() === 'formula' && p.getFormula && p.getFormula() ? `<span class="px-1.5 py-0.5 rounded text-[9px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate max-w-[120px] shrink-0" title="${escapeHtml(p.getFormula())}">= ${escapeHtml(p.getFormula())}</span>` : p.getValue && p.getValue() !== '' ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 font-mono border border-zinc-700/60 shrink-0">${escapeHtml(String(p.getValue()))}</span>` : ''}
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `
    }

    // 3. Umiejętności (Skills)
    if (filteredSkills.length > 0) {
        html += `
            <div class="traits-section mb-3">
                <div class="flex items-center justify-between text-[11px] font-bold text-blue-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none">
                    <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center text-blue-400">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                        <span data-i18n="left_panel.skills_section">${t('left_panel.skills_section')}</span>
                    </span>
                    <span class="px-1.5 py-0.2 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40 text-[9px] font-mono">${filteredSkills.length}</span>
                </div>
                <div class="space-y-1">
                    ${filteredSkills
                        .map(
                            sk => `
                        <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="skill" data-item-id="${escapeHtml(sk.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                            <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
                                <span class="truncate">${escapeHtml(sk.getName())}</span>
                            </span>
                            ${sk.getMode && sk.getMode() === 'stat_mod' && sk.getStatName && sk.getStatName() ? `<span class="px-1.5 py-0.5 rounded text-[9px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 truncate max-w-[120px] shrink-0">${escapeHtml(sk.getStatName())} ${escapeHtml((sk.getModifier && sk.getModifier()) || '+0')}</span>` : sk.getValue && sk.getValue() !== '' ? `<span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 text-zinc-300 font-mono border border-zinc-700/60 shrink-0">${escapeHtml(String(sk.getValue()))}</span>` : ''}
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `
    }

    // 4. Przymioty specjalne (Features)
    if (filteredFeatures.length > 0) {
        html += `
            <div class="traits-section mb-3">
                <div class="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none">
                    <span class="flex items-center gap-1.5">
                        <span class="inline-flex items-center text-purple-400">${getIconSvg('feature', 'w-3.5 h-3.5')}</span>
                        <span data-i18n="left_panel.features_section">${t('left_panel.features_section')}</span>
                    </span>
                    <span class="px-1.5 py-0.2 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[9px] font-mono">${filteredFeatures.length}</span>
                </div>
                <div class="space-y-1">
                    ${filteredFeatures
                        .map(
                            f => `
                        <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-purple-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="feature" data-item-id="${escapeHtml(f.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                            <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                                <span class="text-purple-400 shrink-0 inline-flex items-center">${getIconSvg('feature', 'w-3 h-3')}</span>
                                <span class="truncate">${escapeHtml(f.getName())}</span>
                            </span>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `
    }

    container.innerHTML = html

    // Attach Drag & Drop for all items
    attachDragStartListeners(container)

    // Attach Context Menu & Selection for all 4 types
    attachContextMenuListeners(container, 'stat', stats, ctx)
    attachItemSelectionListeners(container, 'stat', stats, ctx)

    attachContextMenuListeners(container, 'parameter', parameters, ctx)
    attachItemSelectionListeners(container, 'parameter', parameters, ctx)

    attachContextMenuListeners(container, 'skill', skills, ctx)
    attachItemSelectionListeners(container, 'skill', skills, ctx)

    attachContextMenuListeners(container, 'feature', features, ctx)
    attachItemSelectionListeners(container, 'feature', features, ctx)
}

/**
 * Renders the list of Connections / Choices in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderConnectionsList(ctx) {
    const container = document.getElementById('connections-list-container')
    if (!container) return

    const allChoices = ctx.vm.getAllChoices(ctx.projectParagraphs)
    const filtered = ctx.vm.searchAndFilterChoices(allChoices, ctx.projectParagraphs)

    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_connections">${t('left_panel.no_connections')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(c => {
            const fromP = ctx.projectParagraphs.find(p => p.getId() === c.getFromParagraphId())
            const toP = ctx.projectParagraphs.find(p => p.getId() === c.getToParagraphId())
            const fromTitle = fromP
                ? fromP.getTitle() || fromP.getId()
                : c.getFromParagraphId() || '?'
            const toTitle = toP ? toP.getTitle() || toP.getId() : c.getToParagraphId() || '?'
            const cond = c.getCondition()
            const condBadge = cond
                ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-900/40 text-amber-300 border border-amber-700/40 truncate max-w-full">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    <span class="truncate">${escapeHtml(cond.getSummary())}</span>
                   </span>`
                : ''

            return `
            <div class="drawer-item group p-2 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1.5 cursor-pointer transition-colors" data-item-type="choice" data-item-id="${escapeHtml(c.getId())}">
                <div class="flex items-center justify-between gap-1">
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                        <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                        <span class="truncate">${escapeHtml(c.getName() || c.getId())}</span>
                    </span>
                    <button type="button" class="btn-delete-choice opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded text-gray-400 cursor-pointer inline-flex items-center transition-opacity" data-choice-id="${escapeHtml(c.getId())}" title="${t('buttons.delete')}">
                        ${getIconSvg('close', 'w-3 h-3')}
                    </button>
                </div>
                <div class="flex items-center gap-1 mt-1 text-[10px] text-[#71717a] font-mono">
                    <span class="truncate text-[#a1a1aa]">§ ${escapeHtml(fromTitle)}</span>
                    <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                    <span class="truncate text-[#a1a1aa]">§ ${escapeHtml(toTitle)}</span>
                </div>
                ${condBadge ? `<div class="mt-1 flex items-center">${condBadge}</div>` : ''}
            </div>
            `
        })
        .join('')

    container.querySelectorAll('.drawer-item').forEach(el => {
        el.addEventListener('dblclick', e => {
            if (e.target.closest('.btn-delete-choice')) return
            e.preventDefault()
            const id = el.dataset.itemId
            const choice = allChoices.find(c => c.getId() === id)
            if (choice) {
                const fromP = ctx.projectParagraphs.find(
                    p => p.getId() === choice.getFromParagraphId()
                )
                ctx.selectEntity(choice, 'choice', fromP)
            }
        })
    })

    container.querySelectorAll('.btn-delete-choice').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const id = btn.dataset.choiceId
            const choice = allChoices.find(c => c.getId() === id)
            if (
                choice &&
                confirm(
                    t('context_menu.confirm_delete', { name: choice.getName() || choice.getId() })
                )
            ) {
                ctx.vm.deleteChoice(id, ctx.projectParagraphs)
                renderConnectionsList(ctx)
                renderParagraphsList(ctx)
                if (ctx.renderHistoryBar) ctx.renderHistoryBar(ctx)
                if (ctx.renderDetailsPanel) ctx.renderDetailsPanel(ctx)
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                toast.success(t('toast.connection_deleted'))
            }
        })
    })
}

/**
 * Attaches drag & drop assignment listeners to items in Left Drawer.
 *
 * @param {HTMLElement} container
 * @param {string} targetType
 * @param {any[]} targetArray
 * @param {object} ctx
 */
export function attachDrawerDropListeners(container, targetType, targetArray, ctx) {
    container.querySelectorAll(`.drawer-item[data-item-type="${targetType}"]`).forEach(el => {
        el.addEventListener('dragover', e => {
            if (
                e.dataTransfer &&
                (e.dataTransfer.types.includes('application/x-entity-type') ||
                    e.dataTransfer.types.includes('application/x-tag-id') ||
                    e.dataTransfer.types.includes('application/x-character-id') ||
                    e.dataTransfer.types.includes('application/x-location-id'))
            ) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                el.classList.add('border-blue-500', 'ring-1', 'ring-blue-500/50')
            }
        })
        el.addEventListener('dragleave', () => {
            el.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500/50')
        })
        el.addEventListener('drop', e => {
            e.preventDefault()
            el.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500/50')
            const id = el.dataset.itemId
            const target = targetArray.find(x => x.getId() === id)
            if (!target || !e.dataTransfer) return

            let entityType = e.dataTransfer.getData('application/x-entity-type')
            let entityId = e.dataTransfer.getData('application/x-entity-id')

            if (!entityType) {
                if (e.dataTransfer.getData('application/x-tag-id')) {
                    entityType = 'tag'
                    entityId = e.dataTransfer.getData('application/x-tag-id')
                } else if (e.dataTransfer.getData('application/x-character-id')) {
                    entityType = 'character'
                    entityId = e.dataTransfer.getData('application/x-character-id')
                } else if (e.dataTransfer.getData('application/x-location-id')) {
                    entityType = 'location'
                    entityId = e.dataTransfer.getData('application/x-location-id')
                }
            }

            const targetName =
                typeof target.getName === 'function'
                    ? target.getName()
                    : typeof target.getTitle === 'function'
                      ? target.getTitle()
                      : id

            if (entityType === 'tag') {
                const tagObj = ctx.projectTags.find(tObj => tObj.getId() === entityId)
                if (tagObj) {
                    target.addTag(tagObj)
                    toast.success(
                        t('toast.tag_assigned', {
                            tag: tagObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            } else if (entityType === 'character') {
                const charObj = ctx.projectCharacters.find(c => c.getId() === entityId)
                if (charObj) {
                    target.addCharacter(charObj)
                    toast.success(
                        t('toast.character_assigned', {
                            character: charObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            } else if (entityType === 'location') {
                const locObj = ctx.projectLocations.find(l => l.getId() === entityId)
                if (locObj) {
                    if (typeof target.addLocation === 'function') {
                        target.addLocation(locObj)
                    } else if (typeof target.setLocation === 'function') {
                        target.setLocation(locObj)
                    }
                    toast.success(
                        t('toast.location_assigned', {
                            location: locObj.getName(),
                            target: targetName,
                        }),
                        t('toast.element_created_title')
                    )
                }
            }

            renderParagraphsList(ctx)
            renderScenesList(ctx)
            if (ctx.renderDetailsPanel) ctx.renderDetailsPanel(ctx)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        })
    })
}

/**
 * Attaches drag-and-drop start listeners to drawer items in a container.
 *
 * @param {HTMLElement} container
 * @param {string} [itemType]
 */
export function attachDragStartListeners(container, itemType) {
    const selector = itemType ? `.drawer-item[data-item-type="${itemType}"]` : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('dragstart', e => {
            const id = el.dataset.itemId
            const type = itemType || el.dataset.itemType
            if (e.dataTransfer && id && type) {
                e.dataTransfer.setData('text/plain', id)
                e.dataTransfer.setData('application/x-entity-type', type)
                e.dataTransfer.setData('application/x-entity-id', id)
                e.dataTransfer.setData(`application/x-${type}-id`, id)
                e.dataTransfer.effectAllowed = 'copyMove'
            }
        })
    })
}

/**
 * Attaches double-click entity selection listeners to items in Left Drawer.
 *
 * @param {HTMLElement} container
 * @param {string} type
 * @param {any[]} sourceArray
 * @param {object} ctx
 */
export function attachItemSelectionListeners(container, type, sourceArray, ctx) {
    const selector =
        type === 'trait' || type === 'stat'
            ? '.drawer-item[data-item-type="trait"], .drawer-item[data-item-type="stat"]'
            : type
              ? `.drawer-item[data-item-type="${type}"]`
              : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('dblclick', e => {
            e.preventDefault()
            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.getId() === id)
            if (item) {
                const entityType = el.dataset.itemType || (type === 'trait' ? 'stat' : type)
                ctx.selectEntity(item, entityType)
            }
        })
    })
}

/**
 * Attaches right-click context menu listeners to drawer items.
 *
 * @param {HTMLElement} container
 * @param {string} type
 * @param {any[]} sourceArray
 * @param {object} ctx
 */
export function attachContextMenuListeners(container, type, sourceArray, ctx) {
    const selector =
        type === 'trait' || type === 'stat'
            ? '.drawer-item[data-item-type="trait"], .drawer-item[data-item-type="stat"]'
            : type
              ? `.drawer-item[data-item-type="${type}"]`
              : '.drawer-item'
    container.querySelectorAll(selector).forEach(el => {
        el.addEventListener('contextmenu', e => {
            e.preventDefault()
            e.stopPropagation()

            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.getId() === id)
            if (!item) return

            if (ctx.openContextMenu) {
                ctx.openContextMenu(e.clientX, e.clientY, {
                    type: el.dataset.itemType || type,
                    id,
                    name: typeof item.getName === 'function' ? item.getName() : id,
                    item,
                })
            }
        })
    })
}

/**
 * Attaches click listeners to color badges in the drawer to open color popover.
 *
 * @param {HTMLElement} container
 * @param {object} ctx
 */
export function attachColorPickerListeners(container, ctx) {
    container.querySelectorAll('.tag-color-badge, .scene-color-badge').forEach(badge => {
        badge.addEventListener('click', e => {
            e.stopPropagation()
            const parent = badge.closest('.drawer-item')
            if (!parent) return
            const itemType = parent.dataset.itemType
            const itemId = parent.dataset.itemId
            const entity =
                itemType === 'scene'
                    ? ctx.projectScenes.find(s => s.getId() === itemId)
                    : ctx.projectTags.find(tObj => tObj.getId() === itemId)

            if (ctx.openColorPicker && entity) {
                ctx.openColorPicker(badge, entity)
            }
        })
    })
}
