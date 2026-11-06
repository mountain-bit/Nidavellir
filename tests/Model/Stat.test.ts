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
        expect(defaultStat.getStatKind()).toBe('numeric')
        expect(defaultStat.getMin()).toBeNull()
        expect(defaultStat.getMax()).toBeNull()
        expect(defaultStat.getOptions()).toEqual([])

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

    it('obsługuje granice min i max dla cech numerycznych', () => {
        const stat = new Stat('s1', 'Siła', new Description(), 10, 'numeric', 1, 20)
        expect(stat.getStatKind()).toBe('numeric')
        expect(stat.getMin()).toBe(1)
        expect(stat.getMax()).toBe(20)

        stat.setMin(5)
        stat.setMax(25)
        expect(stat.getMin()).toBe(5)
        expect(stat.getMax()).toBe(25)

        stat.setMin(null)
        stat.setMax(null)
        expect(stat.getMin()).toBeNull()
        expect(stat.getMax()).toBeNull()
    })

    it('obsługuje opcje dla cech typu list', () => {
        const stat = new Stat('s2', 'Płeć', new Description(), 'Kobieta', 'list', null, null, [
            'Kobieta',
            'Mężczyzna',
        ])
        expect(stat.getStatKind()).toBe('list')
        expect(stat.getOptions()).toEqual(['Kobieta', 'Mężczyzna'])

        stat.addOption('Inna')
        expect(stat.getOptions()).toEqual(['Kobieta', 'Mężczyzna', 'Inna'])

        // Ignoruj duplikaty lub puste opcje
        stat.addOption('Kobieta')
        stat.addOption('')
        expect(stat.getOptions()).toEqual(['Kobieta', 'Mężczyzna', 'Inna'])

        stat.removeOption('Inna')
        expect(stat.getOptions()).toEqual(['Kobieta', 'Mężczyzna'])

        stat.setOptions(['A', 'B', 'C'])
        expect(stat.getOptions()).toEqual(['A', 'B', 'C'])
    })

    it('waliduje poprawność wartości numerycznych z granicami', () => {
        const stat = new Stat('s1', 'Siła', new Description(), 10, 'numeric', 1, 20)

        expect(stat.validateValue(10).valid).toBe(true)
        expect(stat.validateValue('15').valid).toBe(true)
        expect(stat.validateValue(1).valid).toBe(true)
        expect(stat.validateValue(20).valid).toBe(true)
        expect(stat.validateValue('').valid).toBe(true)

        const belowMin = stat.validateValue(0)
        expect(belowMin.valid).toBe(false)
        expect(belowMin.error).toContain('mniejsza niż 1')

        const aboveMax = stat.validateValue(25)
        expect(aboveMax.valid).toBe(false)
        expect(aboveMax.error).toContain('większa niż 20')

        const notNumber = stat.validateValue('abc')
        expect(notNumber.valid).toBe(false)
        expect(notNumber.error).toContain('liczbą')
    })

    it('waliduje poprawność wartości dla cech typu list', () => {
        const stat = new Stat('s2', 'Rasa', new Description(), 'Człowiek', 'list', null, null, [
            'Człowiek',
            'Elf',
            'Krasnolud',
        ])

        expect(stat.validateValue('Człowiek').valid).toBe(true)
        expect(stat.validateValue('Elf').valid).toBe(true)
        expect(stat.validateValue('').valid).toBe(true)

        const invalid = stat.validateValue('Ork')
        expect(invalid.valid).toBe(false)
        expect(invalid.error).toBeDefined()
    })

    it('serializuje i deserializuje do/z JSON z nowymi polami', () => {
        const stat = new Stat(
            'c2',
            'Płeć',
            new Description('Płeć postaci'),
            'Kobieta',
            'list',
            null,
            null,
            ['Kobieta', 'Mężczyzna']
        )
        const json = stat.toJSON()
        expect(json).toEqual({
            id: 'c2',
            name: 'Płeć',
            description: stat.getDescription(),
            value: 'Kobieta',
            type: 'stat',
            statKind: 'list',
            min: null,
            max: null,
            options: ['Kobieta', 'Mężczyzna'],
        })

        const fromJson = Stat.fromJSON(json)
        expect(fromJson.getId()).toBe('c2')
        expect(fromJson.getName()).toBe('Płeć')
        expect(fromJson.getStatKind()).toBe('list')
        expect(fromJson.getOptions()).toEqual(['Kobieta', 'Mężczyzna'])
    })

    it('obsługuje starszy format JSON bez nowych pól (backward compatibility)', () => {
        const legacyJson = {
            id: 'legacy-1',
            name: 'Siła',
            description: { text: 'Legacy stat' },
            value: 12,
            type: 'stat',
        }

        const stat = Stat.fromJSON(legacyJson)
        expect(stat.getId()).toBe('legacy-1')
        expect(stat.getName()).toBe('Siła')
        expect(stat.getValue()).toBe(12)
        expect(stat.getStatKind()).toBe('numeric')
        expect(stat.getMin()).toBeNull()
        expect(stat.getMax()).toBeNull()
        expect(stat.getOptions()).toEqual([])
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
        expect(statEmpty.getStatKind()).toBe('numeric')
    })
})
