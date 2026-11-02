import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { DescriptionTransclusionService } from '../../Services/markdown/DescriptionTransclusionService'

describe('DescriptionTransclusionService', () => {
    const item1 = new Item(
        'sword_01',
        'Miecz Światła',
        new Description(
            'Lśniący miecz wykuty ze stali meteorytowej.',
            'Magiczny miecz jednoręczny.'
        )
    )
    const npc1 = new NPC(
        'npc_elrond',
        'Lord Elrond',
        new Description(
            'Dostojny elf o przenikliwym spojrzeniu i wiekowej mądrości.',
            'Władca Rivendell.'
        )
    )
    const loc1 = new Location(
        'loc_crypt',
        'Krypta Królów',
        new Description('Mroczna krypta pełna pradawnych sarkofagów.', 'Grobowiec dawnych królów.')
    )

    const projectData = {
        items: [item1],
        characters: [npc1],
        locations: [loc1],
    }

    describe('extractEmbeds', () => {
        it('extracts all embeds from markdown links [Label](embed://...) and legacy macros', () => {
            const md = `
Wchodzisz do sali: [Opis: Krypta](embed://location/loc_crypt)
Na ołtarzu leży oręż: [Opis: Miecz](embed://item/sword_01)
Obok stoi strażnik: [Opis: Elrond](embed://character/npc_elrond/summary)
I stary format: {{embed:item:sword_01}}
            `
            const embeds = DescriptionTransclusionService.extractEmbeds(md)
            expect(embeds).toHaveLength(4)
            expect(embeds[0]).toEqual({
                type: 'location',
                id: 'loc_crypt',
                variant: 'text',
                label: 'Opis: Krypta',
                rawMatch: '[Opis: Krypta](embed://location/loc_crypt)',
            })
            expect(embeds[1]).toEqual({
                type: 'item',
                id: 'sword_01',
                variant: 'text',
                label: 'Opis: Miecz',
                rawMatch: '[Opis: Miecz](embed://item/sword_01)',
            })
            expect(embeds[2]).toEqual({
                type: 'character',
                id: 'npc_elrond',
                variant: 'summary',
                label: 'Opis: Elrond',
                rawMatch: '[Opis: Elrond](embed://character/npc_elrond/summary)',
            })
            expect(embeds[3]).toEqual({
                type: 'item',
                id: 'sword_01',
                variant: 'text',
                rawMatch: '{{embed:item:sword_01}}',
            })
        })

        it('returns empty array when text has no embeds', () => {
            expect(DescriptionTransclusionService.extractEmbeds('Zwykły opis paragrafu.')).toEqual(
                []
            )
        })
    })

    describe('preprocess and postprocess for editor', () => {
        it('converts legacy markdown macro to link format', () => {
            const md = 'Przedmiot: {{embed:item:sword_01:summary}}'
            const pre = DescriptionTransclusionService.preprocessForEditor(md)
            expect(pre).toBe('Przedmiot: [Opis: sword_01](embed://item/sword_01/summary)')
        })

        it('converts HTML div tag back to markdown link format', () => {
            const html =
                'Przedmiot: <div data-description-embed="true" data-type="item" data-id="sword_01" data-variant="summary"></div>'
            const post = DescriptionTransclusionService.postprocessFromEditor(html)
            expect(post).toBe('Przedmiot: [Opis: sword_01](embed://item/sword_01/summary)')
        })
    })

    describe('resolve', () => {
        it('replaces item link embed with full text by default', () => {
            const md = 'Znalazłeś skarb:\n[Opis: Miecz](embed://item/sword_01)\nBierz i uciekaj!'
            const resolved = DescriptionTransclusionService.resolve(md, projectData)
            expect(resolved).toContain('Lśniący miecz wykuty ze stali meteorytowej.')
            expect(resolved).not.toContain('embed://')
        })

        it('replaces character embed link with summary when requested', () => {
            const md = 'Przy stole siedzi: [Opis: Elrond](embed://character/npc_elrond/summary)'
            const resolved = DescriptionTransclusionService.resolve(md, projectData)
            expect(resolved).toBe('Przy stole siedzi: Władca Rivendell.')
        })

        it('replaces location embed link with full description', () => {
            const md = 'Przechodzisz przez wrota.\n[Opis: Krypta](embed://location/loc_crypt)'
            const resolved = DescriptionTransclusionService.resolve(md, projectData)
            expect(resolved).toContain('Mroczna krypta pełna pradawnych sarkofagów.')
        })

        it('handles missing entities with warning placeholder', () => {
            const md = 'Przedmiot: [Opis: Nieznany](embed://item/non_existent_item)'
            const resolved = DescriptionTransclusionService.resolve(md, projectData)
            expect(resolved).toContain('⚠️ [Brakujący opis obiektu: item "non_existent_item"]')
        })

        it('handles missing entities with empty fallback when option is set', () => {
            const md = 'Przedmiot: [Opis: Nieznany](embed://item/non_existent_item)'
            const resolved = DescriptionTransclusionService.resolve(md, projectData, {
                fallbackOnMissing: 'empty',
            })
            expect(resolved).toBe('Przedmiot: ')
        })

        it('throws error on missing entity when fallbackOnMissing is throw', () => {
            const md = 'Przedmiot: [Opis: Nieznany](embed://item/non_existent_item)'
            expect(() =>
                DescriptionTransclusionService.resolve(md, projectData, {
                    fallbackOnMissing: 'throw',
                })
            ).toThrow(/Nie znaleziono obiektu do transkluzji opisu/)
        })

        it('supports wrapper template option', () => {
            const md = '[Opis: Miecz](embed://item/sword_01)'
            const resolved = DescriptionTransclusionService.resolve(md, projectData, {
                wrapperTemplate: (text, embed, name) => `> **${name}**\n> ${text}`,
            })
            expect(resolved).toBe(
                '> **Miecz Światła**\n> Lśniący miecz wykuty ze stali meteorytowej.'
            )
        })

        it('detects cycles and avoids infinite recursion', () => {
            const cyclicItem = new Item(
                'cyclic_item',
                'Pętla',
                new Description('Oto pętla: [Opis: Pętla](embed://item/cyclic_item)')
            )
            const resolved = DescriptionTransclusionService.resolve(
                '[Opis: Pętla](embed://item/cyclic_item)',
                {
                    items: [cyclicItem],
                }
            )
            expect(resolved).toContain('⚠️ [Cykliczne odwołanie do opisu: item "cyclic_item"]')
        })
    })
})
