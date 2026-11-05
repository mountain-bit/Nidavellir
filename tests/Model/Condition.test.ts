/* eslint-disable @typescript-eslint/no-explicit-any */
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
        expect(textCond.hasId()).toBe(true)
        expect(textCond.getName()).toBe('Requirement')
        expect(textCond.getType()).toBe('text')
        expect(textCond.getText()).toBe('Must have sword')
        expect(textCond.getSummary()).toBe('Must have sword')

        textCond.setId('c2')
        expect(textCond.getId()).toBe('c2')
        textCond.setName('New Req')
        expect(textCond.getName()).toBe('New Req')
        textCond.setType('custom')
        expect(textCond.getType()).toBe('custom')
        textCond.setText('New text')
        expect(textCond.getText()).toBe('New text')
        expect(textCond.toJSON()).toEqual({
            id: 'c2',
            name: 'New Req',
            type: 'custom',
            text: 'New text',
        })
    })

    it('should handle empty TextCondition and fallback summaries', () => {
        const emptyCond = new TextCondition()
        expect(emptyCond.hasId()).toBe(false)
        expect(emptyCond.getSummary()).toBe('')

        const namedOnly = new TextCondition('c3', 'OnlyName', '')
        expect(namedOnly.getSummary()).toBe('OnlyName')

        const parsedNull = TextCondition.fromJSON(null)
        expect(parsedNull.getId()).toBe('')
        expect(parsedNull.getText()).toBe('')

        const parsedFallback = TextCondition.fromJSON({ id: 'f1', name: 'FallbackName' })
        expect(parsedFallback.getText()).toBe('FallbackName')

        const parsedEmptyJson = TextCondition.fromJSON({})
        expect(parsedEmptyJson.getText()).toBe('')
    })

    it('should create ItemCondition with quantity and summary', () => {
        const itemCond = new ItemCondition('ic1', 'Wymóg pochodni', 'Pochodnia', 1)
        expect(itemCond.getId()).toBe('ic1')
        expect(itemCond.getType()).toBe('item')
        expect(itemCond.getItemName()).toBe('Pochodnia')
        expect(itemCond.getQuantity()).toBe(1)
        expect(itemCond.getSummary()).toBe('Posiada: Pochodnia')

        itemCond.setItemName('Miecz')
        expect(itemCond.getItemName()).toBe('Miecz')
        itemCond.setQuantity(3)
        expect(itemCond.getSummary()).toBe('Posiada: Miecz (x3)')
        itemCond.setQuantity(-5)
        expect(itemCond.getQuantity()).toBe(1)

        const json = itemCond.toJSON()
        expect(json.type).toBe('item')
        expect(json.itemName).toBe('Miecz')
        expect(json.quantity).toBe(1)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(ItemCondition)
        expect(restored.getSummary()).toBe('Posiada: Miecz')
    })

    it('should handle ItemCondition fallbacks and null fromJSON', () => {
        const nullItem = ItemCondition.fromJSON(null)
        expect(nullItem.getItemName()).toBe('')
        expect(nullItem.getQuantity()).toBe(1)

        const fallbackItem = ItemCondition.fromJSON({
            name: 'NamedItem',
            item: 'LegacyItem',
            quantity: 'invalid' as any,
        })
        expect(fallbackItem.getItemName()).toBe('LegacyItem')
        expect(fallbackItem.getQuantity()).toBe(1)

        const fallbackOnlyName = ItemCondition.fromJSON({
            name: 'OnlyNameItem',
        })
        expect(fallbackOnlyName.getItemName()).toBe('OnlyNameItem')

        const emptyItem = new ItemCondition('', '', '', 0)
        expect(emptyItem.getQuantity()).toBe(1)
        expect(emptyItem.getSummary()).toBe('Posiada: Przedmiot')
    })

    it('should create StatCondition with operator, value and summary', () => {
        const statCond = new StatCondition('sc1', 'Test siły', 'Siła', '>=', 14)
        expect(statCond.getId()).toBe('sc1')
        expect(statCond.getType()).toBe('stat')
        expect(statCond.getStatName()).toBe('Siła')
        expect(statCond.getOperator()).toBe('>=')
        expect(statCond.getValue()).toBe(14)
        expect(statCond.getSummary()).toBe('Siła >= 14')

        statCond.setStatName('Zręczność')
        expect(statCond.getStatName()).toBe('Zręczność')
        statCond.setOperator('<=')
        expect(statCond.getOperator()).toBe('<=')
        statCond.setValue(10)
        expect(statCond.getValue()).toBe(10)
        expect(statCond.getSummary()).toBe('Zręczność <= 10')
        statCond.setValue('not-a-number' as any)
        expect(statCond.getValue()).toBe(0)

        const json = statCond.toJSON()
        expect(json.type).toBe('stat')
        expect(json.statName).toBe('Zręczność')
        expect(json.operator).toBe('<=')
        expect(json.value).toBe(0)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(StatCondition)
        expect(restored.getSummary()).toBe('Zręczność <= 0')
    })

    it('should handle StatCondition operators, fallbacks and null fromJSON', () => {
        const nullStat = StatCondition.fromJSON(null)
        expect(nullStat.getStatName()).toBe('')
        expect(nullStat.getValue()).toBe(0)

        const legacyStat = StatCondition.fromJSON({
            stat: 'Mądrość',
            operator: '!=',
            value: 12,
        })
        expect(legacyStat.getStatName()).toBe('Mądrość')
        expect(legacyStat.getOperator()).toBe('!=')
        expect(legacyStat.getValue()).toBe(12)

        const invalidOpStat = StatCondition.fromJSON({
            name: 'Kondycja',
            operator: 'INVALID_OP',
            value: 'non-num' as any,
        })
        expect(invalidOpStat.getStatName()).toBe('Kondycja')
        expect(invalidOpStat.getOperator()).toBe('>=')
        expect(invalidOpStat.getValue()).toBe(0)

        const emptyStat = new StatCondition()
        expect(emptyStat.getSummary()).toBe('Cecha >= 0')
    })

    it('should create TagCondition with tag name and summary (positive and negated)', () => {
        const tagCond = new TagCondition('tc1', 'Wymóg tagu', 'odwiedzil_zamek', false)
        expect(tagCond.getId()).toBe('tc1')
        expect(tagCond.getType()).toBe('tag')
        expect(tagCond.getTagName()).toBe('odwiedzil_zamek')
        expect(tagCond.isNegated()).toBe(false)
        expect(tagCond.getNegated()).toBe(false)
        expect(tagCond.getSummary()).toBe('Posiada tag: #odwiedzil_zamek')

        tagCond.setTagName('nowy_tag')
        expect(tagCond.getTagName()).toBe('nowy_tag')
        tagCond.setNegated(true)
        expect(tagCond.isNegated()).toBe(true)
        expect(tagCond.getNegated()).toBe(true)
        expect(tagCond.getSummary()).toBe('Brak tagu: #nowy_tag')

        const json = tagCond.toJSON()
        expect(json.type).toBe('tag')
        expect(json.tagName).toBe('nowy_tag')
        expect(json.negated).toBe(true)

        const restored = Condition.fromJSON(json)
        expect(restored).toBeInstanceOf(TagCondition)
        expect(restored.getSummary()).toBe('Brak tagu: #nowy_tag')
        expect((restored as TagCondition).isNegated()).toBe(true)
        expect((restored as TagCondition).getTagName()).toBe('nowy_tag')
    })

    it('should handle TagCondition fallbacks, aliases and null fromJSON', () => {
        const nullTag = TagCondition.fromJSON(null)
        expect(nullTag.getTagName()).toBe('')
        expect(nullTag.isNegated()).toBe(false)

        const aliasTag1 = TagCondition.fromJSON({ tag: 'alias_tag', not: true })
        expect(aliasTag1.getTagName()).toBe('alias_tag')
        expect(aliasTag1.isNegated()).toBe(true)

        const aliasTag2 = TagCondition.fromJSON({ name: 'name_tag', isNegated: true })
        expect(aliasTag2.getTagName()).toBe('name_tag')
        expect(aliasTag2.isNegated()).toBe(true)

        const emptyTag = new TagCondition('', 'OnlyNameTag', '')
        expect(emptyTag.getSummary()).toBe('Posiada tag: OnlyNameTag')

        const completelyEmptyTag = new TagCondition('', '', '')
        expect(completelyEmptyTag.getSummary()).toBe('Posiada tag: Tag')
    })

    it('should serialize and deserialize polymorphic Condition.fromJSON across all types', () => {
        const nullCond = Condition.fromJSON(null)
        expect(nullCond).toBeInstanceOf(TextCondition)

        const textFromTextProp = Condition.fromJSON({ text: 'Some text requirement' })
        expect(textFromTextProp).toBeInstanceOf(TextCondition)

        const statCond = Condition.fromJSON({ type: 'stat', statName: 'Intellect', value: 10 })
        expect(statCond).toBeInstanceOf(StatCondition)

        const skillCond = Condition.fromJSON({ type: 'skill', statName: 'Lockpicking', value: 3 })
        expect(skillCond).toBeInstanceOf(StatCondition)

        const paramCond = Condition.fromJSON({ type: 'parameter', statName: 'Stamina', value: 50 })
        expect(paramCond).toBeInstanceOf(StatCondition)

        const tagCond = Condition.fromJSON({ type: 'tag', tagName: 'vip' })
        expect(tagCond).toBeInstanceOf(TagCondition)

        const itemCond = Condition.fromJSON({ type: 'item', itemName: 'Potion' })
        expect(itemCond).toBeInstanceOf(ItemCondition)

        const defaultCond = Condition.fromJSON({ type: 'unknown_type', name: 'Unknown' })
        expect(defaultCond).toBeInstanceOf(TextCondition)
    })

    it('should handle legacy condition JSON without type field — falls back to TextCondition using name as text', () => {
        const legacy = {
            id: 'legacy_1',
            name: 'Posiadanie klucza',
        }
        const parsed = Condition.fromJSON(legacy)
        expect(parsed).toBeInstanceOf(TextCondition)
        expect(parsed.getId()).toBe('legacy_1')
        expect(parsed.getSummary()).toBe('Posiadanie klucza')
        expect((parsed as TextCondition).getText()).toBe('Posiadanie klucza')
    })
})
