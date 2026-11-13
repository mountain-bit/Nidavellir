/**
 * Drawer Traits & Stats List Module
 *
 * Renders the lists of Base Stats, Vital Parameters, Skills, and Special Features
 * in the Left Drawer, along with their values, formulas, counters, and drag-and-drop bindings.
 */

import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import {
    attachContextMenuListeners,
    attachDragStartListeners,
    attachItemSelectionListeners,
} from './drawerInteractions.js'

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

    const filter = ctx?.vm?.filter
    const filteredStats =
        typeof filter?.searchAndFilterStats === 'function'
            ? filter.searchAndFilterStats(stats)
            : stats
    const filteredParams =
        typeof filter?.searchAndFilterParameters === 'function'
            ? filter.searchAndFilterParameters(parameters)
            : parameters
    const filteredSkills =
        typeof filter?.searchAndFilterSkills === 'function'
            ? filter.searchAndFilterSkills(skills)
            : skills
    const filteredFeatures =
        typeof filter?.searchAndFilterFeatures === 'function'
            ? filter.searchAndFilterFeatures(features)
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

    if (typeof ctx?.updateTraitsCounterUI === 'function') {
        ctx.updateTraitsCounterUI()
    }
    if (typeof ctx?.renderDynamicSuggestions === 'function') {
        ctx.renderDynamicSuggestions()
    }
}
