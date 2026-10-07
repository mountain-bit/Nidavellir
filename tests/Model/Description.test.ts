import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'

describe('Description Model', () => {
    it('should correctly create an instance with default values', () => {
        const desc = new Description()
        expect(desc.getText()).toBe('')
        expect(desc.getSummary()).toBe('')
        expect(desc.getFilePath()).toBe('')
        expect(desc.getTextPath()).toBe('')
    })

    it('should correctly set and get field values and paths', () => {
        const desc = new Description()
        desc.setText('Main content')
        desc.setSummary('Short summary')
        desc.setFilePath('./Paragraphs/p1/Description_Paragraph_p1.md')

        expect(desc.getText()).toBe('Main content')
        expect(desc.getSummary()).toBe('Short summary')
        expect(desc.getFilePath()).toBe('./Paragraphs/p1/Description_Paragraph_p1.md')
        // Backwards compatible getTextPath alias
        expect(desc.getTextPath()).toBe('./Paragraphs/p1/Description_Paragraph_p1.md')
    })

    it('should correctly serialize to JSON', () => {
        const desc = new Description(
            'Content',
            'Summary',
            './Paragraphs/p1/Description_Paragraph_p1.md'
        )
        const json = desc.toJSON()
        expect(json).toEqual({
            text: 'Content',
            summary: 'Summary',
            filePath: './Paragraphs/p1/Description_Paragraph_p1.md',
        })
        expect((json as Record<string, unknown>).authorNotes).toBeUndefined()
        expect((json as Record<string, unknown>).authorNotesPath).toBeUndefined()
    })

    it('should correctly deserialize from JSON with filePath', () => {
        const data = {
            text: 'A',
            summary: 'B',
            filePath: './NPC/jan/Description_NPC_Jan.md',
        }
        const desc = Description.fromJSON(data)
        expect(desc.getText()).toBe('A')
        expect(desc.getSummary()).toBe('B')
        expect(desc.getFilePath()).toBe('./NPC/jan/Description_NPC_Jan.md')
    })

    it('should support legacy textPath in fromJSON as fallback', () => {
        const legacyData = {
            text: 'Legacy text',
            summary: 'Legacy summary',
            textPath: './NPC/jan/text.md',
        }
        const desc = Description.fromJSON(legacyData)
        expect(desc.getText()).toBe('Legacy text')
        expect(desc.getSummary()).toBe('Legacy summary')
        expect(desc.getFilePath()).toBe('./NPC/jan/text.md')
    })

    it('should safely ignore legacy authorNotes and authorNotesPath in fromJSON', () => {
        const legacyWithNotes = {
            text: 'Story text',
            summary: 'Brief recap',
            authorNotes: 'Internal secret note to delete',
            authorNotesPath: './NPC/jan/author.md',
            filePath: './NPC/jan/Description_NPC_Jan.md',
        }
        const desc = Description.fromJSON(legacyWithNotes)
        expect(desc.getText()).toBe('Story text')
        expect(desc.getSummary()).toBe('Brief recap')
        expect(desc.getFilePath()).toBe('./NPC/jan/Description_NPC_Jan.md')

        // Serialized output must not contain authorNotes
        const json = desc.toJSON()
        expect(json).toEqual({
            text: 'Story text',
            summary: 'Brief recap',
            filePath: './NPC/jan/Description_NPC_Jan.md',
        })
    })

    it('should handle empty or undefined object in fromJSON', () => {
        const desc = Description.fromJSON(null)
        expect(desc).toBeInstanceOf(Description)
        expect(desc.getText()).toBe('')
        expect(desc.getSummary()).toBe('')
        expect(desc.getFilePath()).toBe('')
    })

    it('should handle partial JSON — missing optional fields default to empty string', () => {
        const partial = { text: 'Only text provided' }
        const desc = Description.fromJSON(partial)
        expect(desc.getText()).toBe('Only text provided')
        expect(desc.getSummary()).toBe('')
        expect(desc.getFilePath()).toBe('')
    })
})
