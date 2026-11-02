/**
 * Shared Pure HTML Templates for Read-Only Details Panels
 */

import { getIconSvg } from '../../../../dist/Utils/icons.js'
import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml, getTypeBadgeColor } from '../../common/htmlTemplates.js'
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'

/**
 * Pure HTML template for Header section (type badge and ID).
 */
export function renderEntityHeaderHtml({ type, typeLabel, id, fallbackId = '' }) {
    const typeTitle = t('details.type') || 'Typ'
    const displayId = id || fallbackId
    return `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${escapeHtml(typeTitle)}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${escapeHtml(typeLabel)}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(displayId)}</div>
    `
}

/**
 * Pure HTML template for Name section.
 */
export function renderEntityNameHtml({ entityName, label, displayId = 'details-name-display' }) {
    const nameLabel = label || t('details.name') || 'Nazwa'
    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide mb-1">${escapeHtml(nameLabel)}</label>
        <div id="${escapeHtml(displayId)}" class="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white font-medium select-text">
            ${escapeHtml(entityName)}
        </div>
    `
}

/**
 * Pure HTML template for Summary & Narrative section.
 */
export function renderEntitySummaryHtml({
    currentSummary,
    currentNarrative,
    summaryLabel,
    noSummaryText,
    narrativeLabel,
}) {
    const sLabel = summaryLabel || t('details.summary') || 'Streszczenie'
    const noSumText = noSummaryText || t('details.no_summary') || 'Brak streszczenia'
    const nLabel = narrativeLabel || t('details.narrative_description') || 'Opis narracyjny'

    return `
        <div class="space-y-1">
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(sLabel)}</label>
            ${
                currentSummary
                    ? `<div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#d4d4d8] leading-relaxed whitespace-pre-wrap select-text">${escapeHtml(currentSummary)}</div>`
                    : `<div class="text-xs text-gray-500 italic py-1">${escapeHtml(noSumText)}</div>`
            }
        </div>
        ${
            currentNarrative && currentNarrative !== currentSummary
                ? `
            <div class="space-y-1 pt-1">
                <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(nLabel)}</label>
                <div class="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-xs text-[#a1a1aa] leading-relaxed whitespace-pre-wrap select-text max-h-48 overflow-y-auto">${escapeHtml(currentNarrative)}</div>
            </div>
            `
                : ''
        }
    `
}

/**
 * Pure HTML template for Tags section.
 */
export function renderTagsSectionHtml({
    tagsCount,
    tagsChipsHtml,
    tagsLabel,
    noTagsText,
    listId = 'details-tags-list',
}) {
    const tLabel = tagsLabel || t('details.tags') || 'Tagi'
    const noTText = noTagsText || t('details.no_tags') || 'Brak tagów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(tLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${tagsCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-wrap gap-1 min-h-[20px]">
            ${tagsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTText)}</span>` : tagsChipsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Base Stat item.
 */
export function renderBaseStatItemHtml(
    stName,
    stVal,
    { icon = 'stat', accentColor = 'text-amber-400', badgeColor = 'text-amber-300' } = {}
) {
    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="${accentColor} shrink-0 inline-flex items-center">${getIconSvg(icon, 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(stName)}</span>
            </span>
            <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] ${badgeColor} shrink-0">
                ${escapeHtml(String(stVal))}
            </span>
        </div>
    `
}

/**
 * Pure HTML template for Base Stats section.
 */
export function renderBaseStatsSectionHtml({
    statsCount,
    statsItemsHtml,
    statsLabel,
    noTraitsText,
    listId = 'details-stats-list',
    icon = 'stat',
    accentColor = 'text-amber-400',
}) {
    const sLabel = statsLabel || t('details.traits') || 'Cechy'
    const noTText = noTraitsText || t('details.no_traits') || 'Brak zdefiniowanych cech'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="${accentColor} inline-flex items-center">${getIconSvg(icon, 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(sLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${statsCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-col gap-1.5 min-h-[20px]">
            ${statsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noTText)}</span>` : statsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Parameter item (with formula evaluation support).
 */
export function renderParameterItemHtml(
    p,
    charStatsMap,
    { icon = 'parameter', accentColor = 'text-rose-400', badgeColor = 'text-rose-300' } = {}
) {
    const pName = typeof p.getName === 'function' ? p.getName() : p.name || ''
    const pMode = typeof p.getMode === 'function' ? p.getMode() : p.mode || 'direct'
    let valueDisplay = ''

    if (pMode === 'formula') {
        const formula = typeof p.getFormula === 'function' ? p.getFormula() : p.formula || ''
        const evalRes = evaluateFormula(formula, charStatsMap)
        const calcText = evalRes.result !== null ? ` (${evalRes.result})` : ''
        valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-rose-950/60 ${badgeColor} font-mono border border-rose-500/40 font-bold truncate max-w-[150px]" title="${escapeHtml(formula)}${calcText}">= ${escapeHtml(formula)}${calcText ? `<span class="text-emerald-400 font-semibold">${calcText}</span>` : ''}</span>`
    } else {
        const pVal = typeof p.getValue === 'function' ? p.getValue() : (p.value ?? '')
        valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] ${badgeColor} shrink-0">${escapeHtml(String(pVal))}</span>`
    }

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="${accentColor} shrink-0 inline-flex items-center">${getIconSvg(icon, 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(pName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Vitals & Parameters section.
 */
export function renderVitalsSectionHtml({
    paramsCount,
    paramsItemsHtml,
    vitalsLabel,
    noParamsText,
    listId = 'details-params-list',
    icon = 'parameter',
    accentColor = 'text-rose-400',
}) {
    const vLabel = vitalsLabel || t('details.parameters') || 'Parametry'
    const noPText = noParamsText || t('details.no_parameters') || 'Brak przypisanych parametrów'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="${accentColor} inline-flex items-center">${getIconSvg(icon, 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(vLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${paramsCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-col gap-1.5 min-h-[20px]">
            ${paramsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noPText)}</span>` : paramsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Skill item.
 */
export function renderSkillItemHtml(
    sk,
    { icon = 'skill', accentColor = 'text-blue-400', badgeColor = 'text-blue-300' } = {}
) {
    const skName = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
    const skMode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'
    let valueDisplay = ''

    if (skMode === 'stat_mod') {
        const statName = typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
        const mod = typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || '+0'
        valueDisplay = `<span class="px-2 py-0.5 rounded text-[10px] bg-blue-950/60 ${badgeColor} font-mono border border-blue-500/40 font-bold truncate max-w-[140px]">${escapeHtml(statName)} ${escapeHtml(mod)}</span>`
    } else {
        const skVal = typeof sk.getValue === 'function' ? sk.getValue() : (sk.value ?? '')
        valueDisplay = `<span class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#202023] border border-[#3f3f46] ${badgeColor} shrink-0">${escapeHtml(String(skVal))}</span>`
    }

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <span class="text-[#d4d4d8] font-medium flex items-center gap-1.5 min-w-0 truncate">
                <span class="${accentColor} shrink-0 inline-flex items-center">${getIconSvg(icon, 'w-3 h-3')}</span>
                <span class="truncate">${escapeHtml(skName)}</span>
            </span>
            <div class="flex items-center gap-1.5 shrink-0">
                ${valueDisplay}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Skills section.
 */
export function renderSkillsSectionHtml({
    skillsCount,
    skillsItemsHtml,
    skillsLabel,
    noSkillsText,
    listId = 'details-skills-list',
    icon = 'skill',
    accentColor = 'text-blue-400',
}) {
    const sLabel = skillsLabel || t('details.skills') || 'Umiejętności'
    const noSText = noSkillsText || t('details.no_skills') || 'Brak przypisanych umiejętności'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="${accentColor} inline-flex items-center">${getIconSvg(icon, 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(sLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${skillsCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-col gap-1.5 min-h-[20px]">
            ${skillsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noSText)}</span>` : skillsItemsHtml}
        </div>
    `
}

/**
 * Pure HTML template for Custom Attributes section.
 */
export function renderCustomAttributesSectionHtml({
    attrsCount,
    attrsRowsHtml,
    attributesLabel,
    noAttrsText,
    listId = 'details-custom-attrs-list',
}) {
    const aLabel = attributesLabel || t('details.custom_attributes') || 'Atrybuty niestandardowe'
    const noAText =
        noAttrsText || t('details.no_custom_attributes') || 'Brak atrybutów niestandardowych'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${escapeHtml(aLabel)}</span>
            <span class="text-[10px] text-gray-500 font-mono">${attrsCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-col gap-1.5 min-h-[20px]">
            ${attrsCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noAText)}</span>` : attrsRowsHtml}
        </div>
    `
}

/**
 * Pure HTML template for a single Feature / Trait item.
 */
export function renderFeatureItemHtml(
    f,
    { icon = 'feature', accentColor = 'text-purple-400' } = {}
) {
    const fName = typeof f.getName === 'function' ? f.getName() : f.name || ''
    const rawVal =
        typeof f.getValue === 'function' ? f.getValue() : f.value !== undefined ? f.value : null
    const hasValue = rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== ''
    const descText =
        typeof f.getDescription === 'function'
            ? f.getDescription()?.getText?.() || f.getDescription()?.getSummary?.() || ''
            : f.description?.text || f.description?.summary || ''

    return `
        <div class="flex items-center justify-between bg-[#18181b] px-2.5 py-1.5 rounded border border-[#27272a] text-xs">
            <div class="min-w-0 flex flex-col flex-1 pr-2">
                <span class="text-[#d4d4d8] font-medium flex items-center justify-between gap-1.5 truncate">
                    <span class="flex items-center gap-1.5 truncate">
                        <span class="${accentColor} shrink-0 inline-flex items-center">${getIconSvg(icon, 'w-3 h-3')}</span>
                        <span class="truncate">${escapeHtml(fName)}</span>
                    </span>
                    ${hasValue ? `<span class="text-gray-400 font-normal shrink-0"><span class="text-gray-500 font-mono mr-1">:</span><span class="text-white font-medium">${escapeHtml(String(rawVal))}</span></span>` : ''}
                </span>
                ${descText ? `<span class="text-[10px] text-gray-400 truncate pl-4.5 italic" title="${escapeHtml(descText)}">${escapeHtml(descText)}</span>` : ''}
            </div>
        </div>
    `
}

/**
 * Pure HTML template for Features section.
 */
export function renderFeaturesSectionHtml({
    featuresCount,
    featuresItemsHtml,
    featuresLabel,
    noFeaturesText,
    listId = 'details-features-list',
    icon = 'feature',
    accentColor = 'text-purple-400',
}) {
    const fLabel = featuresLabel || t('details.features') || 'Przymioty specjalne'
    const noFText = noFeaturesText || t('details.no_features') || 'Brak przymiotów specjalnych'

    return `
        <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide flex items-center gap-1.5">
                <span class="${accentColor} inline-flex items-center">${getIconSvg(icon, 'w-3.5 h-3.5')}</span>
                <span>${escapeHtml(fLabel)}</span>
            </span>
            <span class="text-[10px] text-gray-500 font-mono">${featuresCount}</span>
        </div>
        <div id="${escapeHtml(listId)}" class="flex flex-col gap-1.5 min-h-[20px]">
            ${featuresCount === 0 ? `<span class="text-xs text-gray-500 italic py-0.5">${escapeHtml(noFText)}</span>` : featuresItemsHtml}
        </div>
    `
}
