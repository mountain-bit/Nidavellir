import { describe, expect, it } from 'vitest'

import { Choice } from '../../Model/Choice'
import { Combat } from '../../Model/Combat'
import { TextCondition } from '../../Model/Condition'
import { Description } from '../../Model/Description'
import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'

describe('Paragraph Model', () => {
    it('initializes with correct default values', () => {
        const paragraph = new Paragraph()

        expect(paragraph.getId()).toBe('')
        expect(paragraph.hasId()).toBe(false)
        expect(paragraph.getTitle()).toBe('')
        expect(paragraph.getName()).toBe('')
        expect(paragraph.getContent()).toBeInstanceOf(Description)
        expect(paragraph.getChoices()).toEqual([])
        expect(paragraph.getHasCombat()).toBe(false)
        expect(paragraph.getCombat()).toBeInstanceOf(Combat)
        expect(paragraph.getTags()).toEqual([])
        expect(paragraph.getNumber()).toBe(0)
        expect(paragraph.getRandomizedNumber()).toBe(0)
        expect(paragraph.getIsNumberLocked()).toBe(false)
        expect(paragraph.getPosition()).toBeNull()
    })

    it('serializes to JSON with all expected English keys', () => {
        const paragraph = new Paragraph(
            'p1',
            'Crossroads',
            new Description('At the crossroads...', 'Crossroads summary'),
            [new Choice('c1', 'Go North', 'p1', 'p2')],
            false,
            new Combat('', ''),
            [new Tag('t1', 'Adventure', '#ff0000')]
        )
        paragraph.setNumber(42)
        paragraph.setRandomizedNumber(100)
        paragraph.setIsNumberLocked(true)
        paragraph.setPosition({ x: 150, y: 250 })

        const json = paragraph.toJSON()

        expect(json).toHaveProperty('id', 'p1')
        expect(json).toHaveProperty('title', 'Crossroads')
        expect(json).toHaveProperty('content')
        expect(json).toHaveProperty('choices')
        expect(json).toHaveProperty('hasCombat', false)
        expect(json).toHaveProperty('combat')
        expect(json).toHaveProperty('tags')
        expect(json).toHaveProperty('number', 42)
        expect(json).toHaveProperty('randomizedNumber', 100)
        expect(json).toHaveProperty('isNumberLocked', true)
        expect(json).toHaveProperty('position', { x: 150, y: 250 })

        // Ensure no legacy Polish keys exist
        expect(json).not.toHaveProperty('nazwa')
        expect(json).not.toHaveProperty('elementy')
        expect(json).not.toHaveProperty('jumps')
        expect(json).not.toHaveProperty('walka')
    })

    it('round-trips fromJSON -> toJSON without data loss', () => {
        const original = new Paragraph(
            'p_orig',
            'Dragon Lair',
            new Description('Smell of sulfur...', 'Lair brief'),
            [
                new Choice(
                    'c_fight',
                    'Attack the dragon',
                    'p_orig',
                    'p_combat',
                    new TextCondition('tc1', 'Sword Check', 'Requires Dragon Slayer')
                ),
            ],
            true,
            new Combat(
                'combat_1',
                'Dragon Fight',
                new Description('You slew the dragon!', 'Victory')
            ),
            [new Tag('t_boss', 'Boss Fight', '#990000')]
        )
        original.setNumber(99)
        original.setRandomizedNumber(333)
        original.setIsNumberLocked(true)
        original.setPosition({ x: 500, y: 600 })

        const json = original.toJSON()
        const restored = Paragraph.fromJSON(json)

        expect(restored.getId()).toBe('p_orig')
        expect(restored.hasId()).toBe(true)
        expect(restored.getTitle()).toBe('Dragon Lair')
        expect(restored.getContent().getText()).toBe('Smell of sulfur...')
        expect(restored.getContent().getSummary()).toBe('Lair brief')
        expect(restored.getHasCombat()).toBe(true)
        expect(restored.getCombat().getId()).toBe('combat_1')
        expect(restored.getCombat().getName()).toBe('Dragon Fight')
        expect(restored.getCombat().getVictoryDescription().getText()).toBe('You slew the dragon!')
        expect(restored.getNumber()).toBe(99)
        expect(restored.getRandomizedNumber()).toBe(333)
        expect(restored.getIsNumberLocked()).toBe(true)
        expect(restored.getPosition()).toEqual({ x: 500, y: 600 })

        // Verify tags
        expect(restored.getTags()).toHaveLength(1)
        expect(restored.getTags()[0].getId()).toBe('t_boss')
        expect(restored.getTags()[0].getName()).toBe('Boss Fight')

        // Verify nested choices
        expect(restored.getChoices()).toHaveLength(1)
        const restoredChoice = restored.getChoices()[0]
        expect(restoredChoice.getId()).toBe('c_fight')
        expect(restoredChoice.getName()).toBe('Attack the dragon')
        expect(restoredChoice.getFromParagraphId()).toBe('p_orig')
        expect(restoredChoice.getToParagraphId()).toBe('p_combat')
        expect(restoredChoice.getCondition()?.getSummary()).toBe('Requires Dragon Slayer')
    })

    it('fromJSON deserializes nested choices with conditions and auto-assigns fromParagraphId', () => {
        const rawJson = {
            id: 'p_auto',
            title: 'Tavern',
            choices: [
                {
                    id: 'c_drink',
                    name: 'Order ale',
                    toParagraphId: 'p_ale',
                    // Note: fromParagraphId is intentionally missing
                },
            ],
        }

        const paragraph = Paragraph.fromJSON(rawJson)
        expect(paragraph.getChoices()).toHaveLength(1)
        expect(paragraph.getChoices()[0].getFromParagraphId()).toBe('p_auto')
        expect(paragraph.getChoices()[0].getToParagraphId()).toBe('p_ale')
    })

    it('fromJSON with null returns empty Paragraph', () => {
        const paragraph = Paragraph.fromJSON(null)
        expect(paragraph.getId()).toBe('')
        expect(paragraph.getTitle()).toBe('')
        expect(paragraph.getChoices()).toEqual([])
    })

    it('fromJSON with undefined returns empty Paragraph', () => {
        const paragraph = Paragraph.fromJSON(undefined)
        expect(paragraph.getId()).toBe('')
        expect(paragraph.getTitle()).toBe('')
        expect(paragraph.getChoices()).toEqual([])
    })

    it('fromJSON ignores unknown fields and does not throw', () => {
        const strangeJson = {
            id: 'p_weird',
            title: 'Strange Place',
            unknownProperty: 'ignored',
            legacyExtra: 12345,
        }

        expect(() => {
            const p = Paragraph.fromJSON(strangeJson)
            expect(p.getId()).toBe('p_weird')
            expect(p.getTitle()).toBe('Strange Place')
        }).not.toThrow()
    })

    it('manages choices via addChoice, removeChoice, getChoice, and hasChoice', () => {
        const p = new Paragraph('p_test', 'Test Paragraph')
        const choice1 = new Choice('c1', 'Choice 1', '', 'p_target_1')
        const choice2 = new Choice('c2', 'Choice 2', 'p_test', 'p_target_2')

        p.addChoice(choice1)
        // addChoice should auto-assign fromParagraphId if missing
        expect(choice1.getFromParagraphId()).toBe('p_test')

        p.addChoice(choice2)
        expect(p.getChoices()).toHaveLength(2)
        expect(p.hasChoice('c1')).toBe(true)
        expect(p.hasChoice('c2')).toBe(true)
        expect(p.hasChoice('c_nonexistent')).toBe(false)

        expect(p.getChoice('c1')?.getName()).toBe('Choice 1')
        expect(p.getChoice('p_target_2')?.getId()).toBe('c2')

        p.removeChoice('c1')
        expect(p.hasChoice('c1')).toBe(false)
        expect(p.getChoices()).toHaveLength(1)
    })

    it('manages tags via addTag, removeTag, and hasTag', () => {
        const p = new Paragraph('p_tags', 'Tag Test')
        const tag1 = new Tag('t1', 'Important', '#ff0000')
        const tag2 = new Tag('t2', 'Lore', '#00ff00')

        p.addTag(tag1)
        p.addTag(tag2)
        // Adding duplicate tag should be ignored
        p.addTag(new Tag('t1', 'Important Duplicate', '#ff0000'))

        expect(p.getTags()).toHaveLength(2)
        expect(p.hasTag('t1')).toBe(true)
        expect(p.hasTag('Important')).toBe(true)
        expect(p.hasTag('Lore')).toBe(true)
        expect(p.hasTag('Missing')).toBe(false)

        p.removeTag('Important')
        expect(p.hasTag('t1')).toBe(false)
        expect(p.getTags()).toHaveLength(1)

        p.removeTag('t2')
        expect(p.hasTag('t2')).toBe(false)
        expect(p.getTags()).toHaveLength(0)
    })

    it('handles randomizeNumber with min/max and preserves existing number', () => {
        const p = new Paragraph('p_rnd', 'Random Test')
        expect(p.getRandomizedNumber()).toBe(0)

        const rnd = p.randomizeNumber(10, 20)
        expect(rnd).toBeGreaterThanOrEqual(10)
        expect(rnd).toBeLessThanOrEqual(20)
        expect(p.getRandomizedNumber()).toBe(rnd)

        // Calling again should return the already generated number
        const secondCall = p.randomizeNumber(100, 200)
        expect(secondCall).toBe(rnd)
    })
})
