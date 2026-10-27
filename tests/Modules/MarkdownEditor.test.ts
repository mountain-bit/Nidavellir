// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { MarkdownEditor } from '../../Modules/Editor/core/MarkdownEditor'
import { EntitySyncService } from '../../Modules/Editor/services/EntitySyncService'
import { ICustomTextStyle, IEntityMentionItem } from '../../Modules/Editor/types'
import { setLanguage } from '../../Utils/translate'

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

    afterEach(async () => {
        await setLanguage('pl')
        container?.remove()
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

    it('preserves combat block HTML comment markers through editor lifecycle', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const input =
            '# Paragraf\n\nTekst opisu.\n\n<!-- COMBAT_START -->\n### ⚔️ Starcie: Zasadzka\n<!-- COMBAT_END -->'
        editor.setMarkdown(input)
        const output = editor.getMarkdown()

        expect(output).toContain('<!-- COMBAT_START -->')
        expect(output).toContain('### ⚔️ Starcie: Zasadzka')
        expect(output).toContain('<!-- COMBAT_END -->')
        editor.destroy()
    })

    it('preserves full combat block with markdown table and outcomes without corruption', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const input = [
            '# Paragraf',
            '',
            'Wchodzisz do komnaty strażnika.',
            '',
            '<!-- COMBAT_START -->',
            '',
            '---',
            '',
            '### Starcie: zasx',
            '',
            '| Przeciwnik | Siła | hp |',
            '| :--- | :---: | :---: |',
            '| Strażnik miejski | 5 | 40 |',
            '',
            '#### Możliwe wyniki starcia:',
            '',
            '- **Zwycięstwo** → [§ 1 koniec](entity://paragraph/p1)',
            '',
            '<!-- COMBAT_END -->',
        ].join('\n')

        editor.setMarkdown(input)
        const output = editor.getMarkdown()

        expect(output).toContain('<!-- COMBAT_START -->')
        expect(output).toContain('<!-- COMBAT_END -->')
        expect(output).toContain('### Starcie: zasx')
        expect(output).toContain('| Przeciwnik | Siła | hp |')
        expect(output).toContain('| Strażnik miejski | 5 | 40 |')
        expect(output).toContain('- **Zwycięstwo** → [§ 1 koniec](entity://paragraph/p1)')
        expect(output).not.toContain('PrzeciwnikSiłahp')
        expect(output).not.toContain('{{combat:start}}')
        expect(output).not.toContain('{{combat:end}}')

        const card = container.querySelector('.combat-block-card')
        expect(card).not.toBeNull()
        expect(card?.textContent).toContain('Starcie: zasx')
        expect(card?.textContent).toContain('Strażnik miejski')
        expect(card?.textContent).toContain('Zwycięstwo')

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

    it('links entity with custom alias and syncs canonical character (e.g. Jasiek -> Jan Kowalski)', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const janKowalski: IEntityMentionItem = {
            id: 'char_jan_kowalski',
            name: 'Jan Kowalski',
            type: 'character',
        }

        // Insert mention with alias "Jasiek"
        editor.insertEntity(janKowalski, 'Jasiek')
        const md = editor.getMarkdown()

        expect(md).toContain('[Jasiek](entity://character/char_jan_kowalski)')

        // Verify syncWithParagraph recognizes canonical character Jan Kowalski
        const paragraph = new Paragraph('p_2', 'Spotkanie')
        const projectData = {
            characters: [new NPC('char_jan_kowalski', 'Jan Kowalski')],
        }

        const extracted = editor.getExtractedEntities()
        expect(extracted.characters[0].id).toBe('char_jan_kowalski')
        expect(extracted.characters[0].name).toBe('Jasiek')

        const syncResult = EntitySyncService.syncWithParagraph(paragraph, extracted, projectData)
        expect(syncResult.changed).toBe(true)
        expect(syncResult.addedCharacters).toContain('Jan Kowalski')
        expect(paragraph.hasCharacter('char_jan_kowalski')).toBe(true)

        editor.destroy()
    })

    it('unlinks an entity mention back to plain text', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '[Jasiek](entity://character/char_jan_kowalski)',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        // Mention is at position 1
        const unlinked = editor.unlinkEntityMention(1, 'Jasiek')
        expect(unlinked).toBe(true)

        const md = editor.getMarkdown()
        expect(md).not.toContain('entity://')
        expect(md).toContain('Jasiek')

        editor.destroy()
    })

    it('manages editable state correctly via constructor and setEditable', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Hello world',
            editable: false,
        })

        expect(editor.isEditable()).toBe(false)

        editor.setEditable(true)
        expect(editor.isEditable()).toBe(true)

        editor.setEditable(false)
        expect(editor.isEditable()).toBe(false)

        editor.destroy()
    })

    it('inserts image and serializes to clean markdown format', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Przed obrazem',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.setImage({ src: 'Assets/Images/mapa.png', alt: 'Mapa krainy' })
        const md = editor.getMarkdown()

        expect(md).toContain('![Mapa krainy](Assets/Images/mapa.png)')

        editor.destroy()
    })

    it('parses markdown image and renders DOM element with asset URL', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '![Zamek](Assets/Images/zamek.png)',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const img = container.querySelector('img')
        expect(img).not.toBeNull()
        expect(img?.getAttribute('src')).toBe('asset://project/Assets/Images/zamek.png')
        expect(img?.getAttribute('alt')).toBe('Zamek')

        const md = editor.getMarkdown()
        expect(md).toContain('![Zamek](Assets/Images/zamek.png)')

        editor.destroy()
    })

    it('parses markdown embed link [Label](embed://...) into interactive description embed badge', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent:
                'Wchodzisz do sali. [Opis: Miecz](embed://item/sword_01) Widzisz strażnika.',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const embedBadge = container.querySelector('.description-embed-badge')
        expect(embedBadge).not.toBeNull()
        expect(embedBadge?.getAttribute('data-id')).toBe('sword_01')
        expect(embedBadge?.getAttribute('data-type')).toBe('item')
        expect(embedBadge?.getAttribute('data-variant')).toBe('text')

        const md = editor.getMarkdown()
        expect(md).toContain('[Opis: Miecz](embed://item/sword_01)')

        editor.destroy()
    })

    it('inserts description embed and serializes back to markdown link format', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Rozdział pierwszy.',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const inserted = editor.insertDescriptionEmbed({
            id: 'npc_gandalf',
            type: 'character',
            variant: 'summary',
            name: 'Gandalf Szary',
        })

        expect(inserted).toBe(true)

        const embedBadge = container.querySelector('.description-embed-badge')
        expect(embedBadge).not.toBeNull()
        expect(embedBadge?.getAttribute('data-id')).toBe('npc_gandalf')
        expect(embedBadge?.getAttribute('data-type')).toBe('character')
        expect(embedBadge?.getAttribute('data-variant')).toBe('summary')

        const md = editor.getMarkdown()
        expect(md).toContain('[Opis: Gandalf Szary](embed://character/npc_gandalf/summary)')

        editor.destroy()
    })

    it('supports custom alias label in description embed link', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Wchodzisz do sali.',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        const inserted = editor.insertDescriptionEmbed({
            id: 'item_sword',
            type: 'item',
            name: 'Miecz',
            label: 'Ostrze Króla',
        })

        expect(inserted).toBe(true)

        const md = editor.getMarkdown()
        expect(md).toContain('[Ostrze Króla](embed://item/item_sword)')

        editor.destroy()
    })

    it('dynamically updates custom styles in running editor instance', () => {
        const initialStyles: ICustomTextStyle[] = [
            { id: 'style_red', name: 'Czerwony', color: '#ff0000' },
        ]
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Ważny tekst',
            getCustomStyles: (): ICustomTextStyle[] => initialStyles,
        })

        const raw = editor.getRawEditor()
        raw?.commands.selectAll()

        editor.toggleCustomStyle('style_red')
        expect(editor.getActiveCustomStyle()).toBe('style_red')

        const updatedStyles: ICustomTextStyle[] = [
            { id: 'style_red', name: 'Czerwony', color: '#ff0000' },
            { id: 'style_blue', name: 'Niebieski', color: '#0000ff' },
        ]
        editor.updateCustomStyles(updatedStyles)

        editor.toggleCustomStyle('style_blue')
        expect(editor.getActiveCustomStyle()).toBe('style_blue')

        editor.unsetCustomStyle()
        expect(editor.getActiveCustomStyle()).toBeNull()

        editor.destroy()
    })

    it('updates and removes description embed safely with robust node resolution', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Początek. ',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        editor.insertDescriptionEmbed({
            id: 'item_dagger',
            type: 'item',
            name: 'Sztylet',
        })

        const raw = editor.getRawEditor()
        let embedPos = -1
        raw?.state.doc.descendants((node, pos) => {
            if (node.type.name === 'descriptionEmbed') {
                embedPos = pos
                return false
            }
        })
        expect(embedPos).toBeGreaterThanOrEqual(0)

        // Test update using pos within/at the node
        const updated = editor.updateDescriptionEmbed(embedPos, {
            label: 'Zatruty Sztylet',
            variant: 'summary',
        })
        expect(updated).toBe(true)
        expect(editor.getMarkdown()).toContain(
            '[Zatruty Sztylet](embed://item/item_dagger/summary)'
        )

        // Test removal using pos offset by 1 (tests findNodePos fallback resolution)
        const removed = editor.removeDescriptionEmbed(embedPos + 1)
        expect(removed).toBe(true)
        expect(editor.getMarkdown()).not.toContain('embed://')

        editor.destroy()
    })

    it('extracts existing prefix cleanly and uses localized prefix on language switch', async () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: '',
            getProjectEntities: (): IEntityMentionItem[] => mockEntities,
        })

        // Test prefix de-duplication in default (PL) locale
        editor.insertDescriptionEmbed({
            id: 'item_sword',
            type: 'item',
            name: 'Opis: Miecz Ognia',
        })
        expect(editor.getMarkdown()).toContain('[Opis: Miecz Ognia](embed://item/item_sword)')
        expect(editor.getMarkdown()).not.toContain('Opis: Opis:')

        // Change language to english
        await setLanguage('en')
        editor.setMarkdown('')
        editor.insertDescriptionEmbed({
            id: 'item_bow',
            type: 'item',
            name: 'Description: Elven Bow',
        })
        expect(editor.getMarkdown()).toContain('[Description: Elven Bow](embed://item/item_bow)')
        expect(editor.getMarkdown()).not.toContain('Description: Description:')

        await setLanguage('pl')
        editor.destroy()
    })

    it('safely handles editor methods after destroy without throwing', () => {
        const editor = new MarkdownEditor({
            element: container,
            initialContent: 'Przykładowa treść',
        })

        expect(editor.isReady()).toBe(true)
        editor.destroy()

        expect(editor.isReady()).toBe(false)
        expect(editor.isEditable()).toBe(false)
        expect(editor.getWordCount()).toBe(0)
        expect(editor.getCharacterCount()).toBe(0)
        expect(editor.getMarkdown()).toBe('')
        expect(editor.toggleBold()).toBe(false)
        expect(editor.toggleItalic()).toBe(false)
        expect(editor.setParagraph()).toBe(false)
        expect(editor.getActiveCustomStyle()).toBeNull()
        expect(editor.getActiveFormatting()).toEqual({})
        expect(() => editor.focus()).not.toThrow()
        expect(() => editor.updateCustomStyles([])).not.toThrow()
        expect(() => editor.setMarkdown('Nowa treść')).not.toThrow()
        expect(() => editor.destroy()).not.toThrow()
    })
})
