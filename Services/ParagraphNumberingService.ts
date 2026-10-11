/**
 * Paragraph Numbering Service.
 *
 * Manages unique, collision-free numbering for storybook paragraphs:
 * 1. Guarantees that no two paragraphs share the same number.
 * 2. Strictly respects author locked numbers (`isNumberLocked: true`).
 *    - If an author locks number 12 on paragraph A, number 12 can NEVER be randomized
 *      for any other paragraph.
 *    - If another paragraph B previously had 12 as its randomized number, paragraph B
 *      is automatically re-rolled to a new, non-reserved number.
 * 3. Assigns START node number 1 by default (unless locked differently).
 * 4. Ensures no paragraph displays 0 in tests, editor, or export.
 */

import { Paragraph } from '../Model/Paragraph'

export interface INumberingOptions {
    /** Starting number for pool (default: 1) */
    minNumber?: number
    /** Maximum number for initial pool range (default: max(count * 3, 200)) */
    maxNumber?: number
    /** Whether to enforce START paragraph as number 1 (default: true) */
    startNodeAsOne?: boolean
}

export class ParagraphNumberingService {
    /**
     * Collects all numbers explicitly locked by the author.
     *
     * @param {Paragraph[]} paragraphs
     * @returns {Set<number>} Set of locked numbers
     */
    public static getLockedNumbers(paragraphs: Paragraph[]): Set<number> {
        const locked = new Set<number>()
        for (const p of paragraphs) {
            if (p && typeof p.getIsNumberLocked === 'function' && p.getIsNumberLocked()) {
                const num = typeof p.getNumber === 'function' ? p.getNumber() : (p as any).number
                if (typeof num === 'number' && num > 0) {
                    locked.add(num)
                }
            }
        }
        return locked
    }

    /**
     * Resolves the effective presentation number for a paragraph.
     * Never returns 0.
     *
     * @param {Paragraph} p
     * @returns {number}
     */
    public static getDisplayNumber(p: Paragraph | null | undefined): number {
        if (!p) return 1

        const isLocked = typeof p.getIsNumberLocked === 'function' ? p.getIsNumberLocked() : false
        const customNum = typeof p.getNumber === 'function' ? p.getNumber() : (p as any).number || 0
        if (isLocked && customNum > 0) {
            return customNum
        }

        const isStart = typeof p.getIsStart === 'function' ? p.getIsStart() : (p as any).isStart
        const randomized =
            typeof p.getRandomizedNumber === 'function'
                ? p.getRandomizedNumber()
                : (p as any).randomizedNumber || 0

        if (isStart && !isLocked && randomized <= 0) {
            return 1
        }

        if (randomized > 0) {
            return randomized
        }

        return 1
    }

    /**
     * Ensures all paragraphs have unique numbers without any collisions.
     * If any unlocked paragraph shares a number with a locked paragraph (e.g. 12),
     * that unlocked paragraph is immediately re-rolled to a free number.
     *
     * @param {Paragraph[]} paragraphs
     * @param {INumberingOptions} [options]
     */
    public static ensureUniqueNumbers(
        paragraphs: Paragraph[],
        options: INumberingOptions = {}
    ): void {
        if (!Array.isArray(paragraphs) || paragraphs.length === 0) return

        const totalCount = paragraphs.length
        const min = options.minNumber ?? 1
        const lockedNumbers = this.getLockedNumbers(paragraphs)
        let maxLocked = 0
        for (const num of lockedNumbers) {
            if (num > maxLocked) maxLocked = num
        }
        // If options.maxNumber is provided, respect it; otherwise max is exactly the paragraph count
        // (or maxLocked if author explicitly chose a higher locked custom number).
        const targetMax = options.maxNumber ?? Math.max(totalCount, maxLocked)
        const startAsOne = options.startNodeAsOne ?? true

        const usedNumbers = new Set<number>(lockedNumbers)

        // Find START node
        const startP = paragraphs.find(
            p =>
                (typeof p.getIsStart === 'function' && p.getIsStart()) ||
                (p as any).isStart === true
        )

        // 1. Assign 1 to START node if unlocked and 1 is not locked by another paragraph
        if (startP && startAsOne) {
            const isStartLocked =
                typeof startP.getIsNumberLocked === 'function' && startP.getIsNumberLocked()
            if (!isStartLocked) {
                if (!lockedNumbers.has(1)) {
                    startP.setRandomizedNumber(1)
                    usedNumbers.add(1)
                } else if (startP.getRandomizedNumber() === 1) {
                    // Evict START from 1 since 1 was locked by another paragraph
                    startP.setRandomizedNumber(0)
                }
            }
        }

        // 2. Identify paragraphs that already have a valid, non-colliding randomized number
        const needNumber: Paragraph[] = []

        for (const p of paragraphs) {
            if (p === startP && startP.getRandomizedNumber() === 1 && !lockedNumbers.has(1)) {
                continue
            }

            const isLocked = typeof p.getIsNumberLocked === 'function' && p.getIsNumberLocked()
            const customNum =
                typeof p.getNumber === 'function' ? p.getNumber() : (p as any).number || 0

            if (isLocked && customNum > 0) {
                // Locked number is already in lockedNumbers and usedNumbers
                continue
            }

            const currentRand =
                typeof p.getRandomizedNumber === 'function'
                    ? p.getRandomizedNumber()
                    : (p as any).randomizedNumber || 0

            // If current number is 0 OR exceeds targetMax OR it collides with a locked number (e.g. 12)
            // OR it collides with another already accepted number:
            if (
                currentRand <= 0 ||
                currentRand > targetMax ||
                lockedNumbers.has(currentRand) ||
                usedNumbers.has(currentRand)
            ) {
                needNumber.push(p)
            } else {
                usedNumbers.add(currentRand)
            }
        }

        // 3. Generate candidate pool from min upwards, excluding all locked and used numbers
        const candidatePool: number[] = []
        let candidateNum = min
        while (candidatePool.length < needNumber.length) {
            if (!lockedNumbers.has(candidateNum) && !usedNumbers.has(candidateNum)) {
                candidatePool.push(candidateNum)
            }
            candidateNum++
        }

        this.shuffle(candidatePool)

        // 4. Assign unique random numbers from candidate pool
        let poolIdx = 0
        for (const p of needNumber) {
            const chosenNumber = candidatePool[poolIdx++]
            p.setRandomizedNumber(chosenNumber)
            usedNumbers.add(chosenNumber)
        }
    }

    /**
     * Reshuffles all unlocked paragraphs in the project with fresh random numbers,
     * while strictly preserving all locked numbers and keeping numbers within 1..count.
     *
     * @param {Paragraph[]} paragraphs
     * @param {INumberingOptions} [options]
     */
    public static reshuffleAllNumbers(
        paragraphs: Paragraph[],
        options: INumberingOptions = {}
    ): void {
        if (!Array.isArray(paragraphs) || paragraphs.length === 0) return

        // Clear randomized numbers for all unlocked paragraphs
        for (const p of paragraphs) {
            const isLocked = typeof p.getIsNumberLocked === 'function' && p.getIsNumberLocked()
            if (!isLocked) {
                p.setRandomizedNumber(0)
            }
        }

        this.ensureUniqueNumbers(paragraphs, options)
    }

    /**
     * Re-rolls a single paragraph's number to a new random number,
     * ensuring it does not collide with any existing numbers or locked numbers,
     * and strictly never exceeds the total paragraph count.
     * If the paragraph is itself locked, its number is preserved and not altered.
     *
     * @param {Paragraph} paragraph
     * @param {Paragraph[]} allParagraphs
     * @returns {number} The newly assigned random number
     */
    public static rerollSingleParagraph(paragraph: Paragraph, allParagraphs: Paragraph[]): number {
        if (!paragraph) return 1

        // If the paragraph is locked by author, preserve its custom number
        if (typeof paragraph.getIsNumberLocked === 'function' && paragraph.getIsNumberLocked()) {
            return this.getDisplayNumber(paragraph)
        }

        const lockedNumbers = this.getLockedNumbers(allParagraphs)
        const usedNumbers = new Set<number>(lockedNumbers)

        for (const p of allParagraphs) {
            if (p === paragraph) continue

            const isLocked = typeof p.getIsNumberLocked === 'function' && p.getIsNumberLocked()
            const customNum =
                typeof p.getNumber === 'function' ? p.getNumber() : (p as any).number || 0

            if (isLocked && customNum > 0) {
                usedNumbers.add(customNum)
            } else {
                const rand =
                    typeof p.getRandomizedNumber === 'function'
                        ? p.getRandomizedNumber()
                        : (p as any).randomizedNumber || 0
                if (rand > 0) usedNumbers.add(rand)
            }
        }

        const totalCount = allParagraphs.length
        let maxLocked = 0
        for (const num of lockedNumbers) {
            if (num > maxLocked) maxLocked = num
        }
        const targetMax = Math.max(totalCount, maxLocked)

        // 1. Check if there are free numbers <= targetMax
        const freeNumbers: number[] = []
        for (let i = 1; i <= targetMax; i++) {
            if (!lockedNumbers.has(i) && !usedNumbers.has(i)) {
                freeNumbers.push(i)
            }
        }

        if (freeNumbers.length > 0) {
            this.shuffle(freeNumbers)
            const chosen = freeNumbers[0]
            paragraph.setRandomizedNumber(chosen)
            return chosen
        }

        // 2. If all numbers in 1..targetMax are already assigned, swap with another unlocked paragraph
        // so that no number ever exceeds targetMax / totalCount
        const eligibleOthers = allParagraphs.filter(
            p =>
                p !== paragraph &&
                !(typeof p.getIsNumberLocked === 'function' && p.getIsNumberLocked()) &&
                (typeof p.getRandomizedNumber === 'function'
                    ? p.getRandomizedNumber()
                    : (p as any).randomizedNumber || 0) > 0
        )

        if (eligibleOthers.length > 0) {
            const other = eligibleOthers[Math.floor(Math.random() * eligibleOthers.length)]
            const oldThisNum =
                typeof paragraph.getRandomizedNumber === 'function'
                    ? paragraph.getRandomizedNumber()
                    : (paragraph as any).randomizedNumber || 1
            const otherNum =
                typeof other.getRandomizedNumber === 'function'
                    ? other.getRandomizedNumber()
                    : (other as any).randomizedNumber

            paragraph.setRandomizedNumber(otherNum)
            other.setRandomizedNumber(oldThisNum)
            return otherNum
        }

        return this.getDisplayNumber(paragraph)
    }

    /**
     * In-place Fisher-Yates array shuffle.
     *
     * @param {number[]} array
     */
    private static shuffle(array: number[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const temp = array[i]
            array[i] = array[j]
            array[j] = temp
        }
    }
}
