/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'vitest'

import { CharacterClass } from '../../Model/CharacterClass'
import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import { Paragraph } from '../../Model/Paragraph'
import { Parameter } from '../../Model/Parameter'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'

describe('Project', () => {
    let project: Project

    beforeEach(() => {
        project = new Project('test-id', 'My Project', 'Author', '1.0.0')
    })

    it('initializes with correct id, name, author and version', () => {
        expect(project.getId()).toBe('test-id')
        expect(project.getName()).toBe('My Project')
        expect(project.getAuthor()).toBe('Author')
        expect(project.getVersion()).toBe('1.0.0')
    })

    it('hasId returns true when ID is set and false for an empty ID', () => {
        expect(project.hasId()).toBe(true)
        expect(new Project().hasId()).toBe(false)
    })

    it('powinien dodawać scenę', () => {
        const scene = new Scene('scena-1', 'Prologue')
        project.addScene(scene)
        expect(project.getScenes()).toHaveLength(1)
        expect(project.hasScene('scena-1')).toBe(true)
    })

    it('powinien usuwać scenę po ID', () => {
        const scene = new Scene('scena-1', 'Prologue')
        project.addScene(scene)
        project.removeScene('scena-1')
        expect(project.getScenes()).toHaveLength(0)
        expect(project.hasScene('scena-1')).toBe(false)
    })

    it('getScene powinno zwracać undefined dla nieistniejącej sceny', () => {
        expect(project.getScene('non-existent')).toBeUndefined()
    })

    it('manages customStyles and customFonts with serialization roundtrip', () => {
        const styles = [{ id: 'style_1', name: 'Myśli', color: '#c084fc', italic: true }]
        const fonts = [{ name: 'Cinzel', isCustom: true, googleFont: true }]

        project.setCustomStyles(styles)
        project.setCustomFonts(fonts)

        expect(project.getCustomStyles()).toEqual(styles)
        expect(project.getCustomFonts()).toEqual(fonts)

        const json = project.toJSON()
        expect(json.editor?.customStyles).toEqual(styles)
        expect(json.editor?.customFonts).toEqual(fonts)

        const reconstructed = Project.fromJSON(json)
        expect(reconstructed.getCustomStyles()).toEqual(styles)
        expect(reconstructed.getCustomFonts()).toEqual(fonts)
    })

    it('powinien dodawać postać i ignorować duplikaty o tym samym ID', () => {
        const npc1 = new NPC('char-1', 'Strażnik')
        const npc2 = new NPC('char-1', 'Strażnik Kopia')
        project.addCharacter(npc1)
        expect(project.getCharacters()).toHaveLength(1)
        expect(project.hasCharacter('char-1')).toBe(true)

        project.addCharacter(npc2)
        expect(project.getCharacters()).toHaveLength(1)
        expect(project.getCharacters()[0].getName()).toBe('Strażnik')
    })

    it('powinien dodawać szablon i ignorować duplikaty o tym samym ID', () => {
        const tpl1 = new NPC_Template('tpl-1', 'Bandyta')
        const tpl2 = new NPC_Template('tpl-1', 'Bandyta Kopia')
        project.addTemplate(tpl1)
        expect(project.getTemplates()).toHaveLength(1)
        expect(project.hasTemplate('tpl-1')).toBe(true)

        project.addTemplate(tpl2)
        expect(project.getTemplates()).toHaveLength(1)
        expect(project.getTemplates()[0].getName()).toBe('Bandyta')
    })

    it('zarządza identyfikatorami, nazwami, autorami, wersjami i opisem', () => {
        project.setId('custom-id')
        expect(project.getId()).toBe('custom-id')

        project.setName('Nowa Nazwa')
        expect(project.getName()).toBe('Nowa Nazwa')

        project.setAuthor('Nowy Autor')
        expect(project.getAuthor()).toBe('Nowy Autor')

        project.setVersion('2.0.0')
        expect(project.getVersion()).toBe('2.0.0')

        const desc = new Description('Opis projektu')
        project.setDescription(desc)
        expect(project.getDescription()).toBe(desc)
    })

    it('zarządza paragrafami bezpośrednimi projektu', () => {
        const p1 = new Paragraph('p_1', 'Wstęp')
        const p2 = new Paragraph('p_2', 'Rozwinięcie')

        project.setParagraphs([p1])
        expect(project.getParagraphs()).toHaveLength(1)

        project.addParagraph(p2)
        // Ignoruj duplikat
        project.addParagraph(new Paragraph('p_2', 'Duplikat'))
        expect(project.getParagraphs()).toHaveLength(2)

        project.removeParagraph('p_1')
        expect(project.getParagraphs()).toHaveLength(1)
        expect(project.getParagraphs()[0].getId()).toBe('p_2')
    })

    it('zarządza lokacjami projektu', () => {
        const loc1 = new Location('loc_1', 'Mroczny Las')
        const loc2 = new Location('loc_2', 'Góry Mgliste')

        project.setLocations([loc1])
        expect(project.getLocations()).toHaveLength(1)
        expect(project.hasLocation('loc_1')).toBe(true)
        expect(project.hasLocation('loc_2')).toBe(false)
        expect(project.getLocation('loc_1')).toBe(loc1)
        expect(project.getLocation('loc_2')).toBeUndefined()

        project.addLocation(loc2)
        // Ignoruj duplikat
        project.addLocation(new Location('loc_2', 'Góry Duplikat'))
        expect(project.getLocations()).toHaveLength(2)

        project.removeLocation('loc_1')
        expect(project.hasLocation('loc_1')).toBe(false)
    })

    it('zarządza postaciami i szablonami NPC', () => {
        const npc = new NPC('npc_1', 'Rycerz')
        project.setCharacters([npc])
        expect(project.getCharacters()).toHaveLength(1)
        expect(project.hasCharacter('npc_1')).toBe(true)
        expect(project.getCharacter('npc_1')).toBe(npc)
        expect(project.getCharacter('unknown')).toBeUndefined()

        project.removeCharacter('npc_1')
        expect(project.hasCharacter('npc_1')).toBe(false)

        const tpl = new NPC_Template('tpl_orc', 'Ork Wojownik')
        project.setTemplates([tpl])
        expect(project.hasTemplate('tpl_orc')).toBe(true)
        expect(project.hasTemplate('Ork Wojownik')).toBe(true)
        expect(project.getTemplate('Ork Wojownik')).toBe(tpl)
        expect(project.getTemplate('unknown')).toBeUndefined()

        project.removeTemplate('Ork Wojownik')
        expect(project.hasTemplate('tpl_orc')).toBe(false)
    })

    it('zarządza przedmiotami projektu', () => {
        const item1 = new Item('item_1', 'Pochodnia')
        const item2 = new Item('item_2', 'Lina')

        project.setItems([item1])
        expect(project.getItems()).toHaveLength(1)
        expect(project.hasItem('item_1')).toBe(true)
        expect(project.hasItem('Pochodnia')).toBe(true)
        expect(project.getItem('item_1')).toBe(item1)
        expect(project.getItem('unknown')).toBeUndefined()

        project.addItem(item2)
        // Ignoruj duplikat
        project.addItem(new Item('item_2', 'Lina Kopia'))
        expect(project.getItems()).toHaveLength(2)

        project.removeItem('item_1')
        expect(project.hasItem('item_1')).toBe(false)
    })

    it('zarządza klasami postaci w projekcie', () => {
        const cc1 = new CharacterClass('class_warrior', 'Wojownik')
        const cc2 = new CharacterClass('class_mage', 'Mag')

        project.setCharacterClasses([cc1])
        expect(project.getCharacterClasses()).toHaveLength(1)
        expect(project.hasCharacterClass('class_warrior')).toBe(true)
        expect(project.hasCharacterClass('class_mage')).toBe(false)
        expect(project.getCharacterClass('class_warrior')).toBe(cc1)
        expect(project.getCharacterClass('class_mage')).toBeUndefined()

        project.addCharacterClass(cc2)
        // Ignoruj duplikat
        project.addCharacterClass(new CharacterClass('class_mage', 'Mag Kopia'))
        expect(project.getCharacterClasses()).toHaveLength(2)

        project.removeCharacterClass('class_warrior')
        expect(project.hasCharacterClass('class_warrior')).toBe(false)
    })

    it('zarządza postacią gracza (PlayerCharacter)', () => {
        const hero1 = new PlayerCharacter('hero_1', 'Geralt')
        const hero2 = new PlayerCharacter('hero_2', 'Yennefer')

        project.setPlayerCharacter(hero1)
        expect(project.getPlayerCharacter()).toBe(hero1)
        expect(project.getPlayerCharacters()).toHaveLength(1)

        // Aktualizacja istniejącego bohatera
        const hero1Updated = new PlayerCharacter('hero_1', 'Geralt z Rivii')
        project.setPlayerCharacter(hero1Updated)
        expect(project.getPlayerCharacters()).toHaveLength(1)
        expect(project.getPlayerCharacter().getName()).toBe('Geralt z Rivii')

        // Dodanie kolejnego bohatera przez setPlayerCharacter
        project.setPlayerCharacter(hero2)
        expect(project.getPlayerCharacters()).toHaveLength(2)

        // Nadpisanie całej listy bohaterów
        project.setPlayerCharacters([hero1])
        expect(project.getPlayerCharacters()).toHaveLength(1)
        expect(project.getPlayerCharacter()).toBe(hero1)

        // Fallback gdy lista pusta, ale pojedynczy bohater ma nazwę/ID
        const emptyListProject = new Project('p_empty', 'Empty')
        emptyListProject.setPlayerCharacter(new PlayerCharacter('solo', 'Bohater Solo'))
        expect(emptyListProject.getPlayerCharacters()).toHaveLength(1)
    })

    it('zarządza globalnymi statystykami, umiejętnościami, cechami i parametrami', () => {
        // Statystyki
        const stat = new Stat('stat_str', 'Siła', new Description(), 10)
        project.setGlobalStats([])
        project.addGlobalStat(stat)
        // Duplikaty po ID lub nazwie (case-insensitive)
        project.addStat(new Stat('stat_str', 'Inna Siła', new Description(), 12))
        project.addStat(new Stat('stat_str_copy', 'siła', new Description(), 12))
        expect(project.getGlobalStats()).toHaveLength(1)
        expect(project.getStats()).toHaveLength(1)

        project.removeStat('Siła')
        expect(project.getStats()).toHaveLength(0)

        // Umiejętności
        const skill = new Skill('sk_jump', 'Skok', new Description(), 'direct', '5')
        project.setGlobalSkills([])
        project.addGlobalSkill(skill)
        project.addSkill(new Skill('sk_jump', 'Inny Skok', new Description(), 'direct', '6'))
        project.addSkill(new Skill('sk_jump_copy', 'skok', new Description(), 'direct', '6'))
        expect(project.getGlobalSkills()).toHaveLength(1)
        expect(project.getSkills()).toHaveLength(1)

        project.removeSkill('Skok')
        expect(project.getSkills()).toHaveLength(0)

        // Cechy
        const feat = new Feature('feat_luck', 'Szczęście', new Description())
        project.setGlobalFeatures([])
        project.addGlobalFeature(feat)
        project.addFeature(new Feature('feat_luck', 'Inne Szczęście', new Description()))
        project.addFeature(new Feature('feat_luck_copy', 'szczęście', new Description()))
        expect(project.getGlobalFeatures()).toHaveLength(1)
        expect(project.getFeatures()).toHaveLength(1)

        project.removeFeature('Szczęście')
        expect(project.getFeatures()).toHaveLength(0)

        // Parametry
        const param = new Parameter('param_hp', 'Punkty Życia', new Description(), 'direct', 100)
        project.setGlobalParameters([])
        project.addGlobalParameter(param)
        project.addParameter(new Parameter('param_hp', 'HP Kopia', new Description(), 'direct', 50))
        project.addParameter(
            new Parameter('param_hp_2', 'Punkty Życia', new Description(), 'direct', 50)
        )
        expect(project.getGlobalParameters()).toHaveLength(1)
        expect(project.getParameters()).toHaveLength(1)

        project.removeParameter('Punkty Życia')
        expect(project.getParameters()).toHaveLength(0)
    })

    it('zbiera wszystkie unikalne tagi z projektu, scen, paragrafów i lokacji via getAllTags', () => {
        const tagProj = new Tag('tag_proj', 'Globalny')
        project.addTag(tagProj)
        project.addTag(new Tag('tag_proj', 'Duplikat')) // ignoruj duplikat

        const tagScene = new Tag('tag_sc', 'Sceniczny')
        const tagPar = new Tag('tag_p', 'Paragrafowy')
        const par = new Paragraph('p_t', 'P', new Description())
        par.addTag(tagPar)
        const scene = new Scene('sc_t', 'S', new Description(), [par])
        scene.addTag(tagScene)
        project.addScene(scene)

        const tagLoc = new Tag('tag_l', 'Lokacyjny')
        const loc = new Location('loc_t', 'L', new Description())
        loc.addTag(tagLoc)
        project.addLocation(loc)

        const allTags = project.getAllTags()
        expect(allTags).toHaveLength(4)
        const tagNames = allTags.map(t => t.getName())
        expect(tagNames).toContain('Globalny')
        expect(tagNames).toContain('Sceniczny')
        expect(tagNames).toContain('Paragrafowy')
        expect(tagNames).toContain('Lokacyjny')
    })

    it('fromJSON parsuje legacy obiekty sceny zawarte w Paragraphs', () => {
        const projectData = {
            id: 'proj_legacy',
            name: 'Legacy Project',
        }
        const entitiesData = {
            Paragraphs: [
                {
                    id: 'legacy_scene_1',
                    name: 'Stara Scena',
                    paragraphs: [{ id: 'p_inner', title: 'Wewnętrzny paragraf' }],
                },
                {
                    id: 'direct_p_1',
                    title: 'Bezpośredni Paragraf',
                },
            ],
        }

        const loaded = Project.fromJSON(projectData, entitiesData as any)
        expect(loaded.getScenes()).toHaveLength(1)
        expect(loaded.getScenes()[0].getName()).toBe('Stara Scena')
    })
})
