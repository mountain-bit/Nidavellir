import { describe, expect, it } from 'vitest'

import { Location } from '../../Model/Location'
import { Tag } from '../../Model/Tag'

describe('Location Model', () => {
    it('tworzy lokację z domyślnymi i podanymi wartościami', () => {
        const lok = new Location('loc-1', 'Tavern')
        expect(lok.getId()).toBe('loc-1')
        expect(lok.getName()).toBe('Tavern')
    })

    it('pozwala na zmianę nazwy za pomocą setName', () => {
        const lok = new Location('loc-1', 'Tavern')
        lok.setName('Castle')
        expect(lok.getName()).toBe('Castle')
    })

    it('dodaje i usuwa tagi', () => {
        const lok = new Location('loc-1', 'Tavern')
        const tag = new Tag('t1', 'Important')
        lok.addTag(tag)
        expect(lok.hasTag('t1')).toBe(true)
        expect(lok.hasTag('Important')).toBe(true)

        lok.removeTag('t1')
        expect(lok.hasTag('t1')).toBe(false)
    })

    it('serializuje i deserializuje do/z JSON', () => {
        const lok = new Location('loc-1', 'Tavern')
        const json = lok.toJSON()
        expect(json.name).toBe('Tavern')
        expect(json.id).toBe('loc-1')

        const fromJson = Location.fromJSON({
            id: 'loc-2',
            name: 'Tower',
            description: { text: 'High tower' },
        })
        expect(fromJson.getId()).toBe('loc-2')
        expect(fromJson.getName()).toBe('Tower')
    })
})
