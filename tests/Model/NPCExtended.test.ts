import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC } from '../../Model/NPC'
import { Parameter } from '../../Model/Parameter'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'

describe('NPC Model Extended', () => {
    it('tworzy postać z awatarem, cechami, umiejętnościami, parametrami i tagami', () => {
        const npc = new NPC(
            'npc-1',
            'Mistrz Elion',
            new Description('Stary mag'),
            [new Stat('st1', 'Siła', new Description(), 10)],
            [new Skill('sk1', 'Magia', new Description(), 'direct', '+4')],
            [new Feature('f1', 'Rasa', new Description('Elf'))],
            [new Tag('t1', 'Mag')],
            'wizard',
            [new Parameter('p1', 'Punkty Życia', new Description(), 'direct', 100)]
        )

        expect(npc.getId()).toBe('npc-1')
        expect(npc.getName()).toBe('Mistrz Elion')
        expect(npc.getAvatar()).toBe('wizard')
        expect(npc.getStats()).toHaveLength(1)
        expect(npc.getSkills()).toHaveLength(1)
        expect(npc.getFeatures()).toHaveLength(1)
        expect(npc.getTags()).toHaveLength(1)
        expect(npc.getParameters()).toHaveLength(1)
        expect(npc.getParameter('p1')?.getValue()).toBe(100)
    })

    it('pozwala na dodawanie i usuwanie parametrów oraz zmianę awatara', () => {
        const npc = new NPC('npc-2', 'Strażnik')
        expect(npc.getAvatar()).toBe('warrior')

        npc.setAvatar('rogue')
        expect(npc.getAvatar()).toBe('rogue')

        const param = new Parameter('p2', 'Mana', new Description(), 'direct', 50)
        npc.addParameter(param)
        expect(npc.hasParameter('Mana')).toBe(true)
        expect(npc.getParameters()).toHaveLength(1)

        npc.removeParameter('Mana')
        expect(npc.hasParameter('Mana')).toBe(false)
        expect(npc.getParameters()).toHaveLength(0)
    })

    it('serializuje i deserializuje postać do/z JSON', () => {
        const npc = new NPC(
            'npc-3',
            'Aldor',
            new Description('Zwiadowca'),
            [new Stat('st2', 'Zręczność', new Description(), 14)],
            [new Skill('sk2', 'Skradanie', new Description(), 'stat_mod', '', 'Zręczność', '+2')],
            [new Feature('f2', 'Klasa', new Description('Łotrzyk'))],
            [new Tag('t2', 'Zwiadowca')],
            'archer',
            [new Parameter('p3', 'Kondycja', new Description(), 'formula', '', 'Siła * 2', 20)]
        )

        const json = npc.toJSON()
        expect(json.avatar).toBe('archer')
        expect(json.parameters).toHaveLength(1)

        const fromJson = NPC.fromJSON(json)
        expect(fromJson.getId()).toBe('npc-3')
        expect(fromJson.getAvatar()).toBe('archer')
        expect(fromJson.getParameters()).toHaveLength(1)
        expect(fromJson.getParameter('p3')?.getFormula()).toBe('Siła * 2')
        expect(fromJson.getSkills()[0].getStatName()).toBe('Zręczność')
    })

    it('zarządza pełnym zestawem metod pomocniczych encji NPC oraz warunkami brzegowymi', () => {
        const npc = new NPC('npc-4', 'Gildian')
        expect(npc.hasId()).toBe(true)

        const emptyNpc = new NPC()
        expect(emptyNpc.hasId()).toBe(false)

        // Description i Summary
        npc.setDescription(new Description('Opis szczegółowy', 'Krótkie podsumowanie'))
        expect(npc.getDescription().getText()).toBe('Opis szczegółowy')
        expect(npc.getSummary()).toBe('Krótkie podsumowanie')

        npc.setSummary('Zaktualizowane podsumowanie')
        expect(npc.getSummary()).toBe('Zaktualizowane podsumowanie')

        // Statystyki
        const st = new Stat('st_str', 'Siła', new Description(), 15)
        npc.addStat(st)
        expect(npc.hasStat('Siła')).toBe(true)
        expect(npc.hasStat('st_str')).toBe(true)
        expect(npc.getStat('Siła')).toBe(15)
        npc.removeStat('Siła')
        expect(npc.hasStat('Siła')).toBe(false)
        npc.setStats([st])
        expect(npc.getStats()).toHaveLength(1)

        // Umiejętności
        const sk = new Skill('sk_arch', 'Łucznictwo', new Description(), 'direct', '+3')
        npc.addSkill(sk)
        expect(npc.hasSkill('Łucznictwo')).toBe(true)
        expect(npc.getSkill('sk_arch')).toBe(sk)
        npc.removeSkill('Łucznictwo')
        expect(npc.hasSkill('Łucznictwo')).toBe(false)
        npc.setSkills([sk])
        expect(npc.getSkills()).toHaveLength(1)

        // Przymioty (Features)
        const feat = new Feature('f_dark', 'Mroczny', new Description())
        npc.addFeature(feat)
        expect(npc.hasFeature('Mroczny')).toBe(true)
        expect(npc.getFeature('f_dark')).toBe(feat)
        npc.removeFeature('Mroczny')
        expect(npc.hasFeature('Mroczny')).toBe(false)
        npc.setFeatures([feat])
        expect(npc.getFeatures()).toHaveLength(1)

        // Tagi
        const tg = new Tag('tg_vip', 'VIP')
        npc.addTag(tg)
        expect(npc.hasTag('VIP')).toBe(true)
        npc.removeTag('VIP')
        expect(npc.hasTag('VIP')).toBe(false)
        npc.setTags([tg])
        expect(npc.getTags()).toHaveLength(1)

        // Custom attributes
        npc.setCustomAttributes([{ name: 'Rasa', value: 'Krasnolud' }])
        expect(npc.getCustomAttributes()).toEqual([{ name: 'Rasa', value: 'Krasnolud' }])

        // fromJSON null i ca.key fallback
        const fromNull = NPC.fromJSON(null)
        expect(fromNull.getId()).toBe('')

        const fromKeyAttrs = NPC.fromJSON({
            id: 'npc-attrs',
            name: 'Kupiec',
            customAttributes: [{ key: 'Wiek', value: '50' }],
        })
        expect(fromKeyAttrs.getCustomAttributes()).toEqual([{ name: 'Wiek', value: '50' }])
    })
})
