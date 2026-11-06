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
 * Renders mode toggle buttons HTML for stat/trait configuration.
 *
 * @param {string} [currentKind='numeric']
 * @returns {string} HTML string
 */
export function renderStatKindButtonsHtml(currentKind = 'numeric') {
    const isNumeric = currentKind !== 'list'
    const isList = currentKind === 'list'

    const numericClass = isNumeric
        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
        : 'text-gray-400 hover:text-white'
    const listClass = isList
        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
        : 'text-gray-400 hover:text-white'

    return `
        <div class="grid grid-cols-2 gap-1.5 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-stat-kind-numeric" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${numericClass}">
                ${escapeHtml(t('details.stat_type_numeric') || 'Numeryczna')}
            </button>
            <button type="button" id="btn-stat-kind-list" class="py-1 px-2 rounded text-xs font-medium cursor-pointer transition-colors ${listClass}">
                ${escapeHtml(t('details.stat_type_list') || 'Lista wartości')}
            </button>
        </div>`
}

/**
 * Renders the numeric bounds and default value block HTML for stats.
 *
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @param {string | number} [defaultValue='']
 * @param {boolean} [isVisible=true]
 * @returns {string} HTML string
 */
export function renderStatNumericBlockHtml(
    minValue = null,
    maxValue = null,
    defaultValue = '',
    isVisible = true
) {
    const hiddenClass = isVisible ? '' : 'hidden'
    const safeMin = minValue !== null && minValue !== undefined ? escapeHtml(String(minValue)) : ''
    const safeMax = maxValue !== null && maxValue !== undefined ? escapeHtml(String(maxValue)) : ''
    const safeVal =
        defaultValue !== null && defaultValue !== undefined ? escapeHtml(String(defaultValue)) : ''
    const minLabel = escapeHtml(t('details.stat_min') || 'Wartość minimalna (Min)')
    const maxLabel = escapeHtml(t('details.stat_max') || 'Wartość maksymalna (Max)')
    const defLabel = escapeHtml(t('details.stat_value') || 'Wartość cechy')

    return `
        <div id="stat-numeric-block" class="${hiddenClass} space-y-2 pt-1">
            <div class="grid grid-cols-2 gap-2">
                <div class="space-y-1">
                    <label class="block text-[11px] text-gray-400">${minLabel}</label>
                    <input id="details-stat-min-input" type="number" value="${safeMin}" placeholder="Brak" aria-label="${minLabel}"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                </div>
                <div class="space-y-1">
                    <label class="block text-[11px] text-gray-400">${maxLabel}</label>
                    <input id="details-stat-max-input" type="number" value="${safeMax}" placeholder="Brak" aria-label="${maxLabel}"
                        class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                </div>
            </div>
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${defLabel}</label>
                <input id="details-stat-value-input" type="text" value="${safeVal}" placeholder="np. 10" aria-label="${defLabel}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                <div id="stat-val-error-msg" class="text-[10px] text-rose-400 hidden"></div>
            </div>
        </div>`
}

/**
 * Renders the options list editor and default value block HTML for list-based stats.
 *
 * @param {Array<string>} [options=[]]
 * @param {string | number} [defaultValue='']
 * @param {boolean} [isVisible=false]
 * @returns {string} HTML string
 */
export function renderStatListBlockHtml(options = [], defaultValue = '', isVisible = false) {
    const hiddenClass = isVisible ? '' : 'hidden'
    const optsList = Array.isArray(options) ? options : []
    const optionsLabel = escapeHtml(t('details.stat_options') || 'Dozwolone wartości')
    const placeholderText = escapeHtml(t('details.stat_option_placeholder') || 'Nowa wartość...')
    const defLabel = escapeHtml(t('details.stat_default_value') || 'Wartość domyślna')

    const optionsListHtml =
        optsList.length === 0
            ? `<p class="italic text-gray-500 text-[11px] py-1 select-none">${escapeHtml(t('details.stat_no_options') || 'Brak zdefiniowanych wartości na liście')}</p>`
            : `<div class="space-y-1 max-h-36 overflow-y-auto">
            ${optsList
                .map(
                    (opt, idx) => `
                <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-2 py-1 rounded text-xs text-zinc-200">
                    <span class="truncate">${escapeHtml(opt)}</span>
                    <button type="button" class="btn-remove-stat-option text-gray-400 hover:text-rose-400 p-0.5 cursor-pointer inline-flex items-center" data-option-index="${idx}" title="${escapeHtml(t('buttons.delete') || 'Usuń')}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `
                )
                .join('')}
           </div>`

    const defaultSelectOptions = `
        <option value="">-- ${escapeHtml(t('details.stat_default_value') || 'Wartość domyślna')} --</option>
        ${optsList
            .map(
                opt =>
                    `<option value="${escapeHtml(opt)}" ${opt === defaultValue ? 'selected' : ''}>${escapeHtml(opt)}</option>`
            )
            .join('')}
    `

    return `
        <div id="stat-list-block" class="${hiddenClass} space-y-2 pt-1">
            <label class="block text-[11px] text-gray-400">${optionsLabel}</label>
            ${optionsListHtml}
            <div class="flex gap-1 pt-0.5">
                <input id="details-stat-new-option-input" type="text" placeholder="${placeholderText}"
                    class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500" />
                <button id="btn-details-stat-add-option" type="button"
                    class="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                    + ${escapeHtml(t('buttons.add') || 'Dodaj')}
                </button>
            </div>
            <div class="space-y-1 pt-1">
                <label class="block text-[11px] text-gray-400">${defLabel}</label>
                <select id="details-stat-default-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500">
                    ${defaultSelectOptions}
                </select>
            </div>
        </div>`
}

/**
 * Renders full stat/trait configuration inner HTML.
 *
 * @param {string} [kind='numeric']
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @param {string | number} [defaultValue='']
 * @param {Array<string>} [options=[]]
 * @returns {string} HTML string
 */
export function renderStatConfigModuleHtml(
    kind = 'numeric',
    minValue = null,
    maxValue = null,
    defaultValue = '',
    options = []
) {
    const isNumeric = kind !== 'list'
    const isList = kind === 'list'
    const typeLabel = escapeHtml(t('details.stat_type') || 'Typ cechy')

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${typeLabel}</label>
        ${renderStatKindButtonsHtml(kind)}
        ${renderStatNumericBlockHtml(minValue, maxValue, defaultValue, isNumeric)}
        ${renderStatListBlockHtml(options, defaultValue, isList)}
    `
}

/**
 * Renders the HTML template for stat/trait value editing (maintains backward compatibility).
 *
 * @param {string | number} [value='']
 * @returns {string} HTML string
 */
export function renderStatValueModuleHtml(
    valueOrKind = '',
    minValue = null,
    maxValue = null,
    defaultValue = '',
    options = []
) {
    if (
        valueOrKind !== 'numeric' &&
        valueOrKind !== 'list' &&
        minValue === null &&
        maxValue === null &&
        (!options || options.length === 0)
    ) {
        return renderStatConfigModuleHtml('numeric', null, null, valueOrKind, [])
    }
    return renderStatConfigModuleHtml(valueOrKind, minValue, maxValue, defaultValue, options)
}

/**
 * Renders base stat / trait configuration module in details panel.
 * Supports numeric bounds (min, max) and discrete options list with default value.
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

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentKind = typeof entity.getStatKind === 'function' ? entity.getStatKind() : 'numeric'
    const currentMin = typeof entity.getMin === 'function' ? entity.getMin() : null
    const currentMax = typeof entity.getMax === 'function' ? entity.getMax() : null
    const currentValue = entity.getValue() ?? ''
    const currentOptions = typeof entity.getOptions === 'function' ? entity.getOptions() : []

    const valMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderStatConfigModuleHtml(
            currentKind,
            currentMin,
            currentMax,
            currentValue,
            currentOptions
        )
    )

    const btnNumeric = valMod.querySelector('#btn-stat-kind-numeric')
    const btnList = valMod.querySelector('#btn-stat-kind-list')
    const minInput = valMod.querySelector('#details-stat-min-input')
    const maxInput = valMod.querySelector('#details-stat-max-input')
    const valInput = valMod.querySelector('#details-stat-value-input')
    const errorMsg = valMod.querySelector('#stat-val-error-msg')
    const newOptionInput = valMod.querySelector('#details-stat-new-option-input')
    const addOptionBtn = valMod.querySelector('#btn-details-stat-add-option')
    const defaultSelect = valMod.querySelector('#details-stat-default-select')

    // Mode buttons
    btnNumeric?.addEventListener('click', () => {
        if (typeof entity.setStatKind === 'function') {
            entity.setStatKind('numeric')
        }
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    btnList?.addEventListener('click', () => {
        if (typeof entity.setStatKind === 'function') {
            entity.setStatKind('list')
        }
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    // Min input
    minInput?.addEventListener('change', () => {
        if (typeof entity.setMin === 'function') {
            const raw = minInput.value.trim()
            entity.setMin(raw !== '' ? Number(raw) : null)
        }
        if (typeof renderHistoryBar === 'function') renderHistoryBar(ctx, onRefreshDetails)
        ctx?.refreshActiveSection?.(type)
    })

    // Max input
    maxInput?.addEventListener('change', () => {
        if (typeof entity.setMax === 'function') {
            const raw = maxInput.value.trim()
            entity.setMax(raw !== '' ? Number(raw) : null)
        }
        if (typeof renderHistoryBar === 'function') renderHistoryBar(ctx, onRefreshDetails)
        ctx?.refreshActiveSection?.(type)
    })

    // Value input (Numeric mode)
    const saveValue = () => {
        if (!valInput) return
        const val = valInput.value.trim()
        entity.setValue(val)
        if (typeof entity.validateValue === 'function') {
            const validation = entity.validateValue(val)
            if (!validation.valid && errorMsg) {
                errorMsg.textContent = validation.error || 'Nieprawidłowa wartość'
                errorMsg.classList.remove('hidden')
                valInput.classList.add('border-rose-500')
            } else if (errorMsg) {
                errorMsg.textContent = ''
                errorMsg.classList.add('hidden')
                valInput.classList.remove('border-rose-500')
            }
        }
        if (typeof renderHistoryBar === 'function') {
            renderHistoryBar(ctx, onRefreshDetails)
        }
        ctx?.refreshActiveSection?.(type)
    }

    valInput?.addEventListener('change', saveValue)
    valInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveValue()
            valInput.blur()
        }
    })

    // Add option (List mode)
    const handleAddOption = () => {
        if (!newOptionInput) return
        const optVal = newOptionInput.value.trim()
        if (optVal && typeof entity.addOption === 'function') {
            entity.addOption(optVal)
            refreshDetails()
            ctx?.refreshActiveSection?.(type)
        }
    }

    addOptionBtn?.addEventListener('click', handleAddOption)
    newOptionInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            handleAddOption()
        }
    })

    // Remove option buttons
    valMod.querySelectorAll('.btn-remove-stat-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-option-index'), 10)
            if (
                !isNaN(idx) &&
                typeof entity.getOptions === 'function' &&
                typeof entity.setOptions === 'function'
            ) {
                const current = entity.getOptions()
                current.splice(idx, 1)
                entity.setOptions(current)
                refreshDetails()
                ctx?.refreshActiveSection?.(type)
            }
        })
    })

    // Default select (List mode)
    defaultSelect?.addEventListener('change', () => {
        entity.setValue(defaultSelect.value)
        if (typeof renderHistoryBar === 'function') renderHistoryBar(ctx, onRefreshDetails)
        ctx?.refreshActiveSection?.(type)
    })

    container.appendChild(valMod)
    return valMod
}

export const renderStatConfigModule = renderStatValueModule

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
 * Renders numeric min/max bounds block HTML for parameters.
 *
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @returns {string} HTML string
 */
export function renderParameterNumericBoundsBlockHtml(minValue = null, maxValue = null) {
    const safeMin = minValue !== null && minValue !== undefined ? escapeHtml(String(minValue)) : ''
    const safeMax = maxValue !== null && maxValue !== undefined ? escapeHtml(String(maxValue)) : ''
    const minLabel = escapeHtml(t('details.param_min') || 'Wartość minimalna (Min)')
    const maxLabel = escapeHtml(t('details.param_max') || 'Wartość maksymalna (Max)')

    return `
        <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${minLabel}</label>
                <input id="details-param-min-input" type="number" value="${safeMin}" placeholder="Brak" aria-label="${minLabel}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
            </div>
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${maxLabel}</label>
                <input id="details-param-max-input" type="number" value="${safeMax}" placeholder="Brak" aria-label="${maxLabel}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-rose-500" />
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
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @returns {string} HTML string
 */
export function renderParameterConfigModuleHtml(
    currentMode = 'direct',
    currentValue = '',
    currentFormula = '',
    evalRes = { result: null },
    minValue = null,
    maxValue = null
) {
    const modeLabel = escapeHtml(t('details.parameter_mode'))
    const isDirect = currentMode === 'direct'
    const isFormula = currentMode === 'formula'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${modeLabel}</label>
        ${renderParameterModeButtonsHtml(currentMode)}
        ${renderParameterDirectBlockHtml(currentValue, isDirect)}
        ${renderParameterFormulaBlockHtml(currentFormula, evalRes, isFormula)}
        ${renderParameterNumericBoundsBlockHtml(minValue, maxValue)}
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
    const minValue = typeof entity.getMin === 'function' ? entity.getMin() : null
    const maxValue = typeof entity.getMax === 'function' ? entity.getMax() : null

    const statsMap = buildStatsMap(ctx?.projectStats || [])
    const evalRes = evaluateFormula(currentFormula, statsMap)

    const paramConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderParameterConfigModuleHtml(
            currentMode,
            currentValue,
            currentFormula,
            evalRes,
            minValue,
            maxValue
        )
    )

    const btnDirect = paramConfigMod.querySelector('#btn-param-mode-direct')
    const btnFormula = paramConfigMod.querySelector('#btn-param-mode-formula')
    const valInput = paramConfigMod.querySelector('#details-param-val-input')
    const formulaInput = paramConfigMod.querySelector('#details-param-formula-input')
    const formulaPreview = paramConfigMod.querySelector('#param-formula-preview')
    const minInput = paramConfigMod.querySelector('#details-param-min-input')
    const maxInput = paramConfigMod.querySelector('#details-param-max-input')

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

    if (minInput) {
        const saveMin = () => {
            const raw = minInput.value.trim()
            const val = raw === '' ? null : Number(raw)
            if (typeof entity.setMin === 'function') entity.setMin(val)
            ctx?.refreshActiveSection?.(type)
        }
        minInput.addEventListener('change', saveMin)
        minInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveMin()
                minInput.blur()
            }
        })
    }

    if (maxInput) {
        const saveMax = () => {
            const raw = maxInput.value.trim()
            const val = raw === '' ? null : Number(raw)
            if (typeof entity.setMax === 'function') entity.setMax(val)
            ctx?.refreshActiveSection?.(type)
        }
        maxInput.addEventListener('change', saveMax)
        maxInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveMax()
                maxInput.blur()
            }
        })
    }

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
 * Renders numeric min/max bounds block HTML for skills.
 *
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @returns {string} HTML string
 */
export function renderSkillNumericBoundsBlockHtml(minValue = null, maxValue = null) {
    const safeMin = minValue !== null && minValue !== undefined ? escapeHtml(String(minValue)) : ''
    const safeMax = maxValue !== null && maxValue !== undefined ? escapeHtml(String(maxValue)) : ''
    const minLabel = escapeHtml(t('details.skill_min') || 'Wartość minimalna (Min)')
    const maxLabel = escapeHtml(t('details.skill_max') || 'Wartość maksymalna (Max)')

    return `
        <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${minLabel}</label>
                <input id="details-skill-min-input" type="number" value="${safeMin}" placeholder="Brak" aria-label="${minLabel}"
                    class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-500" />
            </div>
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${maxLabel}</label>
                <input id="details-skill-max-input" type="number" value="${safeMax}" placeholder="Brak" aria-label="${maxLabel}"
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
 * @param {number | null} [minValue=null]
 * @param {number | null} [maxValue=null]
 * @returns {string} HTML string
 */
export function renderSkillConfigModuleHtml(
    currentMode = 'direct',
    currentValue = '',
    currentStat = '',
    currentMod = '+0',
    projectStats = [],
    minValue = null,
    maxValue = null
) {
    const modeLabel = escapeHtml(t('details.skill_mode'))
    const isDirect = currentMode === 'direct'
    const isStat = currentMode === 'stat_mod'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${modeLabel}</label>
        ${renderSkillModeButtonsHtml(currentMode)}
        ${renderSkillDirectBlockHtml(currentValue, isDirect)}
        ${renderSkillStatBlockHtml(currentStat, currentMod, projectStats, isStat)}
        ${renderSkillNumericBoundsBlockHtml(minValue, maxValue)}
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
    const minValue = typeof entity.getMin === 'function' ? entity.getMin() : null
    const maxValue = typeof entity.getMax === 'function' ? entity.getMax() : null
    const projectStats = ctx?.projectStats || []

    const skillConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderSkillConfigModuleHtml(
            currentMode,
            currentValue,
            currentStat,
            currentMod,
            projectStats,
            minValue,
            maxValue
        )
    )

    const btnDirect = skillConfigMod.querySelector('#btn-skill-mode-direct')
    const btnStat = skillConfigMod.querySelector('#btn-skill-mode-stat')
    const valInput = skillConfigMod.querySelector('#details-skill-val-input')
    const statSelect = skillConfigMod.querySelector('#details-skill-stat-select')
    const modInput = skillConfigMod.querySelector('#details-skill-mod-input')
    const minInput = skillConfigMod.querySelector('#details-skill-min-input')
    const maxInput = skillConfigMod.querySelector('#details-skill-max-input')

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

    if (minInput) {
        const saveMin = () => {
            const raw = minInput.value.trim()
            const val = raw === '' ? null : Number(raw)
            if (typeof entity.setMin === 'function') entity.setMin(val)
            ctx?.refreshActiveSection?.(type)
        }
        minInput.addEventListener('change', saveMin)
        minInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveMin()
                minInput.blur()
            }
        })
    }

    if (maxInput) {
        const saveMax = () => {
            const raw = maxInput.value.trim()
            const val = raw === '' ? null : Number(raw)
            if (typeof entity.setMax === 'function') entity.setMax(val)
            ctx?.refreshActiveSection?.(type)
        }
        maxInput.addEventListener('change', saveMax)
        maxInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                saveMax()
                maxInput.blur()
            }
        })
    }

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

/**
 * Renders kind toggle buttons HTML for feature configuration.
 *
 * @param {'flag' | 'value' | 'list'} [currentKind='flag']
 * @returns {string} HTML string
 */
export function renderFeatureKindButtonsHtml(currentKind = 'flag') {
    const isFlag = currentKind !== 'value' && currentKind !== 'list'
    const isValue = currentKind === 'value'
    const isList = currentKind === 'list'

    const flagClass = isFlag
        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
        : 'text-gray-400 hover:text-white'
    const valClass = isValue
        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
        : 'text-gray-400 hover:text-white'
    const listClass = isList
        ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50'
        : 'text-gray-400 hover:text-white'

    return `
        <div class="grid grid-cols-3 gap-1 bg-[#18181b] p-1 rounded border border-[#27272a]">
            <button type="button" id="btn-feature-kind-flag" class="py-1 px-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors text-center truncate ${flagClass}">
                ${escapeHtml(t('details.feature_type_flag') || 'Flaga')}
            </button>
            <button type="button" id="btn-feature-kind-value" class="py-1 px-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors text-center truncate ${valClass}">
                ${escapeHtml(t('details.feature_type_value') || 'Wartość')}
            </button>
            <button type="button" id="btn-feature-kind-list" class="py-1 px-1.5 rounded text-[11px] font-medium cursor-pointer transition-colors text-center truncate ${listClass}">
                ${escapeHtml(t('details.feature_type_list') || 'Lista')}
            </button>
        </div>`
}

/**
 * Renders feature flag informational block.
 *
 * @param {boolean} [isVisible=true]
 * @returns {string}
 */
export function renderFeatureFlagBlockHtml(isVisible = true) {
    const hiddenClass = isVisible ? '' : 'hidden'
    return `
        <div id="feature-flag-block" class="${hiddenClass} p-2 rounded bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 italic">
            ${escapeHtml(t('details.feature_flag_hint') || 'Istnienie przymiotu jest wystarczające (nie wymaga dodatkowej wartości).')}
        </div>`
}

/**
 * Renders feature single value block.
 *
 * @param {string} [currentValue='']
 * @param {boolean} [isVisible=false]
 * @returns {string}
 */
export function renderFeatureValueBlockHtml(currentValue = '', isVisible = false) {
    const hiddenClass = isVisible ? '' : 'hidden'
    const safeVal = escapeHtml(String(currentValue ?? ''))
    const label = escapeHtml(t('details.feature_value') || 'Wartość przymiotu')
    return `
        <div id="feature-value-block" class="${hiddenClass} space-y-1 pt-1">
            <label class="block text-[11px] text-gray-400">${label}</label>
            <input id="details-feature-value-input" type="text" value="${safeVal}" placeholder="np. Srebrny" aria-label="${label}"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
        </div>`
}

/**
 * Renders feature options list editor and default value block.
 *
 * @param {Array<string>} [options=[]]
 * @param {string} [defaultValue='']
 * @param {boolean} [isVisible=false]
 * @returns {string}
 */
export function renderFeatureListBlockHtml(options = [], defaultValue = '', isVisible = false) {
    const hiddenClass = isVisible ? '' : 'hidden'
    const safeOptions = Array.isArray(options) ? options : []
    const optionsLabel = escapeHtml(t('details.feature_options') || 'Dozwolone wartości')
    const addLabel = escapeHtml(t('details.feature_add_option') || 'Dodaj wartość')
    const placeholder = escapeHtml(t('details.feature_option_placeholder') || 'Nowa wartość...')
    const defLabel = escapeHtml(t('details.feature_default_value') || 'Wartość domyślna')
    const noOptionsText = escapeHtml(
        t('details.feature_no_options') || 'Brak zdefiniowanych wartości na liście'
    )

    const optionsListHtml =
        safeOptions.length === 0
            ? `<div class="text-[11px] text-gray-500 italic py-1 text-center">${noOptionsText}</div>`
            : safeOptions
                  .map(
                      (opt, idx) => `
            <div class="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-2 py-1 rounded text-xs text-white">
                <span class="truncate">${escapeHtml(opt)}</span>
                <button type="button" class="btn-remove-feature-option text-gray-400 hover:text-red-400 p-0.5" data-option-idx="${idx}" title="${escapeHtml(t('buttons.delete') || 'Usuń')}">
                    ✕
                </button>
            </div>
        `
                  )
                  .join('')

    const selectOptionsHtml = safeOptions
        .map(opt => {
            const isSel = String(opt) === String(defaultValue) ? 'selected' : ''
            return `<option value="${escapeHtml(opt)}" ${isSel}>${escapeHtml(opt)}</option>`
        })
        .join('')

    return `
        <div id="feature-list-block" class="${hiddenClass} space-y-2 pt-1">
            <div class="space-y-1">
                <label class="block text-[11px] text-gray-400">${optionsLabel}</label>
                <div id="feature-options-list" class="space-y-1 max-h-36 overflow-y-auto pr-1">
                    ${optionsListHtml}
                </div>
                <div class="flex gap-1 pt-1">
                    <input id="details-feature-new-option-input" type="text" placeholder="${placeholder}"
                        class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500" />
                    <button type="button" id="btn-details-feature-add-option"
                        class="px-2.5 py-1 bg-purple-700 hover:bg-purple-600 rounded text-xs text-white font-medium cursor-pointer transition-colors">
                        ${addLabel}
                    </button>
                </div>
            </div>
            <div class="space-y-1 pt-1 border-t border-[#27272a]">
                <label class="block text-[11px] text-gray-400">${defLabel}</label>
                <select id="details-feature-default-select" class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500">
                    <option value="">-- Wybierz domyślną --</option>
                    ${selectOptionsHtml}
                </select>
            </div>
        </div>`
}

/**
 * Renders the full feature configuration inner HTML.
 *
 * @param {'flag' | 'value' | 'list'} [currentKind='flag']
 * @param {string} [defaultValue='']
 * @param {Array<string>} [options=[]]
 * @returns {string} HTML string
 */
export function renderFeatureConfigModuleHtml(
    currentKind = 'flag',
    defaultValue = '',
    options = []
) {
    const typeLabel = escapeHtml(t('details.feature_type') || 'Typ przymiotu')
    const isFlag = currentKind !== 'value' && currentKind !== 'list'
    const isValue = currentKind === 'value'
    const isList = currentKind === 'list'

    return `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${typeLabel}</label>
        ${renderFeatureKindButtonsHtml(currentKind)}
        ${renderFeatureFlagBlockHtml(isFlag)}
        ${renderFeatureValueBlockHtml(defaultValue, isValue)}
        ${renderFeatureListBlockHtml(options, defaultValue, isList)}
    `
}

/**
 * Renders feature configuration module (Flag vs Single value vs Options list).
 *
 * @param {HTMLElement | null} container
 * @param {object} entity
 * @param {string} type
 * @param {object} [ctx={}]
 * @param {Function} [onRefreshDetails]
 * @returns {HTMLElement | null}
 */
export function renderFeatureConfigModule(
    container,
    entity,
    type,
    ctx = {},
    onRefreshDetails = null
) {
    if (!container || type !== 'feature') return null
    if (
        !entity ||
        typeof entity.getFeatureKind !== 'function' ||
        typeof entity.setFeatureKind !== 'function'
    ) {
        return null
    }

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx?.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentKind = entity.getFeatureKind() || 'flag'
    const defaultValue = typeof entity.getValue === 'function' ? entity.getValue() : ''
    const options = typeof entity.getOptions === 'function' ? entity.getOptions() : []

    const featConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        renderFeatureConfigModuleHtml(currentKind, defaultValue, options)
    )

    const btnFlag = featConfigMod.querySelector('#btn-feature-kind-flag')
    const btnVal = featConfigMod.querySelector('#btn-feature-kind-value')
    const btnList = featConfigMod.querySelector('#btn-feature-kind-list')

    btnFlag?.addEventListener('click', () => {
        entity.setFeatureKind('flag')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    btnVal?.addEventListener('click', () => {
        entity.setFeatureKind('value')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    btnList?.addEventListener('click', () => {
        entity.setFeatureKind('list')
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    })

    const valInput = featConfigMod.querySelector('#details-feature-value-input')
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

    const newOptInput = featConfigMod.querySelector('#details-feature-new-option-input')
    const addOptBtn = featConfigMod.querySelector('#btn-details-feature-add-option')
    const defSelect = featConfigMod.querySelector('#details-feature-default-select')

    const addOptionHandler = () => {
        if (!newOptInput) return
        const val = newOptInput.value.trim()
        if (!val) return
        if (typeof entity.addOption === 'function') {
            entity.addOption(val)
            if (typeof entity.getValue === 'function' && !entity.getValue()) {
                entity.setValue(val)
            }
        }
        refreshDetails()
        ctx?.refreshActiveSection?.(type)
    }

    addOptBtn?.addEventListener('click', addOptionHandler)
    newOptInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addOptionHandler()
        }
    })

    featConfigMod.querySelectorAll('.btn-remove-feature-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.getAttribute('data-option-idx') || '-1', 10)
            if (idx >= 0 && options[idx]) {
                const optToRemove = options[idx]
                if (typeof entity.removeOption === 'function') {
                    entity.removeOption(optToRemove)
                }
                if (typeof entity.getValue === 'function' && entity.getValue() === optToRemove) {
                    const remaining =
                        typeof entity.getOptions === 'function' ? entity.getOptions() : []
                    entity.setValue(remaining[0] || '')
                }
                refreshDetails()
                ctx?.refreshActiveSection?.(type)
            }
        })
    })

    defSelect?.addEventListener('change', () => {
        if (typeof entity.setValue === 'function') {
            entity.setValue(defSelect.value)
        }
        ctx?.refreshActiveSection?.(type)
    })

    container.appendChild(featConfigMod)
    return featConfigMod
}
