import { beforeEach, describe, expect, it } from 'vitest'

import { Projekt } from '../../Model/Projekt'
import { Scena } from '../../Model/Scena'

describe('Projekt', () => {
    let projekt: Projekt

    beforeEach(() => {
        projekt = new Projekt('test-id', 'Mój Projekt', 'Autor', '1.0.0')
    })

    it('powinien mieć poprawne ID po inicjalizacji', () => {
        expect(projekt.pobierzID()).toBe('test-id')
    })

    it('powinien mieć poprawną nazwę', () => {
        expect(projekt.pobierzNazwe()).toBe('Mój Projekt')
    })

    it('powinien mieć poprawnego autora', () => {
        expect(projekt.pobierzAutora()).toBe('Autor')
    })

    it('czymaID powinno zwracać true gdy ID jest ustawione', () => {
        expect(projekt.czymaID()).toBe(true)
    })

    it('czymaID powinno zwracać false dla pustego ID', () => {
        const pustyProjekt = new Projekt()
        expect(pustyProjekt.czymaID()).toBe(false)
    })

    it('powinien dodawać scenę', () => {
        const scena = new Scena('scena-1', 'Prolog')
        projekt.dodajScene(scena)
        expect(projekt.pobierzSceny()).toHaveLength(1)
        expect(projekt.czymaScene('scena-1')).toBe(true)
    })

    it('powinien usuwać scenę po ID', () => {
        const scena = new Scena('scena-1', 'Prolog')
        projekt.dodajScene(scena)
        projekt.usunScene('scena-1')
        expect(projekt.pobierzSceny()).toHaveLength(0)
        expect(projekt.czymaScene('scena-1')).toBe(false)
    })

    it('pobierzScene powinno zwracać undefined dla nieistniejącej sceny', () => {
        expect(projekt.pobierzScene('nie-istnieje')).toBeUndefined()
    })
})
