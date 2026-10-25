import { describe, expect, it } from 'vitest'

import {
    Condition,
    ItemCondition,
    StatCondition,
    TagCondition,
    TextCondition,
} from '../../Model/Condition'

describe('Condition Polymorphic Model', () => {
    it('should create TextCondition with correct type and text', () => {
        const textCond = new TextCondition('c1', 'Requirement', 'Must have sword')
        expect(textCond.getId()).toBe('c1')
        expect(textCond.getName()).toBe('Requirement')
        expect(textCond.getType()).toBe('text')
        expect(textCond.getText()).toBe('Must have sword')
        expect(textCond.getSummary()).toBe('Must have sword')
    })

    it('should create ItemCondition with quantity and summary', () => {
        const itemCond = new ItemCondition('ic1', 'Wymóg pochodni', 'Pochodnia', 1)
        expect(itemCond.getId()).toBe('ic1')
        expect(itemCond.getType()).toBe('item')
        expect(itemCond.getItemName()).toBe('Pochodnia')
        expect(itemCond.getQuantity()).toBe(1)
        expect(itemCond.getSummary()).toBe('Posiada: Pochodnia')

        itemCond.setQuantity(3)
        expect(itemCond.getSummary()).toBe('Posiada: Pochodnia (x3)')

        const json = itemCond.toJSON()
        expect(json.type).toBe('item')
        expect(json.itemName).toBe('Pochodnia')
        expect(json.quantity).toBe(3)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(ItemCondition)
        expect(restored.getSummary()).toBe('Posiada: Pochodnia (x3)')
    })

    it('should create StatCondition with operator, value and summary', () => {
        const statCond = new StatCondition('sc1', 'Test siły', 'Siła', '>=', 14)
        expect(statCond.getId()).toBe('sc1')
        expect(statCond.getType()).toBe('stat')
        expect(statCond.getStatName()).toBe('Siła')
        expect(statCond.getOperator()).toBe('>=')
        expect(statCond.getValue()).toBe(14)
        expect(statCond.getSummary()).toBe('Siła >= 14')

        const json = statCond.toJSON()
        expect(json.type).toBe('stat')
        expect(json.statName).toBe('Siła')
        expect(json.operator).toBe('>=')
        expect(json.value).toBe(14)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(StatCondition)
        expect(restored.getSummary()).toBe('Siła >= 14')
    })

    it('should create TagCondition with tag name and summary (positive and negated)', () => {
        const tagCond = new TagCondition('tc1', 'Wymóg tagu', 'odwiedzil_zamek', false)
        expect(tagCond.getId()).toBe('tc1')
        expect(tagCond.getType()).toBe('tag')
        expect(tagCond.getTagName()).toBe('odwiedzil_zamek')
        expect(tagCond.isNegated()).toBe(false)
        expect(tagCond.getSummary()).toBe('Posiada tag: #odwiedzil_zamek')

        tagCond.setNegated(true)
        expect(tagCond.isNegated()).toBe(true)
        expect(tagCond.getSummary()).toBe('Brak tagu: #odwiedzil_zamek')

        const json = tagCond.toJSON()
        expect(json.type).toBe('tag')
        expect(json.tagName).toBe('odwiedzil_zamek')
        expect(json.negated).toBe(true)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(TagCondition)
        expect(restored.getSummary()).toBe('Brak tagu: #odwiedzil_zamek')
        expect((restored as TagCondition).isNegated()).toBe(true)
        expect((restored as TagCondition).getTagName()).toBe('odwiedzil_zamek')
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
        expect((parsed as TextCondition).getText()).toBe('Posiadanie klucza')
    })
})
