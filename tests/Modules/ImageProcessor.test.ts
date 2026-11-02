// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
    buildCssFilter,
    calculateAspectDimensions,
    canvasToDataUrl,
    clampCropRect,
    DEFAULT_ADJUSTMENTS,
    normalizeRotation,
    processImageToCanvas,
    processImageToDataUrl,
} from '../../Modules/ImageEditor/ImageProcessor'

function createMock2dContext(): Record<string, unknown> {
    return {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        filter: 'none',
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
    }
}

describe('ImageProcessor', () => {
    beforeEach(() => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
            contextId: string
        ) {
            if (contextId === '2d') {
                return createMock2dContext() as unknown as CanvasRenderingContext2D
            }
            return null
        })
        vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (
            type?: string
        ) {
            return `data:${type || 'image/png'};base64,mockdata`
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

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

        it('ensures crop rectangle does not exceed bounds when x or y equals edge', () => {
            const clamped = clampCropRect({ x: 500, y: 400, width: 50, height: 50 }, 500, 400)
            expect(clamped.x + clamped.width).toBeLessThanOrEqual(500)
            expect(clamped.y + clamped.height).toBeLessThanOrEqual(400)
            expect(clamped.width).toBeGreaterThanOrEqual(1)
            expect(clamped.height).toBeGreaterThanOrEqual(1)
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

        it('preserves both dimensions when explicitly provided', () => {
            const dim = calculateAspectDimensions(1920, 1080, { width: 800, height: 600 })
            expect(dim.width).toBe(800)
            expect(dim.height).toBe(600)
        })

        it('handles non-positive original dimensions gracefully', () => {
            const dim = calculateAspectDimensions(0, 0, { width: 300, height: 200 })
            expect(dim.width).toBe(300)
            expect(dim.height).toBe(200)
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

        it('handles non-finite values safely by defaulting to 0', () => {
            expect(normalizeRotation(NaN)).toBe(0)
            expect(normalizeRotation(Infinity)).toBe(0)
            expect(normalizeRotation(-Infinity)).toBe(0)
        })
    })

    describe('processImageToCanvas', () => {
        it('processes a canvas source with default options', () => {
            const source = document.createElement('canvas')
            source.width = 200
            source.height = 100

            const result = processImageToCanvas(source)
            expect(result).toBeInstanceOf(HTMLCanvasElement)
            expect(result.width).toBe(200)
            expect(result.height).toBe(100)
        })

        it('swaps width and height when rotated 90 or 270 degrees', () => {
            const source = document.createElement('canvas')
            source.width = 200
            source.height = 100

            const res90 = processImageToCanvas(source, { transform: { rotation: 90 } })
            expect(res90.width).toBe(100)
            expect(res90.height).toBe(200)

            const res270 = processImageToCanvas(source, { transform: { rotation: 270 } })
            expect(res270.width).toBe(100)
            expect(res270.height).toBe(200)
        })

        it('applies crop coordinates', () => {
            const source = document.createElement('canvas')
            source.width = 400
            source.height = 300

            const res = processImageToCanvas(source, {
                crop: { x: 50, y: 50, width: 150, height: 100 },
            })
            expect(res.width).toBe(150)
            expect(res.height).toBe(100)
        })

        it('applies resize dimensions', () => {
            const source = document.createElement('canvas')
            source.width = 400
            source.height = 300

            const res = processImageToCanvas(source, {
                resize: { width: 200, height: 150 },
            })
            expect(res.width).toBe(200)
            expect(res.height).toBe(150)
        })

        it('prioritizes naturalWidth and naturalHeight on HTMLImageElement', () => {
            const img = document.createElement('img')
            // Mock intrinsic dimensions different from styled width
            Object.defineProperty(img, 'naturalWidth', { value: 800, configurable: true })
            Object.defineProperty(img, 'naturalHeight', { value: 600, configurable: true })
            img.width = 200
            img.height = 150

            const res = processImageToCanvas(img)
            expect(res.width).toBe(800)
            expect(res.height).toBe(600)
        })

        it('throws an error if 2D context cannot be obtained', () => {
            vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
            const source = document.createElement('canvas')
            source.width = 100
            source.height = 100

            expect(() => processImageToCanvas(source)).toThrow('Could not get 2D canvas context')
        })
    })

    describe('canvasToDataUrl and processImageToDataUrl', () => {
        it('converts canvas to data URL string', () => {
            const canvas = document.createElement('canvas')
            canvas.width = 50
            canvas.height = 50

            const dataUrl = canvasToDataUrl(canvas, 'image/png')
            expect(typeof dataUrl).toBe('string')
            expect(dataUrl.startsWith('data:image/')).toBe(true)
        })

        it('processes image and returns data URL with processImageToDataUrl', () => {
            const source = document.createElement('canvas')
            source.width = 100
            source.height = 100

            const dataUrl = processImageToDataUrl(source, {
                resize: { width: 50, height: 50 },
                mimeType: 'image/jpeg',
            })
            expect(typeof dataUrl).toBe('string')
            expect(dataUrl.startsWith('data:image/jpeg')).toBe(true)
        })
    })
})
