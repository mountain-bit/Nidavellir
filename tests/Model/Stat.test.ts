import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Stat } from '../../Model/Stat'

describe('Stat Model', () => {
    it('tworzy cechę/statystykę i pozwala na zmianę wartości', () => {
        const stat = new Stat('c1', 'Strength', new Description('Physical power'), 10)
        expect(stat.getId()).toBe('c1')
        expect(stat.getName()).toBe('Strength')
        expect(stat.getValue()).toBe(10)

        stat.setName('Agility')
        expect(stat.getName()).toBe('Agility')
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const stat = new Stat('c2', 'Magic', new Description('Magical power'), 5)
        const json = stat.toJSON()
        expect(json).toEqual({
            id: 'c2',
            name: 'Magic',
            description: stat.getDescription(),
            value: 5,
            type: 'stat',
        })

        const fromJson = Stat.fromJSON(json)
        expect(fromJson.getId()).toBe('c2')
        expect(fromJson.getName()).toBe('Magic')
        expect(fromJson.getValue()).toBe(5)
    })

    it('obsługuje pusty obiekt fromJSON', () => {
        const stat = Stat.fromJSON(null)
        expect(stat).toBeInstanceOf(Stat)
        expect(stat.getId()).toBe('')
        expect(stat.getName()).toBe('')
    })
})
