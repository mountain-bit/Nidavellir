import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Location } from '../../Model/Location'
import { Tag } from '../../Model/Tag'

describe('Location Model', () => {
    it('tworzy lokację z domyślnymi i podanymi wartościami', () => {
        const defaultLok = new Location()
        expect(defaultLok.getId()).toBe('')
        expect(defaultLok.hasId()).toBe(false)
        expect(defaultLok.getName()).toBe('')
        expect(defaultLok.getTags()).toEqual([])

        const lok = new Location('loc-1', 'Tavern')
        expect(lok.getId()).toBe('loc-1')
        expect(lok.hasId()).toBe(true)
        expect(lok.getName()).toBe('Tavern')

        lok.setId('loc-changed')
        expect(lok.getId()).toBe('loc-changed')
    })

    it('pozwala na zmianę nazwy za pomocą setName oraz opisu za pomocą setDescription', () => {
        const lok = new Location('loc-1', 'Tavern')
        lok.setName('Castle')
        expect(lok.getName()).toBe('Castle')

        const newDesc = new Description('Wielki zamek z basztami')
        lok.setDescription(newDesc)
        expect(lok.getDescription().getText()).toBe('Wielki zamek z basztami')
    })

    it('zarządza tagami: dodawanie unikalnych, usuwanie po ID lub nazwie, setTags', () => {
        const lok = new Location('loc-1', 'Tavern')
        const tag1 = new Tag('t1', 'Important')
        const tag2 = new Tag('t2', 'Dangerous')
        lok.addTag(tag1)
        expect(lok.hasTag('t1')).toBe(true)
        expect(lok.hasTag('Important')).toBe(true)

        // Nie dodaje duplikatu o tym samym ID
        lok.addTag(new Tag('t1', 'Important duplicate'))
        expect(lok.getTags().length).toBe(1)

        lok.addTag(tag2)
        expect(lok.getTags().length).toBe(2)

        // Usuwanie po nazwie
        lok.removeTag('Dangerous')
        expect(lok.hasTag('t2')).toBe(false)
        expect(lok.getTags().length).toBe(1)

        // Usuwanie po ID
        lok.removeTag('t1')
        expect(lok.hasTag('t1')).toBe(false)
        expect(lok.getTags().length).toBe(0)

        // setTags
        lok.setTags([tag1, tag2])
        expect(lok.getTags().length).toBe(2)
    })

    it('serializuje i deserializuje do/z JSON oraz obsługuje null i puste obiekty', () => {
        const lok = new Location('loc-1', 'Tavern')
        const json = lok.toJSON()
        expect(json.name).toBe('Tavern')
        expect(json.id).toBe('loc-1')

        const fromJson = Location.fromJSON({
            id: 'loc-2',
            name: 'Tower',
            description: { text: 'High tower' },
            tags: [{ id: 't1', name: 'Tall' }],
        })
        expect(fromJson.getId()).toBe('loc-2')
        expect(fromJson.getName()).toBe('Tower')
        expect(fromJson.hasTag('t1')).toBe(true)

        const nullLok = Location.fromJSON(null)
        expect(nullLok.getId()).toBe('')
        expect(nullLok.getName()).toBe('')

        const emptyObjLok = Location.fromJSON({})
        expect(emptyObjLok.getId()).toBe('')
        expect(emptyObjLok.getName()).toBe('')
    })
})
