import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import {
    Choice,
    DEFAULT_SCENE_COLOR,
    DEFAULT_TAG_COLOR,
    Description,
    Feature,
    Paragraph,
    Parameter,
    Skill,
    Stat,
    TextCondition,
} from '../../dist/ViewModel/MainWindowViewModel.js'
import {
    escapeHtml,
    getTypeBadgeColor,
    getTypeIconSvg,
    PRESET_COLORS,
    renderColorPresetButtonsHtml,
    renderEmptyPlaceholderHtml,
} from './htmlTemplates.js'
import { FANTASY_AVATARS, getAvatarById } from './npcAvatars.js'
import { openNpcModal } from './npcModal.js'
import { evaluateFormula } from './npcModal/formulaEvaluator.js'

/**
 * Renders the top history tabs bar in the right sidebar.
 *
 * @param {object} ctx Application UI Context
 */
export function renderHistoryBar(ctx) {
    const container = document.getElementById('history-tabs-container')
    if (!container) return
    container.innerHTML = ''

    const history = ctx.vm.getHistory()
    const selected = ctx.vm.getSelectedItem()

    if (history.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-gray-500 italic px-1 select-none">${t('details.history')}: ${t('details.history_empty')}</span>`
        return
    }

    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'

    history.forEach(item => {
        const isActive = selected && selected.id === item.id && selected.type === item.type
        const tab = document.createElement('button')
        tab.type = 'button'
        tab.className = `group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            isActive
                ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
                : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'
        }`

        const icon = document.createElement('span')
        icon.className = 'text-[10px] opacity-80 shrink-0 inline-flex items-center'
        icon.innerHTML = getTypeIconSvg(item.type, 'w-3 h-3')

        const nameSpan = document.createElement('span')
        nameSpan.className = 'truncate max-w-[100px]'
        nameSpan.textContent = item.name

        const closeBtn = document.createElement('span')
        closeBtn.className =
            'ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5 inline-flex items-center'
        closeBtn.innerHTML = getIconSvg('close', 'w-3 h-3')
        closeBtn.title = t('buttons.close')
        closeBtn.addEventListener('click', e => {
            e.stopPropagation()
            ctx.vm.closeHistoryItem(item.id)
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
        })

        tab.appendChild(icon)
        tab.appendChild(nameSpan)
        tab.appendChild(closeBtn)

        tab.addEventListener('click', () => {
            ctx.vm.selectHistoryItem(item.id)
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
        })

        scrollWrapper.appendChild(tab)
    })

    const closeAllBtn = document.createElement('button')
    closeAllBtn.type = 'button'
    closeAllBtn.className =
        'shrink-0 ml-auto px-1.5 py-0.5 text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px]'
    closeAllBtn.title = t('details.close_all')
    closeAllBtn.innerHTML = getIconSvg('close-all', 'w-3.5 h-3.5')
    closeAllBtn.addEventListener('click', () => {
        ctx.vm.closeAllHistory()
        renderHistoryBar(ctx)
        renderDetailsPanel(ctx)
    })

    container.appendChild(scrollWrapper)
    container.appendChild(closeAllBtn)
}

/**
 * Renders the Right Details Panel for the currently selected entity or connection.
 *
 * @param {object} ctx Application UI Context
 */
export function renderDetailsPanel(ctx) {
    const container = document.getElementById('details-content')
    if (!container) return
    container.innerHTML = ''

    const item = ctx.vm.getSelectedItem()
    if (!item) {
        container.innerHTML = renderEmptyPlaceholderHtml('§', t('details.no_selection'))
        return
    }

    const { entity, type } = item

    if (type === 'choice' && entity instanceof Choice) {
        renderChoiceDetails(container, entity, item, ctx)
        return
    }

    if (type === 'character' || type === 'template') {
        renderNpcReadOnlyDetails(container, entity, item, type, ctx)
        return
    }

    let entityScope = []
    if (type === 'paragraph') entityScope = ctx.projectParagraphs
    else if (type === 'scene') entityScope = ctx.projectScenes
    else if (type === 'character') entityScope = ctx.projectCharacters
    else if (type === 'template') entityScope = ctx.projectTemplates || []
    else if (type === 'location') entityScope = ctx.projectLocations
    else if (type === 'stat' || type === 'trait') entityScope = ctx.projectStats
    else if (type === 'parameter') entityScope = ctx.projectParameters
    else if (type === 'skill') entityScope = ctx.projectSkills
    else if (type === 'feature') entityScope = ctx.projectFeatures
    else if (type === 'tag') entityScope = ctx.projectTags

    renderEntityHeaderModule(container, item)
    renderAvatarModule(container, entity, type, ctx)
    renderNameModule(container, item, entityScope, ctx)
    renderColorModule(container, entity, type, ctx)
    renderParagraphNumberModule(container, entity, type, ctx)
    renderStatValueModule(container, entity, type, ctx)
    renderParameterConfigModule(container, entity, type, ctx)
    renderSkillConfigModule(container, entity, type, ctx)
    renderSummaryModule(container, entity, ctx)
    renderFilesModule(container, entity, ctx)
    renderLocationsModule(container, entity, type, ctx)
    renderCharactersModule(container, entity, type, ctx)
    renderTagsModule(container, entity, type, ctx)
    renderTraitsModule(container, entity, type, ctx)
    renderParametersModule(container, entity, type, ctx)
    renderSkillsModule(container, entity, type, ctx)
    renderFeaturesModule(container, entity, type, ctx)
    renderCustomAttributesModule(container, entity, type, ctx)
    renderExitsModule(container, entity, type, ctx)
    renderQuickActionsModule(container, item, type, ctx)
}

// ---------------------------------------------------------------------------
// SUB-RENDERERS FOR DETAILS PANEL
// ---------------------------------------------------------------------------

function renderNpcReadOnlyDetails(container, entity, item, type, ctx) {
    const openModalFn = options => {
        if (typeof ctx.openNpcModal === 'function') {
            ctx.openNpcModal(options)
        } else {
            openNpcModal(options)
        }
    }

    // 1. Header Module
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const typeKey = `details.type_${type}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : type.toUpperCase()

    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)

    // 2. Action Module (Top Edit Button)
    const editActionMod = document.createElement('section')
    editActionMod.className = 'border-b border-[#333338] p-3'
    const editBtnText =
        type === 'template' ? t('details.edit_template') : t('details.edit_character')
    editActionMod.innerHTML = `
        <button id="btn-details-edit-npc" type="button" class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
            <span class="shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-4 h-4')}</span>
            <span>${escapeHtml(editBtnText)}</span>
        </button>
    `
    editActionMod.querySelector('#btn-details-edit-npc').addEventListener('click', () => {
        openModalFn({ mode: type, editEntity: entity })
    })
    container.appendChild(editActionMod)

    // 3. Avatar Module (Read-only)
    const avatarId =
        (typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar) || 'warrior'
    const avatar = getAvatarById(avatarId)

    const avatarMod = document.createElement('section')
    avatarMod.className = 'border-b border-[#333338] p-3 space-y-2'
    avatarMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.avatar')}</span>
            <span class="text-[10px] text-gray-400 capitalize">${escapeHtml(avatar.category || '')}</span>
        </div>
        <div class="flex items-center gap-3">
            <div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border-color: ${avatar.borderColor}">
                ${avatar.svg}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(avatar.name)}</div>
                <div class="text-[10px] text-zinc-400 font-mono">${escapeHtml(avatar.id)}</div>
            </div>
        </div>
    `
    container.appendChild(avatarMod)

    // 4. Name Module (Read-only)
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    const entityName = (typeof entity.getName === 'function' ? entity.getName() : item.name) || ''
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <div id="details-name-display" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
            ${escapeHtml(entityName)}
        </div>
    `
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

    const descMod = document.createElement('section')
    descMod.className = 'border-b border-[#333338] p-3 space-y-2'
    descMod.innerHTML = `
        <div class="space-y-1">
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.summary')}</label>
            ${
                currentSummary
                    ? `<div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentSummary)}</div>`
                    : `<div class="text-xs text-gray-500 italic py-1">${t('details.no_summary')}</div>`
            }
        </div>
        ${
            currentNarrative && currentNarrative !== currentSummary
                ? `
            <div class="space-y-1 pt-1">
                <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.narrative_description')}</label>
                <div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentNarrative)}</div>
            </div>
            `
                : ''
        }
    `
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module (Read-only)
    const currentTags =
        typeof entity.getTags === 'function' ? entity.getTags() || [] : entity.tags || []
    const tagsMod = document.createElement('section')
    tagsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    tagsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.tags')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${currentTags.length}</span>
        </div>
        <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[20px]">
            ${
                currentTags.length === 0
                    ? `<span class="text-xs text-gray-500 italic py-0.5">${t('left_panel.no_tags')}</span>`
                    : ''
            }
        </div>
    `
    const tagsListEl = tagsMod.querySelector('#details-tags-list')
    currentTags.forEach(tObj => {
        const tagName = typeof tObj.getName === 'function' ? tObj.getName() : tObj.name || tObj
        const tagColor =
            (typeof tObj.getColor === 'function' ? tObj.getColor() : tObj.color) ||
            DEFAULT_TAG_COLOR
        const chip = document.createElement('span')
        chip.className =
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] text-white font-medium shadow-sm'
        chip.style.backgroundColor = tagColor
        chip.textContent = `#${tagName}`
        tagsListEl.appendChild(chip)
    })
    container.appendChild(tagsMod)

    // 7. Traits / Stats Module (Read-only)
    const statsList =
        typeof entity.getStats === 'function' ? entity.getStats() || [] : entity.stats || []
    const statsMod = document.createElement('section')
    statsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    statsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="text-amber-400 inline-flex items-center">${getIconSvg('stat', 'w-3.5 h-3.5')}</span>
                <span>${t('details.traits')}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsList.length}</span>
        </div>
        <div id="details-stats-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_traits')}</span>` : ''}
        </div>
    `
    const statsListEl = statsMod.querySelector('#details-stats-list')
    statsList.forEach(st => {
        const stName = typeof st.getName === 'function' ? st.getName() : st.name || ''
        const stVal = typeof st.getValue === 'function' ? st.getValue() : (st.value ?? '')
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-amber-400 shrink-0 inline-flex items-center">${getIconSvg('stat', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(stName)}</span>
            </span>
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-amber-300 shrink-0">
                ${escapeHtml(String(stVal))}
            </span>
        `
        statsListEl.appendChild(row)
    })
    container.appendChild(statsMod)

    // 8. Vital Parameters Module (Read-only)
    const paramsList =
        typeof entity.getParameters === 'function'
            ? entity.getParameters() || []
            : entity.parameters || []
    const charStatsMap = {}
    statsList.forEach(st => {
        const name = typeof st.getName === 'function' ? st.getName() : st.name
        const val = typeof st.getValue === 'function' ? st.getValue() : st.value
        if (name) charStatsMap[name] = val
    })

    const paramsMod = document.createElement('section')
    paramsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    paramsMod.innerHTML = `
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
    `
    const paramsListEl = paramsMod.querySelector('#details-params-list')
    paramsList.forEach(p => {
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

        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-rose-400 shrink-0 inline-flex items-center">${getIconSvg('parameter', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(pName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        `
        paramsListEl.appendChild(row)
    })
    container.appendChild(paramsMod)

    // 9. Skills Module (Read-only)
    const skillsList =
        typeof entity.getSkills === 'function' ? entity.getSkills() || [] : entity.skills || []
    const skillsMod = document.createElement('section')
    skillsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    skillsMod.innerHTML = `
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
    `
    const skillsListEl = skillsMod.querySelector('#details-skills-list')
    skillsList.forEach(sk => {
        const skName = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
        const skMode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'
        let valueDisplay = ''

        if (skMode === 'stat_mod') {
            const statName =
                typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
            const mod =
                typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || '+0'
            valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 text-blue-300 font-mono border border-blue-500/40 font-bold truncate max-w-[140px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
        } else {
            const skVal = typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? '')
            valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] text-blue-300 shrink-0">${escapeHtml(String(skVal))}</span>`
        }

        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('skill', 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(skName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        `
        skillsListEl.appendChild(row)
    })
    container.appendChild(skillsMod)

    // 10. Features Module (Read-only)
    const featuresList =
        typeof entity.getFeatures === 'function'
            ? entity.getFeatures() || []
            : entity.features || []
    const featMod = document.createElement('section')
    featMod.className = 'border-b border-[#333338] p-3 space-y-2'
    featMod.innerHTML = `
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
    `
    const featuresListEl = featMod.querySelector('#details-features-list')
    featuresList.forEach(f => {
        const fName = typeof f.getName === 'function' ? f.getName() : f.name || ''
        const descText =
            typeof f.getDescription === 'function'
                ? f.getDescription()?.getText?.() || f.getDescription()?.getSummary?.() || ''
                : f.description?.text || f.description?.summary || ''

        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <div class="min-w-0 flex flex-col flex-1 pr-2">
                <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 truncate">
                    <span class="text-purple-400 shrink-0 inline-flex items-center">${getIconSvg('feature', 'w-3 h-3')}</span>
                    <span class="truncate">${escapeHtml(fName)}</span>
                </span>
                ${descText ? `<span class="text-[10px] text-gray-400 truncate pl-4.5 italic" title="${escapeHtml(descText)}">${escapeHtml(descText)}</span>` : ''}
            </div>
        `
        featuresListEl.appendChild(row)
    })
    container.appendChild(featMod)

    // 11. Custom Attributes Module (Read-only)
    const customAttrs =
        typeof entity.getCustomAttributes === 'function'
            ? entity.getCustomAttributes() || []
            : entity.customAttributes || []
    const customMod = document.createElement('section')
    customMod.className = 'border-b border-[#333338] p-3 space-y-2'
    customMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.custom_attributes')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${customAttrs.length}</span>
        </div>
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${customAttrs.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_custom_attributes')}</span>` : ''}
        </div>
    `
    const attrsListEl = customMod.querySelector('#details-custom-attrs-list')
    customAttrs.forEach(attr => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-2 bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <span class="font-medium text-[#d4d4d8] truncate">${escapeHtml(attr.name)}</span>
            <span class="text-gray-500 font-mono">:</span>
            <span class="font-mono text-white text-right truncate">${escapeHtml(String(attr.value))}</span>
        `
        attrsListEl.appendChild(row)
    })
    container.appendChild(customMod)

    // 12. Quick Actions Module (Bottom)
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    const editLabel = type === 'template' ? t('details.edit_template') : t('details.edit_character')

    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-bottom-edit-npc" class="w-full py-1.5 px-3 rounded bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-xs text-left text-blue-200 flex items-center justify-between cursor-pointer transition-colors" type="button">
            <span>${escapeHtml(editLabel)}</span>
            <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-3.5 h-3.5')}</span>
        </button>
        ${
            type === 'character'
                ? `
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        `
                : `
        <button id="btn-details-create-npc-from-template" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('details.create_character_from_template')}</span>
            <span class="text-emerald-400 shrink-0 inline-flex items-center">${getIconSvg('character', 'w-3.5 h-3.5')}</span>
        </button>
        `
        }
    `

    actionsMod.querySelector('#btn-details-bottom-edit-npc').addEventListener('click', () => {
        openModalFn({ mode: type, editEntity: entity })
    })

    const showGraphBtn = actionsMod.querySelector('#btn-details-show-graph')
    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', () => {
            ctx.vm.setActiveMainView('graph')
            ctx.updateMainWorkspaceUI()
            if (ctx.storyGraphInstance) {
                ctx.storyGraphInstance.focusOnElement(item.id)
                requestAnimationFrame(() => {
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(item.id)
                })
            }
        })
    }

    const createFromTemplateBtn = actionsMod.querySelector('#btn-details-create-npc-from-template')
    if (createFromTemplateBtn) {
        createFromTemplateBtn.addEventListener('click', () => {
            openModalFn({
                mode: 'character',
                templateId: entity.getId ? entity.getId() : entity.id,
            })
        })
    }

    container.appendChild(actionsMod)
}

function renderChoiceDetails(container, choice, item, ctx) {
    const fromId = choice.getFromParagraphId()
    const toId = choice.getToParagraphId()
    const fromP = ctx.projectParagraphs.find(p => p.getId() === fromId)
    const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
    const fromTitle = fromP ? fromP.getTitle() || fromP.getId() : fromId || '?'
    const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
    const cond = choice.getCondition()
    const condText = cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

    // Typ & ID
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor('choice')} font-medium">${t('details.type_choice')}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)

    // Nazwa / Etykieta przeskoku
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.choice_name')}</label>
        <input id="details-choice-name-input" type="text" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-choice-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    const nameInput = nameMod.querySelector('#details-choice-name-input')
    const nameError = nameMod.querySelector('#details-choice-name-error')

    const saveChoiceName = () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }
        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        const currentCondEl = container.querySelector('#details-condition-text')
        const currentCondText = currentCondEl ? currentCondEl.value : condText
        ctx.vm.updateChoiceDetails(choice, val, currentCondText)
        renderHistoryBar(ctx)
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        return true
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        if (!val) {
            nameError.textContent = t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })
    nameInput.addEventListener('blur', saveChoiceName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (saveChoiceName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)

    // Węzły źródłowy i docelowy
    const nodesMod = document.createElement('section')
    nodesMod.className = 'border-b border-[#333338] p-3 space-y-2'
    nodesMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.nodes_section')}</div>
        <div class="grid grid-cols-2 gap-2">
            <button type="button" id="btn-node-source" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-emerald-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${fromP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.source_node')}</span>
                    <span class="text-gray-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-emerald-400 font-medium truncate mt-1 w-full" title="${escapeHtml(fromTitle)}">§ ${escapeHtml(fromTitle)}</div>
            </button>
            <button type="button" id="btn-node-target" class="group bg-[#18181b] hover:bg-[#222226] border border-[#27272a] hover:border-blue-500/50 rounded p-2 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between min-w-0" title="${toP ? t('details.open_node_details') : ''}">
                <div class="flex items-center justify-between gap-1 w-full">
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${t('details.target_node')}</span>
                    <span class="text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">${getIconSvg('arrow-right', 'w-2.5 h-2.5')}</span>
                </div>
                <div class="text-xs text-blue-400 font-medium truncate mt-1 w-full" title="${escapeHtml(toTitle)}">§ ${escapeHtml(toTitle)}</div>
            </button>
        </div>
    `

    const sourceBtn = nodesMod.querySelector('#btn-node-source')
    const targetBtn = nodesMod.querySelector('#btn-node-target')
    if (sourceBtn) {
        sourceBtn.addEventListener('click', () => {
            if (fromP) ctx.selectEntity(fromP, 'paragraph')
        })
    }
    if (targetBtn) {
        targetBtn.addEventListener('click', () => {
            if (toP) ctx.selectEntity(toP, 'paragraph')
        })
    }
    container.appendChild(nodesMod)

    // Warunek Polimorficzny
    const condMod = document.createElement('section')
    condMod.className = 'border-b border-[#333338] p-3 space-y-2'
    condMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.condition_title')}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/40 text-amber-300 border border-amber-700/40 font-medium">${t('condition.type_text')}</span>
        </div>
        <p class="text-[11px] text-gray-400 leading-snug">${t('details.condition_help')}</p>
        <textarea id="details-condition-text" rows="3" placeholder="${t('details.condition_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(condText)}</textarea>
    `
    const condInput = condMod.querySelector('#details-condition-text')
    condInput.addEventListener('input', () => {
        ctx.vm.updateChoiceDetails(choice, choice.getName(), condInput.value)
        ctx.renderConnectionsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
    })
    container.appendChild(condMod)

    // Szybkie akcje / Usuń
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
        <button id="btn-details-delete-choice" class="w-full py-1.5 px-3 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-xs text-left text-red-300 flex items-center justify-between cursor-pointer" type="button">
            <span>${t('details.delete_connection')}</span>
            <span class="text-red-400 shrink-0">${getIconSvg('close', 'w-3.5 h-3.5')}</span>
        </button>
    `
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = choice.getFromParagraphId() || choice.getId()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
    })
    actionsMod.querySelector('#btn-details-delete-choice').addEventListener('click', () => {
        if (confirm(t('context_menu.confirm_delete', { name: choice.getName() }))) {
            ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
            ctx.renderConnectionsList()
            ctx.renderParagraphsList()
            renderHistoryBar(ctx)
            renderDetailsPanel(ctx)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            toast.success(t('toast.connection_deleted'))
        }
    })
    container.appendChild(actionsMod)
}

function renderEntityHeaderModule(container, item) {
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const typeKey = `details.type_${item.type}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : item.type.toUpperCase()

    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(item.type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)
}

function renderAvatarModule(container, entity, type, ctx) {
    if ((type !== 'character' && type !== 'template') || typeof entity.getAvatar !== 'function')
        return

    const avatarId = entity.getAvatar() || 'warrior'
    const avatar = getAvatarById(avatarId)

    const avatarMod = document.createElement('section')
    avatarMod.className = 'border-b border-[#333338] p-3 space-y-2'
    avatarMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.avatar')}</span>
            <span class="text-[10px] text-gray-400 capitalize">${escapeHtml(avatar.category || '')}</span>
        </div>
        <div class="flex items-center gap-3">
            <div id="details-avatar-preview" class="w-10 h-10 rounded-lg p-1.5 flex items-center justify-center shrink-0 shadow-md border" style="background-color: ${avatar.bgColor}; color: ${avatar.color}; border-color: ${avatar.borderColor}">
                ${avatar.svg}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-white truncate">${escapeHtml(avatar.name)}</div>
                <button type="button" id="btn-details-toggle-avatar-grid" class="mt-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1 font-medium transition-colors">
                    <span>${t('details.change_avatar')}</span>
                    ${getIconSvg('chevron-down', 'w-3 h-3')}
                </button>
            </div>
        </div>
        <div id="details-avatar-grid" class="hidden grid grid-cols-4 gap-1.5 pt-2 border-t border-[#2d2d32]">
            ${FANTASY_AVATARS.map(
                av => `
                <button type="button" data-avatar-id="${av.id}" class="details-avatar-btn group p-1.5 rounded flex flex-col items-center gap-1 bg-[#18181b] border ${av.id === avatarId ? 'border-blue-500 ring-1 ring-blue-500' : 'border-[#27272a] hover:border-[#3f3f46]'} cursor-pointer transition-all">
                    <div class="w-6 h-6 rounded flex items-center justify-center p-0.5" style="background-color: ${av.bgColor}; color: ${av.color}">
                        ${av.svg}
                    </div>
                    <span class="text-[9px] text-[#a1a1aa] group-hover:text-white truncate max-w-full">${escapeHtml(av.name)}</span>
                </button>
            `
            ).join('')}
        </div>
    `

    const toggleBtn = avatarMod.querySelector('#btn-details-toggle-avatar-grid')
    const grid = avatarMod.querySelector('#details-avatar-grid')

    if (toggleBtn && grid) {
        toggleBtn.addEventListener('click', () => {
            grid.classList.toggle('hidden')
        })

        grid.querySelectorAll('.details-avatar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedAvatarId = btn.dataset.avatarId
                if (selectedAvatarId && entity.setAvatar) {
                    entity.setAvatar(selectedAvatarId)
                    renderDetailsPanel(ctx)
                    ctx.refreshActiveSection(type)
                }
            })
        })
    }

    container.appendChild(avatarMod)
}

function renderNameModule(container, item, entityScope, ctx) {
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <input id="details-name-input" type="text" value="${escapeHtml(item.name)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    const nameInput = nameMod.querySelector('#details-name-input')
    const nameError = nameMod.querySelector('#details-name-error')

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        const res = ctx.vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        }
        nameError.classList.add('hidden')
        nameInput.classList.remove('border-red-500')
        ctx.vm.updateName(val, entityScope)
        renderHistoryBar(ctx)
        ctx.refreshActiveSection(item.type)
        return true
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        const res = ctx.vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })

    nameInput.addEventListener('blur', validateAndSaveName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (validateAndSaveName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)
}

function renderColorModule(container, entity, type, ctx) {
    if (typeof entity.getColor !== 'function' || typeof entity.setColor !== 'function') return

    const colorMod = document.createElement('section')
    colorMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentColor =
        entity.getColor() || (type === 'scene' ? DEFAULT_SCENE_COLOR : DEFAULT_TAG_COLOR)

    const sectionTitle =
        type === 'scene'
            ? t('details.scene_color')
            : type === 'tag'
              ? t('details.tag_color')
              : t('details.color')

    colorMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(sectionTitle)}</span>
            <div class="flex items-center gap-1.5">
                <span id="details-color-preview" class="w-3.5 h-3.5 rounded border border-white/20 shadow-sm shrink-0" style="background-color: ${escapeHtml(currentColor)}"></span>
                <span id="details-color-hex" class="text-[10px] font-mono text-gray-400 uppercase">${escapeHtml(currentColor)}</span>
            </div>
        </div>
        <div class="grid grid-cols-6 gap-1.5 pt-0.5">
            ${renderColorPresetButtonsHtml(PRESET_COLORS, currentColor)}
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="text-[11px] text-gray-400 shrink-0">${t('details.custom_color')}:</label>
            <input type="color" id="details-color-picker" value="${escapeHtml(currentColor)}" class="w-7 h-6 p-0 border border-[#3f3f46] rounded bg-transparent cursor-pointer shrink-0" />
            <input type="text" id="details-color-hex-input" value="${escapeHtml(currentColor)}" class="w-24 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-0.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-blue-500" />
        </div>
    `

    const previewEl = colorMod.querySelector('#details-color-preview')
    const hexLabel = colorMod.querySelector('#details-color-hex')
    const colorPicker = colorMod.querySelector('#details-color-picker')
    const hexInput = colorMod.querySelector('#details-color-hex-input')
    const presetBtns = colorMod.querySelectorAll('.details-color-preset-btn')

    const applyColor = newColor => {
        entity.setColor(newColor)
        if (previewEl) previewEl.style.backgroundColor = newColor
        if (hexLabel) hexLabel.textContent = newColor.toUpperCase()
        if (colorPicker) colorPicker.value = newColor
        if (hexInput) hexInput.value = newColor.toUpperCase()

        presetBtns.forEach(btn => {
            const isMatching = btn.dataset.color.toLowerCase() === newColor.toLowerCase()
            btn.classList.toggle('border-white', isMatching)
            btn.classList.toggle('ring-2', isMatching)
            btn.classList.toggle('ring-white/50', isMatching)
            btn.classList.toggle('scale-105', isMatching)
            btn.classList.toggle('border-white/15', !isMatching)
        })

        if (type === 'scene') {
            ctx.renderScenesList()
            if (ctx.storyGraphInstance) {
                ctx.storyGraphInstance.updateParagraphNodeColors(
                    ctx.projectParagraphs,
                    ctx.projectScenes
                )
                ctx.storyGraphInstance.updateSceneNodeBadges(ctx.projectScenes)
                const sceneEl = document.querySelector(
                    `scene-node[data-scene-id="${entity.getId()}"]`
                )
                if (sceneEl) {
                    sceneEl.themeColor = newColor
                }
            }
        } else {
            ctx.renderTagsList()
            if (ctx.renderFilterTags) ctx.renderFilterTags()
            ctx.renderParagraphsList()
            if (ctx.storyGraphInstance) {
                ctx.storyGraphInstance.render(true)
            }
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => applyColor(btn.dataset.color))
    })

    colorPicker.addEventListener('input', e => applyColor(e.target.value))

    hexInput.addEventListener('change', () => {
        let val = hexInput.value.trim()
        if (!val.startsWith('#')) val = '#' + val
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
            applyColor(val)
        } else {
            hexInput.value = (entity.getColor() || '').toUpperCase()
        }
    })

    container.appendChild(colorMod)
}

function renderParagraphNumberModule(container, entity, type, ctx) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const numMod = document.createElement('section')
    numMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const isLocked = Boolean(entity.getIsNumberLocked && entity.getIsNumberLocked())
    const customNum = entity.getCustomNumber ? entity.getCustomNumber() : 0

    numMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.paragraph_number')}</span>
            <span id="details-number-mode-badge" class="text-[10px] font-medium px-2 py-0.5 rounded ${
                isLocked
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }">
                ${isLocked ? `#${customNum || 1} (${t('details.custom_number')})` : t('details.auto_number')}
            </span>
        </div>
        <div class="flex items-center gap-2 pt-1">
            <label class="flex items-center gap-1.5 text-xs text-[#d4d4d8] cursor-pointer select-none">
                <input type="checkbox" id="details-number-lock" ${isLocked ? 'checked' : ''} class="rounded accent-blue-500 cursor-pointer" />
                <span>${t('details.lock_number')}</span>
            </label>
            <input id="details-custom-number" type="number" min="1" value="${isLocked && customNum ? customNum : ''}" placeholder="${t('details.custom_number_placeholder')}"
                ${!isLocked ? 'disabled' : ''}
                class="w-28 bg-[#18181b] border border-[#3f3f46] disabled:opacity-30 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
        </div>
        <div id="details-number-error" class="hidden text-[11px] text-red-400 mt-1"></div>
    `

    const lockCheckbox = numMod.querySelector('#details-number-lock')
    const customNumInput = numMod.querySelector('#details-custom-number')
    const modeBadge = numMod.querySelector('#details-number-mode-badge')
    const numberError = numMod.querySelector('#details-number-error')

    const validateNumber = val => {
        if (!lockCheckbox.checked || !val) {
            numberError.classList.add('hidden')
            customNumInput.classList.remove('border-red-500')
            return true
        }
        const res = ctx.vm.validateParagraphNumber(val, entity.getId(), ctx.projectParagraphs)
        if (!res.valid) {
            numberError.textContent = res.message || t('details.number_taken')
            numberError.classList.remove('hidden')
            customNumInput.classList.add('border-red-500')
            return false
        }
        numberError.classList.add('hidden')
        customNumInput.classList.remove('border-red-500')
        return true
    }

    if (isLocked && customNum) {
        validateNumber(customNum)
    }

    lockCheckbox.addEventListener('change', () => {
        const locked = lockCheckbox.checked
        ctx.vm.toggleNumberLock(locked)
        customNumInput.disabled = !locked
        if (!locked) {
            ctx.vm.updateCustomNumber(0)
            customNumInput.value = ''
            validateNumber(0)
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700'
                modeBadge.textContent = t('details.auto_number')
            }
        } else {
            const parsed = parseInt(customNumInput.value, 10) || 1
            ctx.vm.updateCustomNumber(parsed)
            customNumInput.value = String(parsed)
            validateNumber(parsed)
            if (modeBadge) {
                modeBadge.className =
                    'text-[10px] font-medium px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50'
                modeBadge.textContent = `#${parsed} (${t('details.custom_number')})`
            }
        }
        ctx.renderParagraphsList()
    })

    customNumInput.addEventListener('input', () => {
        const val = parseInt(customNumInput.value, 10) || 0
        validateNumber(val)
        ctx.vm.updateCustomNumber(val)
        if (modeBadge && lockCheckbox.checked) {
            modeBadge.textContent = `#${val || 1} (${t('details.custom_number')})`
        }
        ctx.renderParagraphsList()
    })

    container.appendChild(numMod)
}

function renderStatValueModule(container, entity, type, ctx) {
    if (type !== 'stat' && type !== 'trait') return
    if (!entity.getValue || !entity.setValue) return

    const valMod = document.createElement('section')
    valMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    valMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.stat_value')}</label>
        <input id="details-stat-value-input" type="text" value="${escapeHtml(String(entity.getValue() ?? ''))}" placeholder="${t('details.trait_value')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
    `

    const input = valMod.querySelector('#details-stat-value-input')
    const saveValue = () => {
        const val = input.value.trim()
        entity.setValue(val)
        renderHistoryBar(ctx)
        ctx.refreshActiveSection(type)
    }

    input.addEventListener('change', saveValue)
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveValue()
            input.blur()
        }
    })

    container.appendChild(valMod)
}

function renderParameterConfigModule(container, entity, type, ctx) {
    if (type !== 'parameter') return
    if (!entity.getMode || !entity.setMode) return

    const currentMode = entity.getMode() || 'direct'
    const currentValue = entity.getValue ? entity.getValue() : ''
    const currentFormula = entity.getFormula ? entity.getFormula() : ''

    const statsMap = {}
    ;(ctx.projectStats || []).forEach(st => {
        statsMap[st.getName()] = st.getValue()
    })
    const evalRes = evaluateFormula(currentFormula, statsMap)

    const paramConfigMod = document.createElement('section')
    paramConfigMod.className = 'border-b border-[#333338] p-3 space-y-2'
    paramConfigMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.parameter_mode')}</label>
        <div class="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-param-mode-direct" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${currentMode === 'direct' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50' : 'text-gray-400 hover:text-white'}">
                ${t('details.mode_direct')}
            </button>
            <button type="button" id="btn-param-mode-formula" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${currentMode === 'formula' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50' : 'text-gray-400 hover:text-white'}">
                ${t('details.mode_formula')}
            </button>
        </div>
        <div id="param-direct-block" class="${currentMode === 'direct' ? '' : 'hidden'} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${t('details.parameter_value')}</label>
            <input id="details-param-val-input" type="text" value="${escapeHtml(String(currentValue))}" placeholder="100"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
        </div>
        <div id="param-formula-block" class="${currentMode === 'formula' ? '' : 'hidden'} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${t('details.parameter_formula')}</label>
            <input id="details-param-formula-input" type="text" value="${escapeHtml(currentFormula)}" placeholder="Siła * 2 + 10"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
            <div class="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                <span>${t('details.calculated_preview')}:</span>
                <span id="param-formula-preview" class="font-mono font-bold ${evalRes.result !== null ? 'text-emerald-400' : 'text-amber-400'}">${evalRes.result !== null ? evalRes.result : evalRes.error || '—'}</span>
            </div>
        </div>
    `

    const btnDirect = paramConfigMod.querySelector('#btn-param-mode-direct')
    const btnFormula = paramConfigMod.querySelector('#btn-param-mode-formula')
    const valInput = paramConfigMod.querySelector('#details-param-val-input')
    const formulaInput = paramConfigMod.querySelector('#details-param-formula-input')
    const formulaPreview = paramConfigMod.querySelector('#param-formula-preview')

    btnDirect.addEventListener('click', () => {
        entity.setMode('direct')
        renderDetailsPanel(ctx)
        ctx.refreshActiveSection(type)
    })

    btnFormula.addEventListener('click', () => {
        entity.setMode('formula')
        renderDetailsPanel(ctx)
        ctx.refreshActiveSection(type)
    })

    if (valInput) {
        valInput.addEventListener('change', () => {
            if (entity.setValue) entity.setValue(valInput.value.trim())
            ctx.refreshActiveSection(type)
        })
        valInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (entity.setValue) entity.setValue(valInput.value.trim())
                valInput.blur()
                ctx.refreshActiveSection(type)
            }
        })
    }

    if (formulaInput) {
        formulaInput.addEventListener('input', () => {
            const formVal = formulaInput.value.trim()
            const res = evaluateFormula(formVal, statsMap)
            if (formulaPreview) {
                formulaPreview.textContent =
                    res.result !== null ? String(res.result) : res.error || '—'
                formulaPreview.className = `font-mono font-bold ${res.result !== null ? 'text-emerald-400' : 'text-amber-400'}`
            }
        })
        formulaInput.addEventListener('change', () => {
            const formVal = formulaInput.value.trim()
            if (entity.setFormula) entity.setFormula(formVal)
            ctx.refreshActiveSection(type)
        })
        formulaInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const formVal = formulaInput.value.trim()
                if (entity.setFormula) entity.setFormula(formVal)
                formulaInput.blur()
                ctx.refreshActiveSection(type)
            }
        })
    }

    container.appendChild(paramConfigMod)
}

function renderSkillConfigModule(container, entity, type, ctx) {
    if (type !== 'skill') return
    if (!entity.getMode || !entity.setMode) return

    const currentMode = entity.getMode() || 'direct'
    const currentValue = entity.getValue ? entity.getValue() : ''
    const currentStat = entity.getStatName ? entity.getStatName() : ''
    const currentMod = entity.getModifier ? entity.getModifier() : '+0'

    const skillConfigMod = document.createElement('section')
    skillConfigMod.className = 'border-b border-[#333338] p-3 space-y-2'
    skillConfigMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.skill_mode')}</label>
        <div class="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-skill-mode-direct" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${currentMode === 'direct' ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50' : 'text-gray-400 hover:text-white'}">
                ${t('details.mode_direct')}
            </button>
            <button type="button" id="btn-skill-mode-stat" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${currentMode === 'stat_mod' ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50' : 'text-gray-400 hover:text-white'}">
                ${t('details.mode_stat_mod')}
            </button>
        </div>
        <div id="skill-direct-block" class="${currentMode === 'direct' ? '' : 'hidden'} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${t('details.skill_value')}</label>
            <input id="details-skill-val-input" type="text" value="${escapeHtml(currentValue)}" placeholder="+2"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
        </div>
        <div id="skill-stat-block" class="${currentMode === 'stat_mod' ? '' : 'hidden'} space-y-2 pt-1">
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${t('details.skill_stat')}</label>
                <select id="details-skill-stat-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                    <option value="">-- ${t('details.traits')} --</option>
                    ${(ctx.projectStats || [])
                        .map(
                            st =>
                                `<option value="${escapeHtml(st.getName())}" ${st.getName() === currentStat ? 'selected' : ''}>${escapeHtml(st.getName())}</option>`
                        )
                        .join('')}
                </select>
            </div>
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${t('details.skill_mod')}</label>
                <input id="details-skill-mod-input" type="text" value="${escapeHtml(currentMod)}" placeholder="+2"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
            </div>
        </div>
    `

    const btnDirect = skillConfigMod.querySelector('#btn-skill-mode-direct')
    const btnStat = skillConfigMod.querySelector('#btn-skill-mode-stat')
    const valInput = skillConfigMod.querySelector('#details-skill-val-input')
    const statSelect = skillConfigMod.querySelector('#details-skill-stat-select')
    const modInput = skillConfigMod.querySelector('#details-skill-mod-input')

    btnDirect.addEventListener('click', () => {
        entity.setMode('direct')
        renderDetailsPanel(ctx)
        ctx.refreshActiveSection(type)
    })

    btnStat.addEventListener('click', () => {
        entity.setMode('stat_mod')
        renderDetailsPanel(ctx)
        ctx.refreshActiveSection(type)
    })

    if (valInput) {
        valInput.addEventListener('change', () => {
            if (entity.setValue) entity.setValue(valInput.value.trim())
            ctx.refreshActiveSection(type)
        })
        valInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (entity.setValue) entity.setValue(valInput.value.trim())
                valInput.blur()
                ctx.refreshActiveSection(type)
            }
        })
    }

    if (statSelect) {
        statSelect.addEventListener('change', () => {
            if (entity.setStatName) entity.setStatName(statSelect.value)
            ctx.refreshActiveSection(type)
        })
    }

    if (modInput) {
        modInput.addEventListener('change', () => {
            if (entity.setModifier) entity.setModifier(modInput.value.trim())
            ctx.refreshActiveSection(type)
        })
        modInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (entity.setModifier) entity.setModifier(modInput.value.trim())
                modInput.blur()
                ctx.refreshActiveSection(type)
            }
        })
    }

    container.appendChild(skillConfigMod)
}

function renderSummaryModule(container, entity, ctx) {
    const desc =
        typeof entity.getContent === 'function'
            ? entity.getContent()
            : typeof entity.getDescription === 'function'
              ? entity.getDescription()
              : null
    if (!desc) return

    const summaryMod = document.createElement('section')
    summaryMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    const currentSummary =
        (typeof desc.getSummary === 'function' ? desc.getSummary() : '') ||
        (typeof desc.getText === 'function' ? desc.getText() : '') ||
        ''

    summaryMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.summary')}</label>
        <textarea id="details-summary-input" rows="2" placeholder="${t('details.summary_placeholder')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(currentSummary)}</textarea>
    `

    const summaryInput = summaryMod.querySelector('#details-summary-input')
    summaryInput.addEventListener('input', () => {
        if (typeof ctx.vm.updateSummary === 'function') {
            ctx.vm.updateSummary(summaryInput.value)
        } else if (typeof desc.setSummary === 'function') {
            desc.setSummary(summaryInput.value)
        } else if (typeof desc.setText === 'function') {
            desc.setText(summaryInput.value)
        }
    })

    container.appendChild(summaryMod)
}

function renderFilesModule(container, entity, ctx) {
    if (!entity.getContent && !entity.getDescription) return

    const filesMod = document.createElement('section')
    filesMod.className = 'border-b border-[#333338] p-3 space-y-2'
    filesMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.description_files')}</div>
        <div class="flex flex-col gap-1.5">
            <button id="btn-open-player-text" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${t('details.open_player_text')}</span>
                </span>
                <span class="text-blue-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
            <button id="btn-open-author-notes" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                <span class="flex items-center gap-2">
                    <span class="text-amber-400 shrink-0">${getIconSvg('markdown', 'w-3.5 h-3.5')}</span>
                    <span>${t('details.open_author_notes')}</span>
                </span>
                <span class="text-blue-400 shrink-0">${getIconSvg('arrow-right', 'w-3.5 h-3.5')}</span>
            </button>
        </div>
    `

    filesMod.querySelector('#btn-open-player-text').addEventListener('click', () => {
        const { fileName, content } = ctx.vm.openOrCreateDescriptionFile('text')
        if (fileName) {
            ctx.files[fileName] = content
            ctx.updateMainWorkspaceUI()
            toast.success(`${t('details.open_player_text')}: ${t('details.file_created')}`)
        }
    })

    filesMod.querySelector('#btn-open-author-notes').addEventListener('click', () => {
        const { fileName, content } = ctx.vm.openOrCreateDescriptionFile('author')
        if (fileName) {
            ctx.files[fileName] = content
            ctx.updateMainWorkspaceUI()
            toast.success(`${t('details.open_author_notes')}: ${t('details.file_created')}`)
        }
    })

    container.appendChild(filesMod)
}

function renderLocationsModule(container, entity, type, ctx) {
    if (
        typeof entity.getLocations !== 'function' &&
        typeof entity.getLocation !== 'function' &&
        typeof entity.addLocation !== 'function'
    )
        return

    const locationMod = document.createElement('section')
    locationMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentLocs =
        typeof entity.getLocations === 'function'
            ? entity.getLocations()
            : entity.getLocation && entity.getLocation()
              ? [entity.getLocation()]
              : []

    locationMod.innerHTML = `
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
                renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(locationMod)
}

function renderCharactersModule(container, entity, type, ctx) {
    if (
        typeof entity.getCharacters !== 'function' ||
        typeof entity.addCharacter !== 'function' ||
        typeof entity.removeCharacter !== 'function'
    )
        return

    const charsMod = document.createElement('section')
    charsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentChars = entity.getCharacters() || []

    charsMod.innerHTML = `
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
                renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
            if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        }
    })

    container.appendChild(charsMod)
}

function renderTagsModule(container, entity, type, ctx) {
    if (!entity.getTags || !entity.addTag || !entity.removeTag) return

    const tagsMod = document.createElement('section')
    tagsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const currentTags = entity.getTags() || []

    tagsMod.innerHTML = `
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

    const tagsListEl = tagsMod.querySelector('#details-tags-list')
    currentTags.forEach(tObj => {
        const chip = document.createElement('span')
        chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white'
        chip.style.backgroundColor = tObj.getColor() || DEFAULT_TAG_COLOR
        chip.innerHTML = `<span>#${escapeHtml(tObj.getName())}</span><button class="hover:text-red-200 ml-0.5 cursor-pointer inline-flex items-center" title="${t('buttons.delete')}">${getIconSvg('close', 'w-2.5 h-2.5')}</button>`
        chip.querySelector('button').addEventListener('click', () => {
            ctx.vm.removeTagFromSelected(tObj.getId())
            renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(tagsMod)
}

function renderTraitsModule(container, entity, type, ctx) {
    if (!entity.getStats || !entity.addStat || !entity.removeStat) return

    const statsMod = document.createElement('section')
    statsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const statsList = entity.getStats() || []

    statsMod.innerHTML = `
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
            renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(statsMod)
}

function renderParametersModule(container, entity, type, ctx) {
    if (!entity.getParameters || !entity.addParameter || !entity.removeParameter) return

    const paramsMod = document.createElement('section')
    paramsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const paramsList = entity.getParameters() || []

    const charStatsMap = {}
    if (entity.getStats) {
        ;(entity.getStats() || []).forEach(st => {
            charStatsMap[st.getName()] = st.getValue()
        })
    }

    paramsMod.innerHTML = `
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
            renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(paramsMod)
}

function renderSkillsModule(container, entity, type, ctx) {
    if (!entity.getSkills || !entity.addSkill || !entity.removeSkill) return

    const skillsMod = document.createElement('section')
    skillsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const skillsList = entity.getSkills() || []

    skillsMod.innerHTML = `
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
            renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(skillsMod)
}

function renderFeaturesModule(container, entity, type, ctx) {
    if (!entity.getFeatures || !entity.addFeature || !entity.removeFeature) return

    const featMod = document.createElement('section')
    featMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const featuresList = entity.getFeatures() || []

    featMod.innerHTML = `
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
            renderDetailsPanel(ctx)
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
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        }
    })

    container.appendChild(featMod)
}

function renderCustomAttributesModule(container, entity, type, ctx) {
    if (!entity.getCustomAttributes || !entity.setCustomAttributes) return

    const customMod = document.createElement('section')
    customMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const customAttrs = entity.getCustomAttributes() || []

    customMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.custom_attributes')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${customAttrs.length}</span>
        </div>
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${customAttrs.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_custom_attributes')}</span>` : ''}
        </div>
        <div class="flex gap-1.5 pt-1 items-center">
            <input type="text" id="details-add-attr-name" placeholder="${t('details.attr_name_placeholder')}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <input type="text" id="details-add-attr-val" placeholder="${t('details.attr_value_placeholder')}" class="w-1/2 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            <button id="btn-details-add-attr" type="button" class="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white font-medium cursor-pointer shrink-0">
                ${t('buttons.add')}
            </button>
        </div>
    `

    const attrsListEl = customMod.querySelector('#details-custom-attrs-list')
    customAttrs.forEach((attr, idx) => {
        const row = document.createElement('div')
        row.className =
            'flex items-center justify-between gap-1.5 bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
        row.innerHTML = `
            <input type="text" class="attr-name-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${escapeHtml(attr.name)}" />
            <span class="text-gray-500 font-mono">:</span>
            <input type="text" class="attr-val-input flex-1 bg-[#202023] border border-transparent hover:border-[#3f3f46] focus:border-blue-500 rounded px-1.5 py-0.5 text-xs text-white" value="${escapeHtml(String(attr.value))}" />
            <button type="button" class="btn-remove-attr text-gray-400 hover:text-red-400 p-0.5 cursor-pointer inline-flex items-center shrink-0" title="${t('buttons.delete')}">${getIconSvg('close', 'w-3 h-3')}</button>
        `

        const nameInput = row.querySelector('.attr-name-input')
        const valInput = row.querySelector('.attr-val-input')
        const saveAttr = () => {
            attr.name = nameInput.value.trim()
            attr.value = valInput.value.trim()
            entity.setCustomAttributes(customAttrs)
            ctx.refreshActiveSection(type)
        }
        nameInput.addEventListener('change', saveAttr)
        valInput.addEventListener('change', saveAttr)

        row.querySelector('.btn-remove-attr').addEventListener('click', () => {
            customAttrs.splice(idx, 1)
            entity.setCustomAttributes(customAttrs)
            renderDetailsPanel(ctx)
            ctx.refreshActiveSection(type)
        })

        attrsListEl.appendChild(row)
    })

    const newNameInput = customMod.querySelector('#details-add-attr-name')
    const newValInput = customMod.querySelector('#details-add-attr-val')
    const addBtn = customMod.querySelector('#btn-details-add-attr')

    const handleAddAttr = () => {
        const aName = newNameInput.value.trim()
        const aVal = newValInput.value.trim()
        if (!aName) return
        entity.setCustomAttributes([...customAttrs, { name: aName, value: aVal }])
        renderDetailsPanel(ctx)
        ctx.refreshActiveSection(type)
    }

    addBtn.addEventListener('click', handleAddAttr)
    newNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })
    newValInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddAttr()
    })

    container.appendChild(customMod)
}

function renderExitsModule(container, entity, type, ctx) {
    if (type !== 'paragraph' || !(entity instanceof Paragraph)) return

    const exitsMod = document.createElement('section')
    exitsMod.className = 'border-b border-[#333338] p-3 space-y-2'
    const choices = entity.getChoices() || []

    exitsMod.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 min-w-0">
                <span class="text-teal-400 shrink-0">${getIconSvg('choice', 'w-3.5 h-3.5')}</span>
                <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide truncate">${t('details.paragraph_exits')}</span>
                <span class="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">${choices.length}</span>
            </div>
            <button id="btn-toggle-add-exit" type="button" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[11px] text-white font-medium cursor-pointer transition-colors flex items-center gap-1 shrink-0">
                <span>${t('details.add_exit')}</span>
            </button>
        </div>

        <div id="details-add-exit-form" class="hidden bg-[#18181b] border border-[#3f3f46] rounded p-2.5 space-y-2">
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.target_node')}</label>
                <select id="details-add-exit-target" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                </select>
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.choice_name')}</label>
                <input id="details-add-exit-name" type="text" placeholder="${t('details.choice_name_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
                <label class="block text-[10px] text-gray-400 uppercase font-semibold mb-1">${t('details.condition_text')} (${t('left_panel.condition_text_optional')})</label>
                <input id="details-add-exit-condition" type="text" placeholder="${t('details.condition_placeholder')}" class="w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div class="flex items-center justify-end gap-1.5 pt-1">
                <button id="btn-cancel-add-exit" type="button" class="px-2.5 py-1 bg-[#27272a] hover:bg-[#323238] rounded text-xs text-gray-300 cursor-pointer">${t('buttons.cancel')}</button>
                <button id="btn-submit-add-exit" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">${t('buttons.add')}</button>
            </div>
        </div>

        <div id="details-exits-list" class="space-y-2"></div>
    `

    const addExitForm = exitsMod.querySelector('#details-add-exit-form')
    const toggleAddBtn = exitsMod.querySelector('#btn-toggle-add-exit')
    const targetSelect = exitsMod.querySelector('#details-add-exit-target')
    const nameInput = exitsMod.querySelector('#details-add-exit-name')
    const condInput = exitsMod.querySelector('#details-add-exit-condition')
    const cancelBtn = exitsMod.querySelector('#btn-cancel-add-exit')
    const submitBtn = exitsMod.querySelector('#btn-submit-add-exit')

    const populateTargets = () => {
        const options = ctx.projectParagraphs
            .map(p => {
                const isSelf = p.getId() === entity.getId()
                const title = p.getTitle() || p.getId()
                return `<option value="${escapeHtml(p.getId())}">§ ${escapeHtml(title)}${isSelf ? ` ${t('details.this_paragraph')}` : ''}</option>`
            })
            .join('')
        targetSelect.innerHTML = options
        const otherP = ctx.projectParagraphs.find(p => p.getId() !== entity.getId())
        if (otherP) {
            targetSelect.value = otherP.getId()
        }
    }

    toggleAddBtn.addEventListener('click', () => {
        addExitForm.classList.toggle('hidden')
        if (!addExitForm.classList.contains('hidden')) {
            populateTargets()
            if (nameInput) {
                nameInput.value = ''
                nameInput.focus()
            }
            if (condInput) condInput.value = ''
        }
    })

    cancelBtn.addEventListener('click', () => {
        addExitForm.classList.add('hidden')
    })

    const handleAddExit = () => {
        const targetId = targetSelect.value
        if (!targetId) return
        const targetP = ctx.projectParagraphs.find(p => p.getId() === targetId)
        if (!targetP) return

        const choiceName = nameInput.value.trim() || t('details.default_jump_name')
        const condTextVal = condInput.value.trim()

        ctx.vm.createChoice(
            entity,
            targetP,
            choiceName,
            t('details.default_jump_name'),
            condTextVal
        )
        renderDetailsPanel(ctx)
        ctx.renderConnectionsList()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
        toast.success(
            t('toast.connection_created', {
                from: entity.getTitle() || entity.getId(),
                to: targetP.getTitle() || targetP.getId(),
            }),
            t('toast.element_created_title')
        )
    }

    submitBtn.addEventListener('click', handleAddExit)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })
    condInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddExit()
    })

    const exitsListContainer = exitsMod.querySelector('#details-exits-list')

    if (choices.length === 0) {
        exitsListContainer.innerHTML = `
            <div class="text-xs text-gray-500 italic py-2 text-center bg-[#18181b]/50 rounded border border-[#27272a] border-dashed" data-i18n="details.no_exits">
                ${t('details.no_exits')}
            </div>
        `
    } else {
        choices.forEach(choice => {
            const toId = choice.getToParagraphId()
            const toP = ctx.projectParagraphs.find(p => p.getId() === toId)
            const toTitle = toP ? toP.getTitle() || toP.getId() : toId || '?'
            const cond = choice.getCondition()
            const choiceCondText =
                cond instanceof TextCondition ? cond.getText() : cond ? cond.getSummary() : ''

            const card = document.createElement('div')
            card.className =
                'bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded p-2.5 space-y-2 transition-colors'

            const targetOptionsHtml = ctx.projectParagraphs
                .map(p => {
                    const isSelected = p.getId() === toId
                    const title = p.getTitle() || p.getId()
                    return `<option value="${escapeHtml(p.getId())}" ${isSelected ? 'selected' : ''}>§ ${escapeHtml(title)}</option>`
                })
                .join('')

            card.innerHTML = `
                <div class="flex items-center justify-between gap-1">
                    <span class="text-xs text-emerald-400 font-medium truncate flex items-center gap-1 min-w-0" title="${escapeHtml(toTitle)}">
                        <span class="text-blue-400 shrink-0 inline-flex items-center">${getIconSvg('arrow-right', 'w-3 h-3')}</span>
                        <span class="truncate">§ ${escapeHtml(toTitle)}</span>
                    </span>
                    <div class="flex items-center gap-1 shrink-0">
                        <button type="button" class="btn-inspect-exit p-1 text-gray-400 hover:text-blue-400 rounded cursor-pointer transition-colors" title="${t('details.open_choice_details')}">
                            ${getIconSvg('arrow-right', 'w-3 h-3')}
                        </button>
                        <button type="button" class="btn-delete-exit p-1 text-gray-400 hover:text-red-400 rounded cursor-pointer transition-colors" title="${t('buttons.delete')}">
                            ${getIconSvg('close', 'w-3 h-3')}
                        </button>
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.choice_name')}</label>
                    <input type="text" class="exit-name-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choice.getName())}" placeholder="${t('details.choice_name_placeholder')}" />
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.target_node')}</label>
                    <select class="exit-target-select w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                        ${targetOptionsHtml}
                    </select>
                </div>

                <div class="space-y-1">
                    <div class="flex items-center justify-between">
                        <label class="block text-[10px] text-gray-400 uppercase font-semibold">${t('details.condition_section')}</label>
                        <span class="text-[9px] text-amber-400 font-mono">${t('condition.type_text')}</span>
                    </div>
                    <input type="text" class="exit-condition-input w-full bg-[#27272a] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(choiceCondText)}" placeholder="${t('details.condition_placeholder')}" />
                </div>
            `

            const exitNameInput = card.querySelector('.exit-name-input')
            const exitTargetSelect = card.querySelector('.exit-target-select')
            const exitCondInput = card.querySelector('.exit-condition-input')
            const inspectBtn = card.querySelector('.btn-inspect-exit')
            const deleteBtn = card.querySelector('.btn-delete-exit')

            exitNameInput.addEventListener('input', () => {
                const newName = exitNameInput.value.trim()
                if (newName) {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })
            exitNameInput.addEventListener('blur', () => {
                const newName = exitNameInput.value.trim()
                if (!newName) {
                    exitNameInput.value = choice.getName()
                } else {
                    ctx.vm.updateChoiceDetails(choice, newName, exitCondInput.value)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                }
            })

            exitTargetSelect.addEventListener('change', () => {
                const newTargetId = exitTargetSelect.value
                if (newTargetId && newTargetId !== choice.getToParagraphId()) {
                    choice.setToParagraphId(newTargetId)
                    renderDetailsPanel(ctx)
                    ctx.renderConnectionsList()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.target_updated'))
                }
            })

            exitCondInput.addEventListener('input', () => {
                ctx.vm.updateChoiceDetails(choice, choice.getName(), exitCondInput.value)
                ctx.renderConnectionsList()
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
            })

            inspectBtn.addEventListener('click', () => {
                ctx.selectEntity(choice, 'choice', entity)
            })

            deleteBtn.addEventListener('click', () => {
                if (
                    confirm(
                        t('context_menu.confirm_delete', {
                            name: choice.getName() || choice.getId(),
                        })
                    )
                ) {
                    ctx.vm.deleteChoice(choice.getId(), ctx.projectParagraphs)
                    renderDetailsPanel(ctx)
                    ctx.renderConnectionsList()
                    ctx.renderParagraphsList()
                    renderHistoryBar(ctx)
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    toast.success(t('toast.connection_deleted'))
                }
            })

            exitsListContainer.appendChild(card)
        })
    }

    container.appendChild(exitsMod)
}

function renderQuickActionsModule(container, item, type, ctx) {
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span>
        </button>
    `
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        ctx.vm.setActiveMainView('graph')
        ctx.updateMainWorkspaceUI()
        const targetId = item.id
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.focusOnElement(targetId)
            requestAnimationFrame(() => {
                if (ctx.storyGraphInstance) ctx.storyGraphInstance.focusOnElement(targetId)
            })
        }
        if (type === 'scene') {
            ctx.renderScenesList()
        }
    })
    container.appendChild(actionsMod)
}
