/**
 * NPC Character & Template Read-Only Details Panel Module
 *
 * Renders the full inspector view for NPC characters and NPC templates in the right sidebar.
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { openNpcModal } from '../../modals/npc/npcModal.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'
import { renderFilesModule } from '../modules/entityConfigModules.js'
import {
    getEntityDescription,
    getEntityList,
    getEntityProp,
    renderCustomAttributeRows,
    renderTagChips,
} from './readonlySharedHelpers.js'
import {
    renderBaseStatItemHtml,
    renderBaseStatsSectionHtml,
    renderCustomAttributesSectionHtml,
    renderEntityHeaderHtml,
    renderEntityNameHtml,
    renderEntitySummaryHtml,
    renderFeatureItemHtml,
    renderFeaturesSectionHtml,
    renderParameterItemHtml,
    renderSkillItemHtml,
    renderSkillsSectionHtml,
    renderTagsSectionHtml,
    renderVitalsSectionHtml,
} from './readonlySharedTemplates.js'

/**
 * Pure HTML template for NPC Header section.
 */
export function renderNpcHeaderSectionHtml({ type, typeLabel, id }) {
    return renderEntityHeaderHtml({
        type,
        typeLabel,
        id,
        fallbackId: '',
    })
}

/**
 * Pure HTML template for NPC Top Edit Button.
 */
export function renderNpcTopEditButtonHtml({ editBtnText }) {
    return `
        <button id="btn-details-edit-npc" type="button" class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
            <span class="shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-4 h-4')}</span>
            <span>${escapeHtml(editBtnText)}</span>
        </button>
    `
}

/**
 * Pure HTML template for NPC Avatar section.
 */
export function renderNpcAvatarSectionHtml({ avatarVal, avatarPreset }) {
    const avatarHeaderLabel = t('details.avatar') || 'Awatar postaci'
    const category = avatarPreset?.category || ''
    const avatarName = avatarPreset?.name || avatarVal || ''
    const avatarId = avatarPreset?.id || avatarVal || ''

    const previewHtml = avatarPreset?.svg
        ? `<div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border" style="background-color: ${avatarPreset.bgColor || '#27272a'}; color: ${avatarPreset.color || '#38bdf8'}; border-color: ${avatarPreset.borderColor || '#0284c7'}">
              ${avatarPreset.svg}
           </div>`
        : `<div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border border-zinc-800 bg-zinc-900 text-zinc-500">
              ${getIconSvg('character', 'w-5 h-5')}
           </div>`

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(avatarHeaderLabel)}</span>
            <span class="text-[10px] text-gray-400 capitalize">${escapeHtml(category)}</span>
        </div>
        <div class="flex items-center gap-3">
            ${previewHtml}
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(avatarName)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${escapeHtml(avatarId)}</div>
            </div>
        </div>
    `
}

/**
 * Pure HTML template for NPC Name section.
 */
export function renderNpcNameSectionHtml({ entityName }) {
    return renderEntityNameHtml({
        entityName,
        label: t('details.name') || 'Nazwa',
        displayId: 'details-name-display',
    })
}

/**
 * Pure HTML template for NPC Summary & Narrative section.
 */
export function renderNpcSummarySectionHtml({ currentSummary, currentNarrative }) {
    return renderEntitySummaryHtml({
        currentSummary,
        currentNarrative,
        summaryLabel: t('details.summary') || 'Streszczenie',
        noSummaryText: t('details.no_summary') || 'Brak streszczenia',
        narrativeLabel: t('details.narrative_description') || 'Opis narracyjny',
    })
}

/**
 * Pure HTML template for NPC Tags section.
 */
export function renderNpcTagsSectionHtml({ tagsCount, tagsChipsHtml }) {
    return renderTagsSectionHtml({
        tagsCount,
        tagsChipsHtml,
        tagsLabel: t('details.tags') || 'Tagi',
        noTagsText: t('left_panel.no_tags') || t('details.no_tags') || 'Brak tagów',
        listId: 'details-tags-list',
    })
}

/**
 * Pure HTML template for a single NPC Base Stat item.
 */
export function renderNpcBaseStatItemHtml(stName, stVal) {
    return renderBaseStatItemHtml(stName, stVal, {
        icon: 'stat',
        accentColor: 'text-amber-400',
        badgeColor: 'text-amber-300',
    })
}

/**
 * Pure HTML template for NPC Traits / Base Stats section.
 */
export function renderNpcBaseStatsSectionHtml({ statsCount, statsItemsHtml }) {
    return renderBaseStatsSectionHtml({
        statsCount,
        statsItemsHtml,
        statsLabel: t('details.traits') || 'Cechy',
        noTraitsText: t('details.no_traits') || 'Brak zdefiniowanych cech',
        listId: 'details-stats-list',
        icon: 'stat',
        accentColor: 'text-amber-400',
    })
}

/**
 * Pure HTML template for a single NPC Parameter item.
 */
export function renderNpcParameterItemHtml(p, charStatsMap) {
    return renderParameterItemHtml(p, charStatsMap, {
        icon: 'parameter',
        accentColor: 'text-rose-400',
        badgeColor: 'text-rose-300',
    })
}

/**
 * Pure HTML template for NPC Vital Parameters section.
 */
export function renderNpcVitalsSectionHtml({ paramsCount, paramsItemsHtml }) {
    return renderVitalsSectionHtml({
        paramsCount,
        paramsItemsHtml,
        vitalsLabel: t('details.parameters') || 'Parametry',
        noParamsText: t('details.no_parameters') || 'Brak przypisanych parametrów',
        listId: 'details-params-list',
        icon: 'parameter',
        accentColor: 'text-rose-400',
    })
}

/**
 * Pure HTML template for a single NPC Skill item.
 */
export function renderNpcSkillItemHtml(sk) {
    return renderSkillItemHtml(sk, {
        icon: 'skill',
        accentColor: 'text-blue-400',
        badgeColor: 'text-blue-300',
    })
}

/**
 * Pure HTML template for NPC Skills section.
 */
export function renderNpcSkillsSectionHtml({ skillsCount, skillsItemsHtml }) {
    return renderSkillsSectionHtml({
        skillsCount,
        skillsItemsHtml,
        skillsLabel: t('details.skills') || 'Umiejętności',
        noSkillsText: t('details.no_skills') || 'Brak przypisanych umiejętności',
        listId: 'details-skills-list',
        icon: 'skill',
        accentColor: 'text-blue-400',
    })
}

/**
 * Pure HTML template for a single NPC Feature item.
 */
export function renderNpcFeatureItemHtml(f) {
    return renderFeatureItemHtml(f, {
        icon: 'feature',
        accentColor: 'text-purple-400',
    })
}

/**
 * Pure HTML template for NPC Features section.
 */
export function renderNpcFeaturesSectionHtml({ featuresCount, featuresItemsHtml }) {
    return renderFeaturesSectionHtml({
        featuresCount,
        featuresItemsHtml,
        featuresLabel: t('details.features') || 'Przymioty specjalne',
        noFeaturesText: t('details.no_features') || 'Brak przymiotów specjalnych',
        listId: 'details-features-list',
        icon: 'feature',
        accentColor: 'text-purple-400',
    })
}

/**
 * Pure HTML template for NPC Custom Attributes section.
 */
export function renderNpcCustomAttributesSectionHtml({ attrsCount, attrsRowsHtml }) {
    return renderCustomAttributesSectionHtml({
        attrsCount,
        attrsRowsHtml,
        attributesLabel: t('details.custom_attributes') || 'Atrybuty niestandardowe',
        noAttrsText: t('details.no_custom_attributes') || 'Brak atrybutów niestandardowych',
        listId: 'details-custom-attrs-list',
    })
}

/**
 * Pure HTML template for NPC Bottom Actions section (Edit button + Graph or Create from template button).
 */
export function renderNpcBottomActionsSectionHtml({ type, editLabel }) {
    const quickActionsLabel = t('right_panel.quick_actions') || 'Szybkie akcje'
    const showGraphLabel = t('right_panel.show_story_graph') || 'Pokaż w grafie'
    const createTemplateLabel =
        t('details.create_character_from_template') || 'Stwórz postać z tego szablonu'

    const extraButtonHtml =
        type === 'character'
            ? `
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${escapeHtml(showGraphLabel)}</span>
            <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        `
            : `
        <button id="btn-details-create-npc-from-template" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${escapeHtml(createTemplateLabel)}</span>
            <span class="text-emerald-400 shrink-0 inline-flex items-center">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
        </button>
        `

    return `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(quickActionsLabel)}</div>
        <button id="btn-details-bottom-edit-npc" class="w-full py-1.5 px-3 rounded bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-xs text-left text-blue-200 flex items-center justify-between cursor-pointer transition-colors" type="button">
            <span>${escapeHtml(editLabel)}</span>
            <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-3.5 h-3.5')}</span>
        </button>
        ${extraButtonHtml}
    `
}

/**
 * Renders the read-only details view for NPC characters and templates.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {object} item
 * @param {string} type
 * @param {object} ctx
 */
export function renderNpcReadOnlyDetails(container, entity, item, type, ctx) {
    if (!container || !entity) return

    const openModalFn = options => {
        if (typeof ctx?.openNpcModal === 'function') {
            ctx.openNpcModal(options)
        } else {
            openNpcModal(options)
        }
    }

    // 1. Header Module
    const typeKey = `details.type_${type}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : (type || '').toUpperCase()

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcHeaderSectionHtml({
            type,
            typeLabel,
            id: item?.id || '',
        })
    )
    container.appendChild(headerMod)

    // 2. Action Module (Top Edit Button)
    const editBtnText =
        type === 'template'
            ? t('details.edit_template') || 'Edytuj szablon'
            : t('details.edit_character') || 'Edytuj postać'

    const editActionMod = createSection(
        'border-b border-[#333338] p-3',
        renderNpcTopEditButtonHtml({ editBtnText })
    )
    editActionMod.querySelector('#btn-details-edit-npc')?.addEventListener('click', () => {
        openModalFn({ mode: type, editEntity: entity })
    })
    container.appendChild(editActionMod)

    // 3. Avatar Module (Read-only)
    const avatarId = getEntityProp(entity, 'getAvatar', 'avatar', 'warrior')
    const avatar = getAvatarById(avatarId)

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcAvatarSectionHtml({
            avatarVal: avatarId,
            avatarPreset: avatar,
        })
    )
    container.appendChild(avatarMod)

    // 4. Name Module (Read-only)
    const entityName = getEntityProp(entity, 'getName', 'name', item?.name || '')
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderNpcNameSectionHtml({ entityName })
    )
    container.appendChild(nameMod)

    // 5. Summary & Narrative Module (Read-only)
    const { currentSummary, currentNarrative } = getEntityDescription(entity)
    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcSummarySectionHtml({ currentSummary, currentNarrative })
    )
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module (Read-only)
    const currentTags = getEntityList(entity, 'getTags', 'tags')
    const tagsChipsHtml = renderTagChips(currentTags)
    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcTagsSectionHtml({
            tagsCount: currentTags.length,
            tagsChipsHtml,
        })
    )
    container.appendChild(tagsMod)

    // 7. Traits / Stats Module (Read-only)
    const statsList = getEntityList(entity, 'getStats', 'stats')
    const statsItemsHtml = statsList
        .map(st => {
            const stName = getEntityProp(st, 'getName', 'name', '')
            const stVal = getEntityProp(st, 'getValue', 'value', '')
            return renderNpcBaseStatItemHtml(stName, stVal)
        })
        .join('')

    const statsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcBaseStatsSectionHtml({
            statsCount: statsList.length,
            statsItemsHtml,
        })
    )
    container.appendChild(statsMod)

    // 8. Vital Parameters Module (Read-only)
    const paramsList = getEntityList(entity, 'getParameters', 'parameters')
    const charStatsMap = buildStatsMap(statsList)
    const paramsItemsHtml = paramsList
        .map(p => renderNpcParameterItemHtml(p, charStatsMap))
        .join('')

    const paramsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcVitalsSectionHtml({
            paramsCount: paramsList.length,
            paramsItemsHtml,
        })
    )
    container.appendChild(paramsMod)

    // 9. Skills Module (Read-only)
    const skillsList = getEntityList(entity, 'getSkills', 'skills')
    const skillsItemsHtml = skillsList.map(sk => renderNpcSkillItemHtml(sk)).join('')

    const skillsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcSkillsSectionHtml({
            skillsCount: skillsList.length,
            skillsItemsHtml,
        })
    )
    container.appendChild(skillsMod)

    // 10. Features Module (Read-only)
    const featuresList = getEntityList(entity, 'getFeatures', 'features')
    const featuresItemsHtml = featuresList.map(f => renderNpcFeatureItemHtml(f)).join('')

    const featMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcFeaturesSectionHtml({
            featuresCount: featuresList.length,
            featuresItemsHtml,
        })
    )
    container.appendChild(featMod)

    // 11. Custom Attributes Module (Read-only)
    const customAttrs = getEntityList(entity, 'getCustomAttributes', 'customAttributes')
    const attrsRowsHtml = renderCustomAttributeRows(customAttrs)

    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcCustomAttributesSectionHtml({
            attrsCount: customAttrs.length,
            attrsRowsHtml,
        })
    )
    container.appendChild(customMod)

    // 12. Quick Actions Module (Bottom)
    const editLabel =
        type === 'template'
            ? t('details.edit_template') || 'Edytuj szablon'
            : t('details.edit_character') || 'Edytuj postać'

    const actionsMod = createSection(
        'p-3 space-y-2',
        renderNpcBottomActionsSectionHtml({ type, editLabel })
    )

    actionsMod.querySelector('#btn-details-bottom-edit-npc')?.addEventListener('click', () => {
        openModalFn({ mode: type, editEntity: entity })
    })

    const showGraphBtn = actionsMod.querySelector('#btn-details-show-graph')
    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', () => {
            const layout = ctx?.vm?.layout
            if (layout?.setActiveMainView) layout.setActiveMainView('graph')
            if (ctx?.updateMainWorkspaceUI) ctx.updateMainWorkspaceUI()
            if (ctx?.storyGraphInstance?.focusOnElement) {
                ctx.storyGraphInstance.focusOnElement(item?.id)
            }
        })
    }

    const createFromTemplateBtn = actionsMod.querySelector('#btn-details-create-npc-from-template')
    if (createFromTemplateBtn) {
        createFromTemplateBtn.addEventListener('click', () => {
            openModalFn({
                mode: 'character',
                templateId: getEntityProp(entity, 'getId', 'id', ''),
            })
        })
    }

    container.appendChild(actionsMod)
}
