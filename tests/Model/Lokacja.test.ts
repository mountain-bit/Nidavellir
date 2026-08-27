import { describe, expect, it } from 'vitest'

import { Lokacja } from '../../Model/Lokacja'
import { Tag } from '../../Model/Tag'

describe('Lokacja Model', () => {
    it('tworzy lokację z domyślnymi i podanymi wartościami', () => {
        const lok = new Lokacja('loc-1', 'Karczma')
        expect(lok.pobierzID()).toBe('loc-1')
        expect(lok.pobierzNazwe()).toBe('Karczma')
    })

    it('pozwala na zmianę nazwy za pomocą ustawNazwe', () => {
        const lok = new Lokacja('loc-1', 'Karczma')
        lok.ustawNazwe('Zamek')
        expect(lok.pobierzNazwe()).toBe('Zamek')
    })

    it('dodaje i usuwa tagi', () => {
        const lok = new Lokacja('loc-1', 'Karczma')
        const tag = new Tag('t1', 'Ważne')
        lok.dodajTag(tag)
        expect(lok.czymaTag('t1')).toBe(true)
        expect(lok.czymaTag('Ważne')).toBe(true)

        lok.usunTag('t1')
        expect(lok.czymaTag('t1')).toBe(false)
    })
})
