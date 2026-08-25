import { describe, expect, it } from 'vitest'

import { Tag } from '../../Model/Tag'

describe('Tag Model', () => {
    it('tworzy tag z domyślnymi wartościami', () => {
        const tag = new Tag()
        expect(tag.pobierzID()).toBe('')
        expect(tag.pobierzNazwe()).toBe('')
        expect(tag.pobierzKolor()).toBe('#3b82f6')
    })

    it('tworzy tag z podanymi parametrami', () => {
        const tag = new Tag('tag-1', 'Przygoda', '#ef4444')
        expect(tag.pobierzID()).toBe('tag-1')
        expect(tag.pobierzNazwe()).toBe('Przygoda')
        expect(tag.pobierzKolor()).toBe('#ef4444')
    })

    it('pozwala na zmianę nazwy i koloru', () => {
        const tag = new Tag('tag-1', 'Stary')
        tag.ustawNazwe('Nowy Tag')
        tag.ustawKolor('#10b981')
        expect(tag.pobierzNazwe()).toBe('Nowy Tag')
        expect(tag.pobierzKolor()).toBe('#10b981')
    })

    it('deserializuje z obiektu JSON', () => {
        const tag = Tag.fromJSON({ id: 't1', nazwa: 'Magia', kolor: '#8b5cf6' })
        expect(tag.pobierzID()).toBe('t1')
        expect(tag.pobierzNazwe()).toBe('Magia')
        expect(tag.pobierzKolor()).toBe('#8b5cf6')
    })

    it('deserializuje ze stringa', () => {
        const tag = Tag.fromJSON('Ważne')
        expect(tag.pobierzID()).toBe('Ważne')
        expect(tag.pobierzNazwe()).toBe('Ważne')
        expect(tag.pobierzKolor()).toBe('#3b82f6')
    })

    it('serializuje do obiektu JSON', () => {
        const tag = new Tag('t2', 'Walka', '#dc2626')
        expect(tag.toJSON()).toEqual({
            id: 't2',
            nazwa: 'Walka',
            kolor: '#dc2626',
        })
    })
})
