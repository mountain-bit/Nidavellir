import { describe, expect, it } from 'vitest'

import { Choice } from '../../Model/Choice'
import { TextCondition } from '../../Model/Condition'
import { Description } from '../../Model/Description'

describe('Choice Model', () => {
    it('should initialize with default values', () => {
        const choice = new Choice()
        expect(choice.getId()).toBe('')
        expect(choice.getName()).toBe('')
        expect(choice.getFromParagraphId()).toBe('')
        expect(choice.getToParagraphId()).toBe('')
        expect(choice.getCondition()).toBeNull()
        expect(choice.getDescription()).toBeInstanceOf(Description)
    })

    it('should set and get fromParagraphId and toParagraphId', () => {
        const choice = new Choice('c1', 'Go to Cave', 'p1', 'p2')
        expect(choice.getId()).toBe('c1')
        expect(choice.getName()).toBe('Go to Cave')
        expect(choice.getFromParagraphId()).toBe('p1')
        expect(choice.getToParagraphId()).toBe('p2')

        choice.setFromParagraphId('p10')
        choice.setToParagraphId('p20')
        expect(choice.getFromParagraphId()).toBe('p10')
        expect(choice.getToParagraphId()).toBe('p20')
    })

    it('should handle polymorphic condition assignment', () => {
        const choice = new Choice('c1', 'Choice with Condition', 'p1', 'p2')
        const cond = new TextCondition('cond1', 'Night check', 'Requires torch')
        choice.setCondition(cond)

        expect(choice.getCondition()).toBe(cond)
        expect(choice.getCondition()?.getType()).toBe('text')
        expect(choice.getCondition()?.getSummary()).toBe('Requires torch')
    })

    it('should serialize to JSON and deserialize from JSON correctly', () => {
        const choice = new Choice(
            'c1',
            'Take secret passage',
            'p1',
            'p3',
            new TextCondition('tc1', 'Key check', 'Requires golden key'),
            new Description('Secret passage description', 'Summary of passage')
        )

        const json = choice.toJSON()
        expect(json.id).toBe('c1')
        expect(json.name).toBe('Take secret passage')
        expect(json.fromParagraphId).toBe('p1')
        expect(json.toParagraphId).toBe('p3')
        expect(json.condition).toEqual({
            id: 'tc1',
            name: 'Key check',
            type: 'text',
            text: 'Requires golden key',
        })

        const deserialized = Choice.fromJSON(json)
        expect(deserialized.getId()).toBe('c1')
        expect(deserialized.getName()).toBe('Take secret passage')
        expect(deserialized.getFromParagraphId()).toBe('p1')
        expect(deserialized.getToParagraphId()).toBe('p3')
        expect(deserialized.getCondition()?.getSummary()).toBe('Requires golden key')
    })

    it('should support legacy fromJSON format where id was targetParagraphId', () => {
        const legacyJson = {
            id: 'p2',
            name: 'Go to the forest',
        }
        const choice = Choice.fromJSON(legacyJson)
        expect(choice.getName()).toBe('Go to the forest')
        expect(choice.getToParagraphId()).toBe('p2')
    })

    it('should support legacy fromJSON format with sourceParagraphId and targetParagraphId', () => {
        const legacyJson = {
            id: 'c1',
            name: 'Go to the forest',
            sourceParagraphId: 'p1',
            targetParagraphId: 'p2',
        }
        const choice = Choice.fromJSON(legacyJson)
        expect(choice.getId()).toBe('c1')
        expect(choice.getName()).toBe('Go to the forest')
        expect(choice.getFromParagraphId()).toBe('p1')
        expect(choice.getToParagraphId()).toBe('p2')
    })
})
