import { describe, expect, it } from 'vitest'

import { Tag } from '../../Model/Tag'

describe('Tag Model', () => {
    it('tworzy tag z domyślnymi wartościami', () => {
        const tag = new Tag()
        expect(tag.getId()).toBe('')
        expect(tag.hasId()).toBe(false)
        expect(tag.getName()).toBe('')
        expect(tag.getColor()).toBe('#4a5b6d')
    })

    it('tworzy tag z podanymi parametrami oraz obsługuje setId i hasId', () => {
        const tag = new Tag('tag-1', 'Adventure', '#ef4444')
        expect(tag.getId()).toBe('tag-1')
        expect(tag.hasId()).toBe(true)
        expect(tag.getName()).toBe('Adventure')
        expect(tag.getColor()).toBe('#ef4444')

        tag.setId('tag-new-id')
        expect(tag.getId()).toBe('tag-new-id')
    })

    it('pozwala na zmianę nazwy i koloru', () => {
        const tag = new Tag('tag-1', 'Old')
        tag.setName('New Tag')
        tag.setColor('#10b981')
        expect(tag.getName()).toBe('New Tag')
        expect(tag.getColor()).toBe('#10b981')
    })

    it('deserializuje z obiektu JSON oraz z pustego/null wejścia', () => {
        const tagEn = Tag.fromJSON({ id: 't1', name: 'Magic', color: '#8b5cf6' })
        expect(tagEn.getId()).toBe('t1')
        expect(tagEn.getName()).toBe('Magic')
        expect(tagEn.getColor()).toBe('#8b5cf6')

        const nullTag = Tag.fromJSON(null)
        expect(nullTag.getId()).toBe('')
        expect(nullTag.getName()).toBe('')

        const nameOnlyTag = Tag.fromJSON({ name: 'OnlyName' })
        expect(nameOnlyTag.getId()).toBe('OnlyName')
        expect(nameOnlyTag.getName()).toBe('OnlyName')
    })

    it('deserializuje ze stringa', () => {
        const tag = Tag.fromJSON('Important')
        expect(tag.getId()).toBe('Important')
        expect(tag.getName()).toBe('Important')
        expect(tag.getColor()).toBe('#4a5b6d')
    })

    it('serializuje do obiektu JSON', () => {
        const tag = new Tag('t2', 'Combat', '#dc2626')
        expect(tag.toJSON()).toEqual({
            id: 't2',
            name: 'Combat',
            color: '#dc2626',
        })
    })
})
