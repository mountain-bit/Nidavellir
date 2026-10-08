import { describe, expect, it } from 'vitest'

import {
    buildCssFilter,
    calculateAspectDimensions,
    clampCropRect,
    DEFAULT_ADJUSTMENTS,
    normalizeRotation,
} from '../../Modules/ImageEditor/ImageProcessor'

describe('ImageProcessor', () => {
    describe('buildCssFilter', () => {
        it('returns "none" for default adjustments', () => {
            expect(buildCssFilter(DEFAULT_ADJUSTMENTS)).toBe('none')
            expect(buildCssFilter()).toBe('none')
        })

        it('builds composite filter string for modified adjustments', () => {
            const filter = buildCssFilter({
                brightness: 120,
                contrast: 90,
                saturation: 150,
                sepia: 40,
                grayscale: 20,
                hueRotate: 45,
            })

            expect(filter).toContain('brightness(120%)')
            expect(filter).toContain('contrast(90%)')
            expect(filter).toContain('saturate(150%)')
            expect(filter).toContain('sepia(40%)')
            expect(filter).toContain('grayscale(20%)')
            expect(filter).toContain('hue-rotate(45deg)')
        })
    })

    describe('clampCropRect', () => {
        it('clamps out of bounds crop coordinates', () => {
            const clamped = clampCropRect({ x: -10, y: -20, width: 600, height: 700 }, 500, 400)
            expect(clamped.x).toBe(0)
            expect(clamped.y).toBe(0)
            expect(clamped.width).toBe(500)
            expect(clamped.height).toBe(400)
        })

        it('preserves valid crop coordinates', () => {
            const clamped = clampCropRect({ x: 50, y: 60, width: 200, height: 150 }, 500, 400)
            expect(clamped).toEqual({ x: 50, y: 60, width: 200, height: 150 })
        })
    })

    describe('calculateAspectDimensions', () => {
        it('calculates height when only width is provided', () => {
            const dim = calculateAspectDimensions(1920, 1080, { width: 960 })
            expect(dim.width).toBe(960)
            expect(dim.height).toBe(540)
        })

        it('calculates width when only height is provided', () => {
            const dim = calculateAspectDimensions(1920, 1080, { height: 540 })
            expect(dim.width).toBe(960)
            expect(dim.height).toBe(540)
        })
    })

    describe('normalizeRotation', () => {
        it('normalizes degrees to 0, 90, 180, 270', () => {
            expect(normalizeRotation(0)).toBe(0)
            expect(normalizeRotation(90)).toBe(90)
            expect(normalizeRotation(180)).toBe(180)
            expect(normalizeRotation(270)).toBe(270)
            expect(normalizeRotation(360)).toBe(0)
            expect(normalizeRotation(-90)).toBe(270)
            expect(normalizeRotation(450)).toBe(90)
        })
    })
})
