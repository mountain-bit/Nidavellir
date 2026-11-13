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
            featureKind: 'flag',
            value: '',
            options: [],
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
        expect(featureEmpty.getFeatureKind()).toBe('flag')
    })

    it('obsługuje tryby featureKind (flag, value, list) oraz opcje i walidację', () => {
        const flagFeat = new Feature('f3', 'Nieśmiertelność')
        expect(flagFeat.getFeatureKind()).toBe('flag')
        expect(flagFeat.validateValue('').isValid).toBe(true)

        const valFeat = new Feature('f4', 'Pochodzenie', new Description(), 'value', 'Góry')
        expect(valFeat.getFeatureKind()).toBe('value')
        expect(valFeat.getValue()).toBe('Góry')
        valFeat.setValue('Las')
        expect(valFeat.getValue()).toBe('Las')
        expect(valFeat.validateValue('Równiny').isValid).toBe(true)

        const listFeat = new Feature('f5', 'Rasa', new Description(), 'list', 'Elf', [
            'Człowiek',
            'Elf',
            'Krasnolud',
        ])
        expect(listFeat.getFeatureKind()).toBe('list')
        expect(listFeat.getValue()).toBe('Elf')
        expect(listFeat.getOptions()).toEqual(['Człowiek', 'Elf', 'Krasnolud'])
        expect(listFeat.validateValue('Elf').isValid).toBe(true)
        expect(listFeat.validateValue('Ork').isValid).toBe(false)

        listFeat.addOption('Ork')
        expect(listFeat.validateValue('Ork').isValid).toBe(true)
        listFeat.removeOption('Człowiek')
        expect(listFeat.getOptions()).toEqual(['Elf', 'Krasnolud', 'Ork'])

        const json = listFeat.toJSON()
        expect(json.featureKind).toBe('list')
        expect(json.value).toBe('Elf')
        expect(json.options).toEqual(['Elf', 'Krasnolud', 'Ork'])

        const fromJson = Feature.fromJSON(json)
        expect(fromJson.getFeatureKind()).toBe('list')
        expect(fromJson.getValue()).toBe('Elf')
        expect(fromJson.getOptions()).toEqual(['Elf', 'Krasnolud', 'Ork'])
    })
})
