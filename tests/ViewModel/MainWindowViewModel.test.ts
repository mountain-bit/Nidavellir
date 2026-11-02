import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_TAG_COLOR } from '../../Model/constants'
import { Description } from '../../Model/Description'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { initTranslationsWithLocale, setLanguage } from '../../Utils/i18n/translate'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('MainWindowViewModel', () => {
    let vm: MainWindowViewModel

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        vm = new MainWindowViewModel()
    })

    it('domyślnie posiada aktywne odpowiednie zakładki i stan widoków', () => {
        expect(vm.layout.getActiveRibbonTab()).toBe('glowna')
        expect(vm.layout.getActiveLeftTab()).toBe('paragraphs')
        expect(vm.layout.isLeftDrawerOpen()).toBe(true)
        expect(vm.layout.isRightSidebarCollapsed()).toBe(false)
        expect(vm.layout.getActiveMainView()).toBe('graph')
    })

    it('zmienia aktywną zakładkę wstążki', () => {
        vm.layout.setActiveRibbonTab('sceny')
        expect(vm.layout.getActiveRibbonTab()).toBe('sceny')

        vm.layout.setActiveRibbonTab('widok')
        expect(vm.layout.getActiveRibbonTab()).toBe('widok')
    })

    it('ponowne kliknięcie tej samej ikony na lewym pasku zamyka panel (toggle off)', () => {
        expect(vm.layout.getActiveLeftTab()).toBe('paragraphs')
        expect(vm.layout.isLeftDrawerOpen()).toBe(true)

        vm.layout.toggleLeftTab('paragraphs')
        expect(vm.layout.getActiveLeftTab()).toBeNull()
        expect(vm.layout.isLeftDrawerOpen()).toBe(false)
    })

    it('kliknięcie innej ikony na lewym pasku zmienia otwartą zakładkę w panelu dla wszystkich sekcji w tym tags i connections', () => {
        vm.layout.closeLeftDrawer()
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
            vm.layout.toggleLeftTab(tab)
            expect(vm.layout.getActiveLeftTab()).toBe(tab)
            expect(vm.layout.isLeftDrawerOpen()).toBe(true)
        })
    })

    it('zamykanie i ponowne otwieranie lewego panelu', () => {
        vm.layout.closeLeftDrawer()
        expect(vm.layout.isLeftDrawerOpen()).toBe(false)
        expect(vm.layout.getActiveLeftTab()).toBeNull()

        vm.layout.toggleLeftTab('settings')
        expect(vm.layout.getActiveLeftTab()).toBe('settings')
        expect(vm.layout.isLeftDrawerOpen()).toBe(true)
    })

    it('przełącza widoczność prawego panelu za pomocą strzałki toggle', () => {
        expect(vm.layout.isRightSidebarCollapsed()).toBe(false)

        vm.layout.toggleRightSidebar()
        expect(vm.layout.isRightSidebarCollapsed()).toBe(true)

        vm.layout.toggleRightSidebar()
        expect(vm.layout.isRightSidebarCollapsed()).toBe(false)
    })

    it('zarządza otwartymi plikami i aktywnym plikiem', () => {
        expect(vm.files.getActiveFile()).toBeNull()
        expect(vm.files.getOpenFiles()).toEqual([])

        vm.files.setActiveFile('Scene 1')
        expect(vm.files.getActiveFile()).toBe('Scene 1')
        expect(vm.files.getOpenFiles()).toContain('Scene 1')

        vm.files.setActiveFile('Scene 2')
        expect(vm.files.getActiveFile()).toBe('Scene 2')
        expect(vm.files.getOpenFiles()).toEqual(['Scene 1', 'Scene 2'])

        vm.files.closeFile('Scene 2')
        expect(vm.files.getOpenFiles()).not.toContain('Scene 2')
        expect(vm.files.getActiveFile()).toBe('Scene 1')
    })

    it('closing the last open file leaves no active file', () => {
        vm.files.setActiveFile('Only File')
        expect(vm.files.getOpenFiles()).toHaveLength(1)

        vm.files.closeFile('Only File')
        expect(vm.files.getOpenFiles()).toHaveLength(0)
        expect(vm.files.getActiveFile()).toBeNull()
    })

    it('zwraca czytelną nazwę obiektu zamiast pełnej nazwy pliku opisu', () => {
        expect(vm.files.getFileDisplayName(null)).toBe('')
        expect(vm.files.getFileDisplayName('Description_NPC_Jan.md')).toBe('Jan')
        expect(vm.files.getFileDisplayName('Description_NPC_Jan')).toBe('Jan')
        expect(vm.files.getFileDisplayName('C:/Projekt/Descriptions/Description_NPC_Jan.md')).toBe(
            'Jan'
        )
        expect(vm.files.getFileDisplayName('Description_Item_Zardzewialy_Miecz.md')).toBe(
            'Zardzewialy Miecz'
        )
        expect(vm.files.getFileDisplayName('Description_Location_Mroczny_Las.md')).toBe(
            'Mroczny Las'
        )
        expect(vm.files.getFileDisplayName('Jan_text.md')).toBe('Jan')
        expect(vm.files.getFileDisplayName('Jan_author.md')).toBe('Jan')
        expect(vm.files.getFileDisplayName('Wprowadzenie.md')).toBe('Wprowadzenie')

        vm.files.setFileDisplayName('custom_file.md', 'Mój Specjalny Obiekt')
        expect(vm.files.getFileDisplayName('custom_file.md')).toBe('Mój Specjalny Obiekt')
    })

    it('zmienia główny widok na graf historii i z powrotem', () => {
        expect(vm.layout.getActiveMainView()).toBe('graph')

        vm.layout.setActiveMainView('markdown')
        expect(vm.layout.getActiveMainView()).toBe('markdown')

        vm.layout.setActiveMainView('graph')
        expect(vm.layout.getActiveMainView()).toBe('graph')
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

            vm.filter.setParagraphSearchQuery('smok')
            const filtered = vm.filter.searchAndFilterParagraphs(list)

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

            vm.filter.setSelectedFilterTag('Combat')
            const filtered = vm.filter.searchAndFilterParagraphs([p1, p2, p3])

            expect(filtered).toHaveLength(2)
            expect(filtered.map(p => p.getId())).toEqual(['p1', 'p3'])
        })
    })

    describe('Tworzenie elementów i filtrowanie sekcji (English & Legacy methods)', () => {
        it('tworzy paragraf z własnym lub domyślnym tytułem', () => {
            const pWlasny = vm.factory.createParagraph('Prologue')
            expect(pWlasny.getTitle()).toBe('Prologue')
            expect(pWlasny.getId()).toMatch(/^paragraph_/)

            const pDomyslny = vm.factory.createParagraph('')
            expect(pDomyslny.getTitle()).toBe('New paragraph')
        })

        it('tworzy scenę z własną lub domyślną nazwą', () => {
            const sWlasna = vm.factory.createScene('Intro')
            expect(sWlasna.getName()).toBe('Intro')
            expect(sWlasna.getId()).toMatch(/^scene_/)

            const sDomyslna = vm.factory.createScene('')
            expect(sDomyslna.getName()).toBe('New scene')
        })

        it('tworzy przedmiot z własną lub domyślną nazwą', () => {
            const prWlasny = vm.factory.createItem('Sword')
            expect(prWlasny.getName()).toBe('Sword')
            expect(prWlasny.getId()).toMatch(/^item_/)

            const prDomyslny = vm.factory.createItem('')
            expect(prDomyslny.getName()).toBe('New item')
        })

        it('tworzy klasę postaci z własną lub domyślną nazwą', () => {
            const kWlasna = vm.factory.createCharacterClass('Warrior')
            expect(kWlasna.getName()).toBe('Warrior')
            expect(kWlasna.getId()).toMatch(/^class_/)

            const kDomyslna = vm.factory.createCharacterClass('')
            expect(kDomyslna.getName()).toBe('New class')
        })

        it('tworzy postać z własną lub domyślną nazwą gdy pole jest puste', () => {
            const pWlasna = vm.factory.createCharacter('Merchant')
            expect(pWlasna.getName()).toBe('Merchant')

            const pDomyslna = vm.factory.createCharacter('')
            expect(pDomyslna.getName()).toBe('New character')
        })

        it('tworzy lokację z własną lub domyślną nazwą gdy pole jest puste', () => {
            const lWlasna = vm.factory.createLocation('Tavern')
            expect(lWlasna.getName()).toBe('Tavern')

            const lDomyslna = vm.factory.createLocation('   ')
            expect(lDomyslna.getName()).toBe('New location')
        })

        it('tworzy cechę/statystykę z własną lub domyślną nazwą gdy pole jest puste', () => {
            const cWlasna = vm.factory.createStat('Strength')
            expect(cWlasna.getName()).toBe('Strength')

            const cDomyslna = vm.factory.createStat('')
            expect(cDomyslna.getName()).toBe('New stat')
        })

        it('tworzy tag z własną lub domyślną nazwą oraz domyślnym kolorem', () => {
            const tWlasny = vm.factory.createTag('Magic', '#8b5cf6')
            expect(tWlasny.getName()).toBe('Magic')
            expect(tWlasny.getColor()).toBe('#8b5cf6')

            const tDomyslny = vm.factory.createTag('')
            expect(tDomyslny.getName()).toBe('New tag')
            expect(tDomyslny.getColor()).toBe(DEFAULT_TAG_COLOR)
        })

        it('umożliwia wstrzyknięcie niestandardowego generatora ID dla pełnego determinizmu', () => {
            let counter = 0
            const mockGenerator = (prefix?: string): string =>
                `${prefix || 'id'}_fixed_${++counter}`
            const deterministicVm = new MainWindowViewModel(mockGenerator)

            const npc = deterministicVm.factory.createCharacter('Hero')
            expect(npc.getId()).toBe('npc_fixed_1')

            const location = deterministicVm.factory.createLocation('Mountains')
            expect(location.getId()).toBe('location_fixed_2')

            const stat = deterministicVm.factory.createStat('Agility')
            expect(stat.getId()).toBe('stat_fixed_3')

            const tag = deterministicVm.factory.createTag('Test')
            expect(tag.getId()).toBe('tag_fixed_4')
        })

        it('filtruje sekcje po wyszukiwanym haśle', () => {
            const sc1 = vm.factory.createScene('Prolog')
            const sc2 = vm.factory.createScene('Epilog')
            expect(sc1.getId()).toMatch(/^scene_/)

            vm.filter.setSceneSearchQuery('prol')
            expect(vm.filter.searchAndFilterScenes([sc1, sc2])).toEqual([sc1])

            const p1 = vm.factory.createCharacter('Guard')
            const p2 = vm.factory.createCharacter('Merchant')

            vm.filter.setCharacterSearchQuery('guard')
            expect(vm.filter.searchAndFilterCharacters([p1, p2])).toEqual([p1])

            const l1 = vm.factory.createLocation('Castle')
            const l2 = vm.factory.createLocation('Tavern')

            vm.filter.setLocationSearchQuery('tav')
            expect(vm.filter.searchAndFilterLocations([l1, l2])).toEqual([l2])

            const s1 = vm.factory.createStat('Strength')
            const s2 = vm.factory.createStat('Agility')

            vm.filter.setStatSearchQuery('stre')
            expect(vm.filter.searchAndFilterStats([s1, s2])).toEqual([s1])
        })

        it('filtruje paragrafy po przypisanej scenie oraz tagu postaci', () => {
            const charTag = vm.factory.createTag('Wiedźma')
            const sc = vm.factory.createScene('Mokradła')
            const p1 = vm.factory.createParagraph('Bagna')
            const p2 = vm.factory.createParagraph('Góry')

            sc.addParagraph(p1)
            p1.addTag(charTag)

            vm.filter.setSelectedFilterScene(sc.getId())
            expect(vm.filter.searchAndFilterParagraphs([p1, p2], [sc])).toEqual([p1])

            vm.filter.setSelectedFilterScene(null)
            vm.filter.setSelectedFilterTag(charTag.getId())
            expect(vm.filter.searchAndFilterParagraphs([p1, p2])).toEqual([p1])
        })
    })

    describe('Selection & History Management', () => {
        it('obsługuje pojedyncze zaznaczenie elementu i dodawanie do historii', () => {
            const p1 = vm.factory.createParagraph('Intro')
            const p2 = vm.factory.createParagraph('Outro')

            const item1 = vm.selection.selectElement(p1, 'paragraph')
            expect(vm.selection.getSelectedItem()).toEqual(item1)
            expect(vm.selection.getHistory()).toHaveLength(1)
            expect(vm.selection.getHistory()[0].id).toBe(p1.getId())
            expect(vm.layout.isRightSidebarCollapsed()).toBe(false)

            const item2 = vm.selection.selectElement(p2, 'paragraph')
            expect(vm.selection.getSelectedItem()).toEqual(item2)
            expect(vm.selection.getSelectedItem()?.id).toBe(p2.getId())
            expect(vm.selection.getHistory()).toHaveLength(2)
            expect(vm.selection.getHistory()[0].id).toBe(p2.getId())

            // Ponowne zaznaczenie pierwszego przenosi go na początek historii bez duplikatów
            vm.selection.selectElement(p1, 'paragraph')
            expect(vm.selection.getHistory()).toHaveLength(2)
            expect(vm.selection.getHistory()[0].id).toBe(p1.getId())
        })

        it('umożliwia wybór z historii oraz zamykanie elementów pojedynczo i hurtowo', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const p3 = vm.factory.createParagraph('P3')

            vm.selection.selectElement(p1, 'paragraph')
            vm.selection.selectElement(p2, 'paragraph')
            vm.selection.selectElement(p3, 'paragraph')
            expect(vm.selection.getHistory()).toHaveLength(3)

            vm.selection.selectHistoryItem(p1.getId())
            expect(vm.selection.getSelectedItem()?.id).toBe(p1.getId())

            // Zamknięcie aktywnego elementu przełącza zaznaczenie na kolejny w historii
            vm.selection.closeHistoryItem(p1.getId())
            expect(vm.selection.getHistory()).toHaveLength(2)
            expect(vm.selection.getSelectedItem()?.id).toBe(p3.getId())

            // Zamknij wszystko
            vm.selection.closeAllHistory()
            expect(vm.selection.getHistory()).toEqual([])
            expect(vm.selection.getSelectedItem()).toBeNull()
        })
    })

    describe('Paragraph Numbering & Random Generation', () => {
        it('nie losuje numeru automatycznie podczas zaznaczenia (pozostaje do fazy eksportu)', () => {
            const p = vm.factory.createParagraph('Combat')
            expect(p.getRandomizedNumber()).toBe(0)

            vm.selection.selectElement(p, 'paragraph')
            // Podczas edycji w UI numer nie jest losowany
            expect(p.getRandomizedNumber()).toBe(0)

            // Losowanie następuje dopiero przy wywołaniu randomizeNumber (np. faza eksportu)
            const rolled = p.randomizeNumber(1, 999999)
            expect(rolled).toBeGreaterThan(0)
            expect(rolled).toBeLessThanOrEqual(999999)
            expect(p.getRandomizedNumber()).toBe(rolled)
        })

        it('umożliwia zablokowanie i wpisanie własnego statycznego numeru', () => {
            const p = vm.factory.createParagraph('Secret Room')
            vm.selection.selectElement(p, 'paragraph')

            expect(p.getIsNumberLocked()).toBe(false)
            vm.selection.toggleNumberLock(true)
            expect(p.getIsNumberLocked()).toBe(true)

            vm.selection.updateCustomNumber(99)
            expect(p.getNumber()).toBe(99)
        })

        it('wykrywa kolizję gdy inny paragraf ma już ten sam numer', () => {
            const p1 = vm.factory.createParagraph('P1')
            p1.setNumber(5)
            const p2 = vm.factory.createParagraph('P2')
            p2.setNumber(10)

            const collisionRes = vm.selection.validateParagraphNumber(5, p2.getId(), [p1, p2])
            expect(collisionRes.valid).toBe(false)
            expect(collisionRes.message).toBe('Ten numer jest już zajęty, wybierz inny')

            const sameParagraphRes = vm.selection.validateParagraphNumber(5, p1.getId(), [p1, p2])
            expect(sameParagraphRes.valid).toBe(true)

            const uniqueRes = vm.selection.validateParagraphNumber(42, p2.getId(), [p1, p2])
            expect(uniqueRes.valid).toBe(true)

            const zeroRes = vm.selection.validateParagraphNumber(0, p2.getId(), [p1, p2])
            expect(zeroRes.valid).toBe(true)
        })

        it('zwraca przetłumaczony komunikat o kolizji zależnie od aktywnego języka', () => {
            const p1 = vm.factory.createParagraph('P1')
            p1.setNumber(7)
            const p2 = vm.factory.createParagraph('P2')

            setLanguage('pl')
            expect(vm.selection.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'Ten numer jest już zajęty, wybierz inny'
            )

            setLanguage('en')
            expect(vm.selection.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'This number is already taken, please choose another'
            )

            setLanguage('de')
            expect(vm.selection.validateParagraphNumber(7, p2.getId(), [p1]).message).toBe(
                'Diese Nummer ist bereits vergeben, bitte wählen Sie eine andere'
            )
        })
    })

    describe('Live Name Validation & Scope Collision Checking', () => {
        it('blokuje puste nazwy oraz wykrywa kolizję w zakresie sekcji', () => {
            const p1 = vm.factory.createParagraph('Unique Name')
            const p2 = vm.factory.createParagraph('Existing Name')
            const item = vm.selection.selectElement(p1, 'paragraph')

            const emptyRes = vm.selection.validateName('   ', item, [p1, p2])
            expect(emptyRes.valid).toBe(false)

            const collisionRes = vm.selection.validateName('existing name', item, [p1, p2])
            expect(collisionRes.valid).toBe(false)
            expect(collisionRes.message).toContain('already exists')

            const validRes = vm.selection.validateName('Brand New Name', item, [p1, p2])
            expect(validRes.valid).toBe(true)
        })

        it('aktualizuje nazwę encji i wpisu w historii gdy walidacja przejdzie pomyślnie', () => {
            const p1 = vm.factory.createParagraph('Old Title')
            vm.selection.selectElement(p1, 'paragraph')

            const updated = vm.selection.updateName('New Super Title', [p1])
            expect(updated).toBe(true)
            expect(p1.getTitle()).toBe('New Super Title')
            expect(vm.selection.getSelectedItem()?.name).toBe('New Super Title')
            expect(vm.selection.getHistory()[0].name).toBe('New Super Title')
        })
    })

    describe('Color Management & Validation', () => {
        it('waliduje poprawne i niepoprawne formaty HEX koloru', () => {
            expect(vm.selection.validateColor('#3b82f6').valid).toBe(true)
            expect(vm.selection.validateColor('#FFF').valid).toBe(true)
            expect(vm.selection.validateColor('10b981').valid).toBe(true)
            expect(vm.selection.validateColor('#10b98122').valid).toBe(false)
            expect(vm.selection.validateColor('invalid-color').valid).toBe(false)
            expect(vm.selection.validateColor('').valid).toBe(false)
        })

        it('aktualizuje kolor dla wybranej sceny', () => {
            const scene = vm.factory.createScene('Testowa Scena')
            expect(scene.getColor()).toBe('#4a5b6d')

            vm.selection.selectElement(scene, 'scene')
            const updated = vm.selection.updateColor('#ef4444')
            expect(updated).toBe(true)
            expect(scene.getColor()).toBe('#ef4444')
        })

        it('aktualizuje kolor dla wybranego tagu', () => {
            const tag = vm.factory.createTag('Ważny')
            vm.selection.selectElement(tag, 'tag')
            const updated = vm.selection.updateColor('#8b5cf6')
            expect(updated).toBe(true)
            expect(tag.getColor()).toBe('#8b5cf6')
        })

        it('zwraca false gdy brak zaznaczenia lub encja nie obsługuje setColor', () => {
            expect(vm.selection.updateColor('#3b82f6')).toBe(false)

            const p = vm.factory.createParagraph('Paragraf')
            vm.selection.selectElement(p, 'paragraph')
            expect(vm.selection.updateColor('#3b82f6')).toBe(false)
        })
    })

    describe('Summary & Narrative Files', () => {
        it('aktualizuje streszczenie wybranego elementu', () => {
            const p = vm.factory.createParagraph('Story')
            vm.selection.selectElement(p, 'paragraph')

            vm.selection.updateSummary('Krótkie streszczenie wątku')
            expect(p.getContent().getSummary()).toBe('Krótkie streszczenie wątku')
        })

        it('przygotowuje i otwiera ustandaryzowany plik narracyjny Description_Paragraph_Intro.md i zwraca czytelną nazwę', () => {
            const p = vm.factory.createParagraph('Intro')
            vm.selection.selectElement(p, 'paragraph')

            const descFile = vm.files.openOrCreateDescriptionFile()
            expect(descFile.fileName).toBe('Description_Paragraph_Intro.md')
            expect(descFile.content).toContain('Narrative text')
            expect(vm.files.getActiveFile()).toBe('Description_Paragraph_Intro.md')
            expect(vm.files.getFileDisplayName(descFile.fileName)).toBe('Intro')
        })

        it('zwraca czytelną nazwę obiektu zamiast technicznej nazwy pliku', () => {
            expect(vm.files.getFileDisplayName('Description_NPC_Jan.md')).toBe('Jan')
            expect(vm.files.getFileDisplayName('Description_Location_Mroczny_Las.md')).toBe(
                'Mroczny Las'
            )
            expect(vm.files.getFileDisplayName('Intro_text.md')).toBe('Intro')
            expect(vm.files.getFileDisplayName(null)).toBe('')
        })
    })

    describe('Dynamic Tags & Stats Modification', () => {
        it('dodaje i usuwa tagi dla zaznaczonego elementu', () => {
            const p = vm.factory.createParagraph('Tagged Paragraph')
            const tag = vm.factory.createTag('SpecialTag')
            vm.selection.selectElement(p, 'paragraph')

            vm.selection.addTagToSelected(tag)
            expect(p.getTags()).toHaveLength(1)
            expect(p.getTags()[0].getName()).toBe('SpecialTag')

            vm.selection.removeTagFromSelected(tag.getId())
            expect(p.getTags()).toHaveLength(0)
        })

        it('dodaje i usuwa statystyki/cechy dla postaci', () => {
            const c = vm.factory.createCharacter('Hero')
            const stat = vm.factory.createStat('Mana')
            vm.selection.selectElement(c, 'character')

            vm.selection.addStatToSelected(stat)
            expect(c.getStats()).toHaveLength(1)
            expect(c.getStats()[0].getName()).toBe('Mana')

            vm.selection.removeStatFromSelected(stat.getId())
            expect(c.getStats()).toHaveLength(0)
        })

        it('dodaje i usuwa postacie dla zaznaczonego paragrafu i sceny', () => {
            const p = vm.factory.createParagraph('Tavern Scene')
            const c1 = vm.factory.createCharacter('Barkeep')
            const c2 = vm.factory.createCharacter('Patron')
            vm.selection.selectElement(p, 'paragraph')

            vm.selection.addCharacterToSelected(c1)
            vm.selection.addCharacterToSelected(c2)
            expect(p.getCharacters()).toHaveLength(2)
            expect(p.getCharacters()[0].getName()).toBe('Barkeep')

            vm.selection.removeCharacterFromSelected(c1.getId())
            expect(p.getCharacters()).toHaveLength(1)
            expect(p.getCharacters()[0].getName()).toBe('Patron')

            const scene = vm.factory.createScene('Town Square')
            vm.selection.selectElement(scene, 'scene')
            vm.selection.addCharacterToSelected(c1)
            expect(scene.getCharacters()).toHaveLength(1)
            vm.selection.removeCharacterFromSelected(c1.getId())
            expect(scene.getCharacters()).toHaveLength(0)
        })

        it('dodaje, ustawia i usuwa lokacje dla zaznaczonego paragrafu i sceny (obsługa wielu lokacji)', () => {
            const p = vm.factory.createParagraph('Forest Path')
            const loc1 = vm.factory.createLocation('Deep Woods')
            const loc2 = vm.factory.createLocation('Old Ruins')
            vm.selection.selectElement(p, 'paragraph')

            vm.selection.addLocationToSelected(loc1)
            vm.selection.addLocationToSelected(loc2)
            expect(p.getLocations()).toHaveLength(2)
            expect(p.getLocation()?.getName()).toBe('Deep Woods')

            vm.selection.removeLocationFromSelected(loc1.getId())
            expect(p.getLocations()).toHaveLength(1)
            expect(p.getLocations()[0].getName()).toBe('Old Ruins')

            vm.selection.removeLocationFromSelected()
            expect(p.getLocations()).toEqual([])
            expect(p.getLocation()).toBeNull()

            const scene = vm.factory.createScene('Prologue')
            vm.selection.selectElement(scene, 'scene')
            vm.selection.addLocationToSelected(loc1)
            vm.selection.addLocationToSelected(loc2)
            expect(scene.getLocations()).toHaveLength(2)

            vm.selection.removeLocationFromSelected(loc2.getId())
            expect(scene.getLocations()).toHaveLength(1)
            expect(scene.getLocation()?.getName()).toBe('Deep Woods')

            vm.selection.setLocationToSelected(null)
            expect(scene.getLocations()).toEqual([])
            expect(scene.getLocation()).toBeNull()
        })
    })

    describe('Connection / Choice Management', () => {
        it('tworzy nowe połączenie z automatycznym przypisaniem fromParagraph i toParagraph', () => {
            const p1 = vm.factory.createParagraph('Start')
            const p2 = vm.factory.createParagraph('Cel')

            const choice = vm.graph.createChoice(
                p1,
                p2,
                'Idź do celu',
                'Domyślny skok',
                'Wymagany klucz'
            )
            expect(choice.getId()).toBeDefined()
            expect(choice.getName()).toBe('Idź do celu')
            expect(choice.getFromParagraphId()).toBe(p1.getId())
            expect(choice.getToParagraphId()).toBe(p2.getId())
            expect(choice.getCondition()?.getSummary()).toBe('Wymagany klucz')
            expect(p1.getChoices()).toContain(choice)
        })

        it('pobiera wszystkie wybory ze wszystkich paragrafów projektu', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const p3 = vm.factory.createParagraph('P3')

            const c1 = vm.graph.createChoice(p1, p2, 'Skok 1')
            const c2 = vm.graph.createChoice(p1, p3, 'Skok 2')
            const c3 = vm.graph.createChoice(p2, p3, 'Skok 3')

            const all = vm.graph.getAllChoices([p1, p2, p3])
            expect(all).toHaveLength(3)
            expect(all).toContain(c1)
            expect(all).toContain(c2)
            expect(all).toContain(c3)
        })

        it('getAllChoices zawiera również przeskoki po walce (combat outcomes)', () => {
            const p1 = vm.factory.createParagraph('Arena')
            const p2 = vm.factory.createParagraph('Zwycięstwo')
            p1.setHasCombat(true)
            const combat = p1.getCombat()
            combat.addOutcome({
                id: 'out_win',
                name: 'Wygrana walka',
                targetParagraphId: p2.getId(),
            })

            const all = vm.graph.getAllChoices([p1, p2])
            expect(all).toHaveLength(1)
            expect(all[0].getName()).toBe('Wygrana walka')
            expect(all[0].getToParagraphId()).toBe(p2.getId())
            expect(all[0].getIsCombatOutcome()).toBe(true)
        })

        it('usuwa połączenie ze źródłowego paragrafu oraz zamyka z historii jeśli było wybrane', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const choice = vm.graph.createChoice(p1, p2, 'Skok do usunięcia')

            vm.selection.selectElement(choice, 'choice')
            expect(vm.selection.getSelectedItem()?.id).toBe(choice.getId())

            const deleted = vm.graph.deleteChoice(choice.getId(), [p1, p2])
            expect(deleted).toBe(true)
            expect(p1.getChoices()).not.toContain(choice)
            expect(vm.selection.getSelectedItem()?.id).not.toBe(choice.getId())
        })

        it('deleteChoice returns false for a non-existent choice ID', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')

            const result = vm.graph.deleteChoice('non-existent-id', [p1, p2])
            expect(result).toBe(false)
        })

        it('odwraca kierunek połączenia przenosząc wybór do docelowego węzła', () => {
            const p1 = vm.factory.createParagraph('Źródło')
            const p2 = vm.factory.createParagraph('Cel')
            const choice = vm.graph.createChoice(p1, p2, 'Droga powrotna')

            expect(p1.getChoices()).toContain(choice)
            expect(p2.getChoices()).not.toContain(choice)

            const reversed = vm.graph.reverseChoice(choice, [p1, p2])
            expect(reversed).toBe(true)
            expect(choice.getFromParagraphId()).toBe(p2.getId())
            expect(choice.getToParagraphId()).toBe(p1.getId())
            expect(p1.getChoices()).not.toContain(choice)
            expect(p2.getChoices()).toContain(choice)
        })

        it('aktualizuje nazwę i warunek przeskoku', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const choice = vm.graph.createChoice(p1, p2, 'Stara nazwa')

            vm.selection.selectElement(choice, 'choice')
            vm.graph.updateChoiceDetails(choice, 'Nowa nazwa', 'Nowy warunek pisemny')

            expect(choice.getName()).toBe('Nowa nazwa')
            expect(choice.getCondition()?.getSummary()).toBe('Nowy warunek pisemny')
            expect(vm.selection.getSelectedItem()?.name).toBe('Nowa nazwa')

            // Usunięcie warunku poprzez pusty string
            vm.graph.updateChoiceDetails(choice, 'Nowa nazwa', '   ')
            expect(choice.getCondition()).toBeNull()
        })

        it('filtruje i wyszukuje przeskoki po nazwie, warunku oraz tytułach węzłów', () => {
            const p1 = vm.factory.createParagraph('Karczma')
            const p2 = vm.factory.createParagraph('Las')
            const p3 = vm.factory.createParagraph('Jaskinia')

            const c1 = vm.graph.createChoice(p1, p2, 'Wyjdź na trakt', 'Skok', 'Pochodnia')
            const c2 = vm.graph.createChoice(p2, p3, 'Zejdź w głąb', 'Skok', 'Lina')

            const choices = [c1, c2]
            const paragraphs = [p1, p2, p3]

            // Szukanie po nazwie wyboru
            vm.filter.setConnectionSearchQuery('trakt')
            expect(vm.filter.searchAndFilterChoices(choices, paragraphs)).toEqual([c1])

            // Szukanie po warunku
            vm.filter.setConnectionSearchQuery('lina')
            expect(vm.filter.searchAndFilterChoices(choices, paragraphs)).toEqual([c2])

            // Szukanie po tytule węzła źródłowego
            vm.filter.setConnectionSearchQuery('karczma')
            expect(vm.filter.searchAndFilterChoices(choices, paragraphs)).toEqual([c1])

            // Szukanie po tytule węzła docelowego
            vm.filter.setConnectionSearchQuery('jaskinia')
            expect(vm.filter.searchAndFilterChoices(choices, paragraphs)).toEqual([c2])
        })

        it('zwraca wszystkie wychodzące przeskoki dla danego paragrafu za pomocą getOutgoingChoices', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const p3 = vm.factory.createParagraph('P3')

            expect(vm.graph.getOutgoingChoices(p1)).toEqual([])

            const c1 = vm.graph.createChoice(p1, p2, 'Wyjście 1')
            const c2 = vm.graph.createChoice(p1, p3, 'Wyjście 2')

            const exits = vm.graph.getOutgoingChoices(p1)
            expect(exits).toHaveLength(2)
            expect(exits).toEqual([c1, c2])
        })

        it('zmienia cel przeskoku za pomocą updateChoiceTarget', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const p3 = vm.factory.createParagraph('P3')
            const choice = vm.graph.createChoice(p1, p2, 'Skok')

            expect(choice.getToParagraphId()).toBe(p2.getId())

            const updated = vm.graph.updateChoiceTarget(choice, p3.getId())
            expect(updated).toBe(true)
            expect(choice.getToParagraphId()).toBe(p3.getId())

            // Walidacja pustego ID
            const invalid = vm.graph.updateChoiceTarget(choice, '   ')
            expect(invalid).toBe(false)
        })

        it('aktualizuje nazwę, cel i warunek przeskoku za pomocą updateChoice', () => {
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const p3 = vm.factory.createParagraph('P3')
            const choice = vm.graph.createChoice(p1, p2, 'Stara nazwa')

            const updated = vm.graph.updateChoice(choice, 'Nowa nazwa', p3.getId(), 'Wymóg testowy')
            expect(updated).toBe(true)
            expect(choice.getName()).toBe('Nowa nazwa')
            expect(choice.getToParagraphId()).toBe(p3.getId())
            expect(choice.getCondition()?.getSummary()).toBe('Wymóg testowy')

            // Nie pozwala na pustą nazwę
            const failed = vm.graph.updateChoice(choice, '  ', p2.getId(), 'Warunek')
            expect(failed).toBe(false)
        })

        it('zarządza stylem linii połączeń', () => {
            expect(vm.layout.getConnectionLineStyle()).toBe('curved')

            vm.layout.setConnectionLineStyle('curved')
            expect(vm.layout.getConnectionLineStyle()).toBe('curved')
        })
    })

    describe('Panel Resizing Bounds', () => {
        it('pilnuje minimalnych i maksymalnych wymiarów lewego i prawego panelu', () => {
            expect(vm.layout.getLeftDrawerWidth()).toBe(260)
            vm.layout.setLeftDrawerWidth(100) // Za mało
            expect(vm.layout.getLeftDrawerWidth()).toBe(180)

            vm.layout.setLeftDrawerWidth(900) // Za dużo
            expect(vm.layout.getLeftDrawerWidth()).toBe(600)

            expect(vm.layout.getRightSidebarWidth()).toBe(280)
            vm.layout.setRightSidebarWidth(100) // Za mało
            expect(vm.layout.getRightSidebarWidth()).toBe(220)

            vm.layout.setRightSidebarWidth(1000) // Za dużo
            expect(vm.layout.getRightSidebarWidth()).toBe(700)
        })

        it('zarządza czułością przybliżania kółkiem myszy (zoom sensitivity)', () => {
            expect(vm.layout.getZoomSensitivity()).toBe(0.2)
            vm.layout.setZoomSensitivity(0.35)
            expect(vm.layout.getZoomSensitivity()).toBe(0.35)

            // Clamping
            vm.layout.setZoomSensitivity(-0.5)
            expect(vm.layout.getZoomSensitivity()).toBe(0.01)

            vm.layout.setZoomSensitivity(2.5)
            expect(vm.layout.getZoomSensitivity()).toBe(1.0)
        })

        it('tworzy umiejętności (createSkill), parametry (createParameter) i cechy specjalne (createFeature)', () => {
            const skill = vm.factory.createSkill(
                'Skradanie',
                'Skill',
                'stat_mod',
                '',
                'Zręczność',
                '+2'
            )
            expect(skill.getName()).toBe('Skradanie')
            expect(skill.getMode()).toBe('stat_mod')
            expect(skill.getStatName()).toBe('Zręczność')
            expect(skill.getModifier()).toBe('+2')

            const param = vm.factory.createParameter(
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

            const feature = vm.factory.createFeature('Widzenie w ciemności')
            expect(feature.getName()).toBe('Widzenie w ciemności')
        })

        it('wyszukuje i filtruje umiejętności, parametry oraz cechy specjalne', () => {
            const sk1 = vm.factory.createSkill('Walka mieczem')
            const sk2 = vm.factory.createSkill('Strzelanie z łuku')
            vm.filter.setSkillSearchQuery('miecz')
            expect(vm.filter.searchAndFilterSkills([sk1, sk2])).toEqual([sk1])

            const p1 = vm.factory.createParameter('Punkty Życia')
            const p2 = vm.factory.createParameter('Mana')
            vm.filter.setParameterSearchQuery('mana')
            expect(vm.filter.searchAndFilterParameters([p1, p2])).toEqual([p2])

            const f1 = vm.factory.createFeature('Odporność na ogień')
            const f2 = vm.factory.createFeature('Zwinne palce')
            vm.filter.setFeatureSearchQuery('ogień')
            expect(vm.filter.searchAndFilterFeatures([f1, f2])).toEqual([f1])
        })

        it('generuje dynamiczne sugestie TYLKO dla elementów istniejących w Cechy i atrybuty', () => {
            const char = vm.factory.createCharacter('Wojownik')
            char.addStat(vm.factory.createStat('Percepcja'))
            char.addSkill(vm.factory.createSkill('Kradzież'))
            char.addParameter(vm.factory.createParameter('Wytrzymałość'))
            char.addFeature(vm.factory.createFeature('Blizna'))
            char.addTag(vm.factory.createTag('Wojownik'))

            // Cechy / Stats: TYLKO istniejące w przekazanej tablicy projektu
            const suggestedStats = vm.filter.getSuggestedStats(
                [vm.factory.createStat('Szczęście')],
                [char]
            )
            expect(suggestedStats).not.toContain('Siła') // brak domyślnych
            expect(suggestedStats).not.toContain('Zręczność')
            expect(suggestedStats).toEqual(['Szczęście'])

            // Pusta lista cech zwraca pustą tablicę sugestii
            expect(vm.filter.getSuggestedStats([])).toEqual([])

            // Parametry: TYLKO z listy projektu
            const suggestedParams = vm.filter.getSuggestedParameters(
                [vm.factory.createParameter('Wytrzymałość')],
                [char]
            )
            expect(suggestedParams).not.toContain('Punkty Życia (HP)')
            expect(suggestedParams).toEqual(['Wytrzymałość'])
            expect(vm.filter.getSuggestedParameters([])).toEqual([])

            // Umiejętności: TYLKO z listy projektu
            const suggestedSkills = vm.filter.getSuggestedSkills(
                [vm.factory.createSkill('Alchemia')],
                [char]
            )
            expect(suggestedSkills).not.toContain('Walka wręcz')
            expect(suggestedSkills).toEqual(['Alchemia'])
            expect(vm.filter.getSuggestedSkills([])).toEqual([])

            // Przymioty specjalne / Atrybuty: TYLKO z listy projektu
            const suggestedFeatures = vm.filter.getSuggestedFeatures(
                [vm.factory.createFeature('Noktowizja')],
                [char]
            )
            expect(suggestedFeatures).not.toContain('Rasa')
            expect(suggestedFeatures).toEqual(['Noktowizja'])
            expect(vm.filter.getSuggestedFeatures([])).toEqual([])

            // Tagi z projektu i postaci
            const suggestedTags = vm.filter.getSuggestedTags(
                [vm.factory.createTag('Bohater')],
                [char]
            )
            expect(suggestedTags).toContain('Bohater')
            expect(suggestedTags).toContain('Wojownik')

            // Dynamiczne zliczanie cech, atrybutów, parametrów i umiejętności
            const counts = vm.filter.getProjectTraitsCounts(
                [vm.factory.createStat('S1'), vm.factory.createStat('S2')],
                [vm.factory.createParameter('P1')],
                [
                    vm.factory.createSkill('Sk1'),
                    vm.factory.createSkill('Sk2'),
                    vm.factory.createSkill('Sk3'),
                ],
                [vm.factory.createFeature('F1')]
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
            const char = vm.factory.createCharacter('Bohater')
            vm.selection.selectElement(char, 'character')

            const skill = vm.factory.createSkill('Fechtunek')
            vm.selection.addSkillToSelected(skill)
            expect(char.getSkills()).toContain(skill)

            vm.selection.removeSkillFromSelected(skill.getId())
            expect(char.getSkills()).not.toContain(skill)

            const param = vm.factory.createParameter('Energia')
            vm.selection.addParameterToSelected(param)
            expect(char.getParameters()).toContain(param)

            vm.selection.removeParameterFromSelected(param.getId())
            expect(char.getParameters()).not.toContain(param)

            const feat = vm.factory.createFeature('Szybki refleks')
            vm.selection.addFeatureToSelected(feat)
            expect(char.getFeatures()).toContain(feat)

            vm.selection.removeFeatureFromSelected(feat.getId())
            expect(char.getFeatures()).not.toContain(feat)
        })
    })

    describe('START paragraph and deletion protection', () => {
        it('tworzy węzeł startowy za pomocą createStartParagraph', () => {
            const startP = vm.factory.createStartParagraph({ x: 100, y: 150 })
            expect(startP.getIsStart()).toBe(true)
            expect(startP.getTitle()).toBe('START')
            expect(startP.getPosition()).toEqual({ x: 100, y: 150 })
        })

        it('ensureStartParagraph dodaje węzeł startowy jeśli lista jest pusta lub go brak', () => {
            const list: Paragraph[] = []
            const startP = vm.factory.ensureStartParagraph(list)
            expect(startP.getIsStart()).toBe(true)
            expect(list).toHaveLength(1)
            expect(list[0]).toBe(startP)

            // Wywołane ponownie zwraca istniejący
            const sameStart = vm.factory.ensureStartParagraph(list)
            expect(sameStart).toBe(startP)
            expect(list).toHaveLength(1)
        })

        it('ensureStartParagraph normalizuje listę gdy jest wiele węzłów oznaczonych jako start', () => {
            const p1 = vm.factory.createParagraph('P1')
            p1.setIsStart(true)
            const p2 = vm.factory.createParagraph('P2')
            p2.setIsStart(true)
            const list = [p1, p2]

            const start = vm.factory.ensureStartParagraph(list)
            expect(start).toBe(p1)
            expect(p1.getIsStart()).toBe(true)
            expect(p2.getIsStart()).toBe(false)
        })

        it('deleteParagraph usuwa zwykły paragraf oraz usuwa go ze scen i powiązań wyborów', () => {
            const startP = vm.factory.createStartParagraph()
            const p1 = vm.factory.createParagraph('P1')
            const p2 = vm.factory.createParagraph('P2')
            const choice = vm.graph.createChoice(p1, p2, 'Idź do P2')
            p1.addChoice(choice)

            const scene = vm.factory.createScene('Scena testowa')
            scene.addParagraph(p2)

            const paragraphs = [startP, p1, p2]
            const scenes = [scene]

            const deleted = vm.graph.deleteParagraph(p2.getId(), paragraphs, scenes)
            expect(deleted).toBe(true)
            expect(paragraphs).toEqual([startP, p1])
            expect(scene.getParagraphs()).not.toContain(p2)
            expect(p1.getChoices()).toHaveLength(0)
        })

        it('deleteParagraph blokuje usunięcie węzła START', () => {
            const startP = vm.factory.createStartParagraph()
            const paragraphs = [startP]
            const scenes = [vm.factory.createScene('Scena')]

            const deleted = vm.graph.deleteParagraph(startP.getId(), paragraphs, scenes)
            expect(deleted).toBe(false)
            expect(paragraphs).toContain(startP)
        })

        it('ensureStartParagraph radzi sobie z pustymi wartościami i automatycznie dodaje brakujący węzeł START', () => {
            const emptyList: Paragraph[] = []
            const created = vm.factory.ensureStartParagraph(emptyList)
            expect(created).toBeDefined()
            expect(created.getIsStart()).toBe(true)
            expect(emptyList).toContain(created)

            // Wywołanie z parametrem niebędącym tablicą zwraca nowy węzeł START
            const invalidFallback = vm.factory.ensureStartParagraph(null as unknown as Paragraph[])
            expect(invalidFallback).toBeDefined()
            expect(invalidFallback.getIsStart()).toBe(true)
        })

        it('deleteParagraph po usunięciu innych elementów gwarantuje obecność węzła START', () => {
            const p1 = vm.factory.createParagraph('Tymczasowy')
            const paragraphs = [p1]
            expect(paragraphs.some(p => p.getIsStart())).toBe(false)

            // Usunięcie p1 usuwa p1 i natychmiast zabezpiecza listę dodając węzeł START
            const deleted = vm.graph.deleteParagraph(p1.getId(), paragraphs)
            expect(deleted).toBe(true)
            expect(paragraphs).toHaveLength(1)
            expect(paragraphs[0].getIsStart()).toBe(true)
        })
    })
})
