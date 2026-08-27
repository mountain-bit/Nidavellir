import { describe, expect, it } from 'vitest'

import { Cecha } from '../../Model/Cecha'
import { Opis } from '../../Model/Opis'

describe('Cecha Model', () => {
    it('tworzy cechę i pozwala na zmianę wartości', () => {
        const cecha = new Cecha('c1', 'Siła', new Opis('Siła fizyczna'), 10)
        expect(cecha.pobierzID()).toBe('c1')
        expect(cecha.pobierzNazwe()).toBe('Siła')
        expect(cecha.pobierzWartosc()).toBe(10)

        cecha.ustawNazwe('Zręczność')
        expect(cecha.pobierzNazwe()).toBe('Zręczność')
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const cecha = new Cecha('c2', 'Magia', new Opis('Moc magiczna'), 5)
        const json = cecha.toJSON()
        expect(json).toEqual({
            id: 'c2',
            nazwa: 'Magia',
            opis: cecha.pobierzOpis(),
            wartosc: 5,
        })

        const fromJson = Cecha.fromJSON(json)
        expect(fromJson.pobierzID()).toBe('c2')
        expect(fromJson.pobierzNazwe()).toBe('Magia')
        expect(fromJson.pobierzWartosc()).toBe(5)
    })
})
