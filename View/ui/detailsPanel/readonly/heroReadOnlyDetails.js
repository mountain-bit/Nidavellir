import { isCustomAvatarPath, toAssetUrl } from '../../../../dist/Utils/assetUtils.js'
import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { DEFAULT_TAG_COLOR } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeBadgeColor } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { openHeroModal } from '../../modals/hero/heroModal.js'
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'
import { renderFilesModule } from '../modules/entityConfigModules.js'

/**
 * Pure HTML template for Hero Header section.
 */
export function renderHeroHeaderSectionHtml({ type, typeLabel, id }) {
    const typeTitle = t('details.type') || 'Typ'
    return `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${escapeHtml(typeTitle)}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(id || 'hero_player')}</div>
    `
}

/**
 * Pure HTML template for Hero Top Edit Button.
 */
export function renderHeroTopEditButtonHtml({ editBtnText }) {
    return `
        <button id="btn-details-edit-hero" type="button" class="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
            <span class="shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-4 h-4')}</span>
            <span>${escapeHtml(editBtnText)}</span>
        </button>
    `
}

/**
 * Pure HTML template for Hero Avatar Preview box.
 */
export function renderHeroAvatarPreviewHtml(avatarVal, isCustomAvatar, avatarPreset) {
    if (isCustomAvatar) {
        return `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow-md border border-amber-500/40">
            <img src="${escapeHtml(toAssetUrl(avatarVal))}" alt="Hero Avatar" class="w-full h-full object-cover" />
        </div>`
    }
    if (avatarPreset?.svg) {
        return `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border" style="background-color: ${avatarPreset.bgColor || '#27272a'}; color: ${avatarPreset.color || '#fbbf24'}; border-color: ${avatarPreset.borderColor || '#b45309'}">
            ${avatarPreset.svg}
        </div>`
    }
    return `<div id="details-hero-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border border-zinc-800 bg-zinc-900 text-zinc-500">
        ${getIconSvg('character', 'w-5 h-5')}
    </div>`
}

/**
 * Pure HTML template for Hero Avatar section.
 */
export function renderHeroAvatarSectionHtml({
    avatarVal,
    isCustomAvatar,
    avatarPreset,
    avatarCategoryLabel,
    avatarTitle,
    avatarSubtitle,
}) {
    const avatarHeaderLabel = t('details.avatar') || 'Awatar postaci'
    const previewHtml = renderHeroAvatarPreviewHtml(avatarVal, isCustomAvatar, avatarPreset)

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(avatarHeaderLabel)}</span>
            <span class="text-[10px] text-amber-400 capitalize">${escapeHtml(avatarCategoryLabel)}</span>
        </div>
        <div class="flex items-center gap-3">
            ${previewHtml}
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(avatarTitle)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${escapeHtml(avatarSubtitle)}</div>
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Hero Name section.
 */
export function renderHeroNameSectionHtml({ entityName }) {
    const nameLabel = t('details.name') || 'Nazwa'
    return `
        <div>
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1">${escapeHtml(nameLabel)}</label>
            <div id="details-name-display" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
                ${escapeHtml(entityName)}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Hero Summary & Narrative section.
 */
export function renderHeroSummarySectionHtml({ currentSummary, currentNarrative }) {
    const summaryLabel = t('details.summary') || 'Streszczenie'
    const noSummaryText = t('details.no_summary') || 'Brak streszczenia'
    const chronicleLabel =
        t('hero.narrative_chronicle') || t('hero.chronicle') || 'Kronika Narracyjna'

    return `
        <div class="space-y-1">
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(summaryLabel)}</label>
            ${
                currentSummary
                    ? `<div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentSummary)}</div>`
                    : `<div class="text-xs text-gray-500 italic py-1">${escapeHtml(noSummaryText)}</div>`
            }
        </div>
        ${
            currentNarrative && currentNarrative !== currentSummary
                ? `
            <div class="space-y-1 pt-1">
                <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(chronicleLabel)}</label>
                <div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap select-text max-h-48 overflow-y-auto">${escapeHtml(currentNarrative)}</div>
            </div>
            `
                : ''
        }
    `
}

/**
 * Pure HTML template for Hero Tags section.
 */
export function renderHeroTagsSectionHtml({ tagsCount, tagsChipsHtml }) {
    const tagsLabel = t('details.tags') || 'Tagi'
    const noTagsText = t('details.no_tags') || t('graph.node.no_tags') || 'Brak tagów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(tagsLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${tagsCount}</span>
        </div>
        <div id="details-hero-tags-list" class="flex flex-wrap gap-1 min-h-[20px]">
            ${tagsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTagsText)}</span>` : tagsChipsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Hero Base Stat item.
 */
export function renderHeroBaseStatItemHtml(stName, stVal) {
    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(stName)}</span>
            </span>
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-amber-300 shrink-0">
                ${escapeHtml(String(stVal))}
            </span>
        </div>
    `
}

/**
 * Pure HTML template for Hero Base Stats section.
 */
export function renderHeroBaseStatsSectionHtml({ statsCount, statsItemsHtml }) {
    const statsLabel = t('hero.base_stats') || t('hero.stats_title') || 'Cechy Główne'
    const noTraitsText = t('details.no_traits') || 'Brak zdefiniowanych cech'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(statsLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsCount}</span>
        </div>
        <div id="details-hero-stats-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTraitsText)}</span>` : statsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Hero Parameter item.
 */
export function renderHeroParameterItemHtml(p, charStatsMap) {
    const pName = typeof p.getName === 'function' ? p.getName() : p.name || ''
    const pMode = typeof p.getMode === 'function' ? p.getMode() : p.mode || 'direct'
    let valueDisplay = ''

    if (pMode === 'formula') {
        const formula = typeof p.getFormula === 'function' ? p.getFormula() : p.formula || ''
        const evalRes = evaluateFormula(formula, charStatsMap)
        const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
        valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 font-mono border border-rose-500/40 font-bold truncate max-w-[150px]" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
    } else {
        const pVal = typeof p.getValue === 'function' ? p.getValue() : (p.value ?? '')
        valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-rose-300 shrink-0">${escapeHtml(String(pVal))}</span>`
    }

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(pName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Hero Vitals & Parameters section.
 */
export function renderHeroVitalsSectionHtml({ paramsCount, paramsItemsHtml }) {
    const vitalsLabel = t('hero.vitals') || t('hero.vitals_title') || 'Parametry Życiowe'
    const noParamsText = t('details.no_parameters') || 'Brak przypisanych parametrów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(vitalsLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${paramsCount}</span>
        </div>
        <div id="details-hero-params-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${paramsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noParamsText)}</span>` : paramsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Hero Skill item.
 */
export function renderHeroSkillItemHtml(sk) {
    const skName = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
    const skMode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'
    let valueDisplay = ''

    if (skMode === 'stat_mod') {
        const statName = typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
        const mod = typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || '+0'
        valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate max-w-[140px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
    } else {
        const skVal = typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? '')
        valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-blue-300 shrink-0">${escapeHtml(String(skVal))}</span>`
    }

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(skName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Hero Skills section.
 */
export function renderHeroSkillsSectionHtml({ skillsCount, skillsItemsHtml }) {
    const skillsLabel = t('hero.skills') || t('hero.skills_title') || 'Umiejętności'
    const noSkillsText = t('details.no_skills') || 'Brak przypisanych umiejętności'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(skillsLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${skillsCount}</span>
        </div>
        <div id="details-hero-skills-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${skillsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noSkillsText)}</span>` : skillsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single inventory card in Hero view.
 */
export function renderHeroInventoryCardHtml(inv) {
    const invName =
        typeof inv.getName === 'function'
            ? inv.getName()
            : inv.name || t('items.inventory') || 'Ekwipunek'
    const capacity = typeof inv.getCapacity === 'function' ? inv.getCapacity() : inv.capacity || 0
    const items = typeof inv.getItems === 'function' ? inv.getItems() : inv.items || []
    const capText = capacity > 0 ? `${items.length} / ${capacity}` : `${items.length} (∞)`
    const emptyInvText = t('hero.empty_inv_items') || 'Pusty ekwipunek'

    const itemsButtonsHtml =
        items.length > 0
            ? `
        <div class="flex flex-wrap gap-1 pt-1 border-t border-zinc-800/80">
            ${items
                .map((it, idx) => {
                    const itName =
                        typeof it.getName === 'function' ? it.getName() : it.name || String(it)
                    const itSlots =
                        typeof it.getSlotSize === 'function'
                            ? it.getSlotSize()
                            : typeof it.slotSize === 'number'
                              ? it.slotSize
                              : 1
                    return `<button type="button" data-inv-item-idx="${idx}" class="btn-hero-inspect-item px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-200 font-medium cursor-pointer transition-colors flex items-center gap-1">
                        <span>${escapeHtml(itName)}</span>
                        ${itSlots > 1 ? `<span class="text-[9px] text-zinc-500 font-mono">(${itSlots})</span>` : ''}
                    </button>`
                })
                .join('')}
        </div>
    `
            : `<div class="text-[10px] text-zinc-500 italic pt-0.5">${escapeHtml(emptyInvText)}</div>`

    return `
        <div class="bg-[#18181b] p-2 rounded border border-[#27272a] text-xs flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
                <span class="text-white font-semibold flex items-center gap-1.5 truncate">
                    <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('item', 'w-3 h-3')}</span>
                    <span class="truncate">${escapeHtml(invName)}</span>
                </span>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 shrink-0">${escapeHtml(capText)}</span>
            </div>
            ${itemsButtonsHtml}
        </div>
    `
}

/**
 * Pure HTML template for Hero Inventories section.
 */
export function renderHeroInventoriesSectionHtml({ invCount, invCardsHtml }) {
    const inventoriesLabel = t('hero.inventories_title') || 'Ekwipunki i Przedmioty'
    const emptyInventoriesText = t('hero.empty_inventories') || 'Brak ekwipunków'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(inventoriesLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${invCount}</span>
        </div>
        <div id="details-hero-inventories-list" class="flex flex-col gap-2 min-h-[20px]">
            ${invCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(emptyInventoriesText)}</span>` : invCardsHtml}
        </div>
    `
}

/**
 * Pure HTML template for Hero Custom Attributes section.
 */
export function renderHeroCustomAttributesSectionHtml({ attrsCount, attrsRowsHtml }) {
    const attributesLabel =
        t('hero.identity_attributes') || t('hero.custom_attributes_title') || 'Cechy Tożsamości'
    const noAttrsText = t('details.no_custom_attributes') || 'Brak atrybutów niestandardowych'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(attributesLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${attrsCount}</span>
        </div>
        <div id="details-hero-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${attrsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noAttrsText)}</span>` : attrsRowsHtml}
        </div>
    `
}

/**
 * Pure HTML template for Hero Bottom Edit Button.
 */
export function renderHeroBottomEditButtonHtml({ editBtnText }) {
    const quickActionsLabel = t('right_panel.quick_actions') || 'Szybkie akcje'

    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(quickActionsLabel)}</div>
        <button id="btn-details-bottom-edit-hero" class="w-full py-2 px-3 rounded bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-xs text-left text-amber-200 flex items-center justify-between cursor-pointer transition-colors" type="button">
            <span>${escapeHtml(editBtnText)}</span>
            <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-3.5 h-3.5')}</span>
        </button>
    `
}

/**
 * Renders the read-only details view for the Player Character (Bohater gracza).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {string} type
 * @param {object} ctx
 */
export function renderHeroReadOnlyDetails(container, entity, item, type, ctx) {
    if (!container || !entity) return

    const openModalFn = options => {
        if (typeof ctx?.openHeroModal === 'function') {
            ctx.openHeroModal(options)
        } else {
            openHeroModal(options)
        }
    }

    // 1. Header Module
    const typeLabel = t('details.type_player_character') || 'BOHATER GRACZA'
    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroHeaderSectionHtml({
            type,
            typeLabel,
            id: item?.id || 'hero_player',
        })
    )
    container.appendChild(headerMod)

    // 2. Action Module (Top Edit Button)
    const editBtnText = t('hero.edit_hero') || t('hero.edit_hero_btn') || 'Edytuj bohatera'
    const editActionMod = createSection(
        'border-b border-[#333338] p-3',
        renderHeroTopEditButtonHtml({ editBtnText })
    )
    editActionMod.querySelector('#btn-details-edit-hero')?.addEventListener('click', () => {
        openModalFn({ ctx, editEntity: entity })
    })
    container.appendChild(editActionMod)

    // 3. Avatar Module (Read-only)
    const avatarVal =
        (typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar) || ''
    const isCustomAvatar =
        Boolean(avatarVal) &&
        (isCustomAvatarPath(avatarVal) ||
            avatarVal.startsWith('data:') ||
            avatarVal.startsWith('http') ||
            avatarVal.startsWith('blob:'))
    const avatarPreset = !isCustomAvatar && avatarVal ? getAvatarById(avatarVal) : null

    const avatarCategoryLabel = isCustomAvatar
        ? t('hero.avatar_custom') || 'Własny'
        : avatarPreset?.category || ''
    const avatarTitle = isCustomAvatar
        ? t('hero.custom_portrait') || t('avatars.custom') || 'Własny portret'
        : avatarPreset?.name || avatarVal
    const avatarSubtitle = isCustomAvatar ? 'custom' : avatarPreset?.id || ''

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroAvatarSectionHtml({
            avatarVal,
            isCustomAvatar,
            avatarPreset,
            avatarCategoryLabel,
            avatarTitle,
            avatarSubtitle,
        })
    )
    container.appendChild(avatarMod)

    // 4. Name & Class Module
    const entityName = (typeof entity.getName === 'function' ? entity.getName() : item?.name) || ''
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroNameSectionHtml({ entityName })
    )
    container.appendChild(nameMod)

    // 5. Summary & Narrative Module
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : entity.description
    const currentSummary =
        (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : desc?.summary) ||
        entity.summary ||
        ''
    const currentNarrative =
        (desc && typeof desc.getText === 'function' ? desc.getText() : desc?.text) || ''

    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroSummarySectionHtml({ currentSummary, currentNarrative })
    )
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module
    const currentTags =
        typeof entity.getTags === 'function' ? entity.getTags() || [] : entity.tags || []
    const tagsChipsHtml = currentTags
        .map(tObj => {
            const tagName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || tObj
            const tagColor =
                (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) ||
                DEFAULT_TAG_COLOR
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm" style="background-color: ${escapeHtml(tagColor)}">#${escapeHtml(tagName)}</span>`
        })
        .join('')

    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroTagsSectionHtml({
            tagsCount: currentTags.length,
            tagsChipsHtml,
        })
    )
    container.appendChild(tagsMod)

    // 7. Base Stats / Traits Module
    const statsList =
        typeof entity.getStats === 'function' ? entity.getStats() || [] : entity.stats || []
    const statsItemsHtml = statsList
        .map(st => {
            const stName = typeof st.getName === 'function' ? st.getName() : st.name || ''
            const stVal = typeof st.getValue === 'function' ? st.getValue() : (st.value ?? '')
            return renderHeroBaseStatItemHtml(stName, stVal)
        })
        .join('')

    const statsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroBaseStatsSectionHtml({
            statsCount: statsList.length,
            statsItemsHtml,
        })
    )
    container.appendChild(statsMod)

    // 8. Vital Parameters Module
    const paramsList =
        typeof entity.getParameters === 'function'
            ? entity.getParameters() || []
            : entity.parameters || []
    const charStatsMap = buildStatsMap(statsList)
    const paramsItemsHtml = paramsList
        .map(p => renderHeroParameterItemHtml(p, charStatsMap))
        .join('')

    const paramsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroVitalsSectionHtml({
            paramsCount: paramsList.length,
            paramsItemsHtml,
        })
    )
    container.appendChild(paramsMod)

    // 9. Skills Module
    const skillsList =
        typeof entity.getSkills === 'function' ? entity.getSkills() || [] : entity.skills || []
    const skillsItemsHtml = skillsList.map(sk => renderHeroSkillItemHtml(sk)).join('')

    const skillsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroSkillsSectionHtml({
            skillsCount: skillsList.length,
            skillsItemsHtml,
        })
    )
    container.appendChild(skillsMod)

    // 10. Inventories Module
    const inventories =
        typeof entity.getInventories === 'function'
            ? entity.getInventories() || []
            : entity.inventories || []
    const invCardsHtml = inventories.map(inv => renderHeroInventoryCardHtml(inv)).join('')

    const invMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroInventoriesSectionHtml({
            invCount: inventories.length,
            invCardsHtml,
        })
    )

    // Bind item inspect clicks in inventories
    invMod.querySelectorAll('.btn-hero-inspect-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-inv-item-idx') || '0', 10)
            const parentCard = btn.closest('#details-hero-inventories-list > div')
            const allCards = Array.from(
                invMod.querySelectorAll('#details-hero-inventories-list > div')
            )
            const cardIdx = parentCard ? allCards.indexOf(parentCard) : 0
            const currentInv = inventories[cardIdx]
            const items =
                typeof currentInv?.getItems === 'function'
                    ? currentInv.getItems()
                    : currentInv?.items || []
            const it = items[idx]
            if (!it) return

            const itId = typeof it.getId === 'function' ? it.getId() : it.id || it.name
            const projectItem =
                (ctx?.projectItems || []).find(
                    p =>
                        (typeof p.getId === 'function' ? p.getId() : p.id) === itId ||
                        (typeof p.getName === 'function' ? p.getName() : p.name) === itId
                ) || it
            if (typeof ctx?.selectEntity === 'function') {
                ctx.selectEntity(projectItem, 'item')
            } else if (ctx?.vm && typeof ctx.vm.selectElement === 'function') {
                ctx.vm.selectElement(projectItem, 'item')
            }
        })
    })
    container.appendChild(invMod)

    // 11. Custom Attributes Module
    const customAttrs =
        typeof entity.getCustomAttributes === 'function'
            ? entity.getCustomAttributes() || []
            : entity.customAttributes || []
    const attrsRowsHtml = customAttrs
        .map(
            attr => `
        <div class="flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="font-medium text-[#d4d4d8] truncate">${escapeHtml(attr.name)}</span>
            <span class="text-gray-500 font-mono">:</span>
            <span class="font-mono text-white text-right truncate">${escapeHtml(String(attr.value))}</span>
        </div>
    `
        )
        .join('')

    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderHeroCustomAttributesSectionHtml({
            attrsCount: customAttrs.length,
            attrsRowsHtml,
        })
    )
    container.appendChild(customMod)

    // 12. Quick Actions Module (Bottom)
    const actionsMod = createSection(
        'p-3 space-y-2',
        renderHeroBottomEditButtonHtml({ editBtnText })
    )
    actionsMod.querySelector('#btn-details-bottom-edit-hero')?.addEventListener('click', () => {
        openModalFn({ ctx, editEntity: entity })
    })
    container.appendChild(actionsMod)
}
