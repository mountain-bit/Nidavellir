import { describe, expect, it } from 'vitest'

import { CharacterClass } from '../../Model/CharacterClass'
import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'

describe('CharacterClass Model', () => {
    it('creates default instance with proper defaults', () => {
        const cc = new CharacterClass()
        expect(cc.getId()).toBe('')
        expect(cc.hasId()).toBe(false)
        expect(cc.getName()).toBe('')
        expect(cc.getLevel()).toBe(1)
        expect(cc.getDescription()).toBeInstanceOf(Description)
        expect(cc.getStats()).toEqual([])
        expect(cc.getSkills()).toEqual([])
        expect(cc.getFeatures()).toEqual([])
    })

    it('creates parametrized instance', () => {
        const desc = new Description('Wojownik pierwszej linii')
        const stat = new Stat('stat_str', 'Siła', new Description(), 15)
        const skill = new Skill('sk_slash', 'Cięcie', new Description(), 'direct', '5')
        const feature = new Feature('feat_brave', 'Odwaga', new Description())

        const cc = new CharacterClass(
            'class_warrior',
            'Wojownik',
            3,
            desc,
            [stat],
            [skill],
            [feature]
        )

        expect(cc.getId()).toBe('class_warrior')
        expect(cc.hasId()).toBe(true)
        expect(cc.getName()).toBe('Wojownik')
        expect(cc.getLevel()).toBe(3)
        expect(cc.getDescription()).toBe(desc)
        expect(cc.getStats()).toEqual([stat])
        expect(cc.getSkills()).toEqual([skill])
        expect(cc.getFeatures()).toEqual([feature])
    })

    it('manages identity, level and description getters/setters', () => {
        const cc = new CharacterClass()
        cc.setId('class_mage')
        expect(cc.getId()).toBe('class_mage')
        expect(cc.hasId()).toBe(true)

        cc.setName('Mag')
        expect(cc.getName()).toBe('Mag')

        cc.setLevel(5)
        expect(cc.getLevel()).toBe(5)

        const newDesc = new Description('Mistrz magii ognia')
        cc.setDescription(newDesc)
        expect(cc.getDescription()).toBe(newDesc)
    })

    it('manages stats: add, get, has, remove, set and exception on missing', () => {
        const cc = new CharacterClass()
        const stat1 = new Stat('stat_int', 'Inteligencja', new Description(), 18)
        const stat2 = new Stat('stat_wis', 'Mądrość', new Description(), 14)

        cc.addStat(stat1)
        expect(cc.hasStat('stat_int')).toBe(true)
        expect(cc.hasStat('stat_wis')).toBe(false)
        expect(cc.getStat('stat_int')).toBe(stat1)
        expect(() => cc.getStat('non_existent')).toThrowError('Stat not found')

        cc.setStats([stat1, stat2])
        expect(cc.getStats()).toHaveLength(2)

        cc.removeStat('stat_int')
        expect(cc.hasStat('stat_int')).toBe(false)
        expect(cc.hasStat('stat_wis')).toBe(true)
    })

    it('manages skills: add, get, has, remove, set', () => {
        const cc = new CharacterClass()
        const skill1 = new Skill('sk_fireball', 'Kula Ognia', new Description(), 'direct', '8')
        const skill2 = new Skill('sk_teleport', 'Teleportacja', new Description(), 'direct', '2')

        cc.addSkill(skill1)
        expect(cc.hasSkill('sk_fireball')).toBe(true)
        expect(cc.hasSkill('sk_teleport')).toBe(false)
        expect(cc.getSkill('sk_fireball')).toBe(skill1)
        expect(cc.getSkill('unknown')).toBeUndefined()

        cc.setSkills([skill1, skill2])
        expect(cc.getSkills()).toHaveLength(2)

        cc.removeSkill('sk_fireball')
        expect(cc.hasSkill('sk_fireball')).toBe(false)
        expect(cc.hasSkill('sk_teleport')).toBe(true)
    })

    it('manages features: add, get, has, remove, set', () => {
        const cc = new CharacterClass()
        const feat1 = new Feature('feat_arcane', 'Tajemna wiedza', new Description())
        const feat2 = new Feature('feat_mana', 'Zwiększona mana', new Description())

        cc.addFeature(feat1)
        expect(cc.hasFeature('feat_arcane')).toBe(true)
        expect(cc.hasFeature('feat_mana')).toBe(false)
        expect(cc.getFeature('feat_arcane')).toBe(feat1)
        expect(cc.getFeature('unknown')).toBeUndefined()

        cc.setFeatures([feat1, feat2])
        expect(cc.getFeatures()).toHaveLength(2)

        cc.removeFeature('feat_arcane')
        expect(cc.hasFeature('feat_arcane')).toBe(false)
        expect(cc.hasFeature('feat_mana')).toBe(true)
    })

    it('serializes to JSON correctly via toJSON', () => {
        const desc = new Description('Klasa złodzieja')
        const stat = new Stat('stat_dex', 'Zręczność', new Description(), 16)
        const skill = new Skill('sk_stealth', 'Skradanie', new Description(), 'direct', '4')
        const feature = new Feature('feat_shadow', 'Cień', new Description())

        const cc = new CharacterClass('class_rogue', 'Łotrzyk', 2, desc, [stat], [skill], [feature])
        const json = cc.toJSON()

        expect(json).toEqual({
            id: 'class_rogue',
            name: 'Łotrzyk',
            level: 2,
            description: desc,
            stats: [stat],
            skills: [skill],
            features: [feature],
        })
    })

    it('deserializes from JSON correctly via fromJSON', () => {
        // null/undefined/empty
        expect(CharacterClass.fromJSON(null)).toBeInstanceOf(CharacterClass)
        expect(CharacterClass.fromJSON(undefined).getId()).toBe('')
        const emptyCc = CharacterClass.fromJSON({})
        expect(emptyCc.getStats()).toEqual([])
        expect(emptyCc.getSkills()).toEqual([])
        expect(emptyCc.getFeatures()).toEqual([])

        // standard JSON
        const rawJson = {
            id: 'class_cleric',
            name: 'Kapłan',
            level: 4,
            description: { text: 'Sługa światłości', summary: 'Duchowny' },
            stats: [{ id: 'stat_wis', name: 'Mądrość', value: 16 }],
            skills: [{ id: 'sk_heal', name: 'Leczenie ran', type: 'direct', value: '6' }],
            features: [{ id: 'feat_divine', name: 'Boska łaska' }],
        }

        const cc = CharacterClass.fromJSON(rawJson)
        expect(cc.getId()).toBe('class_cleric')
        expect(cc.getName()).toBe('Kapłan')
        expect(cc.getLevel()).toBe(4)
        expect(cc.getDescription().getText()).toBe('Sługa światłości')
        expect(cc.getDescription().getSummary()).toBe('Duchowny')
        expect(cc.getStats()).toHaveLength(1)
        expect(cc.getSkills()).toHaveLength(1)
        expect(cc.getFeatures()).toHaveLength(1)

        // legacy aliases: traits instead of stats, qualities instead of features
        const legacyJson = {
            id: 'class_bard',
            traits: [{ id: 'stat_cha', name: 'Charyzma', value: 15 }],
            qualities: [{ id: 'feat_song', name: 'Pieśń odwagi' }],
        }

        const legacyCc = CharacterClass.fromJSON(legacyJson)
        expect(legacyCc.getId()).toBe('class_bard')
        expect(legacyCc.getName()).toBe('')
        expect(legacyCc.getLevel()).toBe(1)
        expect(legacyCc.getStats()).toHaveLength(1)
        expect(legacyCc.getFeatures()).toHaveLength(1)
    })
})
