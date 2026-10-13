import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Skill } from '../../Model/Skill'

describe('Skill Model', () => {
    it('tworzy umiejętność w trybie direct i pozwala na zmianę pól', () => {
        const skill = new Skill(
            's1',
            'Walka wręcz',
            new Description('Walka na pięści'),
            'direct',
            '+3'
        )
        expect(skill.getId()).toBe('s1')
        expect(skill.getName()).toBe('Walka wręcz')
        expect(skill.getMode()).toBe('direct')
        expect(skill.getValue()).toBe('+3')
        expect(skill.getStatName()).toBe('')
        expect(skill.getModifier()).toBe('')

        skill.setValue('+5')
        expect(skill.getValue()).toBe('+5')
    })

    it('tworzy umiejętność w trybie stat_mod z powiązaną cechą', () => {
        const skill = new Skill(
            's2',
            'Skradanie',
            new Description('Ciche poruszanie'),
            'stat_mod',
            '',
            'Zręczność',
            '+2'
        )
        expect(skill.getMode()).toBe('stat_mod')
        expect(skill.getStatName()).toBe('Zręczność')
        expect(skill.getModifier()).toBe('+2')

        skill.setModifier('+4')
        skill.setStatName('Percepcja')
        expect(skill.getModifier()).toBe('+4')
        expect(skill.getStatName()).toBe('Percepcja')
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const skill = new Skill(
            's3',
            'Magia',
            new Description('Zdolności mistyczne'),
            'stat_mod',
            '',
            'Inteligencja',
            '+3'
        )
        const json = skill.toJSON()
        expect(json).toEqual({
            id: 's3',
            name: 'Magia',
            description: skill.getDescription(),
            mode: 'stat_mod',
            value: '',
            statName: 'Inteligencja',
            modifier: '+3',
            type: 'skill',
        })

        const fromJson = Skill.fromJSON(json)
        expect(fromJson.getId()).toBe('s3')
        expect(fromJson.getName()).toBe('Magia')
        expect(fromJson.getMode()).toBe('stat_mod')
        expect(fromJson.getStatName()).toBe('Inteligencja')
        expect(fromJson.getModifier()).toBe('+3')
    })

    it('obsługuje pusty obiekt fromJSON', () => {
        const skill = Skill.fromJSON(null)
        expect(skill).toBeInstanceOf(Skill)
        expect(skill.getId()).toBe('')
        expect(skill.getName()).toBe('')
        expect(skill.getMode()).toBe('direct')
    })
})
