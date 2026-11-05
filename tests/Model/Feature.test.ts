import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'

describe('Feature Model', () => {
    it('tworzy cechę szczególną/przymiot z domyślnymi i zadanymi wartościami', () => {
        const defaultFeature = new Feature()
        expect(defaultFeature.getId()).toBe('')
        expect(defaultFeature.hasId()).toBe(false)
        expect(defaultFeature.getName()).toBe('')

        const feature = new Feature('f1', 'Night Vision', new Description('Can see in dark'))
        expect(feature.getId()).toBe('f1')
        expect(feature.getName()).toBe('Night Vision')
        expect(feature.getDescription().getText()).toBe('Can see in dark')
        expect(feature.hasId()).toBe(true)

        feature.setId('f1-mod')
        expect(feature.getId()).toBe('f1-mod')
        feature.setName('Darkvision')
        expect(feature.getName()).toBe('Darkvision')

        const newDesc = new Description('Umożliwia widzenie w ciemnościach')
        feature.setDescription(newDesc)
        expect(feature.getDescription().getText()).toBe('Umożliwia widzenie w ciemnościach')
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

    it('obsługuje pusty obiekt i null w fromJSON', () => {
        const featureNull = Feature.fromJSON(null)
        expect(featureNull).toBeInstanceOf(Feature)
        expect(featureNull.getId()).toBe('')
        expect(featureNull.getName()).toBe('')

        const featureEmpty = Feature.fromJSON({})
        expect(featureEmpty).toBeInstanceOf(Feature)
        expect(featureEmpty.getId()).toBe('')
        expect(featureEmpty.getName()).toBe('')
    })
})
