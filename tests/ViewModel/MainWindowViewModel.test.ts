import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_TAG_COLOR } from '../../Model/constants'
import { Description } from '../../Model/Description'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { initTranslationsWithLocale, setLanguage } from '../../Utils/translate'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('MainWindowViewModel', () => {
    let vm: MainWindowViewModel

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        vm = new MainWindowViewModel()
    })

    it('domyślnie posiada aktywne odpowiednie zakładki i stan widoków', () => {
        expect(vm.getActiveRibbonTab()).toBe('glowna')
        expect(vm.getActiveLeftTab()).toBe('paragraphs')
        expect(vm.isLeftDrawerOpen()).toBe(true)
        expect(vm.isRightSidebarCollapsed()).toBe(false)
        expect(vm.getActiveMainView()).toBe('graph')
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

    it('kliknięcie innej ikony na lewym pasku zmienia otwartą zakładkę w panelu dla wszystkich sekcji w tym tags i connections', () => {
        vm.closeLeftDrawer()
        const tabs = [
            'paragraphs',
            'scenes',
            'connections',
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

    it('closing the last open file leaves no active file', () => {
        vm.setActiveFile('Only File')
        expect(vm.getOpenFiles()).toHaveLength(1)

        vm.closeFile('Only File')
        expect(vm.getOpenFiles()).toHaveLength(0)
        expect(vm.getActiveFile()).toBeNull()
    })

    it('zmienia główny widok na graf historii i z powrotem', () => {
        expect(vm.getActiveMainView()).toBe('graph')

        vm.setActiveMainView('markdown')
        expect(vm.getActiveMainView()).toBe('markdown')

        vm.setActiveMainView('graph')
        expect(vm.getActiveMainView()).toBe('graph')
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
            const sc1 = vm.createScene('Prolog')
            const sc2 = vm.createScene('Epilog')
            expect(sc1.getId()).toMatch(/^scene_/)

            vm.setSceneSearchQuery('prol')
            expect(vm.searchAndFilterScenes([sc1, sc2])).toEqual([sc1])

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

        it('filtruje paragrafy po przypisanej scenie oraz tagu postaci', () => {
            const charTag = vm.createTag('Wiedźma')
            const sc = vm.createScene('Mokradła')
            const p1 = vm.createParagraph('Bagna')
            const p2 = vm.createParagraph('Góry')

            sc.addParagraph(p1)
            p1.addTag(charTag)

            vm.setSelectedFilterScene(sc.getId())
            expect(vm.searchAndFilterParagraphs([p1, p2], [sc])).toEqual([p1])

            vm.setSelectedFilterScene(null)
            vm.setSelectedFilterTag(charTag.getId())
            expect(vm.searchAndFilterParagraphs([p1, p2])).toEqual([p1])
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

        it('wykrywa kolizję gdy inny paragraf ma już ten sam numer', () => {
            const p1 = vm.createParagraph('P1')
            p1.setNumber(5)
            const p2 = vm.createParagraph('P2')
            p2.setNumber(10)

            const collisionRes = vm.validateParagraphNumber(5, p2.getId(), [p1, p2])
            expect(collisionRes.valid).toBe(false)
            expect(collisionRes.message).toBe('Ten numer jest już zajęty, wybierz inny')

            const sameParagraphRes = vm.validateParagraphNumber(5, p1.getId(), [p1, p2])
            expect(sameParagraphRes.valid).toBe(true)

            const uniqueRes = vm.validateParagraphNumber(42, p2.getId(), [p1, p2])
            expect(uniqueRes.valid).toBe(true)

            const zeroRes = vm.validateParagraphNumber(0, p2.getId(), [p1, p2])
            expect(zeroRes.valid).toBe(true)
        })

        it('zwraca przetłumaczony komunikat o kolizji zależnie od aktywnego języka', () => {
            const p1 = vm.createParagraph('P1')
            p1.setNumber(7)
            const p2 = vm.createParagraph('P2')

            setLanguage('pl')
            expect(vm.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'Ten numer jest już zajęty, wybierz inny'
            )

            setLanguage('en')
            expect(vm.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'This number is already taken, please choose another'
            )

            setLanguage('de')
            expect(vm.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'Diese Nummer ist bereits vergeben, bitte wählen Sie eine andere'
            )
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

    describe('Color Management & Validation', () => {
        it('waliduje poprawne i niepoprawne formaty HEX koloru', () => {
            expect(vm.validateColor('#3b82f6').valid).toBe(true)
            expect(vm.validateColor('#FFF').valid).toBe(true)
            expect(vm.validateColor('10b981').valid).toBe(true)
            expect(vm.validateColor('#10b98122').valid).toBe(false)
            expect(vm.validateColor('invalid-color').valid).toBe(false)
            expect(vm.validateColor('').valid).toBe(false)
        })

        it('aktualizuje kolor dla wybranej sceny', () => {
            const scene = vm.createScene('Testowa Scena')
            expect(scene.getColor()).toBe('#3b82f6')

            vm.selectElement(scene, 'scene')
            const updated = vm.updateColor('#ef4444')
            expect(updated).toBe(true)
            expect(scene.getColor()).toBe('#ef4444')
        })

        it('aktualizuje kolor dla wybranego tagu', () => {
            const tag = vm.createTag('Ważny')
            vm.selectElement(tag, 'tag')
            const updated = vm.updateColor('#8b5cf6')
            expect(updated).toBe(true)
            expect(tag.getColor()).toBe('#8b5cf6')
        })

        it('zwraca false gdy brak zaznaczenia lub encja nie obsługuje setColor', () => {
            expect(vm.updateColor('#3b82f6')).toBe(false)

            const p = vm.createParagraph('Paragraf')
            vm.selectElement(p, 'paragraph')
            expect(vm.updateColor('#3b82f6')).toBe(false)
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

        it('dodaje i usuwa postacie dla zaznaczonego paragrafu i sceny', () => {
            const p = vm.createParagraph('Tavern Scene')
            const c1 = vm.createCharacter('Barkeep')
            const c2 = vm.createCharacter('Patron')
            vm.selectElement(p, 'paragraph')

            vm.addCharacterToSelected(c1)
            vm.addCharacterToSelected(c2)
            expect(p.getCharacters()).toHaveLength(2)
            expect(p.getCharacters()[0].getName()).toBe('Barkeep')

            vm.removeCharacterFromSelected(c1.getId())
            expect(p.getCharacters()).toHaveLength(1)
            expect(p.getCharacters()[0].getName()).toBe('Patron')

            const scene = vm.createScene('Town Square')
            vm.selectElement(scene, 'scene')
            vm.addCharacterToSelected(c1)
            expect(scene.getCharacters()).toHaveLength(1)
            vm.removeCharacterFromSelected(c1.getId())
            expect(scene.getCharacters()).toHaveLength(0)
        })

        it('dodaje, ustawia i usuwa lokacje dla zaznaczonego paragrafu i sceny (obsługa wielu lokacji)', () => {
            const p = vm.createParagraph('Forest Path')
            const loc1 = vm.createLocation('Deep Woods')
            const loc2 = vm.createLocation('Old Ruins')
            vm.selectElement(p, 'paragraph')

            vm.addLocationToSelected(loc1)
            vm.addLocationToSelected(loc2)
            expect(p.getLocations()).toHaveLength(2)
            expect(p.getLocation()?.getName()).toBe('Deep Woods')

            vm.removeLocationFromSelected(loc1.getId())
            expect(p.getLocations()).toHaveLength(1)
            expect(p.getLocations()[0].getName()).toBe('Old Ruins')

            vm.removeLocationFromSelected()
            expect(p.getLocations()).toEqual([])
            expect(p.getLocation()).toBeNull()

            const scene = vm.createScene('Prologue')
            vm.selectElement(scene, 'scene')
            vm.addLocationToSelected(loc1)
            vm.addLocationToSelected(loc2)
            expect(scene.getLocations()).toHaveLength(2)

            vm.removeLocationFromSelected(loc2.getId())
            expect(scene.getLocations()).toHaveLength(1)
            expect(scene.getLocation()?.getName()).toBe('Deep Woods')

            vm.setLocationToSelected(null)
            expect(scene.getLocations()).toEqual([])
            expect(scene.getLocation()).toBeNull()
        })
    })

    describe('Connection / Choice Management', () => {
        it('tworzy nowe połączenie z automatycznym przypisaniem fromParagraph i toParagraph', () => {
            const p1 = vm.createParagraph('Start')
            const p2 = vm.createParagraph('Cel')

            const choice = vm.createChoice(p1, p2, 'Idź do celu', 'Domyślny skok', 'Wymagany klucz')
            expect(choice.getId()).toBeDefined()
            expect(choice.getName()).toBe('Idź do celu')
            expect(choice.getFromParagraphId()).toBe(p1.getId())
            expect(choice.getToParagraphId()).toBe(p2.getId())
            expect(choice.getCondition()?.getSummary()).toBe('Wymagany klucz')
            expect(p1.getChoices()).toContain(choice)
        })

        it('pobiera wszystkie wybory ze wszystkich paragrafów projektu', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const p3 = vm.createParagraph('P3')

            const c1 = vm.createChoice(p1, p2, 'Skok 1')
            const c2 = vm.createChoice(p1, p3, 'Skok 2')
            const c3 = vm.createChoice(p2, p3, 'Skok 3')

            const all = vm.getAllChoices([p1, p2, p3])
            expect(all).toHaveLength(3)
            expect(all).toContain(c1)
            expect(all).toContain(c2)
            expect(all).toContain(c3)
        })

        it('usuwa połączenie ze źródłowego paragrafu oraz zamyka z historii jeśli było wybrane', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const choice = vm.createChoice(p1, p2, 'Skok do usunięcia')

            vm.selectElement(choice, 'choice')
            expect(vm.getSelectedItem()?.id).toBe(choice.getId())

            const deleted = vm.deleteChoice(choice.getId(), [p1, p2])
            expect(deleted).toBe(true)
            expect(p1.getChoices()).not.toContain(choice)
            expect(vm.getSelectedItem()?.id).not.toBe(choice.getId())
        })

        it('deleteChoice returns false for a non-existent choice ID', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')

            const result = vm.deleteChoice('non-existent-id', [p1, p2])
            expect(result).toBe(false)
        })

        it('odwraca kierunek połączenia przenosząc wybór do docelowego węzła', () => {
            const p1 = vm.createParagraph('Źródło')
            const p2 = vm.createParagraph('Cel')
            const choice = vm.createChoice(p1, p2, 'Droga powrotna')

            expect(p1.getChoices()).toContain(choice)
            expect(p2.getChoices()).not.toContain(choice)

            const reversed = vm.reverseChoice(choice, [p1, p2])
            expect(reversed).toBe(true)
            expect(choice.getFromParagraphId()).toBe(p2.getId())
            expect(choice.getToParagraphId()).toBe(p1.getId())
            expect(p1.getChoices()).not.toContain(choice)
            expect(p2.getChoices()).toContain(choice)
        })

        it('aktualizuje nazwę i warunek przeskoku', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const choice = vm.createChoice(p1, p2, 'Stara nazwa')

            vm.selectElement(choice, 'choice')
            vm.updateChoiceDetails(choice, 'Nowa nazwa', 'Nowy warunek pisemny')

            expect(choice.getName()).toBe('Nowa nazwa')
            expect(choice.getCondition()?.getSummary()).toBe('Nowy warunek pisemny')
            expect(vm.getSelectedItem()?.name).toBe('Nowa nazwa')

            // Usunięcie warunku poprzez pusty string
            vm.updateChoiceDetails(choice, 'Nowa nazwa', '   ')
            expect(choice.getCondition()).toBeNull()
        })

        it('filtruje i wyszukuje przeskoki po nazwie, warunku oraz tytułach węzłów', () => {
            const p1 = vm.createParagraph('Karczma')
            const p2 = vm.createParagraph('Las')
            const p3 = vm.createParagraph('Jaskinia')

            const c1 = vm.createChoice(p1, p2, 'Wyjdź na trakt', 'Skok', 'Pochodnia')
            const c2 = vm.createChoice(p2, p3, 'Zejdź w głąb', 'Skok', 'Lina')

            const choices = [c1, c2]
            const paragraphs = [p1, p2, p3]

            // Szukanie po nazwie wyboru
            vm.setConnectionSearchQuery('trakt')
            expect(vm.searchAndFilterChoices(choices, paragraphs)).toEqual([c1])

            // Szukanie po warunku
            vm.setConnectionSearchQuery('lina')
            expect(vm.searchAndFilterChoices(choices, paragraphs)).toEqual([c2])

            // Szukanie po tytule węzła źródłowego
            vm.setConnectionSearchQuery('karczma')
            expect(vm.searchAndFilterChoices(choices, paragraphs)).toEqual([c1])

            // Szukanie po tytule węzła docelowego
            vm.setConnectionSearchQuery('jaskinia')
            expect(vm.searchAndFilterChoices(choices, paragraphs)).toEqual([c2])
        })

        it('zwraca wszystkie wychodzące przeskoki dla danego paragrafu za pomocą getOutgoingChoices', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const p3 = vm.createParagraph('P3')

            expect(vm.getOutgoingChoices(p1)).toEqual([])

            const c1 = vm.createChoice(p1, p2, 'Wyjście 1')
            const c2 = vm.createChoice(p1, p3, 'Wyjście 2')

            const exits = vm.getOutgoingChoices(p1)
            expect(exits).toHaveLength(2)
            expect(exits).toEqual([c1, c2])
        })

        it('zmienia cel przeskoku za pomocą updateChoiceTarget', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const p3 = vm.createParagraph('P3')
            const choice = vm.createChoice(p1, p2, 'Skok')

            expect(choice.getToParagraphId()).toBe(p2.getId())

            const updated = vm.updateChoiceTarget(choice, p3.getId())
            expect(updated).toBe(true)
            expect(choice.getToParagraphId()).toBe(p3.getId())

            // Walidacja pustego ID
            const invalid = vm.updateChoiceTarget(choice, '   ')
            expect(invalid).toBe(false)
        })

        it('aktualizuje nazwę, cel i warunek przeskoku za pomocą updateChoice', () => {
            const p1 = vm.createParagraph('P1')
            const p2 = vm.createParagraph('P2')
            const p3 = vm.createParagraph('P3')
            const choice = vm.createChoice(p1, p2, 'Stara nazwa')

            const updated = vm.updateChoice(choice, 'Nowa nazwa', p3.getId(), 'Wymóg testowy')
            expect(updated).toBe(true)
            expect(choice.getName()).toBe('Nowa nazwa')
            expect(choice.getToParagraphId()).toBe(p3.getId())
            expect(choice.getCondition()?.getSummary()).toBe('Wymóg testowy')

            // Nie pozwala na pustą nazwę
            const failed = vm.updateChoice(choice, '  ', p2.getId(), 'Warunek')
            expect(failed).toBe(false)
        })

        it('zarządza stylem linii połączeń', () => {
            expect(vm.getConnectionLineStyle()).toBe('curved')

            vm.setConnectionLineStyle('curved')
            expect(vm.getConnectionLineStyle()).toBe('curved')
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

        it('zarządza czułością przybliżania kółkiem myszy (zoom sensitivity)', () => {
            expect(vm.getZoomSensitivity()).toBe(0.2)
            vm.setZoomSensitivity(0.35)
            expect(vm.getZoomSensitivity()).toBe(0.35)

            // Clamping
            vm.setZoomSensitivity(-0.5)
            expect(vm.getZoomSensitivity()).toBe(0.01)

            vm.setZoomSensitivity(2.5)
            expect(vm.getZoomSensitivity()).toBe(1.0)
        })

        it('tworzy umiejętności (createSkill), parametry (createParameter) i cechy specjalne (createFeature)', () => {
            const skill = vm.createSkill('Skradanie', 'Skill', 'stat_mod', '', 'Zręczność', '+2')
            expect(skill.getName()).toBe('Skradanie')
            expect(skill.getMode()).toBe('stat_mod')
            expect(skill.getStatName()).toBe('Zręczność')
            expect(skill.getModifier()).toBe('+2')

            const param = vm.createParameter(
                'Punkty Życia',
                'Param',
                'formula',
                '',
                'Siła * 4 + 10',
                50
            )
            expect(param.getName()).toBe('Punkty Życia')
            expect(param.getMode()).toBe('formula')
            expect(param.getFormula()).toBe('Siła * 4 + 10')
            expect(param.getCalculatedValue()).toBe(50)

            const feature = vm.createFeature('Widzenie w ciemności')
            expect(feature.getName()).toBe('Widzenie w ciemności')
        })

        it('wyszukuje i filtruje umiejętności, parametry oraz cechy specjalne', () => {
            const sk1 = vm.createSkill('Walka mieczem')
            const sk2 = vm.createSkill('Strzelanie z łuku')
            vm.setSkillSearchQuery('miecz')
            expect(vm.searchAndFilterSkills([sk1, sk2])).toEqual([sk1])

            const p1 = vm.createParameter('Punkty Życia')
            const p2 = vm.createParameter('Mana')
            vm.setParameterSearchQuery('mana')
            expect(vm.searchAndFilterParameters([p1, p2])).toEqual([p2])

            const f1 = vm.createFeature('Odporność na ogień')
            const f2 = vm.createFeature('Zwinne palce')
            vm.setFeatureSearchQuery('ogień')
            expect(vm.searchAndFilterFeatures([f1, f2])).toEqual([f1])
        })

        it('generuje dynamiczne sugestie TYLKO dla elementów istniejących w Cechy i atrybuty', () => {
            const char = vm.createCharacter('Wojownik')
            char.addStat(vm.createStat('Percepcja'))
            char.addSkill(vm.createSkill('Kradzież'))
            char.addParameter(vm.createParameter('Wytrzymałość'))
            char.addFeature(vm.createFeature('Blizna'))
            char.addTag(vm.createTag('Wojownik'))

            // Cechy / Stats: TYLKO istniejące w przekazanej tablicy projektu
            const suggestedStats = vm.getSuggestedStats([vm.createStat('Szczęście')], [char])
            expect(suggestedStats).not.toContain('Siła') // brak domyślnych
            expect(suggestedStats).not.toContain('Zręczność')
            expect(suggestedStats).toEqual(['Szczęście'])

            // Pusta lista cech zwraca pustą tablicę sugestii
            expect(vm.getSuggestedStats([])).toEqual([])

            // Parametry: TYLKO z listy projektu
            const suggestedParams = vm.getSuggestedParameters(
                [vm.createParameter('Wytrzymałość')],
                [char]
            )
            expect(suggestedParams).not.toContain('Punkty Życia (HP)')
            expect(suggestedParams).toEqual(['Wytrzymałość'])
            expect(vm.getSuggestedParameters([])).toEqual([])

            // Umiejętności: TYLKO z listy projektu
            const suggestedSkills = vm.getSuggestedSkills([vm.createSkill('Alchemia')], [char])
            expect(suggestedSkills).not.toContain('Walka wręcz')
            expect(suggestedSkills).toEqual(['Alchemia'])
            expect(vm.getSuggestedSkills([])).toEqual([])

            // Przymioty specjalne / Atrybuty: TYLKO z listy projektu
            const suggestedFeatures = vm.getSuggestedFeatures(
                [vm.createFeature('Noktowizja')],
                [char]
            )
            expect(suggestedFeatures).not.toContain('Rasa')
            expect(suggestedFeatures).toEqual(['Noktowizja'])
            expect(vm.getSuggestedFeatures([])).toEqual([])

            // Tagi z projektu i postaci
            const suggestedTags = vm.getSuggestedTags([vm.createTag('Bohater')], [char])
            expect(suggestedTags).toContain('Bohater')
            expect(suggestedTags).toContain('Wojownik')

            // Dynamiczne zliczanie cech, atrybutów, parametrów i umiejętności
            const counts = vm.getProjectTraitsCounts(
                [vm.createStat('S1'), vm.createStat('S2')],
                [vm.createParameter('P1')],
                [vm.createSkill('Sk1'), vm.createSkill('Sk2'), vm.createSkill('Sk3')],
                [vm.createFeature('F1')]
            )
            expect(counts).toEqual({
                stats: 2,
                parameters: 1,
                skills: 3,
                features: 1,
                total: 7,
            })
        })

        it('pozwala dodawać i usuwać umiejętności, parametry oraz cechy z zaznaczonej encji', () => {
            const char = vm.createCharacter('Bohater')
            vm.selectElement(char, 'character')

            const skill = vm.createSkill('Fechtunek')
            vm.addSkillToSelected(skill)
            expect(char.getSkills()).toContain(skill)

            vm.removeSkillFromSelected(skill.getId())
            expect(char.getSkills()).not.toContain(skill)

            const param = vm.createParameter('Energia')
            vm.addParameterToSelected(param)
            expect(char.getParameters()).toContain(param)

            vm.removeParameterFromSelected(param.getId())
            expect(char.getParameters()).not.toContain(param)

            const feat = vm.createFeature('Szybki refleks')
            vm.addFeatureToSelected(feat)
            expect(char.getFeatures()).toContain(feat)

            vm.removeFeatureFromSelected(feat.getId())
            expect(char.getFeatures()).not.toContain(feat)
        })
    })
})
