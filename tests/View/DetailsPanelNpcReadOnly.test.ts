// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { renderNpcReadOnlyDetails as renderNpcReadOnlyDetailsRoot } from '../../View/ui/detailsPanel/npcReadOnlyDetails.js'
import * as ReadonlyModule from '../../View/ui/detailsPanel/readonly/index.js'
import {
    renderNpcAvatarSectionHtml,
    renderNpcBaseStatItemHtml,
    renderNpcBaseStatsSectionHtml,
    renderNpcBottomActionsSectionHtml,
    renderNpcCustomAttributesSectionHtml,
    renderNpcFeatureItemHtml,
    renderNpcFeaturesSectionHtml,
    renderNpcHeaderSectionHtml,
    renderNpcNameSectionHtml,
    renderNpcParameterItemHtml,
    renderNpcReadOnlyDetails,
    renderNpcSkillItemHtml,
    renderNpcSkillsSectionHtml,
    renderNpcSummarySectionHtml,
    renderNpcTagsSectionHtml,
    renderNpcTopEditButtonHtml,
    renderNpcVitalsSectionHtml,
} from '../../View/ui/detailsPanel/readonly/npcReadOnlyDetails.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)

describe('npcReadOnlyDetails & readonly index', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
        document.body.innerHTML = ''
    })

    it('exports renderNpcReadOnlyDetails identically from root facade, submodule, and readonly index', () => {
        expect(renderNpcReadOnlyDetails).toBeDefined()
        expect(renderNpcReadOnlyDetailsRoot).toBe(renderNpcReadOnlyDetails)
        expect(ReadonlyModule.renderNpcReadOnlyDetails).toBe(renderNpcReadOnlyDetails)
        expect(ReadonlyModule.renderHeroReadOnlyDetails).toBeDefined()
    })

    describe('pure template functions', () => {
        it('renders NPC header section HTML with badge and ID', () => {
            const html = renderNpcHeaderSectionHtml({
                type: 'character',
                typeLabel: 'Postać',
                id: 'npc_1',
            })
            expect(html).toContain('Postać')
            expect(html).toContain('npc_1')
            expect(html).toContain('Typ')
        })

        it('renders top edit button with SVG icon', () => {
            const html = renderNpcTopEditButtonHtml({ editBtnText: 'Edytuj postać' })
            expect(html).toContain('id="btn-details-edit-npc"')
            expect(html).toContain('Edytuj postać')
            expect(html).toContain('<svg')
        })

        it('renders avatar section with preview and metadata', () => {
            const html = renderNpcAvatarSectionHtml({
                avatarVal: 'warrior',
                avatarPreset: {
                    id: 'warrior',
                    name: 'Wojownik',
                    category: 'combat',
                    svg: '<svg class="warrior-svg"></svg>',
                    bgColor: '#27272a',
                    color: '#38bdf8',
                    borderColor: '#0284c7',
                },
            })
            expect(html).toContain('Awatar postaci')
            expect(html).toContain('Wojownik')
            expect(html).toContain('combat')
            expect(html).toContain('warrior-svg')
        })

        it('renders name section with escaped HTML', () => {
            const html = renderNpcNameSectionHtml({ entityName: 'Karczmarz <Barmir>' })
            expect(html).toContain('Karczmarz &lt;Barmir&gt;')
            expect(html).toContain('id="details-name-display"')
        })

        it('renders summary and narrative sections', () => {
            const html = renderNpcSummarySectionHtml({
                currentSummary: 'Właściciel tawerny.',
                currentNarrative: 'Przybysz z dalekich krain...',
            })
            expect(html).toContain('Właściciel tawerny.')
            expect(html).toContain('Przybysz z dalekich krain...')

            const emptyHtml = renderNpcSummarySectionHtml({
                currentSummary: '',
                currentNarrative: '',
            })
            expect(emptyHtml).toContain(translate('details.no_summary'))
        })

        it('renders tags section and empty fallback', () => {
            const chips = '<span class="tag-chip">#npc</span>'
            const html = renderNpcTagsSectionHtml({ tagsCount: 1, tagsChipsHtml: chips })
            expect(html).toContain('Tagi')
            expect(html).toContain('#npc')

            const emptyHtml = renderNpcTagsSectionHtml({ tagsCount: 0, tagsChipsHtml: '' })
            expect(emptyHtml).toContain(translate('left_panel.no_tags'))
        })

        it('renders base stats item and container', () => {
            const itemHtml = renderNpcBaseStatItemHtml('Zręczność', 16)
            expect(itemHtml).toContain('Zręczność')
            expect(itemHtml).toContain('16')

            const secHtml = renderNpcBaseStatsSectionHtml({
                statsCount: 1,
                statsItemsHtml: itemHtml,
            })
            expect(secHtml).toContain(translate('details.traits'))
            expect(secHtml).toContain('Zręczność')

            const emptySec = renderNpcBaseStatsSectionHtml({ statsCount: 0, statsItemsHtml: '' })
            expect(emptySec).toContain(translate('details.no_traits'))
        })

        it('renders parameter item direct and formula calculated', () => {
            const directItem = renderNpcParameterItemHtml(
                {
                    getName: (): string => 'Wytrzymałość',
                    getMode: (): string => 'direct',
                    getValue: (): number => 80,
                },
                {}
            )
            expect(directItem).toContain('Wytrzymałość')
            expect(directItem).toContain('80')

            const formulaItem = renderNpcParameterItemHtml(
                {
                    getName: (): string => 'Pancerz',
                    getMode: (): string => 'formula',
                    getFormula: (): string => 'DEF * 2',
                },
                { DEF: 5 }
            )
            expect(formulaItem).toContain('Pancerz')
            expect(formulaItem).toContain('DEF * 2')
            expect(formulaItem).toContain('(10)')

            const secHtml = renderNpcVitalsSectionHtml({
                paramsCount: 2,
                paramsItemsHtml: directItem + formulaItem,
            })
            expect(secHtml).toContain(translate('details.parameters'))
            expect(secHtml).toContain('Pancerz')

            const emptySec = renderNpcVitalsSectionHtml({ paramsCount: 0, paramsItemsHtml: '' })
            expect(emptySec).toContain(translate('details.no_parameters'))
        })

        it('renders skills item direct and stat modifier', () => {
            const directSkill = renderNpcSkillItemHtml({
                getName: (): string => 'Perswazja',
                getMode: (): string => 'direct',
                getValue: (): number => 6,
            })
            expect(directSkill).toContain('Perswazja')
            expect(directSkill).toContain('6')

            const modSkill = renderNpcSkillItemHtml({
                getName: (): string => 'Zastraszanie',
                getMode: (): string => 'stat_mod',
                getStatName: (): string => 'SIŁ',
                getModifier: (): string => '+3',
            })
            expect(modSkill).toContain('Zastraszanie')
            expect(modSkill).toContain('SIŁ')
            expect(modSkill).toContain('+3')

            const secHtml = renderNpcSkillsSectionHtml({
                skillsCount: 2,
                skillsItemsHtml: directSkill + modSkill,
            })
            expect(secHtml).toContain(translate('details.skills'))
            expect(secHtml).toContain('Zastraszanie')

            const emptySec = renderNpcSkillsSectionHtml({ skillsCount: 0, skillsItemsHtml: '' })
            expect(emptySec).toContain(translate('details.no_skills'))
        })

        it('renders feature item and features section with value and standalone name', () => {
            const featHtml = renderNpcFeatureItemHtml({
                getName: (): string => 'Nocne widzenie',
                getDescription: (): { getText: () => string } => ({
                    getText: (): string => 'Widzi w całkowitych ciemnościach.',
                }),
            })
            expect(featHtml).toContain('Nocne widzenie')
            expect(featHtml).toContain('Widzi w całkowitych ciemnościach.')

            const valFeatHtml = renderNpcFeatureItemHtml({
                getName: (): string => 'Pochodzenie',
                getValue: (): string => 'Miasto',
            })
            expect(valFeatHtml).toContain('Pochodzenie')
            expect(valFeatHtml).toContain('Miasto')

            const standaloneFeatHtml = renderNpcFeatureItemHtml({
                getName: (): string => 'Utalentowany',
            })
            expect(standaloneFeatHtml).toContain('Utalentowany')

            const secHtml = renderNpcFeaturesSectionHtml({
                featuresCount: 1,
                featuresItemsHtml: featHtml,
            })
            expect(secHtml).toContain(translate('details.features'))
            expect(secHtml).toContain('Nocne widzenie')

            const emptySec = renderNpcFeaturesSectionHtml({
                featuresCount: 0,
                featuresItemsHtml: '',
            })
            expect(emptySec).toContain(translate('details.no_features'))
        })

        it('renders custom attributes section and empty fallback', () => {
            const rowsHtml = '<div><span>Frakcja</span>:<span>Straż Miejska</span></div>'
            const secHtml = renderNpcCustomAttributesSectionHtml({
                attrsCount: 1,
                attrsRowsHtml: rowsHtml,
            })
            expect(secHtml).toContain(translate('details.custom_attributes'))
            expect(secHtml).toContain('Straż Miejska')

            const emptySec = renderNpcCustomAttributesSectionHtml({
                attrsCount: 0,
                attrsRowsHtml: '',
            })
            expect(emptySec).toContain(translate('details.no_custom_attributes'))
        })

        it('renders bottom actions section for character (with show graph button)', () => {
            const html = renderNpcBottomActionsSectionHtml({
                type: 'character',
                editLabel: 'Edytuj postać',
            })
            expect(html).toContain('id="btn-details-bottom-edit-npc"')
            expect(html).toContain('id="btn-details-show-graph"')
            expect(html).toContain(translate('right_panel.show_story_graph'))
        })

        it('renders bottom actions section for template (with create character from template button)', () => {
            const html = renderNpcBottomActionsSectionHtml({
                type: 'template',
                editLabel: 'Edytuj szablon',
            })
            expect(html).toContain('id="btn-details-bottom-edit-npc"')
            expect(html).toContain('id="btn-details-create-npc-from-template"')
            expect(html).toContain(translate('details.create_character_from_template'))
        })
    })

    describe('renderNpcReadOnlyDetails controller', () => {
        const createMockNpc = (
            type = 'character'
        ): {
            getId: () => string
            getName: () => string
            getAvatar: () => string
            getTags: () => Array<{ getName: () => string; getColor: () => string }>
            getStats: () => Array<{ getName: () => string; getValue: () => number }>
            getParameters: () => Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }>
            getSkills: () => Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }>
            getFeatures: () => Array<{
                getName: () => string
                getDescription: () => { getText: () => string }
            }>
            getCustomAttributes: () => Array<{ name: string; value: string }>
            getDescription: () => { getSummary: () => string; getText: () => string }
        } => ({
            getId: (): string => (type === 'template' ? 'tpl_guard' : 'npc_guard_1'),
            getName: (): string => (type === 'template' ? 'Szablon Strażnika' : 'Strażnik Jan'),
            getAvatar: (): string => 'guard',
            getTags: (): Array<{ getName: () => string; getColor: () => string }> => [
                { getName: (): string => 'straz', getColor: (): string => '#3b82f6' },
            ],
            getStats: (): Array<{ getName: () => string; getValue: () => number }> => [
                { getName: (): string => 'Siła', getValue: (): number => 12 },
            ],
            getParameters: (): Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }> => [
                {
                    getName: (): string => 'Zdrowie',
                    getValue: (): number => 40,
                    getMode: (): string => 'direct',
                },
            ],
            getSkills: (): Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }> => [
                {
                    getName: (): string => 'Walka wręcz',
                    getValue: (): number => 5,
                    getMode: (): string => 'direct',
                },
            ],
            getFeatures: (): Array<{
                getName: () => string
                getDescription: () => { getText: () => string }
            }> => [
                {
                    getName: (): string => 'Czujność',
                    getDescription: (): { getText: () => string } => ({
                        getText: (): string => 'Trudno go zaskoczyć',
                    }),
                },
            ],
            getCustomAttributes: (): Array<{ name: string; value: string }> => [
                { name: 'Ranga', value: 'Sierżant' },
            ],
            getDescription: (): { getSummary: () => string; getText: () => string } => ({
                getSummary: (): string => 'Doświadczony obrońca bramy miejskiej.',
                getText: (): string => 'Służy w straży miejskiej od dwudziestu lat.',
            }),
        })

        it('renders character details and binds edit and show graph buttons', () => {
            const entity = createMockNpc('character')
            const openModalMock = vi.fn()
            const setActiveMainViewMock = vi.fn()
            const updateMainWorkspaceUIMock = vi.fn()
            const focusOnElementMock = vi.fn()

            const ctx = {
                openNpcModal: openModalMock,
                vm: {
                    layout: {
                        setActiveMainView: setActiveMainViewMock,
                    },
                },
                updateMainWorkspaceUI: updateMainWorkspaceUIMock,
                storyGraphInstance: {
                    focusOnElement: focusOnElementMock,
                },
            }

            renderNpcReadOnlyDetails(
                container,
                entity,
                { id: 'npc_guard_1', name: 'Strażnik Jan' },
                'character',
                ctx
            )

            expect(container.textContent).toContain('Strażnik Jan')
            expect(container.textContent).toContain('Doświadczony obrońca bramy miejskiej.')
            expect(container.textContent).toContain('#straz')
            expect(container.textContent).toContain('Siła')
            expect(container.textContent).toContain('12')
            expect(container.textContent).toContain('Czujność')
            expect(container.textContent).toContain('Sierżant')

            // Test top and bottom edit buttons
            const topBtn = container.querySelector(
                '#btn-details-edit-npc'
            ) as HTMLButtonElement | null
            topBtn?.click()
            expect(openModalMock).toHaveBeenCalledWith({ mode: 'character', editEntity: entity })

            const bottomBtn = container.querySelector(
                '#btn-details-bottom-edit-npc'
            ) as HTMLButtonElement | null
            bottomBtn?.click()
            expect(openModalMock).toHaveBeenCalledTimes(2)

            // Test show graph button
            const graphBtn = container.querySelector(
                '#btn-details-show-graph'
            ) as HTMLButtonElement | null
            graphBtn?.click()
            expect(setActiveMainViewMock).toHaveBeenCalledWith('graph')
            expect(updateMainWorkspaceUIMock).toHaveBeenCalled()
            expect(focusOnElementMock).toHaveBeenCalledWith('npc_guard_1')
        })

        it('renders template details and triggers create character from template', () => {
            const entity = createMockNpc('template')
            const openModalMock = vi.fn()

            const ctx = {
                openNpcModal: openModalMock,
            }

            renderNpcReadOnlyDetails(
                container,
                entity,
                { id: 'tpl_guard', name: 'Szablon Strażnika' },
                'template',
                ctx
            )

            expect(container.textContent).toContain('Szablon Strażnika')

            const createBtn = container.querySelector(
                '#btn-details-create-npc-from-template'
            ) as HTMLButtonElement | null
            expect(createBtn).not.toBeNull()
            createBtn?.click()
            expect(openModalMock).toHaveBeenCalledWith({
                mode: 'character',
                templateId: 'tpl_guard',
            })
        })

        it('renders with English and German translations without hardcoded Polish', async () => {
            const entity = createMockNpc('character')
            const ctx = { openNpcModal: vi.fn() }

            // English
            await initTranslationsWithLocale('en')
            container.innerHTML = ''
            renderNpcReadOnlyDetails(
                container,
                entity,
                { id: 'npc_guard_1', name: 'Guard John' },
                'character',
                ctx
            )
            expect(container.textContent).toContain(translate('details.traits'))
            expect(container.textContent).toContain(translate('details.parameters'))
            expect(container.textContent).toContain(translate('details.skills'))

            // German
            await initTranslationsWithLocale('de')
            container.innerHTML = ''
            renderNpcReadOnlyDetails(
                container,
                entity,
                { id: 'npc_guard_1', name: 'Wache Johannes' },
                'character',
                ctx
            )
            expect(container.textContent).toContain(translate('details.traits'))
            expect(container.textContent).toContain(translate('details.parameters'))
            expect(container.textContent).toContain(translate('details.skills'))
        })
    })
})
