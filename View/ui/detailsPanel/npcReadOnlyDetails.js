import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { DEFAULT_TAG_COLOR } from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml, getTypeBadgeColor } from '../common/htmlTemplates.js'
import { getAvatarById } from '../common/npcAvatars.js'
import { evaluateFormula } from '../modals/npc/formulaEvaluator.js'
import { openNpcModal } from '../modals/npc/npcModal.js'
import { buildStatsMap, createSection } from './common/domHelpers.js'
import { renderFilesModule } from './modules/entityConfigModules.js'

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
    const openModalFn = options => {
        if (typeof ctx.openNpcModal === 'function') {
            ctx.openNpcModal(options)
        } else {
            openNpcModal(options)
        }
    }

    // 1. Header Module
    const typeKey = `details.type_${type}`
    const typeLabel = t(typeKey) !== typeKey ? t(typeKey) : type.toUpperCase()

    const headerMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    )
    container.appendChild(headerMod)

    // 2. Action Module (Top Edit Button)
    const editBtnText =
        type === 'template' ? t('details.edit_template') : t('details.edit_character')
    const editActionMod = createSection(
        'border-b border-[#333338] p-3',
        `
        <button id="btn-details-edit-npc" type="button" class="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
            <span class="shrink-0 inline-flex items-center">${getIconSvg('edit', 'w-4 h-4')}</span>
            <span>${escapeHtml(editBtnText)}</span>
        </button>
    `
    )
    editActionMod.querySelector('#btn-details-edit-npc').addEventListener('click', () => {
        openModalFn({ mode: type, editEntity: entity })
    })
    container.appendChild(editActionMod)

    // 3. Avatar Module (Read-only)
    const avatarId =
        (typeof entity.getAvatar === 'function' ? entity.getAvatar() : entity.avatar) || 'warrior'
    const avatar = getAvatarById(avatarId)

    const avatarMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
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
    )
    container.appendChild(avatarMod)

    // 4. Name Module (Read-only)
    const entityName = (typeof entity.getName === 'function' ? entity.getName() : item.name) || ''
    const nameMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <div id="details-name-display" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
            ${escapeHtml(entityName)}
        </div>
    `
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
        `
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
    )
    container.appendChild(descMod)
    renderFilesModule(container, entity, ctx)

    // 6. Tags Module (Read-only)
    const currentTags =
        typeof entity.getTags === 'function' ? entity.getTags() || [] : entity.tags || []
    const tagsMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
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
    )
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
            ${statsList.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_traits')}</span>` : ''}
        </div>
    `
    )
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
    const charStatsMap = buildStatsMap(statsList)

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
    `
    )
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
    `
    )
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
    `
    )
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
    const customMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.custom_attributes')}</span>
            <span class="text-[10px] text-gray-500 font-mono">${customAttrs.length}</span>
        </div>
        <div id="details-custom-attrs-list" class="flex flex-col gap-1.5 min-h-[20px]">
            ${customAttrs.length === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${t('details.no_custom_attributes')}</span>` : ''}
        </div>
    `
    )
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
    const editLabel = type === 'template' ? t('details.edit_template') : t('details.edit_character')
    const actionsMod = createSection(
        'p-3 space-y-2',
        `
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
    )

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
