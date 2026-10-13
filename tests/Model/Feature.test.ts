import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'

describe('Feature Model', () => {
    it('tworzy cechę szczególną/przymiot z domyślnymi i zadanymi wartościami', () => {
        const feature = new Feature('f1', 'Night Vision', new Description('Can see in dark'))
        expect(feature.getId()).toBe('f1')
        expect(feature.getName()).toBe('Night Vision')
        expect(feature.getDescription().getText()).toBe('Can see in dark')
        expect(feature.hasId()).toBe(true)

        feature.setName('Darkvision')
        expect(feature.getName()).toBe('Darkvision')
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const feature = new Feature('f2', 'Eagle Eye', new Description('Sharp eyesight'))
        const json = feature.toJSON()
        expect(json).toEqual({
            id: 'f2',
            name: 'Eagle Eye',
            description: feature.getDescription(),
            type: 'feature',
        })

        const fromJson = Feature.fromJSON(json)
        expect(fromJson.getId()).toBe('f2')
        expect(fromJson.getName()).toBe('Eagle Eye')
        expect(fromJson.getDescription().getText()).toBe('Sharp eyesight')
    })

    it('obsługuje pusty obiekt fromJSON', () => {
        const feature = Feature.fromJSON(null)
        expect(feature).toBeInstanceOf(Feature)
        expect(feature.getId()).toBe('')
        expect(feature.getName()).toBe('')
    })
})
