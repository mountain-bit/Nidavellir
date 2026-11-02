/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import {
    renderAssignFeatureBarHtml,
    renderAssignParameterBarHtml,
    renderAssignSkillBarHtml,
    renderAssignTraitBarHtml,
    renderEmptyFeaturesHtml,
    renderEmptyParametersHtml,
    renderEmptySkillsHtml,
    renderEmptyTraitsHtml,
    renderFeatureItemHtml,
    renderFeatureOptionsHtml,
    renderFeaturesModule,
    renderFeaturesModuleHeaderHtml,
    renderFeaturesModuleHtml,
    renderParameterItemHtml,
    renderParameterOptionsHtml,
    renderParametersModule,
    renderParametersModuleHeaderHtml,
    renderParametersModuleHtml,
    renderSkillItemHtml,
    renderSkillOptionsHtml,
    renderSkillsModule,
    renderSkillsModuleHeaderHtml,
    renderSkillsModuleHtml,
    renderTraitItemHtml,
    renderTraitOptionsHtml,
    renderTraitsModule,
    renderTraitsModuleHeaderHtml,
    renderTraitsModuleHtml,
} from '../../View/ui/detailsPanel/modules/associationModules.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)

describe('associationModules - Part 2 (Traits, Parameters, Skills, Features)', () => {
    let container: HTMLElement

    beforeEach(() => {
        initTranslationsWithLocale('en')
        container = document.createElement('div')
    })

    describe('Traits Module Templates', () => {
        it('renders traits module header with count and icon', () => {
            const html = renderTraitsModuleHeaderHtml(4)
            expect(html).toContain('4')
            expect(html).toContain(translate('details.traits'))
            expect(html).toContain('<svg')
        })

        it('renders empty traits state', () => {
            const html = renderEmptyTraitsHtml()
            expect(html).toContain(translate('left_panel.no_stats'))
        })

        it('renders trait item with value input, delete button, and escapes XSS', () => {
            const mockStat = {
                getId: (): string => 'st-1',
                getName: (): string => '<img src=x onerror=alert(1)> Strength',
                getValue: (): string => '18',
            }
            const html = renderTraitItemHtml(mockStat)
            expect(html).toContain('&lt;img src=x onerror=alert(1)&gt; Strength')
            expect(html).not.toContain('<img src=x')
            expect(html).toContain('value="18"')
            expect(html).toContain('stat-val-input')
            expect(html).toContain('btn-remove-stat')
        })

        it('handles null safely in renderTraitItemHtml', () => {
            expect(renderTraitItemHtml(null)).toBe('')
        })

        it('renders trait select options', () => {
            const stats = [
                { getId: (): string => 's1', getName: (): string => 'Agility' },
                { getId: (): string => 's2', getName: (): string => 'Intelligence' },
            ]
            const html = renderTraitOptionsHtml(stats)
            expect(html).toContain(translate('details.traits'))
            expect(html).toContain('value="s1">Agility</option>')
            expect(html).toContain('value="s2">Intelligence</option>')
        })

        it('renders assign trait bar', () => {
            const html = renderAssignTraitBarHtml([])
            expect(html).toContain('id="details-add-stat-select"')
            expect(html).toContain('id="btn-details-add-stat"')
            expect(html).toContain(translate('details.add_trait'))
        })

        it('renders full traits module structure', () => {
            const html = renderTraitsModuleHtml(3, [])
            expect(html).toContain('details-stats-list')
            expect(html).toContain('details-add-stat-select')
            expect(html).toContain('3')
        })
    })

    describe('Parameters Module Templates', () => {
        it('renders parameters module header with count and icon', () => {
            const html = renderParametersModuleHeaderHtml(2)
            expect(html).toContain('2')
            expect(html).toContain(translate('details.parameters'))
            expect(html).toContain('<svg')
        })

        it('renders empty parameters state', () => {
            const html = renderEmptyParametersHtml()
            expect(html).toContain(translate('details.no_parameters'))
        })

        it('renders parameter item in direct mode with input', () => {
            const mockParam = {
                getId: (): string => 'p-1',
                getName: (): string => 'Health',
                getMode: (): string => 'direct',
                getValue: (): string => '100',
            }
            const html = renderParameterItemHtml(mockParam)
            expect(html).toContain('Health')
            expect(html).toContain('param-val-input')
            expect(html).toContain('value="100"')
            expect(html).toContain('btn-remove-param')
        })

        it('renders parameter item in formula mode with calculated result badge', () => {
            const mockParam = {
                getId: (): string => 'p-2',
                getName: (): string => 'Mana',
                getMode: (): string => 'formula',
                getFormula: (): string => 'INT * 10',
            }
            const statsMap = { INT: 15 }
            const html = renderParameterItemHtml(mockParam, statsMap)
            expect(html).toContain('Mana')
            expect(html).toContain('= INT * 10')
            expect(html).toContain('(150)')
            expect(html).toContain('bg-rose-950/60')
        })

        it('handles null safely in renderParameterItemHtml', () => {
            expect(renderParameterItemHtml(null)).toBe('')
        })

        it('renders parameter select options', () => {
            const params = [
                { getId: (): string => 'p1', getName: (): string => 'Stamina' },
                { getId: (): string => 'p2', getName: (): string => 'Shield' },
            ]
            const html = renderParameterOptionsHtml(params)
            expect(html).toContain(translate('details.select_parameter'))
            expect(html).toContain('value="p1">Stamina</option>')
            expect(html).toContain('value="p2">Shield</option>')
        })

        it('renders assign parameter bar', () => {
            const html = renderAssignParameterBarHtml([])
            expect(html).toContain('id="details-add-param-select"')
            expect(html).toContain('id="btn-details-add-param"')
            expect(html).toContain(translate('details.add_parameter'))
        })

        it('renders full parameters module structure', () => {
            const html = renderParametersModuleHtml(1, [])
            expect(html).toContain('details-params-list')
            expect(html).toContain('details-add-param-select')
            expect(html).toContain('1')
        })
    })

    describe('Skills Module Templates', () => {
        it('renders skills module header with count and icon', () => {
            const html = renderSkillsModuleHeaderHtml(5)
            expect(html).toContain('5')
            expect(html).toContain(translate('details.skills'))
            expect(html).toContain('<svg')
        })

        it('renders empty skills state', () => {
            const html = renderEmptySkillsHtml()
            expect(html).toContain(translate('details.no_skills'))
        })

        it('renders skill item in direct mode with input', () => {
            const mockSkill = {
                getId: (): string => 'sk-1',
                getName: (): string => 'Archery',
                getMode: (): string => 'direct',
                getValue: (): string => '+2',
            }
            const html = renderSkillItemHtml(mockSkill)
            expect(html).toContain('Archery')
            expect(html).toContain('skill-val-input')
            expect(html).toContain('value="+2"')
            expect(html).toContain('btn-remove-skill')
        })

        it('renders skill item in stat_mod mode with badge', () => {
            const mockSkill = {
                getId: (): string => 'sk-2',
                getName: (): string => 'Stealth',
                getMode: (): string => 'stat_mod',
                getStatName: (): string => 'DEX',
                getModifier: (): string => '+3',
            }
            const html = renderSkillItemHtml(mockSkill)
            expect(html).toContain('Stealth')
            expect(html).toContain('DEX +3')
            expect(html).toContain('bg-blue-950/60')
        })

        it('handles null safely in renderSkillItemHtml', () => {
            expect(renderSkillItemHtml(null)).toBe('')
        })

        it('renders skill select options', () => {
            const skills = [
                { getId: (): string => 'sk1', getName: (): string => 'Tracking' },
                { getId: (): string => 'sk2', getName: (): string => 'Lockpicking' },
            ]
            const html = renderSkillOptionsHtml(skills)
            expect(html).toContain(translate('details.select_skill'))
            expect(html).toContain('value="sk1">Tracking</option>')
            expect(html).toContain('value="sk2">Lockpicking</option>')
        })

        it('renders assign skill bar', () => {
            const html = renderAssignSkillBarHtml([])
            expect(html).toContain('id="details-add-skill-select"')
            expect(html).toContain('id="btn-details-add-skill"')
            expect(html).toContain(translate('details.add_skill'))
        })

        it('renders full skills module structure', () => {
            const html = renderSkillsModuleHtml(2, [])
            expect(html).toContain('details-skills-list')
            expect(html).toContain('details-add-skill-select')
            expect(html).toContain('2')
        })
    })

    describe('Features Module Templates', () => {
        it('renders features module header with count and icon', () => {
            const html = renderFeaturesModuleHeaderHtml(3)
            expect(html).toContain('3')
            expect(html).toContain(translate('details.features'))
            expect(html).toContain('<svg')
        })

        it('renders empty features state', () => {
            const html = renderEmptyFeaturesHtml()
            expect(html).toContain(translate('details.no_features'))
        })

        it('renders feature item with description snippet and delete button', () => {
            const mockFeature = {
                getId: (): string => 'f-1',
                getName: (): string => 'Night Vision',
                getDescription: (): { getText(): string; getSummary(): string } => ({
                    getText: (): string => 'Can see clearly in the dark.',
                    getSummary: (): string => 'Darkvision',
                }),
            }
            const html = renderFeatureItemHtml(mockFeature)
            expect(html).toContain('Night Vision')
            expect(html).toContain('Can see clearly in the dark.')
            expect(html).toContain('btn-remove-feature')
        })

        it('handles null safely in renderFeatureItemHtml', () => {
            expect(renderFeatureItemHtml(null)).toBe('')
        })

        it('renders feature select options', () => {
            const features = [
                { getId: (): string => 'f1', getName: (): string => 'Brave' },
                { getId: (): string => 'f2', getName: (): string => 'Regeneration' },
            ]
            const html = renderFeatureOptionsHtml(features)
            expect(html).toContain(translate('details.select_feature'))
            expect(html).toContain('value="f1">Brave</option>')
            expect(html).toContain('value="f2">Regeneration</option>')
        })

        it('renders assign feature bar', () => {
            const html = renderAssignFeatureBarHtml([])
            expect(html).toContain('id="details-add-feature-select"')
            expect(html).toContain('id="btn-details-add-feature"')
            expect(html).toContain(translate('details.add_feature'))
        })

        it('renders full features module structure', () => {
            const html = renderFeaturesModuleHtml(0, [])
            expect(html).toContain('details-features-list')
            expect(html).toContain('details-add-feature-select')
        })
    })

    describe('renderTraitsModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderTraitsModule(null, {}, 'character', {})).not.toThrow()
            expect(() => renderTraitsModule(container, null, 'character', {})).not.toThrow()
            expect(() => renderTraitsModule(container, {}, 'character', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no traits', () => {
            const entity = {
                getStats: (): unknown[] => [],
                addStat: vi.fn(),
                removeStat: vi.fn(),
            }
            renderTraitsModule(container, entity, 'character', { projectStats: [] })
            expect(container.textContent).toContain(translate('left_panel.no_stats'))
        })

        it('updates trait value on input change and enter key', () => {
            const mockSetValue = vi.fn()
            const stat1 = {
                getId: (): string => 'st-1',
                getName: (): string => 'Strength',
                getValue: (): string => '10',
                setValue: mockSetValue,
            }
            const entity = {
                getStats: (): Array<{
                    getId(): string
                    getName(): string
                    getValue(): string
                    setValue: (v: string) => void
                }> => [stat1],
                addStat: vi.fn(),
                removeStat: vi.fn(),
            }
            const mockRefresh = vi.fn()
            const ctx = {
                projectStats: [stat1],
                refreshActiveSection: mockRefresh,
            }

            renderTraitsModule(container, entity, 'character', ctx)
            const input = container.querySelector('.stat-val-input') as HTMLInputElement
            expect(input).toBeTruthy()
            expect(input.value).toBe('10')

            input.value = '14'
            input.dispatchEvent(new Event('change'))
            expect(mockSetValue).toHaveBeenCalledWith('14')
            expect(mockRefresh).toHaveBeenCalledWith('character')

            input.value = '16'
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
            expect(mockSetValue).toHaveBeenCalledWith('16')
        })

        it('removes trait when remove button is clicked', () => {
            const stat1 = {
                getId: (): string => 'st-1',
                getName: (): string => 'Strength',
                getValue: (): string => '10',
            }
            const entity = {
                getStats: (): Array<{ getId(): string; getName(): string; getValue(): string }> => [
                    stat1,
                ],
                addStat: vi.fn(),
                removeStat: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeStatFromSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectStats: [stat1],
                refreshActiveSection: mockRefresh,
            }

            renderTraitsModule(container, entity, 'character', ctx)
            const removeBtn = container.querySelector('.btn-remove-stat') as HTMLButtonElement
            removeBtn.click()

            expect(mockVm.selection.removeStatFromSelected).toHaveBeenCalledWith('st-1')
            expect(mockRefresh).toHaveBeenCalledWith('character')
        })

        it('adds a trait when selected and add button is clicked', () => {
            const stat1 = {
                getId: (): string => 'st-1',
                getName: (): string => 'Wisdom',
                getValue: (): string => '12',
            }
            const entity = {
                getStats: (): unknown[] => [],
                addStat: vi.fn(),
                removeStat: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addStatToSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectStats: [stat1],
                refreshActiveSection: mockRefresh,
            }

            renderTraitsModule(container, entity, 'character', ctx)
            const select = container.querySelector('#details-add-stat-select') as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-stat') as HTMLButtonElement

            select.value = 'st-1'
            addBtn.click()

            expect(mockVm.selection.addStatToSelected).toHaveBeenCalled()
            expect(mockRefresh).toHaveBeenCalledWith('character')
        })
    })

    describe('renderParametersModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderParametersModule(null, {}, 'character', {})).not.toThrow()
            expect(() => renderParametersModule(container, null, 'character', {})).not.toThrow()
            expect(() => renderParametersModule(container, {}, 'character', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no parameters', () => {
            const entity = {
                getParameters: (): unknown[] => [],
                addParameter: vi.fn(),
                removeParameter: vi.fn(),
            }
            renderParametersModule(container, entity, 'character', { projectParameters: [] })
            expect(container.textContent).toContain(translate('details.no_parameters'))
        })

        it('updates direct parameter value on input change', () => {
            const mockSetValue = vi.fn()
            const param1 = {
                getId: (): string => 'p-1',
                getName: (): string => 'Mana',
                getMode: (): string => 'direct',
                getValue: (): string => '50',
                setValue: mockSetValue,
            }
            const entity = {
                getParameters: (): Array<{
                    getId(): string
                    getName(): string
                    getMode(): string
                    getValue(): string
                    setValue: (v: string) => void
                }> => [param1],
                addParameter: vi.fn(),
                removeParameter: vi.fn(),
            }
            const mockRefresh = vi.fn()
            const ctx = {
                projectParameters: [param1],
                refreshActiveSection: mockRefresh,
            }

            renderParametersModule(container, entity, 'character', ctx)
            const input = container.querySelector('.param-val-input') as HTMLInputElement
            input.value = '75'
            input.dispatchEvent(new Event('change'))

            expect(mockSetValue).toHaveBeenCalledWith('75')
            expect(mockRefresh).toHaveBeenCalledWith('character')
        })

        it('removes parameter when delete button is clicked', () => {
            const param1 = {
                getId: (): string => 'p-1',
                getName: (): string => 'Mana',
                getMode: (): string => 'direct',
            }
            const entity = {
                getParameters: (): Array<{
                    getId(): string
                    getName(): string
                    getMode(): string
                }> => [param1],
                addParameter: vi.fn(),
                removeParameter: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeParameterFromSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectParameters: [param1],
                refreshActiveSection: vi.fn(),
            }

            renderParametersModule(container, entity, 'character', ctx)
            const removeBtn = container.querySelector('.btn-remove-param') as HTMLButtonElement
            removeBtn.click()

            expect(mockVm.selection.removeParameterFromSelected).toHaveBeenCalledWith('p-1')
        })

        it('adds a parameter when selected from dropdown and button is clicked', () => {
            const param1 = {
                getId: (): string => 'p-1',
                getName: (): string => 'Armor',
                getMode: (): string => 'direct',
                getValue: (): string => '20',
            }
            const entity = {
                getParameters: (): unknown[] => [],
                addParameter: vi.fn(),
                removeParameter: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addParameterToSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectParameters: [param1],
                refreshActiveSection: vi.fn(),
            }

            renderParametersModule(container, entity, 'character', ctx)
            const select = container.querySelector('#details-add-param-select') as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-param') as HTMLButtonElement

            select.value = 'p-1'
            addBtn.click()

            expect(mockVm.selection.addParameterToSelected).toHaveBeenCalled()
        })
    })

    describe('renderSkillsModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderSkillsModule(null, {}, 'character', {})).not.toThrow()
            expect(() => renderSkillsModule(container, null, 'character', {})).not.toThrow()
            expect(() => renderSkillsModule(container, {}, 'character', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no skills', () => {
            const entity = {
                getSkills: (): unknown[] => [],
                addSkill: vi.fn(),
                removeSkill: vi.fn(),
            }
            renderSkillsModule(container, entity, 'character', { projectSkills: [] })
            expect(container.textContent).toContain(translate('details.no_skills'))
        })

        it('updates direct skill value on input change', () => {
            const mockSetValue = vi.fn()
            const skill1 = {
                getId: (): string => 'sk-1',
                getName: (): string => 'Stealth',
                getMode: (): string => 'direct',
                getValue: (): string => '+1',
                setValue: mockSetValue,
            }
            const entity = {
                getSkills: (): Array<{
                    getId(): string
                    getName(): string
                    getMode(): string
                    getValue(): string
                    setValue: (v: string) => void
                }> => [skill1],
                addSkill: vi.fn(),
                removeSkill: vi.fn(),
            }
            const mockRefresh = vi.fn()
            const ctx = {
                projectSkills: [skill1],
                refreshActiveSection: mockRefresh,
            }

            renderSkillsModule(container, entity, 'character', ctx)
            const input = container.querySelector('.skill-val-input') as HTMLInputElement
            input.value = '+3'
            input.dispatchEvent(new Event('change'))

            expect(mockSetValue).toHaveBeenCalledWith('+3')
            expect(mockRefresh).toHaveBeenCalledWith('character')
        })

        it('removes skill when delete button is clicked', () => {
            const skill1 = {
                getId: (): string => 'sk-1',
                getName: (): string => 'Stealth',
            }
            const entity = {
                getSkills: (): Array<{ getId(): string; getName(): string }> => [skill1],
                addSkill: vi.fn(),
                removeSkill: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeSkillFromSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectSkills: [skill1],
                refreshActiveSection: vi.fn(),
            }

            renderSkillsModule(container, entity, 'character', ctx)
            const removeBtn = container.querySelector('.btn-remove-skill') as HTMLButtonElement
            removeBtn.click()

            expect(mockVm.selection.removeSkillFromSelected).toHaveBeenCalledWith('sk-1')
        })

        it('adds a skill when selected and button is clicked', () => {
            const skill1 = {
                getId: (): string => 'sk-1',
                getName: (): string => 'Alchemy',
                getMode: (): string => 'direct',
                getValue: (): string => '0',
            }
            const entity = {
                getSkills: (): unknown[] => [],
                addSkill: vi.fn(),
                removeSkill: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addSkillToSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectSkills: [skill1],
                refreshActiveSection: vi.fn(),
            }

            renderSkillsModule(container, entity, 'character', ctx)
            const select = container.querySelector('#details-add-skill-select') as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-skill') as HTMLButtonElement

            select.value = 'sk-1'
            addBtn.click()

            expect(mockVm.selection.addSkillToSelected).toHaveBeenCalled()
        })
    })

    describe('renderFeaturesModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderFeaturesModule(null, {}, 'character', {})).not.toThrow()
            expect(() => renderFeaturesModule(container, null, 'character', {})).not.toThrow()
            expect(() => renderFeaturesModule(container, {}, 'character', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no features', () => {
            const entity = {
                getFeatures: (): unknown[] => [],
                addFeature: vi.fn(),
                removeFeature: vi.fn(),
            }
            renderFeaturesModule(container, entity, 'character', { projectFeatures: [] })
            expect(container.textContent).toContain(translate('details.no_features'))
        })

        it('removes feature when delete button is clicked', () => {
            const feat1 = {
                getId: (): string => 'f-1',
                getName: (): string => 'Tough Skin',
            }
            const entity = {
                getFeatures: (): Array<{ getId(): string; getName(): string }> => [feat1],
                addFeature: vi.fn(),
                removeFeature: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeFeatureFromSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectFeatures: [feat1],
                refreshActiveSection: vi.fn(),
            }

            renderFeaturesModule(container, entity, 'character', ctx)
            const removeBtn = container.querySelector('.btn-remove-feature') as HTMLButtonElement
            removeBtn.click()

            expect(mockVm.selection.removeFeatureFromSelected).toHaveBeenCalledWith('f-1')
        })

        it('adds a feature when selected and button is clicked', () => {
            const feat1 = {
                getId: (): string => 'f-1',
                getName: (): string => 'Tough Skin',
            }
            const entity = {
                getFeatures: (): unknown[] => [],
                addFeature: vi.fn(),
                removeFeature: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addFeatureToSelected: vi.fn(),
                },
            }
            const ctx = {
                vm: mockVm,
                projectFeatures: [feat1],
                refreshActiveSection: vi.fn(),
            }

            renderFeaturesModule(container, entity, 'character', ctx)
            const select = container.querySelector(
                '#details-add-feature-select'
            ) as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-feature') as HTMLButtonElement

            select.value = 'f-1'
            addBtn.click()

            expect(mockVm.selection.addFeatureToSelected).toHaveBeenCalled()
        })
    })

    describe('Multilingual i18n support', () => {
        it('renders proper translations in PL, EN, and DE', () => {
            initTranslationsWithLocale('pl')
            expect(renderTraitsModuleHeaderHtml(0)).toContain('Cechy')
            expect(renderParametersModuleHeaderHtml(0)).toContain('Parametry')
            expect(renderSkillsModuleHeaderHtml(0)).toContain('Umiejętności')
            expect(renderFeaturesModuleHeaderHtml(0)).toContain('Przymioty specjalne')
            expect(renderEmptyTraitsHtml()).toContain('Brak cech bazowych w projekcie')
            expect(renderEmptyParametersHtml()).toContain('Brak przypisanych parametrów')
            expect(renderEmptySkillsHtml()).toContain('Brak przypisanych umiejętności')
            expect(renderEmptyFeaturesHtml()).toContain('Brak przypisanych przymiotów')

            initTranslationsWithLocale('de')
            expect(renderTraitsModuleHeaderHtml(0)).toContain('Merkmale & Werte')
            expect(renderParametersModuleHeaderHtml(0)).toContain('Vitalparameter')
            expect(renderSkillsModuleHeaderHtml(0)).toContain('Fertigkeiten')
            expect(renderFeaturesModuleHeaderHtml(0)).toContain('Spezielle Eigenschaften')
            expect(renderEmptyTraitsHtml()).toContain('Keine Basiswerte im Projekt')
            expect(renderEmptyParametersHtml()).toContain('Keine zugewiesenen Parameter')
            expect(renderEmptySkillsHtml()).toContain('Keine zugewiesenen Fertigkeiten')
            expect(renderEmptyFeaturesHtml()).toContain('Keine zugewiesenen Eigenschaften')
        })
    })
})
