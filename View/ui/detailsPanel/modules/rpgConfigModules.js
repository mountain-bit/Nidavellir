import { t } from '../../../../dist/Utils/translate.js'
import { escapeHtml } from '../../htmlTemplates.js'
import { evaluateFormula } from '../../npcModal/formulaEvaluator.js'
import { buildStatsMap, createSection } from '../common/domHelpers.js'
import { renderHistoryBar } from '../historyBar.js'

/**
 * Renders base stat / trait value editing module.
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderStatValueModule(container, entity, type, ctx, onRefreshDetails) {
    if (type !== 'stat' && type !== 'trait') return
    if (!entity.getValue || !entity.setValue) return

    const valMod = createSection(
        'border-b border-[#333338] p-3 space-y-1.5',
        `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.stat_value')}</label>
        <input id="details-stat-value-input" type="text" value="${escapeHtml(String(entity.getValue() ?? ''))}" placeholder="${t('details.trait_value')}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
    `
    )

    const input = valMod.querySelector('#details-stat-value-input')
    const saveValue = () => {
        const val = input.value.trim()
        entity.setValue(val)
        renderHistoryBar(ctx, onRefreshDetails)
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

/**
 * Renders parameter configuration module (Direct value vs Formula mode).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderParameterConfigModule(container, entity, type, ctx, onRefreshDetails) {
    if (type !== 'parameter') return
    if (!entity.getMode || !entity.setMode) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentMode = entity.getMode() || 'direct'
    const currentValue = entity.getValue ? entity.getValue() : ''
    const currentFormula = entity.getFormula ? entity.getFormula() : ''

    const statsMap = buildStatsMap(ctx.projectStats || [])
    const evalRes = evaluateFormula(currentFormula, statsMap)

    const paramConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
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
    )

    const btnDirect = paramConfigMod.querySelector('#btn-param-mode-direct')
    const btnFormula = paramConfigMod.querySelector('#btn-param-mode-formula')
    const valInput = paramConfigMod.querySelector('#details-param-val-input')
    const formulaInput = paramConfigMod.querySelector('#details-param-formula-input')
    const formulaPreview = paramConfigMod.querySelector('#param-formula-preview')

    btnDirect.addEventListener('click', () => {
        entity.setMode('direct')
        refreshDetails()
        ctx.refreshActiveSection(type)
    })

    btnFormula.addEventListener('click', () => {
        entity.setMode('formula')
        refreshDetails()
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

/**
 * Renders skill configuration module (Direct value vs Stat modifier mode).
 *
 * @param {HTMLElement} container
 * @param {object} entity
 * @param {string} type
 * @param {object} ctx
 * @param {Function} [onRefreshDetails]
 */
export function renderSkillConfigModule(container, entity, type, ctx, onRefreshDetails) {
    if (type !== 'skill') return
    if (!entity.getMode || !entity.setMode) return

    const refreshDetails = () => {
        if (typeof onRefreshDetails === 'function') {
            onRefreshDetails(ctx)
        } else if (typeof ctx.renderDetailsPanel === 'function') {
            ctx.renderDetailsPanel(ctx)
        }
    }

    const currentMode = entity.getMode() || 'direct'
    const currentValue = entity.getValue ? entity.getValue() : ''
    const currentStat = entity.getStatName ? entity.getStatName() : ''
    const currentMod = entity.getModifier ? entity.getModifier() : '+0'

    const skillConfigMod = createSection(
        'border-b border-[#333338] p-3 space-y-2',
        `
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
    )

    const btnDirect = skillConfigMod.querySelector('#btn-skill-mode-direct')
    const btnStat = skillConfigMod.querySelector('#btn-skill-mode-stat')
    const valInput = skillConfigMod.querySelector('#details-skill-val-input')
    const statSelect = skillConfigMod.querySelector('#details-skill-stat-select')
    const modInput = skillConfigMod.querySelector('#details-skill-mod-input')

    btnDirect.addEventListener('click', () => {
        entity.setMode('direct')
        refreshDetails()
        ctx.refreshActiveSection(type)
    })

    btnStat.addEventListener('click', () => {
        entity.setMode('stat_mod')
        refreshDetails()
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
