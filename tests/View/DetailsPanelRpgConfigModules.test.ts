// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import {
    renderParameterConfigModule,
    renderParameterConfigModuleHtml,
    renderParameterDirectBlockHtml,
    renderParameterFormulaBlockHtml,
    renderParameterModeButtonsHtml,
    renderSkillConfigModule,
    renderSkillConfigModuleHtml,
    renderSkillDirectBlockHtml,
    renderSkillModeButtonsHtml,
    renderSkillStatBlockHtml,
    renderSkillStatOptionsHtml,
    renderStatValueModule,
    renderStatValueModuleHtml,
} from '../../View/ui/detailsPanel/modules/rpgConfigModules.js'

describe('rpgConfigModules', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        container.remove()
        vi.restoreAllMocks()
    })

    describe('renderStatValueModule', () => {
        let mockStatEntity: {
            _val: string | number
            getValue: () => string | number
            setValue: (val: string | number) => void
        }
        let mockCtx: {
            refreshActiveSection: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockStatEntity = {
                _val: '14',
                getValue: vi.fn(() => mockStatEntity._val),
                setValue: vi.fn(val => {
                    mockStatEntity._val = val
                }),
            }
            mockCtx = {
                refreshActiveSection: vi.fn(),
            }
        })

        it('renderStatValueModuleHtml renders label and input with escaped value', () => {
            const html = renderStatValueModuleHtml('<b>18</b>')
            expect(html).toContain('Wartość cechy')
            expect(html).toContain('&lt;b&gt;18&lt;/b&gt;')
            expect(html).toContain('details-stat-value-input')
        })

        it('returns null if container or type is invalid', () => {
            expect(renderStatValueModule(null, mockStatEntity, 'stat', mockCtx)).toBeNull()
            expect(
                renderStatValueModule(container, mockStatEntity, 'paragraph', mockCtx)
            ).toBeNull()
            expect(renderStatValueModule(container, {}, 'stat', mockCtx)).toBeNull()
        })

        it('renders stat module for stat and trait types', () => {
            const statSection = renderStatValueModule(container, mockStatEntity, 'stat', mockCtx)
            expect(statSection).not.toBeNull()
            expect(container.contains(statSection as Node)).toBe(true)

            container.innerHTML = ''
            const traitSection = renderStatValueModule(container, mockStatEntity, 'trait', mockCtx)
            expect(traitSection).not.toBeNull()
        })

        it('saves value on input change and Enter keydown', () => {
            renderStatValueModule(container, mockStatEntity, 'stat', mockCtx)
            const input = container.querySelector('#details-stat-value-input') as HTMLInputElement

            input.value = '16'
            input.dispatchEvent(new Event('change'))

            expect(mockStatEntity.setValue).toHaveBeenCalledWith('16')
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('stat')

            input.value = '20'
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
            expect(mockStatEntity.setValue).toHaveBeenCalledWith('20')
        })
    })

    describe('renderParameterConfigModule', () => {
        let mockParamEntity: {
            _mode: string
            _val: string | number
            _formula: string
            getMode: () => string
            setMode: (mode: string) => void
            getValue: () => string | number
            setValue: (val: string | number) => void
            getFormula: () => string
            setFormula: (f: string) => void
        }
        let mockCtx: {
            projectStats: Array<{ getName: () => string; getValue: () => string }>
            renderDetailsPanel: ReturnType<typeof vi.fn>
            refreshActiveSection: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockParamEntity = {
                _mode: 'direct',
                _val: '100',
                _formula: 'Siła * 2',
                getMode: vi.fn(() => mockParamEntity._mode),
                setMode: vi.fn(mode => {
                    mockParamEntity._mode = mode
                }),
                getValue: vi.fn(() => mockParamEntity._val),
                setValue: vi.fn(val => {
                    mockParamEntity._val = val
                }),
                getFormula: vi.fn(() => mockParamEntity._formula),
                setFormula: vi.fn(f => {
                    mockParamEntity._formula = f
                }),
            }

            mockCtx = {
                projectStats: [
                    {
                        getName: (): string => 'Siła',
                        getValue: (): string => '10',
                    },
                ],
                renderDetailsPanel: vi.fn(),
                refreshActiveSection: vi.fn(),
            }
        })

        it('renderParameterModeButtonsHtml highlights active mode button', () => {
            const htmlDirect = renderParameterModeButtonsHtml('direct')
            expect(htmlDirect).toContain('btn-param-mode-direct')
            expect(htmlDirect).toContain('border-rose-500/50')

            const htmlFormula = renderParameterModeButtonsHtml('formula')
            expect(htmlFormula).toContain('btn-param-mode-formula')
            expect(htmlFormula).toContain('border-rose-500/50')
        })

        it('renderParameterDirectBlockHtml renders direct input and visibility', () => {
            const visible = renderParameterDirectBlockHtml('50', true)
            expect(visible).not.toContain('hidden')
            expect(visible).toContain('value="50"')

            const hidden = renderParameterDirectBlockHtml('50', false)
            expect(hidden).toContain('hidden')
        })

        it('renderParameterFormulaBlockHtml renders formula input and evaluation preview', () => {
            const htmlWithResult = renderParameterFormulaBlockHtml('Siła * 2', { result: 20 }, true)
            expect(htmlWithResult).toContain('text-emerald-400')
            expect(htmlWithResult).toContain('>20<')

            const htmlWithError = renderParameterFormulaBlockHtml(
                'Nieznana * 2',
                { result: null, error: 'Brak cechy' },
                true
            )
            expect(htmlWithError).toContain('text-amber-400')
            expect(htmlWithError).toContain('Brak cechy')
        })

        it('renderParameterConfigModule returns null for non-parameter types', () => {
            expect(
                renderParameterConfigModule(container, mockParamEntity, 'stat', mockCtx)
            ).toBeNull()
            expect(
                renderParameterConfigModule(null, mockParamEntity, 'parameter', mockCtx)
            ).toBeNull()
        })

        it('renders parameter config module and toggles mode', () => {
            const onRefreshDetails = vi.fn()
            const section = renderParameterConfigModule(
                container,
                mockParamEntity,
                'parameter',
                mockCtx,
                onRefreshDetails
            )
            expect(section).not.toBeNull()

            const btnFormula = container.querySelector(
                '#btn-param-mode-formula'
            ) as HTMLButtonElement
            btnFormula.click()

            expect(mockParamEntity.setMode).toHaveBeenCalledWith('formula')
            expect(onRefreshDetails).toHaveBeenCalledWith(mockCtx)
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('parameter')

            const btnDirect = container.querySelector('#btn-param-mode-direct') as HTMLButtonElement
            btnDirect.click()
            expect(mockParamEntity.setMode).toHaveBeenCalledWith('direct')
        })

        it('updates direct value and formula value on input events', () => {
            renderParameterConfigModule(container, mockParamEntity, 'parameter', mockCtx)
            const valInput = container.querySelector('#details-param-val-input') as HTMLInputElement
            const formulaInput = container.querySelector(
                '#details-param-formula-input'
            ) as HTMLInputElement

            valInput.value = '150'
            valInput.dispatchEvent(new Event('change'))
            expect(mockParamEntity.setValue).toHaveBeenCalledWith('150')

            formulaInput.value = 'Siła + 5'
            formulaInput.dispatchEvent(new Event('input'))
            const preview = container.querySelector('#param-formula-preview')
            expect(preview?.textContent).toBe('15')

            formulaInput.dispatchEvent(new Event('change'))
            expect(mockParamEntity.setFormula).toHaveBeenCalledWith('Siła + 5')
        })
    })

    describe('renderSkillConfigModule', () => {
        let mockSkillEntity: {
            _mode: string
            _val: string
            _stat: string
            _mod: string
            getMode: () => string
            setMode: (mode: string) => void
            getValue: () => string
            setValue: (val: string) => void
            getStatName: () => string
            setStatName: (name: string) => void
            getModifier: () => string
            setModifier: (mod: string) => void
        }
        let mockCtx: {
            projectStats: Array<{ getName: () => string }>
            renderDetailsPanel: ReturnType<typeof vi.fn>
            refreshActiveSection: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockSkillEntity = {
                _mode: 'direct',
                _val: '+2',
                _stat: 'Zręczność',
                _mod: '+3',
                getMode: vi.fn(() => mockSkillEntity._mode),
                setMode: vi.fn(mode => {
                    mockSkillEntity._mode = mode
                }),
                getValue: vi.fn(() => mockSkillEntity._val),
                setValue: vi.fn(val => {
                    mockSkillEntity._val = val
                }),
                getStatName: vi.fn(() => mockSkillEntity._stat),
                setStatName: vi.fn(name => {
                    mockSkillEntity._stat = name
                }),
                getModifier: vi.fn(() => mockSkillEntity._mod),
                setModifier: vi.fn(mod => {
                    mockSkillEntity._mod = mod
                }),
            }

            mockCtx = {
                projectStats: [
                    { getName: (): string => 'Siła' },
                    { getName: (): string => 'Zręczność' },
                ],
                renderDetailsPanel: vi.fn(),
                refreshActiveSection: vi.fn(),
            }
        })

        it('renderSkillDirectBlockHtml renders direct value and visibility', () => {
            const visible = renderSkillDirectBlockHtml('+3', true)
            expect(visible).not.toContain('hidden')
            expect(visible).toContain('value="+3"')

            const hidden = renderSkillDirectBlockHtml('+3', false)
            expect(hidden).toContain('hidden')
        })

        it('renderSkillStatBlockHtml renders stat select and modifier input', () => {
            const visible = renderSkillStatBlockHtml('Zręczność', '+2', mockCtx.projectStats, true)
            expect(visible).not.toContain('hidden')
            expect(visible).toContain('details-skill-stat-select')
            expect(visible).toContain('value="+2"')

            const hidden = renderSkillStatBlockHtml('Zręczność', '+2', mockCtx.projectStats, false)
            expect(hidden).toContain('hidden')
        })

        it('renderSkillModeButtonsHtml highlights active skill mode', () => {
            const htmlDirect = renderSkillModeButtonsHtml('direct')
            expect(htmlDirect).toContain('btn-skill-mode-direct')
            expect(htmlDirect).toContain('border-blue-500/50')

            const htmlStat = renderSkillModeButtonsHtml('stat_mod')
            expect(htmlStat).toContain('btn-skill-mode-stat')
            expect(htmlStat).toContain('border-blue-500/50')
        })

        it('renderSkillStatOptionsHtml renders trait options and marks currentStat selected', () => {
            const options = renderSkillStatOptionsHtml(mockCtx.projectStats, 'Zręczność')
            expect(options).toContain('<option value="Siła" >Siła</option>')
            expect(options).toContain('<option value="Zręczność" selected>Zręczność</option>')
        })

        it('renderSkillConfigModule returns null for non-skill types', () => {
            expect(renderSkillConfigModule(container, mockSkillEntity, 'stat', mockCtx)).toBeNull()
            expect(renderSkillConfigModule(null, mockSkillEntity, 'skill', mockCtx)).toBeNull()
        })

        it('renders skill module and switches mode', () => {
            const onRefreshDetails = vi.fn()
            const section = renderSkillConfigModule(
                container,
                mockSkillEntity,
                'skill',
                mockCtx,
                onRefreshDetails
            )
            expect(section).not.toBeNull()

            const btnStat = container.querySelector('#btn-skill-mode-stat') as HTMLButtonElement
            btnStat.click()

            expect(mockSkillEntity.setMode).toHaveBeenCalledWith('stat_mod')
            expect(onRefreshDetails).toHaveBeenCalledWith(mockCtx)
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('skill')
        })

        it('updates skill direct value, stat name, and modifier', () => {
            renderSkillConfigModule(container, mockSkillEntity, 'skill', mockCtx)

            const valInput = container.querySelector('#details-skill-val-input') as HTMLInputElement
            const statSelect = container.querySelector(
                '#details-skill-stat-select'
            ) as HTMLSelectElement
            const modInput = container.querySelector('#details-skill-mod-input') as HTMLInputElement

            valInput.value = '+5'
            valInput.dispatchEvent(new Event('change'))
            expect(mockSkillEntity.setValue).toHaveBeenCalledWith('+5')

            statSelect.value = 'Siła'
            statSelect.dispatchEvent(new Event('change'))
            expect(mockSkillEntity.setStatName).toHaveBeenCalledWith('Siła')

            modInput.value = '+4'
            modInput.dispatchEvent(new Event('change'))
            expect(mockSkillEntity.setModifier).toHaveBeenCalledWith('+4')
        })
    })

    describe('Internationalization (i18n)', () => {
        it('renders parameter and skill templates in English correctly', async () => {
            await initTranslationsWithLocale('en')
            const paramHtml = renderParameterConfigModuleHtml('direct', '100', 'Power', {
                result: null,
            })
            expect(paramHtml).toContain('Parameter mode')
            expect(paramHtml).toContain('Direct value')
            expect(paramHtml).toContain('Calculated formula')

            const skillHtml = renderSkillConfigModuleHtml('direct', '+2', 'Strength', '+1', [])
            expect(skillHtml).toContain('Skill mode')
            expect(skillHtml).toContain('Stat dependent')
        })

        it('renders parameter and skill templates in German correctly', async () => {
            await initTranslationsWithLocale('de')
            const paramHtml = renderParameterConfigModuleHtml('formula', '100', 'Kraft', {
                result: 25,
            })
            expect(paramHtml).toContain('Parametermodus')
            expect(paramHtml).toContain('Direkter Wert')
            expect(paramHtml).toContain('Berechnete Formel')

            const skillHtml = renderSkillConfigModuleHtml('stat_mod', '+2', 'Stärke', '+1', [])
            expect(skillHtml).toContain('Fertigkeitsmodus')
            expect(skillHtml).toContain('Vom Wert abhängig')
        })
    })
})
