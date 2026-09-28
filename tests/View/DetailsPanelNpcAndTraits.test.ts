// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC } from '../../Model/NPC'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'
import { renderDetailsPanel, renderHistoryBar } from '../../View/ui/detailsPanel.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

interface IMockAppContext {
    vm: MainWindowViewModel
    projectParagraphs: unknown[]
    projectScenes: unknown[]
    projectCharacters: NPC[]
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
            storyGraphInstance: {
                render: vi.fn(),
                focusOnElement: vi.fn(),
            },
        }
    })

    describe('NPC Rendering and Details', () => {
        let npc: NPC

        beforeEach(() => {
            const desc = new Description('Wojownik z północy', 'Wojownik z północy')
            desc.setAuthorNotes('Lubi dobrą walkę')
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
        })

        it('should render avatar module and allow changing avatar', () => {
            renderDetailsPanel(ctx)

            const avatarPreview = detailsContent.querySelector(
                '#details-avatar-preview'
            ) as HTMLElement
            expect(avatarPreview).not.toBeNull()

            // Otwarcie selektora awatara
            const toggleBtn = detailsContent.querySelector(
                '#btn-details-toggle-avatar-grid'
            ) as HTMLButtonElement
            expect(toggleBtn).not.toBeNull()
            toggleBtn.click()

            const grid = detailsContent.querySelector('#details-avatar-grid')
            expect(grid).not.toBeNull()
            expect(grid!.classList.contains('hidden')).toBe(false)

            // Wybór innego awatara
            const mageOption = grid!.querySelector(
                '.details-avatar-btn[data-avatar-id="mage"]'
            ) as HTMLElement
            expect(mageOption).not.toBeNull()
            mageOption.click()

            expect(npc.getAvatar()).toBe('mage')
        })

        it('should render summary and author notes module for NPC using getDescription()', () => {
            renderDetailsPanel(ctx)

            expect(detailsContent.innerHTML).toContain('Wojownik z północy')

            // Sprawdzenie obecności sekcji plików narracyjnych
            const btnPlayerText = detailsContent.querySelector(
                '#btn-open-player-text'
            ) as HTMLButtonElement
            const btnAuthorNotes = detailsContent.querySelector(
                '#btn-open-author-notes'
            ) as HTMLButtonElement
            expect(btnPlayerText).not.toBeNull()
            expect(btnAuthorNotes).not.toBeNull()
        })

        it('should render NPC stats list with values, allow editing and deleting', () => {
            renderDetailsPanel(ctx)

            const statRows = detailsContent.querySelectorAll('#details-stats-list > div')
            expect(statRows.length).toBe(2)

            // Edycja wartości cechy
            const inputSila = statRows[0].querySelector('.stat-val-input') as HTMLInputElement
            expect(inputSila).not.toBeNull()
            expect(inputSila.value).toBe('16')

            inputSila.value = '18'
            inputSila.dispatchEvent(new Event('change'))

            const updatedStat = npc.getStats().find(s => s.getId() === 'stat-1')
            expect(updatedStat?.getValue()).toBe('18')

            // Usunięcie cechy
            const deleteBtn = statRows[1].querySelector('.btn-remove-stat') as HTMLButtonElement
            expect(deleteBtn).not.toBeNull()
            deleteBtn.click()

            expect(npc.getStats()).toHaveLength(1)
            expect(npc.getStats()[0].getId()).toBe('stat-1')
        })

        it('should allow assigning an unassigned stat from projectStats to the NPC', () => {
            renderDetailsPanel(ctx)

            const assignSelect = detailsContent.querySelector(
                '#details-add-stat-select'
            ) as HTMLSelectElement
            const assignBtn = detailsContent.querySelector(
                '#btn-details-add-stat'
            ) as HTMLButtonElement

            expect(assignSelect).not.toBeNull()
            expect(assignSelect.options.length).toBe(2) // Pusta opcja + 'Mądrość' (stat-3)
            assignSelect.value = 'stat-3'

            assignBtn.click()

            expect(npc.getStats()).toHaveLength(3)
            expect(npc.getStats().some(s => s.getId() === 'stat-3')).toBe(true)
        })

        it('should render NPC parameters with calculated formula values and allow deletion', () => {
            renderDetailsPanel(ctx)

            const paramRows = detailsContent.querySelectorAll('#details-params-list > div')
            expect(paramRows.length).toBe(1)

            // Parametr 'Zdrowie' ze wzorem 'Siła * 10' -> Siła to 16, więc wynik 160
            expect(detailsContent.innerHTML).toContain('Siła * 10')
            expect(detailsContent.innerHTML).toContain('160')

            // Usunięcie parametru
            const removeBtn = paramRows[0].querySelector('.btn-remove-param') as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            removeBtn.click()

            expect(npc.getParameters()).toHaveLength(0)
        })

        it('should allow assigning an unassigned parameter from projectParameters to the NPC', () => {
            renderDetailsPanel(ctx)

            const assignSelect = detailsContent.querySelector(
                '#details-add-param-select'
            ) as HTMLSelectElement
            const assignBtn = detailsContent.querySelector(
                '#btn-details-add-param'
            ) as HTMLButtonElement

            expect(assignSelect).not.toBeNull()
            assignSelect.value = 'param-2'

            assignBtn.click()

            expect(npc.getParameters()).toHaveLength(2)
            expect(npc.getParameters().some(p => p.getId() === 'param-2')).toBe(true)
        })

        it('should render NPC skills and allow adding/removing skills', () => {
            renderDetailsPanel(ctx)

            const skillRows = detailsContent.querySelectorAll('#details-skills-list > div')
            expect(skillRows.length).toBe(1)

            // Sprawdzenie wskaźnika modyfikatora
            expect(detailsContent.innerHTML).toContain('Zręczność')

            // Dodanie umiejętności 'Alchemia'
            const assignSelect = detailsContent.querySelector(
                '#details-add-skill-select'
            ) as HTMLSelectElement
            const assignBtn = detailsContent.querySelector(
                '#btn-details-add-skill'
            ) as HTMLButtonElement

            assignSelect.value = 'skill-2'
            assignBtn.click()

            expect(npc.getSkills()).toHaveLength(2)

            // Usunięcie umiejętności
            const removeBtn = skillRows[0].querySelector('.btn-remove-skill') as HTMLButtonElement
            removeBtn.click()

            expect(npc.getSkills()).toHaveLength(1)
            expect(npc.getSkills()[0].getId()).toBe('skill-2')
        })

        it('should render NPC features and allow adding/removing features', () => {
            renderDetailsPanel(ctx)

            const featRows = detailsContent.querySelectorAll('#details-features-list > div')
            expect(featRows.length).toBe(1)
            expect(detailsContent.innerHTML).toContain('Odporność na magię')

            // Dodanie 'Znak Igni'
            const assignSelect = detailsContent.querySelector(
                '#details-add-feature-select'
            ) as HTMLSelectElement
            const assignBtn = detailsContent.querySelector(
                '#btn-details-add-feature'
            ) as HTMLButtonElement

            assignSelect.value = 'feat-2'
            assignBtn.click()

            expect(npc.getFeatures()).toHaveLength(2)

            // Usunięcie
            const removeBtn = featRows[0].querySelector('.btn-remove-feature') as HTMLButtonElement
            removeBtn.click()

            expect(npc.getFeatures()).toHaveLength(1)
            expect(npc.getFeatures()[0].getId()).toBe('feat-2')
        })

        it('should render custom attributes, allow inline editing, adding and deleting', () => {
            renderDetailsPanel(ctx)

            const nameInputs = detailsContent.querySelectorAll(
                '.attr-name-input'
            ) as NodeListOf<HTMLInputElement>
            const valInputs = detailsContent.querySelectorAll(
                '.attr-val-input'
            ) as NodeListOf<HTMLInputElement>

            expect(nameInputs.length).toBe(2)
            expect(nameInputs[0].value).toBe('Rasa')
            expect(valInputs[0].value).toBe('Wiedźmin')

            // Edycja klucza i wartości
            nameInputs[0].value = 'Pochodzenie'
            nameInputs[0].dispatchEvent(new Event('change'))
            valInputs[0].value = 'Rivia'
            valInputs[0].dispatchEvent(new Event('change'))

            const attrs = npc.getCustomAttributes()
            expect(attrs[0].name).toBe('Pochodzenie')
            expect(attrs[0].value).toBe('Rivia')

            // Dodanie nowego atrybutu
            const newName = detailsContent.querySelector(
                '#details-add-attr-name'
            ) as HTMLInputElement
            const newVal = detailsContent.querySelector('#details-add-attr-val') as HTMLInputElement
            const addBtn = detailsContent.querySelector(
                '#btn-details-add-attr'
            ) as HTMLButtonElement

            newName.value = 'Rząd'
            newVal.value = 'Gildia'
            addBtn.click()

            expect(npc.getCustomAttributes()).toHaveLength(3)
            expect(npc.getCustomAttributes()[2]).toEqual({ name: 'Rząd', value: 'Gildia' })

            // Usunięcie atrybutu
            const deleteBtns = detailsContent.querySelectorAll(
                '.btn-remove-attr'
            ) as NodeListOf<HTMLButtonElement>
            deleteBtns[1].click() // Usuwa 'Status'

            expect(npc.getCustomAttributes()).toHaveLength(2)
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
