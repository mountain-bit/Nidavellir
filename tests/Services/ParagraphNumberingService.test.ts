import { describe, expect, it } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { ParagraphNumberingService } from '../../Services/graph/ParagraphNumberingService'

describe('ParagraphNumberingService', () => {
    it('never assigns locked number 12 to any other paragraph', () => {
        const p1Locked = new Paragraph('p1', 'Paragraf Zablokowany')
        p1Locked.setIsNumberLocked(true)
        p1Locked.setNumber(12)

        const p2 = new Paragraph('p2', 'Paragraf Losowy A')
        const p3 = new Paragraph('p3', 'Paragraf Losowy B')
        const p4 = new Paragraph('p4', 'Paragraf Losowy C')
        const paragraphs = [p1Locked, p2, p3, p4]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        expect(ParagraphNumberingService.getDisplayNumber(p1Locked)).toBe(12)
        expect(p1Locked.getNumber()).toBe(12)

        // Paragraphs p2, p3, p4 must NEVER have number 12
        expect(ParagraphNumberingService.getDisplayNumber(p2)).not.toBe(12)
        expect(ParagraphNumberingService.getDisplayNumber(p3)).not.toBe(12)
        expect(ParagraphNumberingService.getDisplayNumber(p4)).not.toBe(12)

        // All numbers must be distinct
        const numbers = paragraphs.map(p => ParagraphNumberingService.getDisplayNumber(p))
        const uniqueSet = new Set(numbers)
        expect(uniqueSet.size).toBe(paragraphs.length)
        expect(uniqueSet.has(0)).toBe(false)
    })

    it('re-rolls an unlocked paragraph if it previously had a newly locked number', () => {
        const p1 = new Paragraph('p1', 'Paragraf A')
        p1.setRandomizedNumber(12)

        const p2 = new Paragraph('p2', 'Paragraf B')
        p2.setIsNumberLocked(true)
        p2.setNumber(12) // User locks 12 on p2!

        const paragraphs = [p1, p2]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        expect(ParagraphNumberingService.getDisplayNumber(p2)).toBe(12)
        // p1 must have been bumped/re-rolled away from 12!
        expect(ParagraphNumberingService.getDisplayNumber(p1)).not.toBe(12)
        expect(ParagraphNumberingService.getDisplayNumber(p1)).toBeGreaterThan(0)
    })

    it('assigns 1 to START paragraph if not locked differently', () => {
        const startP = new Paragraph('start', 'Początek gry')
        startP.setIsStart(true)

        const p2 = new Paragraph('p2', 'Rozstaje')
        const paragraphs = [startP, p2]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        expect(ParagraphNumberingService.getDisplayNumber(startP)).toBe(1)
        expect(ParagraphNumberingService.getDisplayNumber(p2)).not.toBe(1)
        expect(ParagraphNumberingService.getDisplayNumber(p2)).toBeGreaterThan(1)
    })

    it('never leaves any paragraph with number 0', () => {
        const p1 = new Paragraph('p1', 'Wstęp')
        const p2 = new Paragraph('p2', 'Las')
        const p3 = new Paragraph('p3', 'Koniec')
        const paragraphs = [p1, p2, p3]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        paragraphs.forEach(p => {
            expect(ParagraphNumberingService.getDisplayNumber(p)).toBeGreaterThan(0)
            expect(p.getDisplayNumber()).toBeGreaterThan(0)
        })
    })

    it('reshuffleAllNumbers preserves locked numbers and regenerates others', () => {
        const p1Locked = new Paragraph('p1', 'Zamek')
        p1Locked.setIsNumberLocked(true)
        p1Locked.setNumber(42)

        const p2 = new Paragraph('p2', 'Ścieżka')
        const p3 = new Paragraph('p3', 'Rzeka')
        const paragraphs = [p1Locked, p2, p3]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        // Reshuffle with range
        ParagraphNumberingService.reshuffleAllNumbers(paragraphs, { minNumber: 50, maxNumber: 100 })

        expect(ParagraphNumberingService.getDisplayNumber(p1Locked)).toBe(42)
        expect(ParagraphNumberingService.getDisplayNumber(p2)).toBeGreaterThanOrEqual(50)
        expect(ParagraphNumberingService.getDisplayNumber(p3)).toBeGreaterThanOrEqual(50)
        expect(ParagraphNumberingService.getDisplayNumber(p2)).not.toBe(42)
        expect(ParagraphNumberingService.getDisplayNumber(p3)).not.toBe(42)
    })

    it('rerollSingleParagraph picks an unassigned, non-locked number', () => {
        const p1Locked = new Paragraph('p1', 'Zablokowany 12')
        p1Locked.setIsNumberLocked(true)
        p1Locked.setNumber(12)

        const p2 = new Paragraph('p2', 'Drugi paragraf')
        p2.setRandomizedNumber(5)

        const p3 = new Paragraph('p3', 'Do wylosowania')
        const paragraphs = [p1Locked, p2, p3]

        const newRoll = ParagraphNumberingService.rerollSingleParagraph(p3, paragraphs)

        expect(newRoll).not.toBe(12)
        expect(newRoll).not.toBe(5)
        expect(newRoll).toBeGreaterThan(0)
        expect(p3.getRandomizedNumber()).toBe(newRoll)
    })

    it('guarantees that 100 consecutive rerolls never pick locked number 12', () => {
        const p1Locked = new Paragraph('p1', 'Zablokowany 12')
        p1Locked.setIsNumberLocked(true)
        p1Locked.setNumber(12)

        const p2 = new Paragraph('p2', 'Losowy')
        const paragraphs = [p1Locked, p2]

        for (let i = 0; i < 100; i++) {
            const rolled = ParagraphNumberingService.rerollSingleParagraph(p2, paragraphs)
            expect(rolled).not.toBe(12)
            expect(ParagraphNumberingService.getDisplayNumber(p2)).not.toBe(12)
        }
    })

    it('does not alter number of locked paragraph when reroll is called on it', () => {
        const pLocked = new Paragraph('pLocked', 'Zablokowany na sztywno')
        pLocked.setIsNumberLocked(true)
        pLocked.setNumber(12)

        const pOther = new Paragraph('pOther', 'Inny')
        const paragraphs = [pLocked, pOther]

        const result = ParagraphNumberingService.rerollSingleParagraph(pLocked, paragraphs)
        expect(result).toBe(12)
        expect(pLocked.getNumber()).toBe(12)
        expect(ParagraphNumberingService.getDisplayNumber(pLocked)).toBe(12)
    })

    it('evicts START from 1 if another paragraph is locked with 1', () => {
        const pLocked = new Paragraph('pLocked', 'Specjalny paragraf 1')
        pLocked.setIsNumberLocked(true)
        pLocked.setNumber(1)

        const startP = new Paragraph('start', 'Początek')
        startP.setIsStart(true)
        startP.setRandomizedNumber(1)

        const p3 = new Paragraph('p3', 'Kolejny')
        const paragraphs = [pLocked, startP, p3]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        expect(ParagraphNumberingService.getDisplayNumber(pLocked)).toBe(1)
        expect(ParagraphNumberingService.getDisplayNumber(startP)).not.toBe(1)
        expect(ParagraphNumberingService.getDisplayNumber(startP)).toBeGreaterThan(1)
        expect(ParagraphNumberingService.getDisplayNumber(p3)).not.toBe(1)
    })

    it('respects multiple locked numbers simultaneously', () => {
        const p1 = new Paragraph('p1', 'Zablokowany 12')
        p1.setIsNumberLocked(true)
        p1.setNumber(12)

        const p2 = new Paragraph('p2', 'Zablokowany 24')
        p2.setIsNumberLocked(true)
        p2.setNumber(24)

        const p3 = new Paragraph('p3', 'Zablokowany 99')
        p3.setIsNumberLocked(true)
        p3.setNumber(99)

        const u1 = new Paragraph('u1', 'Losowy 1')
        const u2 = new Paragraph('u2', 'Losowy 2')
        const paragraphs = [p1, p2, p3, u1, u2]

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        const lockedSet = new Set([12, 24, 99])
        expect(lockedSet.has(ParagraphNumberingService.getDisplayNumber(u1))).toBe(false)
        expect(lockedSet.has(ParagraphNumberingService.getDisplayNumber(u2))).toBe(false)
        expect(ParagraphNumberingService.getDisplayNumber(u1)).not.toBe(
            ParagraphNumberingService.getDisplayNumber(u2)
        )
    })

    it('ensures that 1000 paragraphs have exactly numbers 1 to 1000 with none greater than 1000', () => {
        const count = 1000
        const paragraphs: Paragraph[] = []
        for (let i = 0; i < count; i++) {
            const p = new Paragraph(`p_${i}`, `Paragraf ${i + 1}`)
            if (i === 0) p.setIsStart(true)
            paragraphs.push(p)
        }

        // Lock paragraph 12 as requested
        paragraphs[11].setIsNumberLocked(true)
        paragraphs[11].setNumber(12)

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        const numbers = paragraphs.map(p => ParagraphNumberingService.getDisplayNumber(p))
        const maxNum = Math.max(...numbers)
        const minNum = Math.min(...numbers)
        const uniqueSet = new Set(numbers)

        // Strict validation: exactly 1000 distinct numbers, min = 1, max = 1000!
        expect(uniqueSet.size).toBe(1000)
        expect(minNum).toBe(1)
        expect(maxNum).toBe(1000)
        expect(ParagraphNumberingService.getDisplayNumber(paragraphs[11])).toBe(12)

        // No other paragraph can have 12
        for (let i = 0; i < count; i++) {
            if (i !== 11) {
                expect(ParagraphNumberingService.getDisplayNumber(paragraphs[i])).not.toBe(12)
            }
            expect(numbers[i]).toBeLessThanOrEqual(1000)
            expect(numbers[i]).toBeGreaterThanOrEqual(1)
        }
    })

    it('guarantees reroll in a fully populated project never produces a number greater than paragraph count', () => {
        const count = 50
        const paragraphs: Paragraph[] = []
        for (let i = 0; i < count; i++) {
            const p = new Paragraph(`p_${i}`, `Paragraf ${i + 1}`)
            if (i === 0) p.setIsStart(true)
            paragraphs.push(p)
        }

        paragraphs[11].setIsNumberLocked(true)
        paragraphs[11].setNumber(12)

        ParagraphNumberingService.ensureUniqueNumbers(paragraphs)

        // Reroll multiple times on unlocked paragraph
        const targetP = paragraphs[25] // paragraph 26
        for (let r = 0; r < 20; r++) {
            const newNum = ParagraphNumberingService.rerollSingleParagraph(targetP, paragraphs)
            expect(newNum).toBeLessThanOrEqual(50)
            expect(newNum).toBeGreaterThanOrEqual(1)
            expect(newNum).not.toBe(12) // never locked 12
        }

        // All numbers in the project must still be strictly 1..50 and unique
        const currentNumbers = paragraphs.map(p => ParagraphNumberingService.getDisplayNumber(p))
        expect(new Set(currentNumbers).size).toBe(50)
        expect(Math.max(...currentNumbers)).toBe(50)
    })
})
