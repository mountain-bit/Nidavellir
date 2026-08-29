import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_TAG_COLOR } from '../../Model/constants'
import { Description } from '../../Model/Description'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('MainWindowViewModel', () => {
    let vm: MainWindowViewModel

    beforeEach(() => {
        vm = new MainWindowViewModel()
    })

    it('domyślnie posiada aktywne odpowiednie zakładki i stan widoków', () => {
        expect(vm.getActiveRibbonTab()).toBe('glowna')
        expect(vm.getActiveLeftTab()).toBe('paragraphs')
        expect(vm.isLeftDrawerOpen()).toBe(true)
        expect(vm.isRightSidebarCollapsed()).toBe(false)
        expect(vm.getActiveMainView()).toBe('markdown')
    })

    it('zmienia aktywną zakładkę wstążki', () => {
        vm.setActiveRibbonTab('sceny')
        expect(vm.getActiveRibbonTab()).toBe('sceny')

        vm.setActiveRibbonTab('widok')
        expect(vm.getActiveRibbonTab()).toBe('widok')
    })

    it('ponowne kliknięcie tej samej ikony na lewym pasku zamyka panel (toggle off)', () => {
        expect(vm.getActiveLeftTab()).toBe('paragraphs')
        expect(vm.isLeftDrawerOpen()).toBe(true)

        vm.toggleLeftTab('paragraphs')
        expect(vm.getActiveLeftTab()).toBeNull()
        expect(vm.isLeftDrawerOpen()).toBe(false)
    })

    it('kliknięcie innej ikony na lewym pasku zmienia otwartą zakładkę w panelu dla wszystkich sekcji w tym tags', () => {
        vm.closeLeftDrawer()
        const tabs = [
            'paragraphs',
            'scenes',
            'characters',
            'locations',
            'traits',
            'main-character',
            'tags',
            'search',
            'settings',
        ] as const

        tabs.forEach(tab => {
            vm.toggleLeftTab(tab)
            expect(vm.getActiveLeftTab()).toBe(tab)
            expect(vm.isLeftDrawerOpen()).toBe(true)
        })
    })

    it('zamykanie i ponowne otwieranie lewego panelu', () => {
        vm.closeLeftDrawer()
        expect(vm.isLeftDrawerOpen()).toBe(false)
        expect(vm.getActiveLeftTab()).toBeNull()

        vm.toggleLeftTab('settings')
        expect(vm.getActiveLeftTab()).toBe('settings')
        expect(vm.isLeftDrawerOpen()).toBe(true)
    })

    it('przełącza widoczność prawego panelu za pomocą strzałki toggle', () => {
        expect(vm.isRightSidebarCollapsed()).toBe(false)

        vm.toggleRightSidebar()
        expect(vm.isRightSidebarCollapsed()).toBe(true)

        vm.toggleRightSidebar()
        expect(vm.isRightSidebarCollapsed()).toBe(false)
    })

    it('zarządza otwartymi plikami i aktywnym plikiem', () => {
        expect(vm.getActiveFile()).toBeNull()
        expect(vm.getOpenFiles()).toEqual([])

        vm.setActiveFile('Scene 1')
        expect(vm.getActiveFile()).toBe('Scene 1')
        expect(vm.getOpenFiles()).toContain('Scene 1')

        vm.setActiveFile('Scene 2')
        expect(vm.getActiveFile()).toBe('Scene 2')
        expect(vm.getOpenFiles()).toEqual(['Scene 1', 'Scene 2'])

        vm.closeFile('Scene 2')
        expect(vm.getOpenFiles()).not.toContain('Scene 2')
        expect(vm.getActiveFile()).toBe('Scene 1')
    })

    it('zmienia główny widok na graf historii i z powrotem', () => {
        vm.setActiveMainView('graph')
        expect(vm.getActiveMainView()).toBe('graph')

        vm.setActiveMainView('markdown')
        expect(vm.getActiveMainView()).toBe('markdown')
    })

    describe('Wyszukiwanie i filtrowanie paragrafów', () => {
        it('sortuje wyniki wyszukiwania wg priorytetu: 1. zablokowany numer, 2. pasujący tytuł, 3. pasująca treść', () => {
            const p1 = new Paragraph(
                'p1',
                'Normalny tytuł',
                new Description('Zawiera słowo smok w treści')
            )
            const p2 = new Paragraph('p2', 'Smok w tytule', new Description('Treść zwykła'))
            const p3 = new Paragraph(
                'p3',
                'Inny tytuł',
                new Description('Inna treść ze słowem smok')
            )
            p3.setIsNumberLocked(true)

            const list = [p1, p2, p3]

            vm.setParagraphSearchQuery('smok')
            const filtered = vm.searchAndFilterParagraphs(list)

            expect(filtered).toHaveLength(3)
            expect(filtered[0].getId()).toBe('p3')
            expect(filtered[1].getId()).toBe('p2')
            expect(filtered[2].getId()).toBe('p1')
        })

        it('filtruje paragrafy po wybranym obiekcie Tag', () => {
            const tagWalka = new Tag('t-walka', 'Combat')
            const tagMagia = new Tag('t-magia', 'Magic')

            const p1 = new Paragraph('p1', 'Starcie', new Description(), [], false, undefined, [
                tagWalka,
            ])
            const p2 = new Paragraph('p2', 'Czar', new Description(), [], false, undefined, [
                tagMagia,
            ])
            const p3 = new Paragraph('p3', 'Pojedynek', new Description(), [], false, undefined, [
                tagWalka,
                tagMagia,
            ])

            vm.setSelectedFilterTag('Combat')
            const filtered = vm.searchAndFilterParagraphs([p1, p2, p3])

            expect(filtered).toHaveLength(2)
            expect(filtered.map(p => p.getId())).toEqual(['p1', 'p3'])
        })
    })

    describe('Tworzenie elementów i filtrowanie sekcji (English & Legacy methods)', () => {
        it('tworzy paragraf z własnym lub domyślnym tytułem', () => {
            const pWlasny = vm.createParagraph('Prologue')
            expect(pWlasny.getTitle()).toBe('Prologue')
            expect(pWlasny.getId()).toMatch(/^paragraph_/)

            const pDomyslny = vm.createParagraph('')
            expect(pDomyslny.getTitle()).toBe('New paragraph')
        })

        it('tworzy scenę z własną lub domyślną nazwą', () => {
            const sWlasna = vm.createScene('Intro')
            expect(sWlasna.getName()).toBe('Intro')
            expect(sWlasna.getId()).toMatch(/^scene_/)

            const sDomyslna = vm.createScene('')
            expect(sDomyslna.getName()).toBe('New scene')
        })

        it('tworzy przedmiot z własną lub domyślną nazwą', () => {
            const prWlasny = vm.createItem('Sword')
            expect(prWlasny.getName()).toBe('Sword')
            expect(prWlasny.getId()).toMatch(/^item_/)

            const prDomyslny = vm.createItem('')
            expect(prDomyslny.getName()).toBe('New item')
        })

        it('tworzy klasę postaci z własną lub domyślną nazwą', () => {
            const kWlasna = vm.createCharacterClass('Warrior')
            expect(kWlasna.getName()).toBe('Warrior')
            expect(kWlasna.getId()).toMatch(/^class_/)

            const kDomyslna = vm.createCharacterClass('')
            expect(kDomyslna.getName()).toBe('New class')
        })

        it('tworzy postać z własną lub domyślną nazwą gdy pole jest puste', () => {
            const pWlasna = vm.createCharacter('Merchant')
            expect(pWlasna.getName()).toBe('Merchant')

            const pDomyslna = vm.createCharacter('')
            expect(pDomyslna.getName()).toBe('New character')
        })

        it('tworzy lokację z własną lub domyślną nazwą gdy pole jest puste', () => {
            const lWlasna = vm.createLocation('Tavern')
            expect(lWlasna.getName()).toBe('Tavern')

            const lDomyslna = vm.createLocation('   ')
            expect(lDomyslna.getName()).toBe('New location')
        })

        it('tworzy cechę/statystykę z własną lub domyślną nazwą gdy pole jest puste', () => {
            const cWlasna = vm.createStat('Strength')
            expect(cWlasna.getName()).toBe('Strength')

            const cDomyslna = vm.createStat('')
            expect(cDomyslna.getName()).toBe('New stat')
        })

        it('tworzy tag z własną lub domyślną nazwą oraz domyślnym kolorem', () => {
            const tWlasny = vm.createTag('Magic', '#8b5cf6')
            expect(tWlasny.getName()).toBe('Magic')
            expect(tWlasny.getColor()).toBe('#8b5cf6')

            const tDomyslny = vm.createTag('')
            expect(tDomyslny.getName()).toBe('New tag')
            expect(tDomyslny.getColor()).toBe(DEFAULT_TAG_COLOR)
        })

        it('umożliwia wstrzyknięcie niestandardowego generatora ID dla pełnego determinizmu', () => {
            let counter = 0
            const mockGenerator = (prefix?: string): string =>
                `${prefix || 'id'}_fixed_${++counter}`
            const deterministicVm = new MainWindowViewModel(mockGenerator)

            const npc = deterministicVm.createCharacter('Hero')
            expect(npc.getId()).toBe('npc_fixed_1')

            const location = deterministicVm.createLocation('Mountains')
            expect(location.getId()).toBe('location_fixed_2')

            const stat = deterministicVm.createStat('Agility')
            expect(stat.getId()).toBe('stat_fixed_3')

            const tag = deterministicVm.createTag('Test')
            expect(tag.getId()).toBe('tag_fixed_4')
        })

        it('filtruje sekcje po wyszukiwanym haśle', () => {
            const p1 = vm.createCharacter('Guard')
            const p2 = vm.createCharacter('Merchant')

            vm.setCharacterSearchQuery('guard')
            expect(vm.searchAndFilterCharacters([p1, p2])).toEqual([p1])

            const l1 = vm.createLocation('Castle')
            const l2 = vm.createLocation('Tavern')

            vm.setLocationSearchQuery('tav')
            expect(vm.searchAndFilterLocations([l1, l2])).toEqual([l2])

            const s1 = vm.createStat('Strength')
            const s2 = vm.createStat('Agility')

            vm.setStatSearchQuery('stre')
            expect(vm.searchAndFilterStats([s1, s2])).toEqual([s1])
        })
    })
})
