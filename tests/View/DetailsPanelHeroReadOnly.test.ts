// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { renderHeroReadOnlyDetails as renderHeroReadOnlyDetailsRoot } from '../../View/ui/detailsPanel/heroReadOnlyDetails.js'
import {
    renderHeroAvatarPreviewHtml,
    renderHeroAvatarSectionHtml,
    renderHeroBaseStatItemHtml,
    renderHeroBaseStatsSectionHtml,
    renderHeroBottomEditButtonHtml,
    renderHeroCustomAttributesSectionHtml,
    renderHeroHeaderSectionHtml,
    renderHeroInventoriesSectionHtml,
    renderHeroInventoryCardHtml,
    renderHeroNameSectionHtml,
    renderHeroParameterItemHtml,
    renderHeroReadOnlyDetails,
    renderHeroSkillItemHtml,
    renderHeroSkillsSectionHtml,
    renderHeroSummarySectionHtml,
    renderHeroTagsSectionHtml,
    renderHeroTopEditButtonHtml,
    renderHeroVitalsSectionHtml,
} from '../../View/ui/detailsPanel/readonly/heroReadOnlyDetails.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)

describe('heroReadOnlyDetails', () => {
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

    it('exports renderHeroReadOnlyDetails identically from root facade and readonly submodule', () => {
        expect(renderHeroReadOnlyDetails).toBeDefined()
        expect(renderHeroReadOnlyDetailsRoot).toBe(renderHeroReadOnlyDetails)
    })

    describe('pure template functions', () => {
        it('renders hero header section HTML with proper badge', () => {
            const html = renderHeroHeaderSectionHtml({
                type: 'player_character',
                typeLabel: 'Bohater gracza',
                id: 'hero_1',
            })
            expect(html).toContain('Bohater gracza')
            expect(html).toContain('hero_1')
            expect(html).toContain('Typ')
        })

        it('renders top and bottom edit buttons HTML with SVG icons', () => {
            const topHtml = renderHeroTopEditButtonHtml({ editBtnText: 'Edytuj bohatera' })
            expect(topHtml).toContain('id="btn-details-edit-hero"')
            expect(topHtml).toContain('Edytuj bohatera')
            expect(topHtml).toContain('<svg')

            const bottomHtml = renderHeroBottomEditButtonHtml({ editBtnText: 'Edytuj bohatera' })
            expect(bottomHtml).toContain('id="btn-details-bottom-edit-hero"')
            expect(bottomHtml).toContain('Edytuj bohatera')
            expect(bottomHtml).toContain('<svg')
        })

        it('renders custom avatar preview vs preset avatar preview vs fallback', () => {
            const customPreview = renderHeroAvatarPreviewHtml(
                'data:image/png;base64,123',
                true,
                null
            )
            expect(customPreview).toContain('<img src="data:image/png;base64,123"')

            const presetPreview = renderHeroAvatarPreviewHtml('avatar_warrior', false, {
                svg: '<svg class="avatar-svg"></svg>',
                bgColor: '#27272a',
                color: '#fbbf24',
            })
            expect(presetPreview).toContain('class="avatar-svg"')

            const fallbackPreview = renderHeroAvatarPreviewHtml('', false, null)
            expect(fallbackPreview).toContain('<svg')
        })

        it('renders avatar section with title, subtitle and category', () => {
            const html = renderHeroAvatarSectionHtml({
                avatarVal: 'warrior',
                isCustomAvatar: false,
                avatarPreset: { category: 'combat' },
                avatarCategoryLabel: 'Bojowe',
                avatarTitle: 'Wojownik',
                avatarSubtitle: 'avatar_warrior_1',
            })
            expect(html).toContain('Awatar postaci')
            expect(html).toContain('Wojownik')
            expect(html).toContain('avatar_warrior_1')
            expect(html).toContain('Bojowe')
        })

        it('renders name section with escaped HTML', () => {
            const html = renderHeroNameSectionHtml({ entityName: 'Geralt <Wiedźmin>' })
            expect(html).toContain('Geralt &lt;Wiedźmin&gt;')
            expect(html).toContain('id="details-name-display"')
        })

        it('renders summary and narrative chronicle sections', () => {
            const html = renderHeroSummarySectionHtml({
                currentSummary: 'Dzielny wojownik ze stolicy.',
                currentNarrative: 'Pełna historia podróżnika przez mroczne puszcze...',
            })
            expect(html).toContain('Dzielny wojownik ze stolicy.')
            expect(html).toContain('Pełna historia podróżnika przez mroczne puszcze...')

            const emptyHtml = renderHeroSummarySectionHtml({
                currentSummary: '',
                currentNarrative: '',
            })
            expect(emptyHtml).toContain('Brak streszczenia')
        })

        it('renders tags section with count and chips', () => {
            const chips = '<span class="tag-chip">#hero</span>'
            const html = renderHeroTagsSectionHtml({ tagsCount: 1, tagsChipsHtml: chips })
            expect(html).toContain('Tagi')
            expect(html).toContain('#hero')

            const emptyHtml = renderHeroTagsSectionHtml({ tagsCount: 0, tagsChipsHtml: '' })
            expect(emptyHtml).toContain(translate('details.no_tags'))
        })

        it('renders base stats item and container', () => {
            const itemHtml = renderHeroBaseStatItemHtml('Siła', 18)
            expect(itemHtml).toContain('Siła')
            expect(itemHtml).toContain('18')

            const secHtml = renderHeroBaseStatsSectionHtml({
                statsCount: 1,
                statsItemsHtml: itemHtml,
            })
            expect(secHtml).toContain('Cechy Główne')
            expect(secHtml).toContain('Siła')

            const emptySec = renderHeroBaseStatsSectionHtml({ statsCount: 0, statsItemsHtml: '' })
            expect(emptySec).toContain('Brak zdefiniowanych cech')
        })

        it('renders parameter item direct and formula calculated', () => {
            const directItem = renderHeroParameterItemHtml(
                {
                    getName: (): string => 'Punkty Życia',
                    getMode: (): string => 'direct',
                    getValue: (): number => 100,
                },
                {}
            )
            expect(directItem).toContain('Punkty Życia')
            expect(directItem).toContain('100')

            const formulaItem = renderHeroParameterItemHtml(
                {
                    getName: (): string => 'Mana',
                    getMode: (): string => 'formula',
                    getFormula: (): string => 'INT * 5',
                },
                { INT: 10 }
            )
            expect(formulaItem).toContain('Mana')
            expect(formulaItem).toContain('INT * 5')
            expect(formulaItem).toContain('(50)')

            const secHtml = renderHeroVitalsSectionHtml({
                paramsCount: 2,
                paramsItemsHtml: directItem + formulaItem,
            })
            expect(secHtml).toContain('Parametry Życiowe')
            expect(secHtml).toContain('Mana')

            const emptyVitals = renderHeroVitalsSectionHtml({
                paramsCount: 0,
                paramsItemsHtml: '',
            })
            expect(emptyVitals).toContain('Brak przypisanych parametrów')
        })

        it('renders skills item direct, stat modifier, and section container', () => {
            const directSkill = renderHeroSkillItemHtml({
                getName: (): string => 'Wspinaczka',
                getMode: (): string => 'direct',
                getValue: (): number => 4,
            })
            expect(directSkill).toContain('Wspinaczka')
            expect(directSkill).toContain('4')

            const modSkill = renderHeroSkillItemHtml({
                getName: (): string => 'Skradanie',
                getMode: (): string => 'stat_mod',
                getStatName: (): string => 'ZRĘ',
                getModifier: (): string => '+2',
            })
            expect(modSkill).toContain('Skradanie')
            expect(modSkill).toContain('ZRĘ')
            expect(modSkill).toContain('+2')

            const secHtml = renderHeroSkillsSectionHtml({
                skillsCount: 2,
                skillsItemsHtml: directSkill + modSkill,
            })
            expect(secHtml).toContain('Umiejętności')
            expect(secHtml).toContain('Skradanie')

            const emptySkills = renderHeroSkillsSectionHtml({
                skillsCount: 0,
                skillsItemsHtml: '',
            })
            expect(emptySkills).toContain('Brak przypisanych umiejętności')
        })

        it('renders inventory card, items, and inventories section', () => {
            const inv = {
                getName: (): string => 'Plecak podróżny',
                getCapacity: (): number => 10,
                getItems: (): Array<{ getName: () => string; getSlotSize: () => number }> => [
                    { getName: (): string => 'Pochodnia', getSlotSize: (): number => 1 },
                    { getName: (): string => 'Miecz oburęczny', getSlotSize: (): number => 2 },
                ],
            }
            const cardHtml = renderHeroInventoryCardHtml(inv)
            expect(cardHtml).toContain('Plecak podróżny')
            expect(cardHtml).toContain('2 / 10')
            expect(cardHtml).toContain('Pochodnia')
            expect(cardHtml).toContain('Miecz oburęczny')
            expect(cardHtml).toContain('(2)')

            const secHtml = renderHeroInventoriesSectionHtml({
                invCount: 1,
                invCardsHtml: cardHtml,
            })
            expect(secHtml).toContain('Ekwipunki i Przedmioty')
            expect(secHtml).toContain('Plecak podróżny')

            const emptyInv = renderHeroInventoriesSectionHtml({
                invCount: 0,
                invCardsHtml: '',
            })
            expect(emptyInv).toContain(translate('hero.empty_inventories'))
        })

        it('renders custom attributes section and empty fallback', () => {
            const rowsHtml = '<div><span>Rasa</span>:<span>Elf</span></div>'
            const secHtml = renderHeroCustomAttributesSectionHtml({
                attrsCount: 1,
                attrsRowsHtml: rowsHtml,
            })
            expect(secHtml).toContain('Cechy Tożsamości')
            expect(secHtml).toContain('Elf')

            const emptyAttrs = renderHeroCustomAttributesSectionHtml({
                attrsCount: 0,
                attrsRowsHtml: '',
            })
            expect(emptyAttrs).toContain('Brak atrybutów niestandardowych')
        })
    })

    describe('renderHeroReadOnlyDetails controller', () => {
        const createMockHeroEntity = (): {
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
            getInventories: () => Array<{
                getName: () => string
                getCapacity: () => number
                getItems: () => Array<{
                    getId: () => string
                    getName: () => string
                    getSlotSize: () => number
                }>
            }>
            getCustomAttributes: () => Array<{ name: string; value: string }>
            getDescription: () => { getSummary: () => string; getText: () => string }
        } => ({
            getId: (): string => 'hero_main',
            getName: (): string => 'Elrond',
            getAvatar: (): string => 'avatar_warrior',
            getTags: (): Array<{ getName: () => string; getColor: () => string }> => [
                { getName: (): string => 'elf', getColor: (): string => '#10b981' },
            ],
            getStats: (): Array<{ getName: () => string; getValue: () => number }> => [
                { getName: (): string => 'Siła', getValue: (): number => 14 },
            ],
            getParameters: (): Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }> => [
                {
                    getName: (): string => 'Zdrowie',
                    getValue: (): number => 50,
                    getMode: (): string => 'direct',
                },
            ],
            getSkills: (): Array<{
                getName: () => string
                getValue: () => number
                getMode: () => string
            }> => [
                {
                    getName: (): string => 'Łucznictwo',
                    getValue: (): number => 8,
                    getMode: (): string => 'direct',
                },
            ],
            getInventories: (): Array<{
                getName: () => string
                getCapacity: () => number
                getItems: () => Array<{
                    getId: () => string
                    getName: () => string
                    getSlotSize: () => number
                }>
            }> => [
                {
                    getName: (): string => 'Sakwa',
                    getCapacity: (): number => 5,
                    getItems: (): Array<{
                        getId: () => string
                        getName: () => string
                        getSlotSize: () => number
                    }> => [
                        {
                            getId: (): string => 'it_arrow',
                            getName: (): string => 'Strzała',
                            getSlotSize: (): number => 1,
                        },
                    ],
                },
            ],
            getCustomAttributes: (): Array<{ name: string; value: string }> => [
                { name: 'Rasa', value: 'Elf' },
            ],
            getDescription: (): { getSummary: () => string; getText: () => string } => ({
                getSummary: (): string => 'Strażnik lasu',
                getText: (): string => 'Urodzony w Rivendell',
            }),
        })

        it('renders all 12 modules cleanly into container', () => {
            const entity = createMockHeroEntity()
            const ctx = {
                openHeroModal: vi.fn(),
                selectEntity: vi.fn(),
                projectItems: [],
            }

            renderHeroReadOnlyDetails(
                container,
                entity,
                { id: 'hero_main', name: 'Elrond' },
                'player_character',
                ctx
            )

            expect(container.textContent).toContain('Elrond')
            expect(container.textContent).toContain('Strażnik lasu')
            expect(container.textContent).toContain('#elf')
            expect(container.textContent).toContain('Siła')
            expect(container.textContent).toContain('14')
            expect(container.textContent).toContain('Zdrowie')
            expect(container.textContent).toContain('Łucznictwo')
            expect(container.textContent).toContain('Sakwa')
            expect(container.textContent).toContain('Strzała')
            expect(container.textContent).toContain('Rasa')
            expect(container.textContent).toContain('Elf')
        })

        it('triggers openHeroModal on top and bottom edit button click', () => {
            const entity = createMockHeroEntity()
            const openModalMock = vi.fn()
            const ctx = {
                openHeroModal: openModalMock,
                selectEntity: vi.fn(),
                projectItems: [],
            }

            renderHeroReadOnlyDetails(
                container,
                entity,
                { id: 'hero_main', name: 'Elrond' },
                'player_character',
                ctx
            )

            const topBtn = container.querySelector(
                '#btn-details-edit-hero'
            ) as HTMLButtonElement | null
            expect(topBtn).not.toBeNull()
            topBtn?.click()
            expect(openModalMock).toHaveBeenCalledTimes(1)

            const bottomBtn = container.querySelector(
                '#btn-details-bottom-edit-hero'
            ) as HTMLButtonElement | null
            expect(bottomBtn).not.toBeNull()
            bottomBtn?.click()
            expect(openModalMock).toHaveBeenCalledTimes(2)
        })

        it('selects item in workspace when clicking inspect button in inventory', () => {
            const entity = createMockHeroEntity()
            const selectEntityMock = vi.fn()
            const arrowItem = { id: 'it_arrow', name: 'Strzała' }
            const ctx = {
                openHeroModal: vi.fn(),
                selectEntity: selectEntityMock,
                projectItems: [arrowItem],
            }

            renderHeroReadOnlyDetails(
                container,
                entity,
                { id: 'hero_main', name: 'Elrond' },
                'player_character',
                ctx
            )

            const inspectItemBtn = container.querySelector(
                '.btn-hero-inspect-item'
            ) as HTMLButtonElement | null
            expect(inspectItemBtn).not.toBeNull()
            inspectItemBtn?.click()

            expect(selectEntityMock).toHaveBeenCalledWith(arrowItem, 'item')
        })

        it('renders with English and German translations without hardcoded Polish', async () => {
            const entity = createMockHeroEntity()
            const ctx = { openHeroModal: vi.fn(), selectEntity: vi.fn() }

            // English
            await initTranslationsWithLocale('en')
            container.innerHTML = ''
            renderHeroReadOnlyDetails(
                container,
                entity,
                { id: 'hero_main', name: 'Elrond' },
                'player_character',
                ctx
            )
            expect(container.textContent).toContain(translate('hero.base_stats'))
            expect(container.textContent).toContain(translate('hero.vitals'))
            expect(container.textContent).toContain(translate('details.type_player_character'))

            // German
            await initTranslationsWithLocale('de')
            container.innerHTML = ''
            renderHeroReadOnlyDetails(
                container,
                entity,
                { id: 'hero_main', name: 'Elrond' },
                'player_character',
                ctx
            )
            expect(container.textContent).toContain(translate('hero.base_stats'))
            expect(container.textContent).toContain(translate('hero.vitals'))
            expect(container.textContent).toContain(translate('details.type_player_character'))
        })
    })
})
