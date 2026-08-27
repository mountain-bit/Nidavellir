import { describe, expect, it } from 'vitest'

import { Opis } from '../../Model/Opis'

describe('Opis Model', () => {
    it('powinien poprawnie tworzyć instancję z domyślnymi wartościami', () => {
        const opis = new Opis()
        expect(opis.pobierzTekst()).toBe('')
        expect(opis.pobierzStreszczenie()).toBe('')
        expect(opis.pobierzTekstDlaAutora()).toBe('')
        expect(opis.pobierzSciezkaTekst()).toBe('')
        expect(opis.pobierzSciezkaTekstDlaAutora()).toBe('')
    })

    it('powinien poprawnie ustawiać i pobierać wartości pól i ścieżek', () => {
        const opis = new Opis()
        opis.ustawTekst('Treść główna')
        opis.ustawStreszczenie('Krótkie streszczenie')
        opis.ustawTekstDlaAutora('Notatka dla autora')
        opis.ustawSciezkaTekst('./Paragrafy/p1/tekst.md')
        opis.ustawSciezkaTekstDlaAutora('./Paragrafy/p1/autor.md')

        expect(opis.pobierzTekst()).toBe('Treść główna')
        expect(opis.pobierzStreszczenie()).toBe('Krótkie streszczenie')
        expect(opis.pobierzTekstDlaAutora()).toBe('Notatka dla autora')
        expect(opis.pobierzSciezkaTekst()).toBe('./Paragrafy/p1/tekst.md')
        expect(opis.pobierzSciezkaTekstDlaAutora()).toBe('./Paragrafy/p1/autor.md')
    })

    it('powinien poprawnie serializować do JSON', () => {
        const opis = new Opis('Treść', 'Streszczenie', 'Autor', './tekst.md', './autor.md')
        const json = opis.toJSON()
        expect(json).toEqual({
            tekst: 'Treść',
            streszczenie: 'Streszczenie',
            tekstDlaAutora: 'Autor',
            sciezkaTekst: './tekst.md',
            sciezkaTekstDlaAutora: './autor.md',
        })
    })

    it('powinien poprawnie deserializować z JSON', () => {
        const data = {
            tekst: 'A',
            streszczenie: 'B',
            tekstDlaAutora: 'C',
            sciezkaTekst: './a/tekst.md',
            sciezkaTekstDlaAutora: './a/autor.md',
        }
        const opis = Opis.fromJSON(data)
        expect(opis.pobierzTekst()).toBe('A')
        expect(opis.pobierzStreszczenie()).toBe('B')
        expect(opis.pobierzTekstDlaAutora()).toBe('C')
        expect(opis.pobierzSciezkaTekst()).toBe('./a/tekst.md')
        expect(opis.pobierzSciezkaTekstDlaAutora()).toBe('./a/autor.md')
    })

    it('powinien obsłużyć pusty/niezdefiniowany obiekt w fromJSON', () => {
        const opis = Opis.fromJSON(null)
        expect(opis).toBeInstanceOf(Opis)
        expect(opis.pobierzTekst()).toBe('')
        expect(opis.pobierzSciezkaTekst()).toBe('')
    })
})
