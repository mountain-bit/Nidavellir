// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { ItemExportService } from '../../Services/export/ItemExportService'

describe('ItemExportService (Stage 4)', () => {
    let sword: Item
    let potion: Item
    let key: Item
    let p1: Paragraph
    let p2: Paragraph

    beforeEach(() => {
        sword = new Item(
            'it_sword',
            'Ognisty Miecz "Zguba"',
            new Description('Pełna historia miecza wykutego w lawie.', 'Streszczenie miecza'),
            [new Tag('tag_w', 'Broń', '#ef4444'), new Tag('tag_f', 'Ogień', '#f97316')],
            [
                {
                    id: 'mod_1',
                    targetType: 'stat',
                    targetName: 'Siła',
                    operator: '+',
                    value: 6,
                },
                {
                    id: 'mod_2',
                    targetType: 'skill',
                    targetName: 'Walka Bronią Białą',
                    operator: '+',
                    value: 2,
                },
            ],
            {
                category: 'weapon',
                slotSize: 2,
                weight: 4.0,
                isConsumable: false,
                inStartingInventory: true,
                targetInventoryId: 'inv_main',
            }
        )

        potion = new Item(
            'it_potion',
            'Mikstura Zdrowia',
            new Description('Leczy 20 punktów życia.'),
            [new Tag('tag_m', 'Mikstura', '#10b981')],
            [
                {
                    id: 'mod_3',
                    targetType: 'parameter',
                    targetName: 'Punkty Życia',
                    operator: '+',
                    value: 20,
                },
            ],
            {
                category: 'consumable',
                slotSize: 1,
                weight: 0.5,
                isConsumable: true,
                inStartingInventory: true,
            }
        )

        key = new Item('it_key', 'Żelazny Klucz', new Description('Otwiera stare drzwi.'), [], [], {
            category: 'quest',
            slotSize: 0,
            weight: 0.1,
            isConsumable: false,
            inStartingInventory: false,
        })

        p1 = new Paragraph('p_armory', 'Zbrojownia')
        p1.addItemAction({
            itemId: 'it_sword',
            itemName: 'Ognisty Miecz "Zguba"',
            action: 'give',
            quantity: 1,
        })

        p2 = new Paragraph('p_gate', 'Brama Zamkowa')
        p2.addItemAction({
            itemId: 'it_key',
            itemName: 'Żelazny Klucz',
            action: 'require',
            quantity: 1,
        })
    })

    describe('exportToJSON', () => {
        it('exports items to clean structured JSON without usages by default', () => {
            const jsonStr = ItemExportService.exportToJSON([sword, potion, key])
            const parsed = JSON.parse(jsonStr)

            expect(Array.isArray(parsed)).toBe(true)
            expect(parsed.length).toBe(3)

            const s = parsed[0]
            expect(s.id).toBe('it_sword')
            expect(s.name).toBe('Ognisty Miecz "Zguba"')
            expect(s.category).toBe('weapon')
            expect(s.slotSize).toBe(2)
            expect(s.weight).toBe(4)
            expect(s.isConsumable).toBe(false)
            expect(s.inStartingInventory).toBe(true)
            expect(s.targetInventoryId).toBe('inv_main')
            expect(s.tags).toEqual(['Broń', 'Ogień'])
            expect(s.modifiers.length).toBe(2)
            expect(s.modifiers[0].targetName).toBe('Siła')
            expect(s.description.summary).toBe('Streszczenie miecza')
            expect(s.description.text).toBe('Pełna historia miecza wykutego w lawie.')
            expect(s.usages).toBeUndefined()
        })

        it('includes paragraph usages when requested with paragraphs list', () => {
            const jsonStr = ItemExportService.exportToJSON([sword, key], {
                includeParagraphUsages: true,
                paragraphs: [p1, p2],
            })
            const parsed = JSON.parse(jsonStr)

            expect(parsed[0].usages).toBeDefined()
            expect(parsed[0].usages.length).toBe(1)
            expect(parsed[0].usages[0].paragraphName).toBe('Zbrojownia')
            expect(parsed[0].usages[0].action).toBe('give')

            expect(parsed[1].usages).toBeDefined()
            expect(parsed[1].usages.length).toBe(1)
            expect(parsed[1].usages[0].paragraphName).toBe('Brama Zamkowa')
            expect(parsed[1].usages[0].action).toBe('require')
        })
    })

    describe('exportToCSV', () => {
        it('generates compliant CSV with UTF-8 BOM, headers and escaped cells', () => {
            const csv = ItemExportService.exportToCSV([sword, potion, key])

            // Starts with UTF-8 BOM
            expect(csv.startsWith('\uFEFF')).toBe(true)

            // Header line
            expect(csv).toContain(
                'ID,Nazwa,Kategoria,Sloty,Waga,Zuzywalny,W_Ekwipunku_Startowym,Docelowy_Ekwipunek,Tagi,Modyfikatory,Streszczenie'
            )

            // Quotes inside sword name escaped as ""
            expect(csv).toContain('"Ognisty Miecz ""Zguba"""')
            expect(csv).toContain('weapon')
            expect(csv).toContain('2')
            expect(csv).toContain('Broń; Ogień')
            expect(csv).toContain('Siła: +6; Walka Bronią Białą: +2')

            // Potion isConsumable = Tak
            expect(csv).toContain('Mikstura Zdrowia')
            expect(csv).toContain('Tak')

            // Key 0 slots
            expect(csv).toContain('Żelazny Klucz')
            expect(csv).toContain('0')
        })
    })

    describe('exportToMarkdown', () => {
        it('generates rich Markdown document with overview table and details', () => {
            const md = ItemExportService.exportToMarkdown([sword, potion, key], {
                projectTitle: 'Kroniki Ognia i Stali',
                includeParagraphUsages: true,
                paragraphs: [p1, p2],
            })

            expect(md).toContain('# Kroniki Ognia i Stali')
            expect(md).toContain('Liczba zdefiniowanych przedmiotów: 3')

            // Overview Table
            expect(md).toContain('## Tabela Przeglądowa')
            expect(md).toContain(
                '| **Ognisty Miecz "Zguba"** | `weapon` | 2 | 4 | Nie | #Broń, #Ogień | `Siła: +6`, `Walka Bronią Białą: +2` |'
            )
            expect(md).toContain(
                '| **Mikstura Zdrowia** | `consumable` | 1 | 0.5 | Tak | #Mikstura | `Punkty Życia: +20` |'
            )

            // Detailed Sections
            expect(md).toContain('## Szczegółowy Opis Przedmiotów')
            expect(md).toContain('### Ognisty Miecz "Zguba"')
            expect(md).toContain('- **Identyfikator:** `it_sword`')
            expect(md).toContain('- **Zajmowane sloty:** 2 sloty')
            expect(md).toContain('- **W początkowym ekwipunku bohatera:** Tak (inv_main)')
            expect(md).toContain('- **Tagi:** #Broń #Ogień')
            expect(md).toContain('| stat | Siła | `+6` |')
            expect(md).toContain('> *Streszczenie miecza*')
            expect(md).toContain('Pełna historia miecza wykutego w lawie.')
            expect(md).toContain('Paragraf §1 "Zbrojownia" — *Znajdź / Otrzymaj* (x1)')

            // Consumable & 0 slots
            expect(md).toContain('### Żelazny Klucz')
            expect(md).toContain('- **Zajmowane sloty:** 0 sloty')
        })

        it('handles empty items array gracefully', () => {
            const md = ItemExportService.exportToMarkdown([])
            expect(md).toContain('nie zawiera jeszcze żadnych zdefiniowanych przedmiotów')
        })
    })

    describe('DOM & Clipboard Helpers', () => {
        it('downloadFile triggers DOM element download without crashing', () => {
            const clickSpy = vi.fn()
            const origCreate = document.createElement.bind(document)
            vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
                const el = origCreate(tagName)
                if (tagName === 'a') {
                    el.click = clickSpy
                }
                return el
            }) as any)

            ItemExportService.downloadFile('test content', 'items.csv', 'text/csv')
            expect(clickSpy).toHaveBeenCalled()
        })

        it('copyToClipboard writes text to navigator.clipboard', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined)
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: writeTextMock },
                writable: true,
                configurable: true,
            })

            const res = await ItemExportService.copyToClipboard('{"items": []}')
            expect(res).toBe(true)
            expect(writeTextMock).toHaveBeenCalledWith('{"items": []}')
        })
    })
})
