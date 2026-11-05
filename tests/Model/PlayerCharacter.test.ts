/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'

import { CharacterClass } from '../../Model/CharacterClass'
import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Inventory } from '../../Model/Inventory'
import { Item } from '../../Model/Item'
import { Parameter } from '../../Model/Parameter'
import { PlayerCharacter } from '../../Model/PlayerCharacter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'

describe('PlayerCharacter Model', () => {
    it('creates default instance with proper defaults', () => {
        const pc = new PlayerCharacter()
        expect(pc.getId()).toBeUndefined()
        expect(pc.hasId()).toBe(false)
        expect(pc.getName()).toBe('')
        expect(pc.getAvatar()).toBe('warrior')
        expect(pc.getStats()).toEqual([])
        expect(pc.getSkills()).toEqual([])
        expect(pc.getParameters()).toEqual([])
        expect(pc.getFeatures()).toEqual([])
        expect(pc.getTags()).toEqual([])
        expect(pc.getCustomAttributes()).toEqual([])
        expect(pc.getItems()).toEqual([])
        expect(pc.getInventories()).toEqual([])
        expect(pc.getCharacterClass()).toBeUndefined()
    })

    it('manages identity, avatar and summary', () => {
        const pc = new PlayerCharacter('hero_1', 'Sir Galahad')
        pc.setAvatar('paladin')
        expect(pc.getAvatar()).toBe('paladin')
        pc.setSummary('Dzielny rycerz poszukujący Graala.')
        expect(pc.getSummary()).toBe('Dzielny rycerz poszukujący Graala.')
        expect(pc.getDescription().getSummary()).toBe('Dzielny rycerz poszukujący Graala.')
    })

    it('manages stats, skills, parameters and tags', () => {
        const pc = new PlayerCharacter('hero_1', 'Sir Galahad')

        const statStr = new Stat('stat_str', 'Siła', new Description(), 14)
        pc.addStat(statStr)
        expect(pc.hasStat('stat_str')).toBe(true)
        expect(pc.getStat('stat_str')).toBe(14)
        expect(pc.getStat('Siła')).toBe(14)

        const skillSword = new Skill('sk_sword', 'Miecz', new Description(), 'direct', '3')
        pc.addSkill(skillSword)
        expect(pc.hasSkill('sk_sword')).toBe(true)
        expect(pc.getSkill('Miecz')?.getValue()).toBe('3')

        const paramHp = new Parameter(
            'param_hp',
            'Punkty Życia',
            new Description(),
            'formula',
            20,
            'Siła * 2'
        )
        pc.addParameter(paramHp)
        expect(pc.hasParameter('param_hp')).toBe(true)
        expect(pc.getParameter('Punkty Życia')?.getFormula()).toBe('Siła * 2')

        const tagHero = new Tag('tag_hero', 'Bohater', '#3b82f6')
        pc.addTag(tagHero)
        expect(pc.hasTag('tag_hero')).toBe(true)
        expect(pc.hasTag('Bohater')).toBe(true)

        pc.setCustomAttributes([{ name: 'Rasa', value: 'Człowiek' }])
        expect(pc.getCustomAttributes()).toEqual([{ name: 'Rasa', value: 'Człowiek' }])
    })

    it('manages multiple inventories and respects capacity limits', () => {
        const pc = new PlayerCharacter('hero_1', 'Sir Galahad')
        const backpack = new Inventory('inv_backpack', 'Plecak podróżny', 2, [
            new Item('it_torch', 'Pochodnia'),
        ])
        const beltPouch = new Inventory('inv_pouch', 'Sakwa przy pasie', 0, [
            new Item('it_coin', 'Złota moneta'),
            new Item('it_gem', 'Rubin'),
        ])

        pc.addInventory(backpack)
        pc.addInventory(beltPouch)

        expect(pc.getInventories().length).toBe(2)
        expect(pc.getInventory('inv_backpack')?.getName()).toBe('Plecak podróżny')
        expect(pc.getInventory('inv_backpack')?.getCapacity()).toBe(2)
        expect(pc.getInventory('inv_backpack')?.getFreeSlots()).toBe(1)
        expect(pc.getInventory('inv_backpack')?.isFull()).toBe(false)

        // Adding second item reaches capacity
        const potion = new Item('it_potion', 'Mikstura leczenia')
        const added = backpack.addItem(potion)
        expect(added).toBe(true)
        expect(backpack.isFull()).toBe(true)
        expect(backpack.getFreeSlots()).toBe(0)

        // Third item fails to add due to capacity
        const extraItem = new Item('it_rope', 'Lina')
        const overLimitAdded = backpack.addItem(extraItem)
        expect(overLimitAdded).toBe(false)
        expect(backpack.getItems().length).toBe(2)

        // Unlimited capacity inventory
        expect(beltPouch.isUnlimited()).toBe(true)
        expect(beltPouch.isFull()).toBe(false)
        expect(beltPouch.getFreeSlots()).toBe(Infinity)

        // Flattened getItems() aggregates all inventories
        const allItems = pc.getItems()
        expect(allItems.length).toBe(4) // 2 from backpack + 2 from belt pouch
        expect(allItems.map(it => it.getName())).toEqual([
            'Pochodnia',
            'Mikstura leczenia',
            'Złota moneta',
            'Rubin',
        ])

        // Remove inventory
        pc.removeInventory('inv_backpack')
        expect(pc.getInventories().length).toBe(1)
        expect(pc.getItems().length).toBe(2)
    })

    it('serializes toJSON and deserializes fromJSON accurately with multiple inventories', () => {
        const stat = new Stat('st_1', 'Siła', new Description(), 12)
        const skill = new Skill('sk_1', 'Walka', new Description(), 'direct', '2')
        const param = new Parameter('pm_1', 'Zdrowie', new Description(), 'direct', 30)
        const tag = new Tag('tg_1', 'Główny', '#10b981')
        const charClass = new CharacterClass('cl_1', 'Rycerz')
        const desc = new Description('Tekst opisu bohatera', 'Krótkie streszczenie')

        const invMain = new Inventory('inv_1', 'Główny plecak', 10, [
            new Item('it_1', 'Miecz stalowy'),
        ])
        const invMount = new Inventory('inv_2', 'Juki konia', 20, [
            new Item('it_2', 'Racje żywnościowe'),
        ])

        const pc = new PlayerCharacter(
            'player_main',
            'Artur Pendragon',
            desc,
            [stat],
            [skill],
            [new Feature('ft_1', 'Szlachetny')],
            [],
            charClass,
            'paladin',
            [param],
            [tag],
            [{ name: 'Pochodzenie', value: 'Camelot' }],
            [invMain, invMount]
        )

        const json = pc.toJSON()
        expect(json.id).toBe('player_main')
        expect(json.name).toBe('Artur Pendragon')
        expect(json.avatar).toBe('paladin')
        expect(json.customAttributes).toEqual([{ name: 'Pochodzenie', value: 'Camelot' }])
        expect(json.inventories).toBeDefined()
        expect(json.inventories.length).toBe(2)
        expect(json.inventories[0].name).toBe('Główny plecak')
        expect(json.inventories[0].capacity).toBe(10)
        expect(json.inventories[1].capacity).toBe(20)

        const restored = PlayerCharacter.fromJSON(json)
        expect(restored.getId()).toBe('player_main')
        expect(restored.getName()).toBe('Artur Pendragon')
        expect(restored.getAvatar()).toBe('paladin')
        expect(restored.getSummary()).toBe('Krótkie streszczenie')
        expect(restored.getStat('Siła')).toBe(12)
        expect(restored.getSkill('Walka')?.getValue()).toBe('2')
        expect(restored.getParameter('Zdrowie')?.getValue()).toBe(30)
        expect(restored.hasTag('Główny')).toBe(true)
        expect(restored.getInventories().length).toBe(2)
        expect(restored.getInventory('inv_1')?.getCapacity()).toBe(10)
        expect(restored.getItem('it_1')?.getName()).toBe('Miecz stalowy')
        expect(restored.getItem('it_2')?.getName()).toBe('Racje żywnościowe')
        expect(restored.getCharacterClass()?.getName()).toBe('Rycerz')
        expect(restored.getCustomAttributes()).toEqual([{ name: 'Pochodzenie', value: 'Camelot' }])
    })

    it('obsługuje różne formaty opisu w konstruktorze oraz get/setSummary', () => {
        // Opis jako string
        const pcStr = new PlayerCharacter('p_str', 'Bohater', 'Prosty tekst opisu' as any)
        expect(pcStr.getDescription().getText()).toBe('Prosty tekst opisu')

        // Opis jako obiekt JSON
        const pcObj = new PlayerCharacter('p_obj', 'Bohater', { text: 'Tekst z obiektu' } as any)
        expect(pcObj.getDescription().getText()).toBe('Tekst z obiektu')

        // Opis jako null/undefined
        const pcEmpty = new PlayerCharacter('p_none', 'Bohater', null as any)
        expect(pcEmpty.getDescription()).toBeInstanceOf(Description)
        expect(pcEmpty.getSummary()).toBe('')

        // setSummary gdy description nie istnieje lub nie ma metody
        ;(pcEmpty as any).description = null
        pcEmpty.setSummary('Nowe streszczenie')
        expect(pcEmpty.getSummary()).toBe('Nowe streszczenie')
    })

    it('zarządza setterami tożsamości, statystyk, umiejętności, parametrów i cech', () => {
        const pc = new PlayerCharacter('p_init', 'Początkowy')
        pc.setId('p_new')
        expect(pc.getId()).toBe('p_new')

        pc.setName('Nowe Imię')
        expect(pc.getName()).toBe('Nowe Imię')

        const newDesc = new Description('Nowy opis')
        pc.setDescription(newDesc)
        expect(pc.getDescription()).toBe(newDesc)

        // Statystyki: setStats, removeStat
        const st = new Stat('st_str', 'Siła', new Description(), 10)
        pc.setStats([st])
        expect(pc.getStats()).toHaveLength(1)
        pc.removeStat('Siła')
        expect(pc.hasStat('st_str')).toBe(false)

        // Umiejętności: setSkills, removeSkill
        const sk = new Skill('sk_sneak', 'Skradanie', new Description(), 'direct', '3')
        pc.setSkills([sk])
        expect(pc.getSkills()).toHaveLength(1)
        pc.removeSkill('Skradanie')
        expect(pc.hasSkill('sk_sneak')).toBe(false)

        // Parametry: setParameters, removeParameter
        const pm = new Parameter('pm_mana', 'Mana', new Description(), 'direct', 50)
        pc.setParameters([pm])
        expect(pc.getParameters()).toHaveLength(1)
        pc.removeParameter('Mana')
        expect(pc.hasParameter('pm_mana')).toBe(false)

        // Cechy: addFeature, getFeature, hasFeature, removeFeature, setFeatures
        const ft = new Feature('ft_night', 'Widzenie w ciemności')
        pc.addFeature(ft)
        expect(pc.hasFeature('ft_night')).toBe(true)
        expect(pc.hasFeature('Widzenie w ciemności')).toBe(true)
        expect(pc.getFeature('Widzenie w ciemności')).toBe(ft)
        expect(pc.getFeature('unknown')).toBeUndefined()

        pc.setFeatures([ft])
        expect(pc.getFeatures()).toHaveLength(1)
        pc.removeFeature('Widzenie w ciemności')
        expect(pc.hasFeature('ft_night')).toBe(false)

        // Tagi: setTags, removeTag
        const tg = new Tag('tg_vip', 'Ważna Postać')
        pc.setTags([tg])
        expect(pc.getTags()).toHaveLength(1)
        pc.removeTag('Ważna Postać')
        expect(pc.hasTag('tg_vip')).toBe(false)

        // Klasa postaci: get/setCharacterClass
        const cc = new CharacterClass('cc_mage', 'Mag')
        pc.setCharacterClass(cc)
        expect(pc.getCharacterClass()?.getName()).toBe('Mag')
        pc.setCharacterClass(null)
        expect(pc.getCharacterClass()).toBeUndefined()
    })

    it('zarządza ekwipunkami i przedmiotami: setItems, addItem bez ekwipunków, removeItem', () => {
        const pc = new PlayerCharacter('p_inv', 'Wędrowiec')
        const item1 = new Item('it_bread', 'Chleb')
        const item2 = new Item('it_water', 'Woda')

        // setItems przy braku ekwipunków tworzy inv_default
        pc.setItems([item1])
        expect(pc.getInventories()).toHaveLength(1)
        expect(pc.getInventories()[0].getId()).toBe('inv_default')
        expect(pc.hasItem('Chleb')).toBe(true)

        // setItems przy istniejącym ekwipunku nadpisuje pierwszy
        pc.setItems([item1, item2])
        expect(pc.getItems()).toHaveLength(2)

        // setInventories z błędnym typem
        pc.setInventories(null as any)
        expect(pc.getInventories()).toEqual([])

        // addItem gdy ekwipunki są puste -> tworzy inv_default
        const item3 = new Item('it_torch', 'Pochodnia')
        pc.addItem(item3)
        expect(pc.getInventories()).toHaveLength(1)
        expect(pc.hasItem('it_torch')).toBe(true)

        // addItem z nieistniejącym inventoryId fallbackuje do pierwszego
        const item4 = new Item('it_rope', 'Lina')
        pc.addItem(item4, 'non_existent_inv_id')
        expect(pc.hasItem('Lina')).toBe(true)

        // addItem z poprawnym inventoryId
        const customInv = new Inventory('inv_custom', 'Dodatkowy')
        pc.addInventory(customInv)
        const item5 = new Item('it_potion', 'Mikstura')
        pc.addItem(item5, 'inv_custom')
        expect(customInv.hasItem('it_potion')).toBe(true)

        // removeItem usuwa z przedmiotów i ze wszystkich ekwipunków
        pc.removeItem('Chleb')
        expect(pc.hasItem('it_bread')).toBe(false)
        expect(pc.hasItem('Chleb')).toBe(false)
    })

    it('fromJSON tworzy automatyczny ekwipunek gdy items istnieje a inventories brak', () => {
        expect(PlayerCharacter.fromJSON(null)).toBeInstanceOf(PlayerCharacter)

        const rawJson = {
            id: 'p_legacy_inv',
            name: 'Kupiec',
            items: [{ id: 'it_coin', name: 'Złota Moneta' }],
        }

        const pc = PlayerCharacter.fromJSON(rawJson)
        expect(pc.getInventories()).toHaveLength(1)
        expect(pc.getInventories()[0].getName()).toBe('Główny ekwipunek')
        expect(pc.hasItem('Złota Moneta')).toBe(true)
    })
})
