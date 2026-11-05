import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Stat } from '../../Model/Stat'

describe('Stat Model', () => {
    it('tworzy cechę/statystykę z domyślnymi i podanymi wartościami', () => {
        const defaultStat = new Stat()
        expect(defaultStat.getId()).toBe('')
        expect(defaultStat.hasId()).toBe(false)
        expect(defaultStat.getName()).toBe('')
        expect(defaultStat.getValue()).toBe('')

        const stat = new Stat('c1', 'Strength', new Description('Physical power'), 10)
        expect(stat.getId()).toBe('c1')
        expect(stat.hasId()).toBe(true)
        expect(stat.getName()).toBe('Strength')
        expect(stat.getValue()).toBe(10)

        stat.setId('c1-new')
        expect(stat.getId()).toBe('c1-new')
        stat.setName('Agility')
        expect(stat.getName()).toBe('Agility')
        stat.setValue(15)
        expect(stat.getValue()).toBe(15)

        const newDesc = new Description('Nowy opis cechy')
        stat.setDescription(newDesc)
        expect(stat.getDescription().getText()).toBe('Nowy opis cechy')
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

    it('obsługuje pusty obiekt i null w fromJSON', () => {
        const statNull = Stat.fromJSON(null)
        expect(statNull).toBeInstanceOf(Stat)
        expect(statNull.getId()).toBe('')
        expect(statNull.getName()).toBe('')

        const statEmpty = Stat.fromJSON({})
        expect(statEmpty).toBeInstanceOf(Stat)
        expect(statEmpty.getId()).toBe('')
        expect(statEmpty.getName()).toBe('')
        expect(statEmpty.getValue()).toBe('')
    })
})
