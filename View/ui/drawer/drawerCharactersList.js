/**
 * Drawer Characters & Main Character Module
 *
 * Renders lists of NPC Characters, NPC Templates (with collapsible sections),
 * and the Player Character protagonist card in the Left Drawer.
 */

import { isCustomAvatarPath, toAssetUrl } from '../../../dist/Utils/assetUtils.js'
import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { getAvatarById } from '../common/npcAvatars.js'
import { openHeroModal } from '../modals/hero/heroModal.js'
import {
    attachContextMenuListeners,
    attachDragStartListeners,
    attachItemSelectionListeners,
} from './drawerInteractions.js'

let charactersSectionCollapsed = false
let templatesSectionCollapsed = false

export function getCharactersSectionCollapsed() {
    return charactersSectionCollapsed
}

export function setCharactersSectionCollapsed(val) {
    charactersSectionCollapsed = Boolean(val)
}

export function getTemplatesSectionCollapsed() {
    return templatesSectionCollapsed
}

export function setTemplatesSectionCollapsed(val) {
    templatesSectionCollapsed = Boolean(val)
}

/**
 * Renders the list of Characters and Templates in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderCharactersList(ctx) {
    const container = document.getElementById('characters-list-container')
    if (!container) return

    const charactersList = ctx.projectCharacters || []
    const templatesList = ctx.projectTemplates || []

    const filter = ctx?.vm?.filter
    const filteredCharacters =
        filter && typeof filter.searchAndFilterCharacters === 'function'
            ? filter.searchAndFilterCharacters(charactersList)
            : charactersList

    const filteredTemplates =
        filter && typeof filter.searchAndFilterTemplates === 'function'
            ? filter.searchAndFilterTemplates(templatesList)
            : templatesList

    const totalCount = filteredCharacters.length + filteredTemplates.length
    if (totalCount === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_characters">${t('left_panel.no_characters')}</p>`
        return
    }

    const renderCard = (item, type, iconColor) => {
        const tagsBadges = (typeof item.getTags === 'function' ? item.getTags() : [])
            .map(
                tObj =>
                    `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
            )
            .join(' ')
        const traitsBadges = (typeof item.getStats === 'function' ? item.getStats() : [])
            .map(
                tr =>
                    `<span class="px-1 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[9px]">${escapeHtml(tr.getName())}</span>`
            )
            .join(' ')

        const iconName = type === 'template' ? 'template' : 'character'
        const badgeLabel = typeof t === 'function' ? t('npc.template_badge') : 'Szablon'

        return `
            <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-grab active:cursor-grabbing select-none transition-colors" data-item-type="${type}" data-item-id="${escapeHtml(item.getId())}" draggable="true" title="${t('left_panel.drag_item_hint')}">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-white text-xs truncate flex items-center gap-1.5 min-w-0">
                        <span class="${iconColor} shrink-0 inline-flex items-center">${getIconSvg(iconName, 'w-3.5 h-3.5')}</span>
                        <span class="truncate">${escapeHtml(item.getName())}</span>
                    </span>
                    ${type === 'template' ? `<span class="px-1 py-0.2 rounded text-[8px] bg-purple-950/70 text-purple-300 border border-purple-800/40 uppercase font-mono font-semibold shrink-0">${badgeLabel}</span>` : ''}
                </div>
                ${tagsBadges || traitsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges} ${traitsBadges}</div>` : ''}
            </div>
        `
    }

    let html = ''

    // 1. Sekcja Postaci (Characters)
    const charChevron = charactersSectionCollapsed
        ? getIconSvg('chevron-right', 'w-3 h-3')
        : getIconSvg('chevron-down', 'w-3 h-3')

    html += `
        <div class="characters-group mb-3">
            <button
                type="button"
                id="btn-toggle-characters-section"
                class="w-full flex items-center justify-between text-[11px] font-bold text-blue-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none hover:text-blue-300 transition-colors cursor-pointer group"
                title="${charactersSectionCollapsed ? 'Rozwiń postacie' : 'Zwiń postacie'}"
            >
                <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center text-blue-400 group-hover:scale-110 transition-transform">${charChevron}</span>
                    <span class="inline-flex items-center text-blue-400">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
                    <span data-i18n="left_panel.characters_section">${t('left_panel.characters_section')}</span>
                </span>
                <span class="px-1.5 py-0.2 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40 text-[9px] font-mono">${filteredCharacters.length}</span>
            </button>
            <div id="characters-section-body" class="${charactersSectionCollapsed ? 'hidden' : 'space-y-1'}">
                ${
                    filteredCharacters.length === 0
                        ? `<p class="italic text-gray-500 text-[11px] px-1 py-1" data-i18n="left_panel.no_characters_in_section">${t('left_panel.no_characters_in_section')}</p>`
                        : filteredCharacters
                              .map(c => renderCard(c, 'character', 'text-blue-400'))
                              .join('')
                }
            </div>
        </div>
    `

    // 2. Sekcja Szablonów (Templates)
    const tplChevron = templatesSectionCollapsed
        ? getIconSvg('chevron-right', 'w-3 h-3')
        : getIconSvg('chevron-down', 'w-3 h-3')

    html += `
        <div class="templates-group mb-3">
            <button
                type="button"
                id="btn-toggle-templates-section"
                class="w-full flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wider px-1 mb-1 pb-1 border-b border-[#2d2d32] select-none hover:text-purple-300 transition-colors cursor-pointer group"
                title="${templatesSectionCollapsed ? 'Rozwiń szablony' : 'Zwiń szablony'}"
            >
                <span class="flex items-center gap-1.5">
                    <span class="inline-flex items-center text-purple-400 group-hover:scale-110 transition-transform">${tplChevron}</span>
                    <span class="inline-flex items-center text-purple-400">${getIconSvg('template', 'w-3.5 h-3.5')}</span>
                    <span data-i18n="left_panel.templates_section">${t('left_panel.templates_section')}</span>
                </span>
                <span class="px-1.5 py-0.2 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 text-[9px] font-mono">${filteredTemplates.length}</span>
            </button>
            <div id="templates-section-body" class="${templatesSectionCollapsed ? 'hidden' : 'space-y-1'}">
                ${
                    filteredTemplates.length === 0
                        ? `<p class="italic text-gray-500 text-[11px] px-1 py-1" data-i18n="left_panel.no_templates_in_section">${t('left_panel.no_templates_in_section')}</p>`
                        : filteredTemplates
                              .map(tObj => renderCard(tObj, 'template', 'text-purple-400'))
                              .join('')
                }
            </div>
        </div>
    `

    container.innerHTML = html

    // Attach collapsible toggles
    const btnToggleCharacters = document.getElementById('btn-toggle-characters-section')
    if (btnToggleCharacters) {
        btnToggleCharacters.addEventListener('click', e => {
            e.preventDefault()
            charactersSectionCollapsed = !charactersSectionCollapsed
            renderCharactersList(ctx)
        })
    }

    const btnToggleTemplates = document.getElementById('btn-toggle-templates-section')
    if (btnToggleTemplates) {
        btnToggleTemplates.addEventListener('click', e => {
            e.preventDefault()
            templatesSectionCollapsed = !templatesSectionCollapsed
            renderCharactersList(ctx)
        })
    }

    attachDragStartListeners(container, 'character')
    attachContextMenuListeners(container, 'character', ctx.projectCharacters || [], ctx)
    attachItemSelectionListeners(container, 'character', ctx.projectCharacters || [], ctx)

    attachDragStartListeners(container, 'template')
    attachContextMenuListeners(container, 'template', ctx.projectTemplates || [], ctx)
    attachItemSelectionListeners(container, 'template', ctx.projectTemplates || [], ctx)
}

/**
 * Renders the Main Character (Player Protagonist) card in the Left Drawer.
 *
 * @param {object} ctx Application UI Context
 */
export function renderMainCharacter(ctx) {
    const container = document.getElementById('main-character-container')
    if (!container) return

    const hero =
        ctx?.playerCharacter ||
        ctx?.projectData?.playerCharacter ||
        (ctx?.vm?.project?.getPlayerCharacter ? ctx.vm.project.getPlayerCharacter() : null) ||
        (Array.isArray(ctx?.playerCharacters) ? ctx.playerCharacters[0] : null) ||
        (Array.isArray(ctx?.projectData?.playerCharacters)
            ? ctx.projectData.playerCharacters[0]
            : null) ||
        (Array.isArray(ctx?.projectPlayerCharacters) ? ctx.projectPlayerCharacters[0] : null) ||
        (Array.isArray(ctx?.vm?.project?.getPlayerCharacters?.())
            ? ctx.vm.project.getPlayerCharacters()[0]
            : null)

    const heroName = hero
        ? typeof hero.getName === 'function'
            ? hero.getName()
            : hero.name || hero.imie || ''
        : ''
    const hasConfiguredHero = hero && String(heroName).trim() !== ''

    if (!hasConfiguredHero) {
        container.innerHTML = `
            <div class="p-3 rounded-xl bg-[#18181b] border border-[#27272a] text-center flex flex-col items-center gap-2.5">
                <div class="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    ${getIconSvg('character', 'w-5 h-5')}
                </div>
                <div>
                    <div class="text-xs font-semibold text-zinc-200">
                        ${t('hero.modal_title') || 'Karta Postaci Gracza'}
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-1">
                        ${t('hero.no_hero_configured') || 'Brak skonfigurowanego bohatera gracza.'}
                    </p>
                </div>
                <button
                    type="button"
                    id="btn-drawer-create-hero"
                    class="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                    <span class="font-bold">+</span>
                    <span>${t('hero.create_hero_btn') || 'Stwórz Postać Gracza'}</span>
                </button>
            </div>
        `

        const btnCreate = container.querySelector('#btn-drawer-create-hero')
        if (btnCreate) {
            btnCreate.onclick = () => {
                openHeroModal({ ctx })
            }
        }
        return
    }

    const heroAvatar = typeof hero.getAvatar === 'function' ? hero.getAvatar() : hero.avatar || ''
    const summary =
        typeof hero.getSummary === 'function'
            ? hero.getSummary()
            : hero.summary || hero.description?.summary || ''

    let avatarPreviewHtml = getIconSvg('character', 'w-5 h-5')
    if (
        heroAvatar &&
        (isCustomAvatarPath(heroAvatar) ||
            heroAvatar.startsWith('data:') ||
            heroAvatar.startsWith('http') ||
            heroAvatar.startsWith('blob:'))
    ) {
        const assetUrl = toAssetUrl(heroAvatar)
        avatarPreviewHtml = `<img src="${assetUrl}" alt="Avatar" class="w-full h-full object-cover rounded" />`
    } else if (heroAvatar) {
        const avatarObj = getAvatarById(heroAvatar)
        if (avatarObj?.svg) {
            avatarPreviewHtml = avatarObj.svg
        }
    }

    const rawStats =
        typeof hero.getStats === 'function'
            ? hero.getStats()
            : Array.isArray(hero.stats)
              ? hero.stats
              : []
    const statsList = (rawStats || [])
        .slice(0, 4)
        .map(s => {
            const sName = typeof s.getName === 'function' ? s.getName() : s.name || ''
            const sVal = typeof s.getValue === 'function' ? s.getValue() : (s.value ?? 10)
            return `<span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono"><strong class="text-amber-400 font-semibold">${escapeHtml(sName)}:</strong> ${sVal}</span>`
        })
        .join(' ')

    const rawTags =
        typeof hero.getTags === 'function'
            ? hero.getTags()
            : Array.isArray(hero.tags)
              ? hero.tags
              : []
    const tagsBadges = (rawTags || [])
        .map(tObj => {
            const color =
                typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color || '#3b82f6'
            const name =
                typeof tObj.getName === 'function'
                    ? tObj.getName()
                    : tObj.name || (typeof tObj === 'string' ? tObj : '')
            return `<span class="px-1.5 py-0.2 rounded text-[9px] text-white" style="background-color: ${escapeHtml(color)}">${escapeHtml(name)}</span>`
        })
        .join(' ')

    container.innerHTML = `
        <div class="drawer-item p-3 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-amber-500/50 transition-all flex flex-col gap-2.5 shadow-sm" data-item-type="player_character">
            <div class="flex items-center gap-3">
                <div class="w-12 h-14 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-center p-1 shrink-0 text-amber-400 shadow-inner overflow-hidden">
                    ${avatarPreviewHtml}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-xs truncate">${escapeHtml(heroName)}</span>
                    </div>
                    <div class="text-[10px] text-zinc-500 italic truncate mt-0.5">${t('hero.badge') || 'Protagonista'}</div>
                    ${tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1.5">${tagsBadges}</div>` : ''}
                </div>
            </div>

            ${summary ? `<p class="text-[11px] text-zinc-400 italic line-clamp-2 leading-relaxed border-t border-zinc-800/80 pt-2 m-0">${escapeHtml(summary)}</p>` : ''}

            ${statsList ? `<div class="flex flex-wrap gap-1 border-t border-zinc-800/80 pt-2">${statsList}</div>` : ''}

            <div class="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                <button
                    type="button"
                    id="btn-drawer-edit-hero"
                    class="flex-1 py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                    <app-icon name="edit" class="w-3 h-3 text-amber-400"></app-icon>
                    <span>${t('hero.edit_hero_btn') || 'Edytuj Kartę Bohatera'}</span>
                </button>
            </div>
        </div>
    `

    const btnEdit = container.querySelector('#btn-drawer-edit-hero')
    if (btnEdit) {
        btnEdit.onclick = e => {
            e.stopPropagation()
            openHeroModal({ ctx, editEntity: hero })
        }
    }

    const card = container.querySelector('.drawer-item')
    if (card) {
        card.onclick = () => {
            if (ctx.selectEntity) {
                ctx.selectEntity(hero, 'player_character')
            }
        }
    }
}
