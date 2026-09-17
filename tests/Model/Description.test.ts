import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'

describe('Description Model', () => {
    it('should correctly create an instance with default values', () => {
        const desc = new Description()
        expect(desc.getText()).toBe('')
        expect(desc.getSummary()).toBe('')
        expect(desc.getAuthorNotes()).toBe('')
        expect(desc.getTextPath()).toBe('')
        expect(desc.getAuthorNotesPath()).toBe('')
    })

    it('should correctly set and get field values and paths', () => {
        const desc = new Description()
        desc.setText('Main content')
        desc.setSummary('Short summary')
        desc.setAuthorNotes('Author note')
        desc.setTextPath('./Paragraphs/p1/text.md')
        desc.setAuthorNotesPath('./Paragraphs/p1/author.md')

        expect(desc.getText()).toBe('Main content')
        expect(desc.getSummary()).toBe('Short summary')
        expect(desc.getAuthorNotes()).toBe('Author note')
        expect(desc.getTextPath()).toBe('./Paragraphs/p1/text.md')
        expect(desc.getAuthorNotesPath()).toBe('./Paragraphs/p1/author.md')
    })

    it('should correctly serialize to JSON', () => {
        const desc = new Description('Content', 'Summary', 'Author', './text.md', './author.md')
        const json = desc.toJSON()
        expect(json).toEqual({
            text: 'Content',
            summary: 'Summary',
            authorNotes: 'Author',
            textPath: './text.md',
            authorNotesPath: './author.md',
        })
    })

    it('should correctly deserialize from JSON', () => {
        const data = {
            text: 'A',
            summary: 'B',
            authorNotes: 'C',
            textPath: './a/text.md',
            authorNotesPath: './a/author.md',
        }
        const desc = Description.fromJSON(data)
        expect(desc.getText()).toBe('A')
        expect(desc.getSummary()).toBe('B')
        expect(desc.getAuthorNotes()).toBe('C')
        expect(desc.getTextPath()).toBe('./a/text.md')
        expect(desc.getAuthorNotesPath()).toBe('./a/author.md')
    })

    it('should handle empty or undefined object in fromJSON', () => {
        const desc = Description.fromJSON(null)
        expect(desc).toBeInstanceOf(Description)
        expect(desc.getText()).toBe('')
        expect(desc.getTextPath()).toBe('')
    })

    it('should handle partial JSON — missing optional fields default to empty string', () => {
        const partial = { text: 'Only text provided' }
        const desc = Description.fromJSON(partial)
        expect(desc.getText()).toBe('Only text provided')
        expect(desc.getSummary()).toBe('')
        expect(desc.getAuthorNotes()).toBe('')
        expect(desc.getTextPath()).toBe('')
        expect(desc.getAuthorNotesPath()).toBe('')
    })
})
