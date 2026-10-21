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
})
