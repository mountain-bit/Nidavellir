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

import { Paragraph } from '../../Model/Paragraph'

export interface INumberingOptions {
    /** Starting number for pool (default: 1) */
    minNumber?: number
    /** Maximum number for initial pool range (default: max(count, maxLocked)) */
    maxNumber?: number
    /** Whether to enforce START paragraph as number 1 (default: true) */
    startNodeAsOne?: boolean
}

export interface IParagraphNumberLike {
    getIsNumberLocked?: () => boolean
    isNumberLocked?: boolean
    getNumber?: () => number
    number?: number
    getRandomizedNumber?: () => number
    randomizedNumber?: number
    setRandomizedNumber?: (num: number) => void
    getIsStart?: () => boolean
    isStart?: boolean
}

export class ParagraphNumberingService {
    private static isLocked(p: Paragraph | IParagraphNumberLike | null | undefined): boolean {
        if (!p) return false
        if (typeof p.getIsNumberLocked === 'function') {
            return Boolean(p.getIsNumberLocked())
        }
        return Boolean((p as IParagraphNumberLike).isNumberLocked)
    }

    private static getCustomNumber(p: Paragraph | IParagraphNumberLike | null | undefined): number {
        if (!p) return 0
        const num =
            typeof p.getNumber === 'function' ? p.getNumber() : (p as IParagraphNumberLike).number
        return typeof num === 'number' ? num : 0
    }

    private static getRandomNumber(p: Paragraph | IParagraphNumberLike | null | undefined): number {
        if (!p) return 0
        const rand =
            typeof p.getRandomizedNumber === 'function'
                ? p.getRandomizedNumber()
                : (p as IParagraphNumberLike).randomizedNumber
        return typeof rand === 'number' ? rand : 0
    }

    private static setRandomNumber(
        p: Paragraph | IParagraphNumberLike | null | undefined,
        num: number
    ): void {
        if (!p) return
        if (typeof p.setRandomizedNumber === 'function') {
            p.setRandomizedNumber(num)
        } else {
            ;(p as IParagraphNumberLike).randomizedNumber = num
        }
    }

    private static isStart(p: Paragraph | IParagraphNumberLike | null | undefined): boolean {
        if (!p) return false
        if (typeof p.getIsStart === 'function') {
            return Boolean(p.getIsStart())
        }
        return Boolean((p as IParagraphNumberLike).isStart)
    }

    /**
     * Resolves the maximum number boundary for the paragraph pool.
     */
    private static getTargetMaxNumber(
        paragraphs: Paragraph[],
        lockedNumbers: Set<number>,
        customMax?: number
    ): number {
        let maxLocked = 0
        for (const num of lockedNumbers) {
            if (num > maxLocked) maxLocked = num
        }
        return customMax ?? Math.max(paragraphs.length, maxLocked)
    }

    /**
     * Collects all numbers explicitly locked by the author.
     *
     * @param {Paragraph[]} paragraphs
     * @returns {Set<number>} Set of locked numbers
     */
    public static getLockedNumbers(paragraphs: Paragraph[]): Set<number> {
        const locked = new Set<number>()
        for (const p of paragraphs) {
            if (this.isLocked(p)) {
                const num = this.getCustomNumber(p)
                if (num > 0) {
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

        const locked = this.isLocked(p)
        const customNum = this.getCustomNumber(p)
        if (locked && customNum > 0) {
            return customNum
        }

        const start = this.isStart(p)
        const randomized = this.getRandomNumber(p)

        if (start && !locked && randomized <= 0) {
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

        const min = options.minNumber ?? 1
        const lockedNumbers = this.getLockedNumbers(paragraphs)
        const targetMax = this.getTargetMaxNumber(paragraphs, lockedNumbers, options.maxNumber)
        const startAsOne = options.startNodeAsOne ?? true

        const usedNumbers = new Set<number>(lockedNumbers)

        // Find START node
        const startP = paragraphs.find(p => this.isStart(p))

        // 1. Assign 1 to START node if unlocked and 1 is not locked by another paragraph
        if (startP && startAsOne && !this.isLocked(startP)) {
            if (!lockedNumbers.has(1)) {
                this.setRandomNumber(startP, 1)
                usedNumbers.add(1)
            } else if (this.getRandomNumber(startP) === 1) {
                // Evict START from 1 since 1 was locked by another paragraph
                this.setRandomNumber(startP, 0)
            }
        }

        // 2. Identify paragraphs that already have a valid, non-colliding randomized number
        const needNumber: Paragraph[] = []

        for (const p of paragraphs) {
            if (p === startP && this.getRandomNumber(startP) === 1 && !lockedNumbers.has(1)) {
                continue
            }

            if (this.isLocked(p) && this.getCustomNumber(p) > 0) {
                // Locked number is already in lockedNumbers and usedNumbers
                continue
            }

            const currentRand = this.getRandomNumber(p)

            // If current number is 0 OR exceeds targetMax OR it collides with a locked/used number:
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
            this.setRandomNumber(p, chosenNumber)
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

        for (const p of paragraphs) {
            if (!this.isLocked(p)) {
                this.setRandomNumber(p, 0)
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

        if (this.isLocked(paragraph)) {
            return this.getDisplayNumber(paragraph)
        }

        const lockedNumbers = this.getLockedNumbers(allParagraphs)
        const usedNumbers = new Set<number>(lockedNumbers)

        for (const p of allParagraphs) {
            if (p === paragraph) continue

            if (this.isLocked(p)) {
                const customNum = this.getCustomNumber(p)
                if (customNum > 0) usedNumbers.add(customNum)
            } else {
                const rand = this.getRandomNumber(p)
                if (rand > 0) usedNumbers.add(rand)
            }
        }

        const targetMax = this.getTargetMaxNumber(allParagraphs, lockedNumbers)

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
            this.setRandomNumber(paragraph, chosen)
            return chosen
        }

        // 2. If all numbers in 1..targetMax are already assigned, swap with another unlocked paragraph
        // so that no number ever exceeds targetMax / totalCount
        const eligibleOthers = allParagraphs.filter(
            p => p !== paragraph && !this.isLocked(p) && this.getRandomNumber(p) > 0
        )

        if (eligibleOthers.length > 0) {
            const other = eligibleOthers[Math.floor(Math.random() * eligibleOthers.length)]
            const oldThisNum = this.getRandomNumber(paragraph) || 1
            const otherNum = this.getRandomNumber(other)

            this.setRandomNumber(paragraph, otherNum)
            this.setRandomNumber(other, oldThisNum)
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
