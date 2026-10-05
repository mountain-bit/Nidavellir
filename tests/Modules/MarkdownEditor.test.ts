// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { EntitySyncService } from '../../Modules/Editor/EntitySyncService'
import { MarkdownEditor } from '../../Modules/Editor/MarkdownEditor'
import { IEntityMentionItem } from '../../Modules/Editor/types'

describe('EntitySyncService', () => {
    it('extracts entities from raw markdown format', () => {
        const md = `
# Wstęp
Wkraczasz do [Karczma Pod Gryfem](entity://location/loc_01), gdzie spotykasz [Karczmarz Jan](entity://character/char_01).
Czujesz, że to miejsce jest [Tajemnicze](entity://tag/tag_secret).
        `
        const extracted = EntitySyncService.extractReferencedEntities(md)

        expect(extracted.locations).toEqual([{ id: 'loc_01', name: 'Karczma Pod Gryfem' }])
        expect(extracted.characters).toEqual([{ id: 'char_01', name: 'Karczmarz Jan' }])
        expect(extracted.tags).toEqual([{ id: 'tag_secret', name: 'Tajemnicze' }])
    })

    it('synchronizes extracted entities with Paragraph', () => {
        const paragraph = new Paragraph('p_1', 'Scena w karczmie')
        const entities = {
            locations: [{ id: 'loc_01', name: 'Karczma' }],
            characters: [{ id: 'npc_01', name: 'Barman' }],
            tags: [{ id: 'tag_01', name: 'Niebezpieczeństwo' }],
            traits: [],
        }

        const projectData = {
            locations: [new Location('loc_01', 'Karczma')],
            characters: [new NPC('npc_01', 'Barman')],
            tags: [new Tag('tag_01', 'Niebezpieczeństwo')],
        }

        const res = EntitySyncService.syncWithParagraph(paragraph, entities, projectData)

        expect(res.changed).toBe(true)
        expect(res.addedLocations).toContain('Karczma')
        expect(res.addedCharacters).toContain('Barman')
        expect(res.addedTags).toContain('Niebezpieczeństwo')

        expect(paragraph.hasLocation('loc_01')).toBe(true)
        expect(paragraph.hasCharacter('npc_01')).toBe(true)
        expect(paragraph.hasTag('tag_01')).toBe(true)
    })

    it('does not duplicate existing entities on second sync', () => {
        const paragraph = new Paragraph('p_1', 'Scena')
        paragraph.addLocation(new Location('loc_01', 'Karczma'))

        const entities = {
            locations: [{ id: 'loc_01', name: 'Karczma' }],
            characters: [],
            tags: [],
            traits: [],
        }

        const res = EntitySyncService.syncWithParagraph(paragraph, entities)
        expect(res.changed).toBe(false)
        expect(res.addedLocations.length).toBe(0)
        expect(paragraph.getLocations().length).toBe(1)
    })

    it('synchronizes extracted traits with NPC', () => {
        const npc = new NPC('npc_1', 'Rycerz')
        const entities = {
            locations: [],
            characters: [],
            tags: [{ id: 'tag_1', name: 'Waleczny' }],
            traits: [],
        }

        const res = EntitySyncService.syncWithNPC(npc, entities)
        expect(res.changed).toBe(true)
        expect(res.addedTags).toContain('Waleczny')
        expect(npc.hasTag('tag_1')).toBe(true)
    })
})

describe('MarkdownEditor', () => {
    let container: HTMLElement
    const mockEntities: IEntityMentionItem[] = [
        { id: 'loc_tavern', name: 'Pod Rozbrykanym Kucykiem', type: 'location' },
        { id: 'npc_barkeep', name: 'Barliman Butterbur', type: 'character' },
    ]

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    it('initializes and calculates word and character count', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Ala ma kota i psa.',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        expect(editor.getWordCount()).toBe(5)
        expect(editor.getCharacterCount()).toBe(18)
        editor.destroy()
    })

    it('sets and gets markdown content', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.setMarkdown('## Nagłówek testowy\n\nJakaś treść.')
        const md = editor.getMarkdown()

        expect(md).toContain('Nagłówek testowy')
        editor.destroy()
    })

    it('inserts entity and serializes to markdown link format', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Spotykasz kogoś.',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.insertEntity(mockEntities[0])
        const md = editor.getMarkdown()

        expect(md).toContain('[Pod Rozbrykanym Kucykiem](entity://location/loc_tavern)')

        const extracted = editor.getExtractedEntities()
        expect(extracted.locations.some(l => l.name === 'Pod Rozbrykanym Kucykiem')).toBe(true)

        editor.destroy()
    })

    it('formats headings up to level 5, paragraphs, and active formatting states', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Tytuł rozdziału',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.toggleHeading(5)
        expect(editor.isActive('heading', { level: 5 })).toBe(true)
        expect(editor.getActiveFormatting().h5).toBe(true)

        editor.setParagraph()
        expect(editor.isActive('paragraph')).toBe(true)
        expect(editor.getActiveFormatting().paragraph).toBe(true)
        expect(editor.getActiveFormatting().h5).toBe(false)

        editor.destroy()
    })

    it('toggles dialog block with dialog styling', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Witaj wędrowcze w naszej gospodzie!',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.toggleDialog()
        expect(editor.isActive('dialog')).toBe(true)
        expect(editor.getActiveFormatting().dialog).toBe(true)

        const md = editor.getMarkdown()
        expect(md).toContain('gamebook-dialog')

        editor.destroy()
    })

    it('supports underline and strike formatting', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Ważne słowo',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        // Select all text
        const raw = editor.getRawEditor()
        raw?.commands.selectAll()

        editor.toggleUnderline()
        expect(editor.isActive('underline')).toBe(true)
        expect(editor.getActiveFormatting().underline).toBe(true)

        editor.toggleStrike()
        expect(editor.isActive('strike')).toBe(true)
        expect(editor.getActiveFormatting().strike).toBe(true)

        const md = editor.getMarkdown()
        expect(md).toContain('<u>')
        expect(md).toContain('~~')

        editor.destroy()
    })
})
