/**
 * @fileoverview RPG configuration modules for Stats, Traits, Parameters, and Skills.
 * Provides pure HTML template renderers and DOM interaction handlers with live formula evaluation,
 * mode toggling, and complete i18n and XSS safety.
 *
 * @module rpgConfigModules
 */

import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../common/htmlTemplates.js'
import { evaluateFormula } from '../../modals/npc/formulaEvaluator.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Renders the HTML template for stat/trait value editing.
 *
 * @param {string | number} [value='']
 * @returns {string} HTML string
 */
export function renderStatValueModuleHtml(value = '') {
    const safeValue = escapeHtml(String(value ?? ''))
    const labelText = escapeHtml(t('details.stat_value'))
    const placeholderText = escapeHtml(t('details.trait_value'))

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${labelText}</label>
        <input id="details-stat-value-input" type="text" value="${safeValue}" placeholder="${placeholderText}" aria-label="${labelText}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
    `
}

/**
 * Renders base stat / trait value editing module in details panel.
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderStatValueModule(container, entity, type, ctx = {}, onRefreshDetails = null) {
    if (!container || (type !== 'stat' && type !== 'trait')) return null
    if (!entity || typeof entity.getValue !== 'function' || typeof entity.setValue !== 'function') {
        return null
    }

    const valMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        renderStatValueModuleHtml(entity.getValue() ?? '')
    )

    const input = valMod.querySelector('#details-stat-value-input')
    const saveValue = () => {
        if (!input) return
        const val = input.value.trim()
        entity.setValue(val)
        if (typeof renderHistoryBar === 'function') {
            renderHistoryBar(ctx, onRefreshDetails)
        }
        ctx?.refreshActiveSection?.(type)
    }

    input?.addEventListener('change', saveValue)
    input?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveValue()
            input.blur()
        }
    })

    container.appendChild(valMod)
    return valMod
}

/**
 * Renders mode toggle buttons HTML for parameter configuration.
 *
 * @param {string} [currentMode='direct']
 * @returns {string} HTML string
 */
export function renderParameterModeButtonsHtml(currentMode = 'direct') {
    const isDirect = currentMode === 'direct'
    const isFormula = currentMode === 'formula'

    const directClass = isDirect
        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
        : 'text-gray-400 hover:text-white'
    const formulaClass = isFormula
        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50'
        : 'text-gray-400 hover:text-white'

    return `
        <div class="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-param-mode-direct" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${directClass}">
                ${escapeHtml(t('details.mode_direct'))}
            </button>
            <button type="button" id="btn-param-mode-formula" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${formulaClass}">
                ${escapeHtml(t('details.mode_formula'))}
            </button>
        </div>`
}

/**
 * Renders the direct value input block HTML for parameters.
 *
 * @param {string | number} [currentValue='']
 * @param {boolean} [isVisible=true]
 * @returns {string} HTML string
 */
export function renderParameterDirectBlockHtml(currentValue = '', isVisible = true) {
    const safeValue = escapeHtml(String(currentValue ?? ''))
    const hiddenClass = isVisible ? '' : 'hidden'
    const labelText = escapeHtml(t('details.parameter_value'))

    return `
        <div id="param-direct-block" class="${hiddenClass} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${labelText}</label>
            <input id="details-param-val-input" type="text" value="${safeValue}" placeholder="100" aria-label="${labelText}"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
        </div>`
}

/**
 * Renders the formula input block HTML and evaluation preview for parameters.
 *
 * @param {string} [currentFormula='']
 * @param {{ result: number | null, error?: string }} [evalRes={ result: null }]
 * @param {boolean} [isVisible=false]
 * @returns {string} HTML string
 */
export function renderParameterFormulaBlockHtml(
    currentFormula = '',
    evalRes = { result: null },
    isVisible = false
) {
    const safeFormula = escapeHtml(currentFormula ?? '')
    const hiddenClass = isVisible ? '' : 'hidden'
    const labelText = escapeHtml(t('details.parameter_formula'))
    const previewLabel = escapeHtml(t('details.calculated_preview'))

    const hasResult = evalRes && evalRes.result !== null
    const resultText = hasResult
        ? escapeHtml(String(evalRes.result))
        : escapeHtml(evalRes?.error || '—')
    const resultClass = hasResult ? 'text-emerald-400' : 'text-amber-400'

    const placeholderText = escapeHtml(t('npc.vital_formula_placeholder'))

    return `
        <div id="param-formula-block" class="${hiddenClass} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${labelText}</label>
            <input id="details-param-formula-input" type="text" value="${safeFormula}" placeholder="${placeholderText}" aria-label="${labelText}"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
            <div class="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                <span>${previewLabel}:</span>
                <span id="param-formula-preview" class="font-mono font-bold ${resultClass}">${resultText}</span>
            </div>
        </div>`
}

/**
 * Renders the full parameter configuration inner HTML.
 *
 * @param {string} [currentMode='direct']
 * @param {string | number} [currentValue='']
 * @param {string} [currentFormula='']
 * @param {{ result: number | null, error?: string }} [evalRes={ result: null }]
 * @returns {string} HTML string
 */
export function renderParameterConfigModuleHtml(
    currentMode = 'direct',
    currentValue = '',
    currentFormula = '',
    evalRes = { result: null }
) {
    const modeLabel = escapeHtml(t('details.parameter_mode'))
    const isDirect = currentMode === 'direct'
    const isFormula = currentMode === 'formula'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${modeLabel}</label>
        ${renderParameterModeButtonsHtml(currentMode)}
        ${renderParameterDirectBlockHtml(currentValue, isDirect)}
        ${renderParameterFormulaBlockHtml(currentFormula, evalRes, isFormula)}
    `
}

/**
 * Renders parameter configuration module (Direct value vs Formula mode).
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderParameterConfigModule(
    container,
    entity,
    type,
    ctx = {},
    onRefreshDetails = null
) {
    if (!container || type !== 'parameter') return null
    if (!entity || typeof entity.getMode !== 'function' || typeof entity.setMode !== 'function') {
        return null
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentMode = entity.getMode() || 'direct'
    const currentValue = typeof entity.getValue === 'function' ? entity.getValue() : ''
    const currentFormula = typeof entity.getFormula === 'function' ? entity.getFormula() : ''

    const statsMap = buildStatsMap(ctx?.projectStats || [])
    const evalRes = evaluateFormula(currentFormula, statsMap)

    const paramConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderParameterConfigModuleHtml(currentMode, currentValue, currentFormula, evalRes)
    )

    const btnDirect = paramConfigMod.querySelector('#btn-param-mode-direct')
    const btnFormula = paramConfigMod.querySelector('#btn-param-mode-formula')
    const valInput = paramConfigMod.querySelector('#details-param-val-input')
    const formulaInput = paramConfigMod.querySelector('#details-param-formula-input')
    const formulaPreview = paramConfigMod.querySelector('#param-formula-preview')

    btnDirect?.addEventListener('click', () => {
        entity.setMode('direct')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    btnFormula?.addEventListener('click', () => {
        entity.setMode('formula')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    if (valInput) {
        const saveVal = () => {
            if (typeof entity.setValue === 'function') entity.setValue(valInput.value.trim())
            ctx?.refreshActiveSection?.(type)
        }
        valInput.addEventListener('change', saveVal)
        valInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveVal()
                valInput.blur()
            }
        })
    }

    if (formulaInput) {
        formulaInput.addEventListener('input', () => {
            const formVal = formulaInput.value.trim()
            const res = evaluateFormula(formVal, statsMap)
            if (formulaPreview) {
                const hasRes = res.result !== null
                formulaPreview.textContent = hasRes ? String(res.result) : res.error || '—'
                formulaPreview.className = `font-mono font-bold ${hasRes ? 'text-emerald-400' : 'text-amber-400'}`
            }
        })

        const saveFormula = () => {
            const formVal = formulaInput.value.trim()
            if (typeof entity.setFormula === 'function') entity.setFormula(formVal)
            ctx?.refreshActiveSection?.(type)
        }
        formulaInput.addEventListener('change', saveFormula)
        formulaInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveFormula()
                formulaInput.blur()
            }
        })
    }

    container.appendChild(paramConfigMod)
    return paramConfigMod
}

/**
 * Renders mode toggle buttons HTML for skill configuration.
 *
 * @param {string} [currentMode='direct']
 * @returns {string} HTML string
 */
export function renderSkillModeButtonsHtml(currentMode = 'direct') {
    const isDirect = currentMode === 'direct'
    const isStat = currentMode === 'stat_mod'

    const directClass = isDirect
        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50'
        : 'text-gray-400 hover:text-white'
    const statClass = isStat
        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/50'
        : 'text-gray-400 hover:text-white'

    return `
        <div class="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-skill-mode-direct" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${directClass}">
                ${escapeHtml(t('details.mode_direct'))}
            </button>
            <button type="button" id="btn-skill-mode-stat" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${statClass}">
                ${escapeHtml(t('details.mode_stat_mod'))}
            </button>
        </div>`
}

/**
 * Renders direct value input block HTML for skills.
 *
 * @param {string} [currentValue='']
 * @param {boolean} [isVisible=true]
 * @returns {string} HTML string
 */
export function renderSkillDirectBlockHtml(currentValue = '', isVisible = true) {
    const safeValue = escapeHtml(String(currentValue ?? ''))
    const hiddenClass = isVisible ? '' : 'hidden'
    const labelText = escapeHtml(t('details.skill_value'))

    return `
        <div id="skill-direct-block" class="${hiddenClass} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${labelText}</label>
            <input id="details-skill-val-input" type="text" value="${safeValue}" placeholder="+2" aria-label="${labelText}"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
        </div>`
}

/**
 * Renders option tags for traits/stats in skill configuration.
 *
 * @param {Array<{ getName?: () => string, name?: string }>} [projectStats=[]]
 * @param {string} [currentStat='']
 * @returns {string} HTML string
 */
export function renderSkillStatOptionsHtml(projectStats = [], currentStat = '') {
    const defaultOption = `<option value="">-- ${escapeHtml(t('details.traits'))} --</option>`
    const statOptions = (Array.isArray(projectStats) ? projectStats : [])
        .map(st => {
            const name = typeof st?.getName === 'function' ? st.getName() : st?.name || ''
            const safeName = escapeHtml(name)
            const isSelected = name === currentStat ? 'selected' : ''
            return `<option value="${safeName}" ${isSelected}>${safeName}</option>`
        })
        .join('')

    return defaultOption + statOptions
}

/**
 * Renders trait selector and modifier input block HTML for skills.
 *
 * @param {string} [currentStat='']
 * @param {string} [currentMod='+0']
 * @param {Array<{ getName?: () => string, name?: string }>} [projectStats=[]]
 * @param {boolean} [isVisible=false]
 * @returns {string} HTML string
 */
export function renderSkillStatBlockHtml(
    currentStat = '',
    currentMod = '+0',
    projectStats = [],
    isVisible = false
) {
    const safeMod = escapeHtml(String(currentMod ?? '+0'))
    const hiddenClass = isVisible ? '' : 'hidden'
    const statLabel = escapeHtml(t('details.skill_stat'))
    const modLabel = escapeHtml(t('details.skill_mod'))

    return `
        <div id="skill-stat-block" class="${hiddenClass} space-y-2 pt-1">
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${statLabel}</label>
                <select id="details-skill-stat-select" aria-label="${statLabel}" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                    ${renderSkillStatOptionsHtml(projectStats, currentStat)}
                </select>
            </div>
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${modLabel}</label>
                <input id="details-skill-mod-input" type="text" value="${safeMod}" placeholder="+2" aria-label="${modLabel}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
            </div>
        </div>`
}

/**
 * Renders the full skill configuration inner HTML.
 *
 * @param {string} [currentMode='direct']
 * @param {string} [currentValue='']
 * @param {string} [currentStat='']
 * @param {string} [currentMod='+0']
 * @param {Array<{ getName?: () => string, name?: string }>} [projectStats=[]]
 * @returns {string} HTML string
 */
export function renderSkillConfigModuleHtml(
    currentMode = 'direct',
    currentValue = '',
    currentStat = '',
    currentMod = '+0',
    projectStats = []
) {
    const modeLabel = escapeHtml(t('details.skill_mode'))
    const isDirect = currentMode === 'direct'
    const isStat = currentMode === 'stat_mod'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${modeLabel}</label>
        ${renderSkillModeButtonsHtml(currentMode)}
        ${renderSkillDirectBlockHtml(currentValue, isDirect)}
        ${renderSkillStatBlockHtml(currentStat, currentMod, projectStats, isStat)}
    `
}

/**
 * Renders skill configuration module (Direct value vs Stat modifier mode).
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null} The created section element or null
 */
export function renderSkillConfigModule(
    container,
    entity,
    type,
    ctx = {},
    onRefreshDetails = null
) {
    if (!container || type !== 'skill') return null
    if (!entity || typeof entity.getMode !== 'function' || typeof entity.setMode !== 'function') {
        return null
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentMode = entity.getMode() || 'direct'
    const currentValue = typeof entity.getValue === 'function' ? entity.getValue() : ''
    const currentStat = typeof entity.getStatName === 'function' ? entity.getStatName() : ''
    const currentMod = typeof entity.getModifier === 'function' ? entity.getModifier() : '+0'
    const projectStats = ctx?.projectStats || []

    const skillConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderSkillConfigModuleHtml(
            currentMode,
            currentValue,
            currentStat,
            currentMod,
            projectStats
        )
    )

    const btnDirect = skillConfigMod.querySelector('#btn-skill-mode-direct')
    const btnStat = skillConfigMod.querySelector('#btn-skill-mode-stat')
    const valInput = skillConfigMod.querySelector('#details-skill-val-input')
    const statSelect = skillConfigMod.querySelector('#details-skill-stat-select')
    const modInput = skillConfigMod.querySelector('#details-skill-mod-input')

    btnDirect?.addEventListener('click', () => {
        entity.setMode('direct')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    btnStat?.addEventListener('click', () => {
        entity.setMode('stat_mod')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    if (valInput) {
        const saveVal = () => {
            if (typeof entity.setValue === 'function') entity.setValue(valInput.value.trim())
            ctx?.refreshActiveSection?.(type)
        }
        valInput.addEventListener('change', saveVal)
        valInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveVal()
                valInput.blur()
            }
        })
    }

    if (statSelect) {
        statSelect.addEventListener('change', () => {
            if (typeof entity.setStatName === 'function') entity.setStatName(statSelect.value)
            ctx?.refreshActiveSection?.(type)
        })
    }

    if (modInput) {
        const saveMod = () => {
            if (typeof entity.setModifier === 'function') entity.setModifier(modInput.value.trim())
            ctx?.refreshActiveSection?.(type)
        }
        modInput.addEventListener('change', saveMod)
        modInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveMod()
                modInput.blur()
            }
        })
    }

    container.appendChild(skillConfigMod)
    return skillConfigMod
}
