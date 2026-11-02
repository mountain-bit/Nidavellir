/**
 * Drawer Story Lists Module
 *
 * Renders core narrative and story graph entity lists in the Left Drawer:
 * Paragraphs, Scenes, Tags, Locations, and Connections/Choices.
 */

import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import {
    attachColorPickerListeners,
    attachContextMenuListeners,
    attachDragStartListeners,
    attachDrawerDropListeners,
    attachItemSelectionListeners,
} from './drawerInteractions.js'

/**
 * Renders the list of Paragraphs in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderParagraphsList(ctx) {
    const container = document.getElementById('paragraphs-list-container')
    if (!container) return

    if (ctx && ctx.vm && Array.isArray(ctx.projectParagraphs)) {
        const factory = ctx.vm.factory || ctx.vm
        if (typeof factory?.ensureStartParagraph === 'function') {
            factory.ensureStartParagraph(ctx.projectParagraphs)
        }
    }

    const filter = ctx?.vm?.filter
    const filtered = filter?.searchAndFilterParagraphs
        ? filter.searchAndFilterParagraphs(ctx.projectParagraphs)
        : ctx.projectParagraphs
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

            const isStart = Boolean(p.getIsStart && p.getIsStart())
            const isEnd = Boolean(p.getIsEnd && p.getIsEnd())
            const roleBadge = isStart
                ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#245842]/40 text-[#8ec8ad] border border-[#357357]/60 uppercase tracking-wide shrink-0">START</span>`
                : isEnd
                  ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4a1823]/70 text-[#fca5a5] border border-[#9f2a40]/60 uppercase tracking-wide shrink-0">KONIEC</span>`
                  : ''
            const iconSvg = isStart
                ? `<span class="text-[#7ec19f] shrink-0">${getIconSvg('play', 'w-3.5 h-3.5')}</span>`
                : isEnd
                  ? `<span class="text-rose-400 shrink-0">${getIconSvg('flag', 'w-3.5 h-3.5')}</span>`
                  : `<span class="text-zinc-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>`
            const titleDisplay = isStart ? 'START' : `§ ${escapeHtml(p.getTitle() || p.getId())}`

            return `
            <div class="drawer-item group p-1.5 rounded ${isStart ? 'bg-[#18201b] border border-[#357357]/70' : isEnd ? 'bg-[#201518] border border-[#9f2a40]/60' : 'bg-[#1a1b1e] border border-[#2e3037]'} hover:border-[#4f6b8a]/60 mb-1 cursor-pointer transition-colors" data-item-type="paragraph" data-item-id="${escapeHtml(p.getId())}">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1.5">
                        ${iconSvg}
                        <span>${titleDisplay}</span>
                    </span>
                    ${roleBadge}
                </div>
                ${
                    isStart
                        ? `<div class="text-[10px] text-[#8ec8ad]/85 mt-1 font-medium flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-[#357357] inline-block"></span><span>${t('graph.start_node_entry_point') || 'Punkt startowy opowieści'}</span></div>`
                        : locBadge || charsBadges || tagsBadges
                          ? `<div class="flex flex-wrap gap-1 mt-1">${locBadge} ${charsBadges} ${tagsBadges}</div>`
                          : ''
                }
            </div>
        `
        })
        .join('')

    attachItemSelectionListeners(container, 'paragraph', ctx.projectParagraphs, ctx)
    attachDrawerDropListeners(container, 'paragraph', ctx.projectParagraphs, ctx)
    attachContextMenuListeners(container, 'paragraph', ctx.projectParagraphs, ctx)
}

/**
 * Renders the list of Scenes in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderScenesList(ctx) {
    const container = document.getElementById('scenes-list-container')
    if (!container) return

    const filter = ctx?.vm?.filter
    const filtered = filter?.searchAndFilterScenes
        ? filter.searchAndFilterScenes(ctx.projectScenes)
        : ctx.projectScenes
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

    const filter = ctx?.vm?.filter
    const filtered = filter?.searchAndFilterTags
        ? filter.searchAndFilterTags(ctx.projectTags)
        : ctx.projectTags
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
 * Renders the list of Locations in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderLocationsList(ctx) {
    const container = document.getElementById('locations-list-container')
    if (!container) return

    const filter = ctx?.vm?.filter
    const filtered = filter?.searchAndFilterLocations
        ? filter.searchAndFilterLocations(ctx.projectLocations)
        : ctx.projectLocations
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
 * Renders the list of Connections / Choices in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderConnectionsList(ctx) {
    const container = document.getElementById('connections-list-container')
    if (!container) return

    const graph = ctx?.vm?.graph
    const filter = ctx?.vm?.filter
    const allChoices = graph?.getAllChoices ? graph.getAllChoices(ctx.projectParagraphs) : []
    const filtered = filter?.searchAndFilterChoices
        ? filter.searchAndFilterChoices(allChoices, ctx.projectParagraphs)
        : allChoices

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

            const isCombat = Boolean(
                (typeof c.getIsCombatOutcome === 'function' && c.getIsCombatOutcome()) ||
                c.isCombatOutcome
            )
            const combatBadge = isCombat
                ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-950/60 text-rose-300 border border-rose-800/40 truncate max-w-full">
                    <span class="text-rose-400 shrink-0">${getIconSvg('swords', 'w-2.5 h-2.5')}</span>
                    <span class="truncate">${t('details.combat_outcome') || 'Po walce'}</span>
                   </span>`
                : ''

            return `
            <div class="drawer-item group p-2 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1.5 cursor-pointer transition-colors" data-item-type="choice" data-item-id="${escapeHtml(c.getId())}">
                <div class="flex items-center justify-between gap-1">
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                        <span class="${isCombat ? 'text-rose-400' : 'text-teal-400'} shrink-0">${getIconSvg(isCombat ? 'swords' : 'choice', 'w-3.5 h-3.5')}</span>
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
                ${combatBadge || condBadge ? `<div class="mt-1 flex flex-wrap items-center gap-1">${combatBadge}${condBadge}</div>` : ''}
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
                graph?.deleteChoice(id, ctx.projectParagraphs)
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
