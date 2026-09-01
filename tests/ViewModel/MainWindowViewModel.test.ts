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

    describe('Selection & History Management', () => {
        it('obsługuje pojedyncze zaznaczenie elementu i dodawanie do historii', () => {
            const p1 = vm.createParagraph('Intro')
            const p2 = vm.createParagraph('Outro')

            const item1 = vm.selectElement(p1, 'paragraph')
            expect(vm.getSelectedItem()).toEqual(item1)
            expect(vm.getHistory()).toHaveLength(1)
            expect(vm.getHistory()[0].id).toBe(p1.getId())
            expect(vm.isRightSidebarCollapsed()).toBe(false)

            const item2 = vm.selectElement(p2, 'paragraph')
            expect(vm.getSelectedItem()).toEqual(item2)
            expect(vm.getSelectedItem()?.id).toBe(p2.getId())
            expect(vm.getHistory()).toHaveLength(2)
            expect(vm.getHistory()[0].id).toBe(p2.getId())

            // Ponowne zaznaczenie pierwszego przenosi go na początek historii bez duplikatów
            vm.selectElement(p1, 'paragraph')
            expect(vm.getHistory()).toHaveLength(2)
            expect(vm.getHistory()[0].id).toBe(p1.getId())
        })

        it('umożliwia wybór z historii oraz zamykanie elementów pojedynczo i hurtowo', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const p3 = vm.createParagraph('P3')

            vm.selectElement(p1, 'paragraph')
            vm.selectElement(p2, 'paragraph')
            vm.selectElement(p3, 'paragraph')
            expect(vm.getHistory()).toHaveLength(3)

            vm.selectHistoryItem(p1.getId())
            expect(vm.getSelectedItem()?.id).toBe(p1.getId())

            // Zamknięcie aktywnego elementu przełącza zaznaczenie na kolejny w historii
            vm.closeHistoryItem(p1.getId())
            expect(vm.getHistory()).toHaveLength(2)
            expect(vm.getSelectedItem()?.id).toBe(p3.getId())

            // Zamknij wszystko
            vm.closeAllHistory()
            expect(vm.getHistory()).toEqual([])
            expect(vm.getSelectedItem()).toBeNull()
        })
    })

    describe('Paragraph Numbering & Random Generation', () => {
        it('nie losuje numeru automatycznie podczas zaznaczenia (pozostaje do fazy eksportu)', () => {
            const p = vm.createParagraph('Combat')
            expect(p.getRandomizedNumber()).toBe(0)

            vm.selectElement(p, 'paragraph')
            // Podczas edycji w UI numer nie jest losowany
            expect(p.getRandomizedNumber()).toBe(0)

            // Losowanie następuje dopiero przy wywołaniu randomizeNumber (np. faza eksportu)
            const rolled = p.randomizeNumber(1, 999999)
            expect(rolled).toBeGreaterThan(0)
            expect(rolled).toBeLessThanOrEqual(999999)
            expect(p.getRandomizedNumber()).toBe(rolled)
        })

        it('umożliwia zablokowanie i wpisanie własnego statycznego numeru', () => {
            const p = vm.createParagraph('Secret Room')
            vm.selectElement(p, 'paragraph')

            expect(p.getIsNumberLocked()).toBe(false)
            vm.toggleNumberLock(true)
            expect(p.getIsNumberLocked()).toBe(true)

            vm.updateCustomNumber(99)
            expect(p.getNumber()).toBe(99)
        })
    })

    describe('Live Name Validation & Scope Collision Checking', () => {
        it('blokuje puste nazwy oraz wykrywa kolizję w zakresie sekcji', () => {
            const p1 = vm.createParagraph('Unique Name')
            const p2 = vm.createParagraph('Existing Name')
            const item = vm.selectElement(p1, 'paragraph')

            const emptyRes = vm.validateName('   ', item, [p1, p2])
            expect(emptyRes.valid).toBe(false)

            const collisionRes = vm.validateName('existing name', item, [p1, p2])
            expect(collisionRes.valid).toBe(false)
            expect(collisionRes.message).toContain('already exists')

            const validRes = vm.validateName('Brand New Name', item, [p1, p2])
            expect(validRes.valid).toBe(true)
        })

        it('aktualizuje nazwę encji i wpisu w historii gdy walidacja przejdzie pomyślnie', () => {
            const p1 = vm.createParagraph('Old Title')
            vm.selectElement(p1, 'paragraph')

            const updated = vm.updateName('New Super Title', [p1])
            expect(updated).toBe(true)
            expect(p1.getTitle()).toBe('New Super Title')
            expect(vm.getSelectedItem()?.name).toBe('New Super Title')
            expect(vm.getHistory()[0].name).toBe('New Super Title')
        })
    })

    describe('Summary & Narrative Files', () => {
        it('aktualizuje streszczenie wybranego elementu', () => {
            const p = vm.createParagraph('Story')
            vm.selectElement(p, 'paragraph')

            vm.updateSummary('Krótkie streszczenie wątku')
            expect(p.getContent().getSummary()).toBe('Krótkie streszczenie wątku')
        })

        it('przygotowuje i otwiera pliki narracyjne text.md oraz author.md', () => {
            const p = vm.createParagraph('Intro')
            vm.selectElement(p, 'paragraph')

            const textFile = vm.openOrCreateDescriptionFile('text')
            expect(textFile.fileName).toBe('Intro_text.md')
            expect(textFile.content).toContain('Narrative text')
            expect(vm.getActiveFile()).toBe('Intro_text.md')

            const authorFile = vm.openOrCreateDescriptionFile('author')
            expect(authorFile.fileName).toBe('Intro_author.md')
            expect(authorFile.content).toContain('Author Notes')
            expect(vm.getActiveFile()).toBe('Intro_author.md')
        })
    })

    describe('Dynamic Tags & Stats Modification', () => {
        it('dodaje i usuwa tagi dla zaznaczonego elementu', () => {
            const p = vm.createParagraph('Tagged Paragraph')
            const tag = vm.createTag('SpecialTag')
            vm.selectElement(p, 'paragraph')

            vm.addTagToSelected(tag)
            expect(p.getTags()).toHaveLength(1)
            expect(p.getTags()[0].getName()).toBe('SpecialTag')

            vm.removeTagFromSelected(tag.getId())
            expect(p.getTags()).toHaveLength(0)
        })

        it('dodaje i usuwa statystyki/cechy dla postaci', () => {
            const c = vm.createCharacter('Hero')
            const stat = vm.createStat('Mana')
            vm.selectElement(c, 'character')

            vm.addStatToSelected(stat)
            expect(c.getStats()).toHaveLength(1)
            expect(c.getStats()[0].getName()).toBe('Mana')

            vm.removeStatFromSelected(stat.getId())
            expect(c.getStats()).toHaveLength(0)
        })
    })

    describe('Panel Resizing Bounds', () => {
        it('pilnuje minimalnych i maksymalnych wymiarów lewego i prawego panelu', () => {
            expect(vm.getLeftDrawerWidth()).toBe(260)
            vm.setLeftDrawerWidth(100) // Za mało
            expect(vm.getLeftDrawerWidth()).toBe(180)

            vm.setLeftDrawerWidth(900) // Za dużo
            expect(vm.getLeftDrawerWidth()).toBe(600)

            expect(vm.getRightSidebarWidth()).toBe(280)
            vm.setRightSidebarWidth(100) // Za mało
            expect(vm.getRightSidebarWidth()).toBe(220)

            vm.setRightSidebarWidth(1000) // Za dużo
            expect(vm.getRightSidebarWidth()).toBe(700)
        })
    })
})
