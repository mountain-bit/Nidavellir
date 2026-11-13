// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import {
    renderFeatureConfigModule,
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

        it('saves min and max bounds on change', () => {
            let currentMin: number | null = null
            let currentMax: number | null = null
            const richStatEntity = {
                ...mockStatEntity,
                getMin: vi.fn(() => currentMin),
                setMin: vi.fn((val: number | null) => {
                    currentMin = val
                }),
                getMax: vi.fn(() => currentMax),
                setMax: vi.fn((val: number | null) => {
                    currentMax = val
                }),
            }

            renderStatValueModule(container, richStatEntity, 'stat', mockCtx)

            const minInput = container.querySelector('#details-stat-min-input') as HTMLInputElement
            const maxInput = container.querySelector('#details-stat-max-input') as HTMLInputElement

            minInput.value = '1'
            minInput.dispatchEvent(new Event('change'))
            expect(richStatEntity.setMin).toHaveBeenCalledWith(1)

            maxInput.value = '20'
            maxInput.dispatchEvent(new Event('change'))
            expect(richStatEntity.setMax).toHaveBeenCalledWith(20)
        })

        it('switches between numeric and list kind and adds/removes options', () => {
            const onRefreshDetails = vi.fn()
            let currentKind = 'numeric'
            let currentOptions = ['Kobieta']
            const listStatEntity = {
                ...mockStatEntity,
                getStatKind: vi.fn(() => currentKind),
                setStatKind: vi.fn((k: string) => {
                    currentKind = k
                }),
                getOptions: vi.fn(() => currentOptions),
                setOptions: vi.fn((opts: string[]) => {
                    currentOptions = opts
                }),
                addOption: vi.fn((opt: string) => {
                    currentOptions.push(opt)
                }),
            }

            renderStatValueModule(container, listStatEntity, 'stat', mockCtx, onRefreshDetails)

            const btnList = container.querySelector('#btn-stat-kind-list') as HTMLButtonElement
            btnList.click()
            expect(listStatEntity.setStatKind).toHaveBeenCalledWith('list')
            expect(onRefreshDetails).toHaveBeenCalled()

            // Simulate re-render with list mode active
            currentKind = 'list'
            container.innerHTML = ''
            renderStatValueModule(container, listStatEntity, 'stat', mockCtx, onRefreshDetails)

            const newOptInput = container.querySelector(
                '#details-stat-new-option-input'
            ) as HTMLInputElement
            const addOptBtn = container.querySelector(
                '#btn-details-stat-add-option'
            ) as HTMLButtonElement

            newOptInput.value = 'Mężczyzna'
            addOptBtn.click()
            expect(listStatEntity.addOption).toHaveBeenCalledWith('Mężczyzna')

            const removeBtn = container.querySelector(
                '.btn-remove-stat-option'
            ) as HTMLButtonElement
            removeBtn.click()
            expect(listStatEntity.setOptions).toHaveBeenCalled()
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

        it('saves min and max bounds for parameter and skill on change', () => {
            let paramMin: number | null = null
            let paramMax: number | null = null
            const richParam = {
                getMode: vi.fn(() => 'direct'),
                setMode: vi.fn(),
                getValue: vi.fn(() => '100'),
                setValue: vi.fn(),
                getFormula: vi.fn(() => ''),
                setFormula: vi.fn(),
                getMin: vi.fn(() => paramMin),
                setMin: vi.fn((val: number | null) => {
                    paramMin = val
                }),
                getMax: vi.fn(() => paramMax),
                setMax: vi.fn((val: number | null) => {
                    paramMax = val
                }),
            }

            renderParameterConfigModule(container, richParam, 'parameter', mockCtx)
            const pMinInput = container.querySelector(
                '#details-param-min-input'
            ) as HTMLInputElement
            const pMaxInput = container.querySelector(
                '#details-param-max-input'
            ) as HTMLInputElement

            pMinInput.value = '10'
            pMinInput.dispatchEvent(new Event('change'))
            expect(richParam.setMin).toHaveBeenCalledWith(10)

            pMaxInput.value = '200'
            pMaxInput.dispatchEvent(new Event('change'))
            expect(richParam.setMax).toHaveBeenCalledWith(200)

            container.innerHTML = ''

            let skillMin: number | null = null
            let skillMax: number | null = null
            const richSkill = {
                getMode: vi.fn(() => 'direct'),
                setMode: vi.fn(),
                getValue: vi.fn(() => '+2'),
                setValue: vi.fn(),
                getStatName: vi.fn(() => ''),
                setStatName: vi.fn(),
                getModifier: vi.fn(() => '+0'),
                setModifier: vi.fn(),
                getMin: vi.fn(() => skillMin),
                setMin: vi.fn((val: number | null) => {
                    skillMin = val
                }),
                getMax: vi.fn(() => skillMax),
                setMax: vi.fn((val: number | null) => {
                    skillMax = val
                }),
            }

            renderSkillConfigModule(container, richSkill, 'skill', mockCtx)
            const sMinInput = container.querySelector(
                '#details-skill-min-input'
            ) as HTMLInputElement
            const sMaxInput = container.querySelector(
                '#details-skill-max-input'
            ) as HTMLInputElement

            sMinInput.value = '0'
            sMinInput.dispatchEvent(new Event('change'))
            expect(richSkill.setMin).toHaveBeenCalledWith(0)

            sMaxInput.value = '20'
            sMaxInput.dispatchEvent(new Event('change'))
            expect(richSkill.setMax).toHaveBeenCalledWith(20)
        })
    })

    describe('renderFeatureConfigModule', () => {
        let mockCtx: {
            refreshActiveSection: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockCtx = {
                refreshActiveSection: vi.fn(),
            }
        })

        it('renders null when container is missing or type is not feature', () => {
            expect(renderFeatureConfigModule(null, {}, 'feature')).toBeNull()
            expect(renderFeatureConfigModule(container, {}, 'stat')).toBeNull()
        })

        it('switches between flag, value and list modes and manages options', () => {
            let kind = 'flag'
            let val = ''
            let options = ['Ciemność', 'Światłość']
            const onRefresh = vi.fn()

            const mockFeat = {
                getFeatureKind: vi.fn(() => kind),
                setFeatureKind: vi.fn((k: string) => {
                    kind = k
                }),
                getValue: vi.fn(() => val),
                setValue: vi.fn((v: string) => {
                    val = v
                }),
                getOptions: vi.fn(() => options),
                setOptions: vi.fn((opts: string[]) => {
                    options = opts
                }),
                addOption: vi.fn((opt: string) => {
                    options.push(opt)
                }),
                removeOption: vi.fn((opt: string) => {
                    options = options.filter(o => o !== opt)
                }),
            }

            renderFeatureConfigModule(container, mockFeat, 'feature', mockCtx, onRefresh)
            expect(
                container.querySelector('#feature-flag-block')?.classList.contains('hidden')
            ).toBe(false)
            expect(
                container.querySelector('#feature-value-block')?.classList.contains('hidden')
            ).toBe(true)
            expect(
                container.querySelector('#feature-list-block')?.classList.contains('hidden')
            ).toBe(true)

            // Switch to value mode
            const btnVal = container.querySelector('#btn-feature-kind-value') as HTMLButtonElement
            btnVal.click()
            expect(mockFeat.setFeatureKind).toHaveBeenCalledWith('value')
            expect(onRefresh).toHaveBeenCalled()

            // Simulate re-render in value mode
            kind = 'value'
            val = 'Błogosławieństwo'
            container.innerHTML = ''
            renderFeatureConfigModule(container, mockFeat, 'feature', mockCtx, onRefresh)

            const valInput = container.querySelector(
                '#details-feature-value-input'
            ) as HTMLInputElement
            expect(valInput.value).toBe('Błogosławieństwo')
            valInput.value = 'Klątwa'
            valInput.dispatchEvent(new Event('change'))
            expect(mockFeat.setValue).toHaveBeenCalledWith('Klątwa')

            // Switch to list mode
            const btnList = container.querySelector('#btn-feature-kind-list') as HTMLButtonElement
            btnList.click()
            expect(mockFeat.setFeatureKind).toHaveBeenCalledWith('list')

            // Simulate re-render in list mode
            kind = 'list'
            container.innerHTML = ''
            renderFeatureConfigModule(container, mockFeat, 'feature', mockCtx, onRefresh)

            const newOptInput = container.querySelector(
                '#details-feature-new-option-input'
            ) as HTMLInputElement
            const addOptBtn = container.querySelector(
                '#btn-details-feature-add-option'
            ) as HTMLButtonElement

            newOptInput.value = 'Magia'
            addOptBtn.click()
            expect(mockFeat.addOption).toHaveBeenCalledWith('Magia')

            const removeBtn = container.querySelector(
                '.btn-remove-feature-option'
            ) as HTMLButtonElement
            removeBtn.click()
            expect(mockFeat.removeOption).toHaveBeenCalledWith('Ciemność')
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
