import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Parameter } from '../../Model/Parameter'

describe('Parameter Model', () => {
    it('tworzy parametr w trybie direct i pozwala na zmianę wartości oraz pól bazowych', () => {
        const defaultParam = new Parameter()
        expect(defaultParam.getId()).toBe('')
        expect(defaultParam.hasId()).toBe(false)
        expect(defaultParam.getName()).toBe('')
        expect(defaultParam.getMode()).toBe('direct')

        const param = new Parameter(
            'p1',
            'Punkty Życia',
            new Description('Życie gracza'),
            'direct',
            100
        )
        expect(param.getId()).toBe('p1')
        expect(param.hasId()).toBe(true)
        expect(param.getName()).toBe('Punkty Życia')
        expect(param.getMode()).toBe('direct')
        expect(param.getValue()).toBe(100)
        expect(param.getFormula()).toBe('')
        expect(param.getCalculatedValue()).toBeNull()

        param.setId('p1-mod')
        expect(param.getId()).toBe('p1-mod')
        param.setName('Nowe Życie')
        expect(param.getName()).toBe('Nowe Życie')
        param.setValue(120)
        expect(param.getValue()).toBe(120)

        const newDesc = new Description('Nowy opis')
        param.setDescription(newDesc)
        expect(param.getDescription().getText()).toBe('Nowy opis')

        param.setMode('formula')
        expect(param.getMode()).toBe('formula')
    })

    it('tworzy parametr w trybie formula i przechowuje wzór', () => {
        const param = new Parameter(
            'p2',
            'Punkty Życia (HP)',
            new Description('Życie wyliczane'),
            'formula',
            '',
            'Siła * 4 + 10',
            50
        )
        expect(param.getMode()).toBe('formula')
        expect(param.getFormula()).toBe('Siła * 4 + 10')
        expect(param.getCalculatedValue()).toBe(50)

        param.setFormula('Siła * 5')
        param.setCalculatedValue(60)
        expect(param.getFormula()).toBe('Siła * 5')
        expect(param.getCalculatedValue()).toBe(60)
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const param = new Parameter(
            'p3',
            'Mana',
            new Description('Punkty magii'),
            'formula',
            '',
            'Inteligencja * 2',
            20
        )
        const json = param.toJSON()
        expect(json).toEqual({
            id: 'p3',
            name: 'Mana',
            description: param.getDescription(),
            mode: 'formula',
            value: '',
            formula: 'Inteligencja * 2',
            calculatedValue: 20,
            type: 'parameter',
        })

        const fromJson = Parameter.fromJSON(json)
        expect(fromJson.getId()).toBe('p3')
        expect(fromJson.getName()).toBe('Mana')
        expect(fromJson.getMode()).toBe('formula')
        expect(fromJson.getFormula()).toBe('Inteligencja * 2')
        expect(fromJson.getCalculatedValue()).toBe(20)
    })

    it('obsługuje pusty obiekt i null w fromJSON', () => {
        const paramNull = Parameter.fromJSON(null)
        expect(paramNull).toBeInstanceOf(Parameter)
        expect(paramNull.getId()).toBe('')
        expect(paramNull.getName()).toBe('')
        expect(paramNull.getMode()).toBe('direct')

        const paramEmpty = Parameter.fromJSON({})
        expect(paramEmpty).toBeInstanceOf(Parameter)
        expect(paramEmpty.getId()).toBe('')
        expect(paramEmpty.getName()).toBe('')
        expect(paramEmpty.getMode()).toBe('direct')
        expect(paramEmpty.getCalculatedValue()).toBeNull()
    })
})
