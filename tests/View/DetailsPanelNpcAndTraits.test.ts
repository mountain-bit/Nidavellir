// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { initTranslationsWithLocale } from '../../Utils/translate'
import { renderDetailsPanel, renderHistoryBar } from '../../View/ui/detailsPanel/detailsPanel.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectParagraphs: unknown[]
    projectScenes: unknown[]
    projectCharacters: NPC[]
    projectTemplates?: NPC_Template[]
    projectLocations: unknown[]
    projectStats: Stat[]
    projectParameters: Parameter[]
    projectSkills: Skill[]
    projectFeatures: Feature[]
    projectTags: Tag[]
    selectEntity: (item: unknown, type: string) => void
    renderCharactersList: () => void
    renderTraitsList: () => void
    renderConnectionsList: () => void
    renderParagraphsList: () => void
    updateMainWorkspaceUI: () => void
    refreshActiveSection: (type: string) => void
    openNarrativeEditor: (filePath: string, title: string) => void
    openNpcModal?: (options?: unknown) => void
    storyGraphInstance: { render: (force: boolean) => void; focusOnElement: (id: string) => void }
}

describe('DetailsPanel - NPC and RPG Traits (Stage 4)', () => {
    let vm: MainWindowViewModel
    let ctx: IMockAppContext
    let detailsContent: HTMLElement
    let historyTabs: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = `
            <div id="history-tabs-container"></div>
            <div id="details-content"></div>
        `

        detailsContent = document.getElementById('details-content')!
        historyTabs = document.getElementById('history-tabs-container')!

        vm = new MainWindowViewModel()

        ctx = {
            vm,
            projectParagraphs: [],
            projectScenes: [],
            projectCharacters: [],
            projectTemplates: [],
            projectLocations: [],
            projectStats: [],
            projectParameters: [],
            projectSkills: [],
            projectFeatures: [],
            projectTags: [],
            selectEntity: vi.fn(),
            renderCharactersList: vi.fn(),
            renderTraitsList: vi.fn(),
            renderConnectionsList: vi.fn(),
            renderParagraphsList: vi.fn(),
            updateMainWorkspaceUI: vi.fn(),
            refreshActiveSection: vi.fn(),
            openNarrativeEditor: vi.fn(),
            openNpcModal: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
                focusOnElement: vi.fn(),
            },
        }
    })

    describe('NPC Rendering and Details (Read-only mode)', () => {
        let npc: NPC

        beforeEach(() => {
            const desc = new Description('Wojownik z północy', 'Wojownik z północy')
            npc = new NPC('npc-1', 'Geralt', desc)
            npc.setAvatar('warrior')

            // Dodaj cechy
            npc.addStat(new Stat('stat-1', 'Siła', new Description(), '16'))
            npc.addStat(new Stat('stat-2', 'Zręczność', new Description(), '14'))

            // Dodaj parametry
            npc.addParameter(
                new Parameter('param-1', 'Zdrowie', new Description(), 'formula', 0, 'Siła * 10')
            )

            // Dodaj umiejętności
            npc.addSkill(
                new Skill(
                    'skill-1',
                    'Fechtunek',
                    new Description(),
                    'stat_mod',
                    '+0',
                    'Zręczność',
                    '+3'
                )
            )

            // Dodaj przymioty
            npc.addFeature(new Feature('feat-1', 'Odporność na magię', new Description('Odporny')))

            // Dodaj tagi
            npc.addTag(new Tag('tag-1', 'Wiedźmini'))

            // Dodaj niestandardowe atrybuty
            npc.setCustomAttributes([
                { name: 'Rasa', value: 'Wiedźmin' },
                { name: 'Status', value: 'Wędrowiec' },
            ])

            ctx.projectCharacters = [npc]
            ctx.projectStats = [
                new Stat('stat-1', 'Siła', new Description(), '16'),
                new Stat('stat-2', 'Zręczność', new Description(), '14'),
                new Stat('stat-3', 'Mądrość', new Description(), '12'),
            ]
            ctx.projectParameters = [
                new Parameter('param-1', 'Zdrowie', new Description(), 'formula', 0, 'Siła * 10'),
                new Parameter('param-2', 'Kondycja', new Description(), 'direct', 80),
            ]
            ctx.projectSkills = [
                new Skill(
                    'skill-1',
                    'Fechtunek',
                    new Description(),
                    'stat_mod',
                    '+0',
                    'Zręczność',
                    '+3'
                ),
                new Skill('skill-2', 'Alchemia', new Description(), 'direct', '+2'),
            ]
            ctx.projectFeatures = [
                new Feature('feat-1', 'Odporność na magię', new Description('Odporny')),
                new Feature('feat-2', 'Znak Igni', new Description('Płomienie')),
            ]

            vm.selectElement(npc, 'character')
        })

        it('should render header with NPC type badge and name', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Geralt')
            expect(detailsContent.innerHTML).toContain('Postać NPC')
            expect(detailsContent.innerHTML).not.toContain('Tylko do odczytu')
            expect(detailsContent.querySelector('#details-name-display')).not.toBeNull()
            expect(detailsContent.querySelector('#details-name-input')).toBeNull()
        })

        it('should render edit button and trigger openNpcModal with mode character and editEntity on click', () => {
            renderDetailsPanel(ctx)

            const editBtn = detailsContent.querySelector(
                '#btn-details-edit-npc'
            ) as HTMLButtonElement
            expect(editBtn).not.toBeNull()
            expect(editBtn.textContent).toContain('Edytuj postać')

            editBtn.click()
            expect(ctx.openNpcModal).toHaveBeenCalledWith({
                mode: 'character',
                editEntity: npc,
            })

            const bottomEditBtn = detailsContent.querySelector(
                '#btn-details-bottom-edit-npc'
            ) as HTMLButtonElement
            expect(bottomEditBtn).not.toBeNull()
            bottomEditBtn.click()
            expect(ctx.openNpcModal).toHaveBeenCalledTimes(2)
        })

        it('should render avatar in read-only mode without change button or grid', () => {
            renderDetailsPanel(ctx)

            const avatarPreview = detailsContent.querySelector(
                '#details-avatar-preview'
            ) as HTMLElement
            expect(avatarPreview).not.toBeNull()

            // Brak przycisku zmiany awatara i brak siatki wyboru
            expect(detailsContent.querySelector('#btn-details-toggle-avatar-grid')).toBeNull()
            expect(detailsContent.querySelector('#details-avatar-grid')).toBeNull()
        })

        it('should render summary and description file module for NPC using getDescription() in read-only without author notes', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Wojownik z północy')
            // Brak edytowalnego pola tekstowego
            expect(detailsContent.querySelector('#details-summary-input')).toBeNull()

            // Sprawdzenie obecności sekcji pojedynczego pliku narracyjnego i braku notatek autora
            const btnPlayerText = detailsContent.querySelector(
                '#btn-open-player-text'
            ) as HTMLButtonElement
            const btnAuthorNotes = detailsContent.querySelector('#btn-open-author-notes')
            expect(btnPlayerText).not.toBeNull()
            expect(btnAuthorNotes).toBeNull()
        })

        it('should render tags in read-only mode without delete buttons or add controls', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('#Wiedźmini')
            expect(detailsContent.querySelector('#details-add-tag-select')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-tag')).toBeNull()
        })

        it('should render NPC stats list with values in read-only mode without input fields or delete buttons', () => {
            renderDetailsPanel(ctx)

            const statRows = detailsContent.querySelectorAll('#details-stats-list > div')
            expect(statRows.length).toBe(2)

            // Brak pól input do edycji wartości oraz brak przycisków usuwania
            expect(detailsContent.querySelectorAll('.stat-val-input').length).toBe(0)
            expect(detailsContent.querySelectorAll('.btn-remove-stat').length).toBe(0)
            expect(detailsContent.querySelector('#details-add-stat-select')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-stat')).toBeNull()

            // Wartości cech są wyświetlane jako tekst
            expect(detailsContent.innerHTML).toContain('Siła')
            expect(detailsContent.innerHTML).toContain('16')
            expect(detailsContent.innerHTML).toContain('Zręczność')
            expect(detailsContent.innerHTML).toContain('14')
        })

        it('should render NPC parameters with calculated formula values in read-only mode', () => {
            renderDetailsPanel(ctx)

            const paramRows = detailsContent.querySelectorAll('#details-params-list > div')
            expect(paramRows.length).toBe(1)

            // Parametr 'Zdrowie' ze wzorem 'Siła * 10' -> Siła to 16, więc wynik 160
            expect(detailsContent.innerHTML).toContain('Siła * 10')
            expect(detailsContent.innerHTML).toContain('160')

            // Brak elementów edycyjnych
            expect(detailsContent.querySelectorAll('.param-val-input').length).toBe(0)
            expect(detailsContent.querySelectorAll('.btn-remove-param').length).toBe(0)
            expect(detailsContent.querySelector('#details-add-param-select')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-param')).toBeNull()
        })

        it('should render NPC skills in read-only mode', () => {
            renderDetailsPanel(ctx)

            const skillRows = detailsContent.querySelectorAll('#details-skills-list > div')
            expect(skillRows.length).toBe(1)

            expect(detailsContent.innerHTML).toContain('Fechtunek')
            expect(detailsContent.innerHTML).toContain('Zręczność')
            expect(detailsContent.innerHTML).toContain('+3')

            // Brak kontrolek edycji
            expect(detailsContent.querySelectorAll('.skill-val-input').length).toBe(0)
            expect(detailsContent.querySelectorAll('.btn-remove-skill').length).toBe(0)
            expect(detailsContent.querySelector('#details-add-skill-select')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-skill')).toBeNull()
        })

        it('should render NPC features in read-only mode', () => {
            renderDetailsPanel(ctx)

            const featRows = detailsContent.querySelectorAll('#details-features-list > div')
            expect(featRows.length).toBe(1)
            expect(detailsContent.innerHTML).toContain('Odporność na magię')

            expect(detailsContent.querySelectorAll('.btn-remove-feature').length).toBe(0)
            expect(detailsContent.querySelector('#details-add-feature-select')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-feature')).toBeNull()
        })

        it('should render custom attributes in read-only mode without inputs or delete buttons', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Rasa')
            expect(detailsContent.innerHTML).toContain('Wiedźmin')
            expect(detailsContent.innerHTML).toContain('Status')
            expect(detailsContent.innerHTML).toContain('Wędrowiec')

            expect(detailsContent.querySelectorAll('.attr-name-input').length).toBe(0)
            expect(detailsContent.querySelectorAll('.attr-val-input').length).toBe(0)
            expect(detailsContent.querySelectorAll('.btn-remove-attr').length).toBe(0)
            expect(detailsContent.querySelector('#details-add-attr-name')).toBeNull()
            expect(detailsContent.querySelector('#btn-details-add-attr')).toBeNull()
        })
    })

    describe('Template Rendering and Details (Read-only mode)', () => {
        let template: NPC_Template

        beforeEach(() => {
            const desc = new Description('Szablon strażnika miejskiego', 'Szablon strażnika')
            template = new NPC_Template(
                'tpl-1',
                'Strażnik Miejski',
                desc,
                [new Stat('stat-1', 'Siła', new Description(), '12')],
                [new Skill('skill-1', 'Walka wręcz', new Description(), 'direct', '+2')],
                [new Feature('feat-1', 'Czujność', new Description('Zawsze czujny'))],
                [new Tag('tag-1', 'Straż')],
                'guardian',
                [new Parameter('param-1', 'Punkty życia', new Description(), 'direct', 50)],
                [{ name: 'Pozycja', value: 'Warta' }]
            )

            ctx.projectTemplates = [template]
            vm.selectElement(template, 'template')
        })

        it('should render template with name, avatar and stats', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Strażnik Miejski')
            expect(detailsContent.innerHTML).toContain('Szablon postaci')
            expect(detailsContent.innerHTML).not.toContain('Tylko do odczytu')
            expect(detailsContent.innerHTML).toContain('Siła')
            expect(detailsContent.innerHTML).toContain('12')
            expect(detailsContent.innerHTML).toContain('Walka wręcz')
            expect(detailsContent.innerHTML).toContain('Czujność')
            expect(detailsContent.innerHTML).toContain('#Straż')
            expect(detailsContent.innerHTML).toContain('Pozycja')
            expect(detailsContent.innerHTML).toContain('Warta')
        })

        it('should render edit template button and trigger openNpcModal with mode template', () => {
            renderDetailsPanel(ctx)

            const editBtn = detailsContent.querySelector(
                '#btn-details-edit-npc'
            ) as HTMLButtonElement
            expect(editBtn).not.toBeNull()
            expect(editBtn.textContent).toContain('Edytuj szablon')

            editBtn.click()
            expect(ctx.openNpcModal).toHaveBeenCalledWith({
                mode: 'template',
                editEntity: template,
            })
        })

        it('should render create character from template button in quick actions', () => {
            renderDetailsPanel(ctx)

            const createBtn = detailsContent.querySelector(
                '#btn-details-create-npc-from-template'
            ) as HTMLButtonElement
            expect(createBtn).not.toBeNull()
            expect(createBtn.textContent).toContain('Stwórz postać z tego szablonu')

            createBtn.click()
            expect(ctx.openNpcModal).toHaveBeenCalledWith({
                mode: 'character',
                templateId: 'tpl-1',
            })
        })
    })

    describe('Single RPG Entities in Details Panel', () => {
        it('should render Stat entity with base value editing and update it', () => {
            const stat = new Stat('stat-10', 'Charyzma', new Description('Urok osobisty'), '15')
            ctx.projectStats = [stat]
            vm.selectElement(stat, 'stat')

            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Charyzma')
            expect(detailsContent.innerHTML).toContain('Cecha')

            const valInput = detailsContent.querySelector(
                '#details-stat-value-input'
            ) as HTMLInputElement
            expect(valInput).not.toBeNull()
            expect(valInput.value).toBe('15')

            valInput.value = '18'
            valInput.dispatchEvent(new Event('change'))

            expect(stat.getValue()).toBe('18')
        })

        it('should render Parameter entity with mode toggle and formula preview', () => {
            const param = new Parameter(
                'param-10',
                'Wytrzymałość',
                new Description(),
                'formula',
                0,
                'Budowa * 5'
            )
            ctx.projectParameters = [param]
            ctx.projectStats = [new Stat('stat-b', 'Budowa', new Description(), '10')]
            vm.selectElement(param, 'parameter')

            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Wytrzymałość')
            expect(detailsContent.innerHTML).toContain('Parametr życiowy')

            const btnDirect = detailsContent.querySelector(
                '#btn-param-mode-direct'
            ) as HTMLButtonElement
            expect(btnDirect).not.toBeNull()

            // Sprawdzenie podglądu formuły
            const formulaPreview = detailsContent.querySelector('#param-formula-preview')
            expect(formulaPreview).not.toBeNull()
            expect(formulaPreview!.textContent).toContain('50') // Budowa(10) * 5 = 50

            // Zmiana trybu na direct
            btnDirect.click()

            expect(param.getMode()).toBe('direct')
        })

        it('should render Skill entity with mode toggle and stat selector', () => {
            const statDex = new Stat('stat-dex', 'Zręczność', new Description(), '12')
            const skill = new Skill(
                'skill-10',
                'Kradzież kieszonkowa',
                new Description(),
                'stat_mod',
                '+0',
                'Zręczność',
                '+4'
            )
            ctx.projectSkills = [skill]
            ctx.projectStats = [statDex]
            vm.selectElement(skill, 'skill')

            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Kradzież kieszonkowa')
            expect(detailsContent.innerHTML).toContain('Umiejętność')

            const btnDirect = detailsContent.querySelector(
                '#btn-skill-mode-direct'
            ) as HTMLButtonElement
            expect(btnDirect).not.toBeNull()

            const statSelect = detailsContent.querySelector(
                '#details-skill-stat-select'
            ) as HTMLSelectElement
            expect(statSelect).not.toBeNull()
            expect(statSelect.value).toBe('Zręczność')

            const modInput = detailsContent.querySelector(
                '#details-skill-mod-input'
            ) as HTMLInputElement
            expect(modInput).not.toBeNull()
            expect(modInput.value).toBe('+4')

            modInput.value = '+5'
            modInput.dispatchEvent(new Event('change'))

            expect(skill.getModifier()).toBe('+5')
        })

        it('should render Feature entity with description and tags', () => {
            const feature = new Feature(
                'feat-10',
                'Widzenie w ciemności',
                new Description('Widzi do 18m w mroku', 'Widzi do 18m w mroku')
            )
            ctx.projectFeatures = [feature]
            vm.selectElement(feature, 'feature')

            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Widzenie w ciemności')
            expect(detailsContent.innerHTML).toContain('Przymiot specjalny')
            expect(detailsContent.innerHTML).toContain('Widzi do 18m w mroku')
        })
    })

    describe('renderHistoryBar', () => {
        it('should render tabs for history items and allow closing all', () => {
            const npc = new NPC('npc-1', 'Bohater')
            ctx.projectCharacters = [npc]
            vm.selectElement(npc, 'character')

            renderHistoryBar(ctx)

            const tabButtons = historyTabs.querySelectorAll('button')
            expect(tabButtons.length).toBeGreaterThanOrEqual(1)
            expect(historyTabs.innerHTML).toContain('Bohater')

            const closeAllBtn = historyTabs.querySelector('button[title]') as HTMLButtonElement
            expect(closeAllBtn).not.toBeNull()
            closeAllBtn.click()

            expect(vm.getHistory()).toHaveLength(0)
        })
    })
})
