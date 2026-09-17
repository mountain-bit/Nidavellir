import { describe, expect, it } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'

describe('Paragraph position persistence', () => {
    it('should have null as default position', () => {
        const p = new Paragraph('p1', 'Test Paragraph')
        expect(p.getPosition()).toBeNull()
    })

    it('should set and get position correctly', () => {
        const p = new Paragraph('p1', 'Test Paragraph')
        p.setPosition({ x: 150, y: 280 })
        expect(p.getPosition()).toEqual({ x: 150, y: 280 })
    })

    it('should serialize position to JSON', () => {
        const p = new Paragraph('p1', 'Test Paragraph')
        p.setPosition({ x: 300, y: 400 })
        const json = p.toJSON()
        expect(json.position).toEqual({ x: 300, y: 400 })
    })

    it('should deserialize position from JSON when present', () => {
        const rawJson = {
            id: 'p2',
            title: 'Sample',
            position: { x: 50, y: 120 },
        }
        const p = Paragraph.fromJSON(rawJson)
        expect(p.getPosition()).toEqual({ x: 50, y: 120 })
    })

    it('should handle missing or invalid position gracefully during fromJSON', () => {
        const jsonWithoutPos = {
            id: 'p3',
            title: 'No Pos',
        }
        const p1 = Paragraph.fromJSON(jsonWithoutPos)
        expect(p1.getPosition()).toBeNull()

        const jsonWithInvalidPos = {
            id: 'p4',
            title: 'Invalid Pos',
            position: 'not an object',
        }
        const p2 = Paragraph.fromJSON(jsonWithInvalidPos as Record<string, unknown>)
        expect(p2.getPosition()).toBeNull()
    })
})
