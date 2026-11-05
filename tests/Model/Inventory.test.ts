/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest'

import { Inventory } from '../../Model/Inventory'
import { Item } from '../../Model/Item'

describe('Inventory Model', () => {
    it('creates instance with default values and auto-generated ID', () => {
        const inv = new Inventory()
        expect(inv.getId()).toMatch(/^inv_\d+_[a-z0-9]+$/)
        expect(inv.hasId()).toBe(true)
        expect(inv.getName()).toBe('Główny ekwipunek')
        expect(inv.getCapacity()).toBe(0)
        expect(inv.isUnlimited()).toBe(true)
        expect(inv.getItems()).toEqual([])
        expect(inv.getFreeSlots()).toBe(Infinity)
        expect(inv.isFull()).toBe(false)
    })

    it('creates parametrized instance with custom capacity and items', () => {
        const sword = new Item('it_sword', 'Miecz')
        const shield = new Item('it_shield', 'Tarcza')
        const inv = new Inventory('inv_backpack', 'Plecak Podróżnika', 10, [sword, shield])

        expect(inv.getId()).toBe('inv_backpack')
        expect(inv.getName()).toBe('Plecak Podróżnika')
        expect(inv.getCapacity()).toBe(10)
        expect(inv.isUnlimited()).toBe(false)
        expect(inv.getItems()).toHaveLength(2)
    })

    it('manages identity, name, and capacity setters', () => {
        const inv = new Inventory()
        inv.setId('custom_id')
        expect(inv.getId()).toBe('custom_id')

        inv.setName('Skrzynia')
        expect(inv.getName()).toBe('Skrzynia')

        inv.setCapacity(5)
        expect(inv.getCapacity()).toBe(5)
        expect(inv.isUnlimited()).toBe(false)

        // Ujemna lub niepoprawna pojemność jest normalizowana do 0
        inv.setCapacity(-1)
        expect(inv.getCapacity()).toBe(0)
        expect(inv.isUnlimited()).toBe(true)

        // @ts-expect-error testowanie niepoprawnych typów
        inv.setCapacity('duża')
        expect(inv.getCapacity()).toBe(0)
    })

    it('manages items, usedSlots and slot calculation variations', () => {
        const inv = new Inventory('inv_test', 'Ekwipunek', 10)

        // Przedmiot domyślny (1 slot)
        const regularItem = new Item('it_reg', 'Klucz')

        // Przedmiot z metodą getSlotSize
        const bigItem = new Item('it_big', 'Wielki Topór')
        bigItem.getSlotSize = (): number => 3

        // Przedmiot z właściwością slotSize
        const mediumItem = {
            getId: () => 'it_med',
            getName: () => 'Zbroja',
            slotSize: 2,
        } as any

        // Przedmiot z niepoprawnym/ujemnym slotSize fallbackuje do 1
        const invalidItem = {
            getId: () => 'it_inv',
            getName: () => 'Magiczny pył',
            slotSize: -5,
        } as any

        inv.setItems([regularItem, bigItem, mediumItem, invalidItem])
        expect(inv.getItems()).toHaveLength(4)
        // 1 + 3 + 2 + 1 = 7 slotów
        expect(inv.getUsedSlots()).toBe(7)
        expect(inv.getFreeSlots()).toBe(3)
        expect(inv.isFull()).toBe(false)

        // setItems z nie-tablicą czyści do []
        // @ts-expect-error testowanie niepoprawnych typów
        inv.setItems(null)
        expect(inv.getItems()).toEqual([])
        expect(inv.getUsedSlots()).toBe(0)
    })

    it('canAddItem and addItem enforce capacity limits', () => {
        const inv = new Inventory('inv_limited', 'Mała Sakwa', 3)
        const item1 = new Item('it_1', 'Eliksir 1')
        const item2 = new Item('it_2', 'Eliksir 2')
        const item3 = new Item('it_3', 'Eliksir 3')
        const item4 = new Item('it_4', 'Eliksir 4')

        expect(inv.addItem(item1)).toBe(true)
        expect(inv.addItem(item2)).toBe(true)
        expect(inv.addItem(item3)).toBe(true)
        expect(inv.isFull()).toBe(true)
        expect(inv.getFreeSlots()).toBe(0)

        // Dodanie czwartego przedmiotu jest odrzucane
        expect(inv.canAddItem(item4)).toBe(false)
        expect(inv.addItem(item4)).toBe(false)
        expect(inv.getItems()).toHaveLength(3)

        // canAddItem z przedmiotem o bezpośredniej właściwości slotSize
        const sizedItem = { slotSize: 2 } as any
        expect(inv.canAddItem(sizedItem)).toBe(false)
        const invalidSizedItem = { slotSize: -2 } as any
        expect(inv.canAddItem(invalidSizedItem)).toBe(false)

        // W nieograniczonym ekwipunku zawsze można dodać
        const unlimitedInv = new Inventory('inv_unlim', 'Magiczna Skrzynia', 0)
        expect(unlimitedInv.canAddItem(item4)).toBe(true)
        expect(unlimitedInv.addItem(item4)).toBe(true)
        expect(unlimitedInv.canAddItem(sizedItem)).toBe(true)
    })

    it('hasItem and removeItem by ID and by Name', () => {
        const inv = new Inventory('inv_pouch', 'Sakiewka', 5)
        const gem = new Item('it_gem', 'Rubin')
        const ring = new Item('it_ring', 'Pierścień')

        inv.addItem(gem)
        inv.addItem(ring)

        expect(inv.hasItem('it_gem')).toBe(true)
        expect(inv.hasItem('Rubin')).toBe(true)
        expect(inv.hasItem('non_existent')).toBe(false)

        // Usunięcie po ID
        inv.removeItem('it_gem')
        expect(inv.hasItem('it_gem')).toBe(false)

        // Usunięcie po nazwie
        inv.removeItem('Pierścień')
        expect(inv.hasItem('Pierścień')).toBe(false)
        expect(inv.getItems()).toHaveLength(0)
    })

    it('serializes to JSON via toJSON and deserializes via fromJSON', () => {
        // fromJSON z pustych danych
        expect(Inventory.fromJSON(null)).toBeInstanceOf(Inventory)
        expect(Inventory.fromJSON(undefined).getName()).toBe('Główny ekwipunek')

        const dagger = new Item('it_dag', 'Sztylet')
        const bareItem = { id: 'it_bare', name: 'Prosty kamień' } as any
        const inv = new Inventory('inv_hero', 'Zapasowy worek', 8, [dagger, bareItem])

        const json = inv.toJSON()
        expect(json).toEqual({
            id: 'inv_hero',
            name: 'Zapasowy worek',
            capacity: 8,
            items: [dagger.toJSON(), bareItem],
        })

        // Standardowy fromJSON
        const restored = Inventory.fromJSON(json)
        expect(restored.getId()).toBe('inv_hero')
        expect(restored.getName()).toBe('Zapasowy worek')
        expect(restored.getCapacity()).toBe(8)
        expect(restored.getItems()).toHaveLength(2)
        expect(restored.getItems()[0].getName()).toBe('Sztylet')

        // fromJSON bez zdefiniowanej pojemności (fallback do 0)
        const noCapJson = { id: 'inv_nocap' }
        expect(Inventory.fromJSON(noCapJson).getCapacity()).toBe(0)

        // fromJSON z polskimi aliasami (nazwa, pojemnosc, przedmioty)
        const polishJson = {
            id: 'inv_pl',
            nazwa: 'Polski Plecak',
            pojemnosc: 15,
            przedmioty: [{ id: 'it_chleb', name: 'Bochenek Chleba' }],
        }
        const restoredPl = Inventory.fromJSON(polishJson)
        expect(restoredPl.getId()).toBe('inv_pl')
        expect(restoredPl.getName()).toBe('Polski Plecak')
        expect(restoredPl.getCapacity()).toBe(15)
        expect(restoredPl.getItems()).toHaveLength(1)

        // fromJSON z aliasem maxSlots
        const maxSlotsJson = {
            id: 'inv_ms',
            maxSlots: 25,
        }
        const restoredMs = Inventory.fromJSON(maxSlotsJson)
        expect(restoredMs.getCapacity()).toBe(25)
    })
})
