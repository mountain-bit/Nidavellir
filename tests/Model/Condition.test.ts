import { describe, expect, it } from 'vitest'

import { Condition, TextCondition } from '../../Model/Condition'

describe('Condition Polymorphic Model', () => {
    it('should create TextCondition with correct type and text', () => {
        const textCond = new TextCondition('c1', 'Requirement', 'Must have sword')
        expect(textCond.getId()).toBe('c1')
        expect(textCond.getName()).toBe('Requirement')
        expect(textCond.getType()).toBe('text')
        expect(textCond.getText()).toBe('Must have sword')
        expect(textCond.getSummary()).toBe('Must have sword')
    })

    it('should serialize and deserialize TextCondition polymorphic from Condition.fromJSON', () => {
        const original = new TextCondition('t1', 'Torch check', 'Torch must be lit')
        const json = original.toJSON()

        expect(json.type).toBe('text')
        expect(json.text).toBe('Torch must be lit')

        const parsed = Condition.fromJSON(json)
        expect(parsed).toBeInstanceOf(TextCondition)
        expect(parsed.getId()).toBe('t1')
        expect(parsed.getType()).toBe('text')
        expect(parsed.getSummary()).toBe('Torch must be lit')
    })

    it('should handle legacy condition JSON without type field — falls back to TextCondition using name as text', () => {
        const legacy = {
            id: 'legacy_1',
            name: 'Posiadanie klucza',
        }
        const parsed = Condition.fromJSON(legacy)
        expect(parsed).toBeInstanceOf(TextCondition)
        expect(parsed.getId()).toBe('legacy_1')
        // name is used as the summary/text fallback
        expect(parsed.getSummary()).toBe('Posiadanie klucza')
        expect((parsed as import('../../Model/Condition').TextCondition).getText()).toBe(
            'Posiadanie klucza'
        )
    })
})
