import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { DEFAULT_TAG_COLOR } from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeBadgeColor } from '../../common/htmlTemplates.js'
import { getAvatarById } from '../../common/npcAvatars.js'
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'
import { openNpcModal } from '../../modals/npc/npcModal.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'
import { renderFilesModule } from '../modules/entityConfigModules.js'

/**
 * Pure HTML template for NPC Header section.
 */
export function renderNpcHeaderSectionHtml({ type, typeLabel, id }) {
    const typeTitle = t('details.type') || 'Typ'
    return `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${escapeHtml(typeTitle)}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(id || '')}</div>
    `
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
    const nameLabel = t('details.name') || 'Nazwa'
    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(nameLabel)}</label>
        <div id="details-name-display" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
            ${escapeHtml(entityName)}
        </div>
    `
}

/**
 * Pure HTML template for NPC Summary & Narrative section.
 */
export function renderNpcSummarySectionHtml({ currentSummary, currentNarrative }) {
    const summaryLabel = t('details.summary') || 'Streszczenie'
    const noSummaryText = t('details.no_summary') || 'Brak streszczenia'
    const narrativeLabel = t('details.narrative_description') || 'Opis narracyjny'

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
                <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(narrativeLabel)}</label>
                <div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentNarrative)}</div>
            </div>
            `
                : ''
        }
    `
}

/**
 * Pure HTML template for NPC Tags section.
 */
export function renderNpcTagsSectionHtml({ tagsCount, tagsChipsHtml }) {
    const tagsLabel = t('details.tags') || 'Tagi'
    const noTagsText = t('left_panel.no_tags') || t('details.no_tags') || 'Brak tagów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(tagsLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${tagsCount}</span>
        </div>
        <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[20px]">
            ${tagsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTagsText)}</span>` : tagsChipsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single NPC Base Stat item.
 */
export function renderNpcBaseStatItemHtml(stName, stVal) {
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
 * Pure HTML template for NPC Traits / Base Stats section.
 */
export function renderNpcBaseStatsSectionHtml({ statsCount, statsItemsHtml }) {
    const traitsLabel = t('details.traits') || 'Cechy'
    const noTraitsText = t('details.no_traits') || 'Brak zdefiniowanych cech'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(traitsLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsCount}</span>
        </div>
        <div id="details-stats-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTraitsText)}</span>` : statsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single NPC Parameter item.
 */
export function renderNpcParameterItemHtml(p, charStatsMap) {
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
 * Pure HTML template for NPC Vital Parameters section.
 */
export function renderNpcVitalsSectionHtml({ paramsCount, paramsItemsHtml }) {
    const parametersLabel = t('details.parameters') || 'Parametry'
    const noParamsText = t('details.no_parameters') || 'Brak przypisanych parametrów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-rose-400 inline-flex items-center">${getIconSvg('parameter', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(parametersLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${paramsCount}</span>
        </div>
        <div id="details-params-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${paramsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noParamsText)}</span>` : paramsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single NPC Skill item.
 */
export function renderNpcSkillItemHtml(sk) {
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
 * Pure HTML template for NPC Skills section.
 */
export function renderNpcSkillsSectionHtml({ skillsCount, skillsItemsHtml }) {
    const skillsLabel = t('details.skills') || 'Umiejętności'
    const noSkillsText = t('details.no_skills') || 'Brak przypisanych umiejętności'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-blue-400 inline-flex items-center">${getIconSvg('skill', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(skillsLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${skillsCount}</span>
        </div>
        <div id="details-skills-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${skillsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noSkillsText)}</span>` : skillsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single NPC Feature item.
 */
export function renderNpcFeatureItemHtml(f) {
    const fName = typeof f.getName === 'function' ? f.getName() : f.name || ''
    const descText =
        typeof f.getDescription === 'function'
            ? f.getDescription()?.getText?.() || f.getDescription()?.getSummary?.() || ''
            : f.description?.text || f.description?.summary || ''

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <div class="min-w-0 flex flex-col flex-1 pr-2">
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-purple-400 shrink-0 inline-flex items-center">${getIconSvg('feature', 'w-3 h-3')}</span>
                    <span class="truncate">${escapeHtml(fName)}</span>
                </span>
                ${descText ? `<span class="text-[10px] text-gray-400 truncate pl-4.5 italic" title="${escapeHtml(descText)}">${escapeHtml(descText)}</span>` : ''}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for NPC Features section.
 */
export function renderNpcFeaturesSectionHtml({ featuresCount, featuresItemsHtml }) {
    const featuresLabel = t('details.features') || 'Przymioty specjalne'
    const noFeaturesText = t('details.no_features') || 'Brak przymiotów specjalnych'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-purple-400 inline-flex items-center">${getIconSvg('feature', 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(featuresLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${featuresCount}</span>
        </div>
        <div id="details-features-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${featuresCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noFeaturesText)}</span>` : featuresItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for NPC Custom Attributes section.
 */
export function renderNpcCustomAttributesSectionHtml({ attrsCount, attrsRowsHtml }) {
    const attributesLabel = t('details.custom_attributes') || 'Atrybuty niestandardowe'
    const noAttrsText = t('details.no_custom_attributes') || 'Brak atrybutów niestandardowych'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(attributesLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${attrsCount}</span>
        </div>
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${attrsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noAttrsText)}</span>` : attrsRowsHtml}
        </div>
    `
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
    const avatarId =
        (typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar) || 'warrior'
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
    const entityName = (typeof entity.getName === 'function' ? entity.getName() : item?.name) || ''
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderNpcNameSectionHtml({ entityName })
    )
    container.appendChild(nameMod)

    // 5. Summary & Narrative Module (Read-only)
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : entity.description
    const currentSummary =
        (desc && typeof desc.getSummary === 'function' ? desc.getSummary() : desc?.summary) || ''
    const currentNarrative =
        (desc && typeof desc.getText === 'function' ? desc.getText() : desc?.text) || ''

    const descMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderNpcSummarySectionHtml({ currentSummary, currentNarrative })
    )
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module (Read-only)
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
        renderNpcTagsSectionHtml({
            tagsCount: currentTags.length,
            tagsChipsHtml,
        })
    )
    container.appendChild(tagsMod)

    // 7. Traits / Stats Module (Read-only)
    const statsList =
        typeof entity.getStats === 'function' ? entity.getStats() || [] : entity.stats || []
    const statsItemsHtml = statsList
        .map(st => {
            const stName = typeof st.getName === 'function' ? st.getName() : st.name || ''
            const stVal = typeof st.getValue === 'function' ? st.getValue() : (st.value ?? '')
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
    const paramsList =
        typeof entity.getParameters === 'function'
            ? entity.getParameters() || []
            : entity.parameters || []
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
    const skillsList =
        typeof entity.getSkills === 'function' ? entity.getSkills() || [] : entity.skills || []
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
    const featuresList =
        typeof entity.getFeatures === 'function'
            ? entity.getFeatures() || []
            : entity.features || []
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
            if (ctx?.vm?.setActiveMainView) ctx.vm.setActiveMainView('graph')
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
                templateId: typeof entity.getId === 'function' ? entity.getId() : entity.id,
            })
        })
    }

    container.appendChild(actionsMod)
}
