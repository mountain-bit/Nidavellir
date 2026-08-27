import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_TAG_COLOR } from '../../Model/constants'
import { Opis } from '../../Model/Opis'
import { Paragraf } from '../../Model/Paragraf'
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

        vm.setActiveFile('Scena 1')
        expect(vm.getActiveFile()).toBe('Scena 1')
        expect(vm.getOpenFiles()).toContain('Scena 1')

        vm.setActiveFile('Scena 2')
        expect(vm.getActiveFile()).toBe('Scena 2')
        expect(vm.getOpenFiles()).toEqual(['Scena 1', 'Scena 2'])

        vm.closeFile('Scena 2')
        expect(vm.getOpenFiles()).not.toContain('Scena 2')
        expect(vm.getActiveFile()).toBe('Scena 1')
    })

    it('zmienia główny widok na graf historii i z powrotem', () => {
        vm.setActiveMainView('graph')
        expect(vm.getActiveMainView()).toBe('graph')

        vm.setActiveMainView('markdown')
        expect(vm.getActiveMainView()).toBe('markdown')
    })

    describe('Wyszukiwanie i filtrowanie paragrafów', () => {
        it('sortuje wyniki wyszukiwania wg priorytetu: 1. zablokowany numer, 2. pasujący tytuł, 3. pasująca treść', () => {
            const p1 = new Paragraf('p1', 'Normalny tytuł', new Opis('Zawiera słowo smok w treści'))
            const p2 = new Paragraf('p2', 'Smok w tytule', new Opis('Treść zwykła'))
            const p3 = new Paragraf('p3', 'Inny tytuł', new Opis('Inna treść ze słowem smok'))
            p3.ustawBlokadaNumeru(true)

            const list = [p1, p2, p3]

            vm.setParagraphSearchQuery('smok')
            const filtered = vm.searchAndFilterParagraphs(list)

            expect(filtered).toHaveLength(3)
            expect(filtered[0].pobierzID()).toBe('p3')
            expect(filtered[1].pobierzID()).toBe('p2')
            expect(filtered[2].pobierzID()).toBe('p1')
        })

        it('filtruje paragrafy po wybranym obiekcie Tag', () => {
            const tagWalka = new Tag('t-walka', 'Walka')
            const tagMagia = new Tag('t-magia', 'Magia')

            const p1 = new Paragraf('p1', 'Starcie', new Opis(), [], false, undefined, [tagWalka])
            const p2 = new Paragraf('p2', 'Czar', new Opis(), [], false, undefined, [tagMagia])
            const p3 = new Paragraf('p3', 'Pojedynek', new Opis(), [], false, undefined, [
                tagWalka,
                tagMagia,
            ])

            vm.setSelectedFilterTag('Walka')
            const filtered = vm.searchAndFilterParagraphs([p1, p2, p3])

            expect(filtered).toHaveLength(2)
            expect(filtered.map(p => p.pobierzID())).toEqual(['p1', 'p3'])
        })
    })

    describe('Tworzenie elementów i filtrowanie sekcji', () => {
        it('tworzy paragraf z własnym lub domyślnym tytułem', () => {
            const pWlasny = vm.stworzParagraf('Prolog')
            expect(pWlasny.pobierzTytul()).toBe('Prolog')
            expect(pWlasny.pobierzID()).toMatch(/^paragraf_/)

            const pDomyslny = vm.stworzParagraf('')
            expect(pDomyslny.pobierzTytul()).toBe('Nowy paragraf')
        })

        it('tworzy scenę z własną lub domyślną nazwą', () => {
            const sWlasna = vm.stworzScene('Wstęp')
            expect(sWlasna.pobierzNazwe()).toBe('Wstęp')
            expect(sWlasna.pobierzID()).toMatch(/^scena_/)

            const sDomyslna = vm.stworzScene('')
            expect(sDomyslna.pobierzNazwe()).toBe('Nowa scena')
        })

        it('tworzy przedmiot z własną lub domyślną nazwą', () => {
            const prWlasny = vm.stworzPrzedmiot('Miecz')
            expect(prWlasny.pobierzNazwe()).toBe('Miecz')
            expect(prWlasny.pobierzID()).toMatch(/^przedmiot_/)

            const prDomyslny = vm.stworzPrzedmiot('')
            expect(prDomyslny.pobierzNazwe()).toBe('Nowy przedmiot')
        })

        it('tworzy klasę postaci z własną lub domyślną nazwą', () => {
            const kWlasna = vm.stworzKlasePostaci('Wojownik')
            expect(kWlasna.pobierzNazwe()).toBe('Wojownik')
            expect(kWlasna.pobierzID()).toMatch(/^klasa_/)

            const kDomyslna = vm.stworzKlasePostaci('')
            expect(kDomyslna.pobierzNazwe()).toBe('Nowa klasa')
        })

        it('tworzy postać z własną lub domyślną nazwą gdy pole jest puste', () => {
            const pWlasna = vm.stworzPostac('Kupiec')
            expect(pWlasna.pobierzNazwe()).toBe('Kupiec')

            const pDomyslna = vm.stworzPostac('')
            expect(pDomyslna.pobierzNazwe()).toBe('Nowa postać')
        })

        it('tworzy lokację z własną lub domyślną nazwą gdy pole jest puste', () => {
            const lWlasna = vm.stworzLokacje('Karczma')
            expect(lWlasna.pobierzNazwe()).toBe('Karczma')

            const lDomyslna = vm.stworzLokacje('   ')
            expect(lDomyslna.pobierzNazwe()).toBe('Nowa lokacja')
        })

        it('tworzy cechę z własną lub domyślną nazwą gdy pole jest puste', () => {
            const cWlasna = vm.stworzCeche('Siła')
            expect(cWlasna.pobierzNazwe()).toBe('Siła')

            const cDomyslna = vm.stworzCeche('')
            expect(cDomyslna.pobierzNazwe()).toBe('Nowa cecha')
        })

        it('tworzy tag z własną lub domyślną nazwą oraz domyślnym kolorem', () => {
            const tWlasny = vm.stworzTag('Magia', '#8b5cf6')
            expect(tWlasny.pobierzNazwe()).toBe('Magia')
            expect(tWlasny.pobierzKolor()).toBe('#8b5cf6')

            const tDomyslny = vm.stworzTag('')
            expect(tDomyslny.pobierzNazwe()).toBe('Nowy tag')
            expect(tDomyslny.pobierzKolor()).toBe(DEFAULT_TAG_COLOR)
        })

        it('umożliwia wstrzyknięcie niestandardowego generatora ID dla pełnego determinizmu', () => {
            let counter = 0
            const mockGenerator = (prefix?: string): string =>
                `${prefix || 'id'}_fixed_${++counter}`
            const deterministicVm = new MainWindowViewModel(mockGenerator)

            const npc = deterministicVm.stworzPostac('Bohater')
            expect(npc.pobierzID()).toBe('npc_fixed_1')

            const location = deterministicVm.stworzLokacje('Góry')
            expect(location.pobierzID()).toBe('lokacja_fixed_2')

            const tag = deterministicVm.stworzTag('Test')
            expect(tag.pobierzID()).toBe('tag_fixed_3')
        })

        it('filtruje sekcje po wyszukiwanym haśle', () => {
            const p1 = vm.stworzPostac('Strażnik')
            const p2 = vm.stworzPostac('Kupiec')

            vm.setCharacterSearchQuery('straż')
            expect(vm.searchAndFilterCharacters([p1, p2])).toEqual([p1])

            const l1 = vm.stworzLokacje('Zamek')
            const l2 = vm.stworzLokacje('Karczma')

            vm.setLocationSearchQuery('karcz')
            expect(vm.searchAndFilterLocations([l1, l2])).toEqual([l2])
        })
    })
})
