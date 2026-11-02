import { describe, expect, it, vi } from 'vitest'

import { Description } from '../../Model/Description'
import { Item } from '../../Model/Item'
import { Paragraph } from '../../Model/Paragraph'
import { Stat } from '../../Model/Stat'
import { EntityAccessor } from '../../Services/helpers/EntityAccessor'
import { copyTextToClipboard, escapeCsvCell, escapeHtml } from '../../Services/helpers/ExportUtils'
import {
    COMBAT_BLOCK_REGEX,
    EMBED_LINK_REGEX,
    EMBED_MACRO_REGEX,
    ENTITY_LINK_REGEX,
    escapeRegex,
} from '../../Services/helpers/MarkdownPatterns'

describe('Services Shared Helpers (Step 1)', () => {
    describe('EntityAccessor', () => {
        it('resolves ID and Name from both Model instances and plain objects', () => {
            const statModel = new Stat('stat_str', 'Siła', new Description(), '10')
            const plainTrait = { id: ' param_luck ', name: ' Szczęście ', value: 7 }
            const nameOnly = { getName: (): string => 'Zwinność' }

            expect(EntityAccessor.getId(statModel)).toBe('stat_str')
            expect(EntityAccessor.getName(statModel)).toBe('Siła')
            expect(EntityAccessor.getValue(statModel)).toBe('10')

            expect(EntityAccessor.getId(plainTrait)).toBe('param_luck')
            expect(EntityAccessor.getName(plainTrait)).toBe('Szczęście')
            expect(EntityAccessor.getValue(plainTrait)).toBe(7)

            expect(EntityAccessor.getId(nameOnly, false)).toBe('')
            expect(EntityAccessor.getId(nameOnly, true)).toBe('Zwinność')
            expect(EntityAccessor.getId(null)).toBe('')
        })

        it('resolves title or name from Paragraphs and fallback objects', () => {
            const p = new Paragraph('p_1', 'Mroczny Las')
            const plain = { name: 'Scena Startowa' }

            expect(EntityAccessor.getTitleOrName(p)).toBe('Mroczny Las')
            expect(EntityAccessor.getTitleOrName(plain)).toBe('Scena Startowa')
            expect(EntityAccessor.getTitleOrName({}, 'Domyślny')).toBe('Domyślny')
        })

        it('extracts description text and summary across Model and plain representations', () => {
            const item = new Item(
                'it_1',
                'Miecz',
                new Description('Pełny opis miecza', 'Krótki opis')
            )
            const plainStringDesc = { description: 'Tylko tekst' }
            const plainObjDesc = { description: { summary: 'Streszczenie', text: 'Długi tekst' } }

            expect(EntityAccessor.getDescriptionText(item, 'text')).toBe('Pełny opis miecza')
            expect(EntityAccessor.getDescriptionText(item, 'summary')).toBe('Krótki opis')
            expect(EntityAccessor.getDescriptionText(plainStringDesc, 'text')).toBe('Tylko tekst')
            expect(EntityAccessor.getDescriptionText(plainObjDesc, 'summary')).toBe('Streszczenie')
            expect(EntityAccessor.getDescriptionText(plainObjDesc, 'text')).toBe('Długi tekst')
        })

        it('normalizes diverse project scopes (AppContext, ProjectData, arrays)', () => {
            const p1 = new Paragraph('p1', 'Start')
            const it1 = new Item('i1', 'Klucz')

            const fromArray = EntityAccessor.normalizeScope([p1, it1])
            expect(fromArray.paragraphs).toHaveLength(1)
            expect(fromArray.items).toHaveLength(1)

            const fromNestedProjectData = EntityAccessor.normalizeScope({
                projectData: {
                    projectParagraphs: [p1],
                    projectItems: [it1],
                    files: { 'rules.md': '# Zasady' },
                },
            })
            expect(fromNestedProjectData.paragraphs).toEqual([p1])
            expect(fromNestedProjectData.items).toEqual([it1])
            expect(fromNestedProjectData.files['rules.md']).toBe('# Zasady')
        })
    })

    describe('MarkdownPatterns', () => {
        it('matches entity links, embed links, macros, and combat blocks', () => {
            expect(new RegExp(ENTITY_LINK_REGEX.source).test('[Miecz](entity://item/it_1)')).toBe(
                true
            )
            expect(
                new RegExp(EMBED_LINK_REGEX.source).test('[Opis: it_1](embed://item/it_1/summary)')
            ).toBe(true)
            expect(new RegExp(EMBED_MACRO_REGEX.source).test('{{embed:location:loc_1:text}}')).toBe(
                true
            )
            expect(
                COMBAT_BLOCK_REGEX.test('<!-- COMBAT_START -->\n### Starcie\n<!-- COMBAT_END -->')
            ).toBe(true)
            expect(escapeRegex('Starcie: (Boss) [1]')).toBe('Starcie: \\(Boss\\) \\[1\\]')
        })
    })

    describe('ExportUtils', () => {
        it('escapes HTML and CSV cells properly', () => {
            expect(escapeHtml('<script>"alert(\'xss\' & 1)"</script>')).toBe(
                '&lt;script&gt;&quot;alert(&#039;xss&#039; &amp; 1)&quot;&lt;/script&gt;'
            )
            expect(escapeCsvCell('Zwykły')).toBe('Zwykły')
            expect(escapeCsvCell('Z przecinkiem, i "cudzysłowem"')).toBe(
                '"Z przecinkiem, i ""cudzysłowem"""'
            )
            expect(escapeCsvCell(null)).toBe('')
        })

        it('copies text to clipboard when navigator.clipboard is available', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined)
            Object.assign(globalThis, {
                navigator: { clipboard: { writeText: writeTextMock } },
            })

            const ok = await copyTextToClipboard('Test schowka')
            expect(ok).toBe(true)
            expect(writeTextMock).toHaveBeenCalledWith('Test schowka')
        })
    })
})
