// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import { renderCanvasPreview } from '../../View/ui/assets/editor/imageEditorCanvas.js'
import {
    calculateCropMove,
    calculateCropResize,
} from '../../View/ui/assets/editor/imageEditorCrop.js'
import { detectMimeAndQuality } from '../../View/ui/assets/editor/imageEditorSave.js'
import {
    calculateAspectCrop,
    createImageEditorState,
    getImageTransformedBounds,
    getNumericAspectRatio,
} from '../../View/ui/assets/editor/imageEditorState.js'

describe('ImageEditor Subsystem', () => {
    describe('imageEditorState', () => {
        it('creates initial default state', () => {
            const state = createImageEditorState()
            expect(state.isOpen).toBe(false)
            expect(state.sourceImg).toBeNull()
            expect(state.aspectRatioMode).toBe('free')
            expect(state.lockAspect).toBe(true)
            expect(state.crop).toEqual({ x: 0, y: 0, width: 100, height: 100 })
        })

        it('returns numeric aspect ratio correctly', () => {
            expect(getNumericAspectRatio('1:1')).toBe(1)
            expect(getNumericAspectRatio('16:9')).toBeCloseTo(16 / 9)
            expect(getNumericAspectRatio('4:3')).toBeCloseTo(4 / 3)
            expect(getNumericAspectRatio('3:2')).toBeCloseTo(3 / 2)
            expect(getNumericAspectRatio('free')).toBeNull()
            expect(getNumericAspectRatio('unknown')).toBeNull()
        })

        it('calculates transformed bounds based on rotation', () => {
            const mockImg = { naturalWidth: 800, naturalHeight: 600 } as HTMLImageElement

            const bounds0 = getImageTransformedBounds(mockImg, 0)
            expect(bounds0).toEqual({ width: 800, height: 600 })

            const bounds90 = getImageTransformedBounds(mockImg, 90)
            expect(bounds90).toEqual({ width: 600, height: 800 })

            const bounds180 = getImageTransformedBounds(mockImg, 180)
            expect(bounds180).toEqual({ width: 800, height: 600 })

            const bounds270 = getImageTransformedBounds(mockImg, 270)
            expect(bounds270).toEqual({ width: 600, height: 800 })

            expect(getImageTransformedBounds(null)).toEqual({ width: 0, height: 0 })
        })

        it('calculates aspect crop with target ratio within bounds', () => {
            const crop = { x: 50, y: 50, width: 200, height: 200 }
            const adjusted169 = calculateAspectCrop(crop, 800, 600, 16 / 9)
            expect(adjusted169.width / adjusted169.height).toBeCloseTo(16 / 9, 1)

            const clamped = calculateAspectCrop(crop, 800, 600, null)
            expect(clamped.width).toBe(200)
            expect(clamped.height).toBe(200)
        })
    })

    describe('imageEditorCrop', () => {
        it('calculates crop move within boundary clamps', () => {
            const orig = { x: 100, y: 100, width: 200, height: 200 }
            const moved = calculateCropMove(orig, 50, -30, 800, 600)
            expect(moved).toEqual({ x: 150, y: 70, width: 200, height: 200 })

            const clampedMin = calculateCropMove(orig, -200, -200, 800, 600)
            expect(clampedMin.x).toBe(0)
            expect(clampedMin.y).toBe(0)

            const clampedMax = calculateCropMove(orig, 1000, 1000, 800, 600)
            expect(clampedMax.x).toBe(600) // 800 - 200
            expect(clampedMax.y).toBe(400) // 600 - 200
        })

        it('calculates handle resizing with minimum threshold of 20px', () => {
            const orig = { x: 100, y: 100, width: 200, height: 200 }
            const resizedSE = calculateCropResize(orig, 'se', 50, 50, 800, 600, null)
            expect(resizedSE.width).toBe(250)
            expect(resizedSE.height).toBe(250)

            const tooSmall = calculateCropResize(orig, 'se', -190, -190, 800, 600, null)
            expect(tooSmall).toEqual(orig) // ignored when under 20px
        })
    })

    describe('imageEditorSave', () => {
        it('detects MIME type and compression quality from extension', () => {
            expect(detectMimeAndQuality('photo.jpg')).toEqual({
                mimeType: 'image/jpeg',
                quality: 0.92,
            })
            expect(detectMimeAndQuality('photo.jpeg')).toEqual({
                mimeType: 'image/jpeg',
                quality: 0.92,
            })
            expect(detectMimeAndQuality('banner.webp')).toEqual({
                mimeType: 'image/webp',
                quality: 0.92,
            })
            expect(detectMimeAndQuality('avatar.png')).toEqual({
                mimeType: 'image/png',
                quality: 0.95,
            })
            expect(detectMimeAndQuality('')).toEqual({ mimeType: 'image/png', quality: 0.95 })
        })
    })

    describe('imageEditorCanvas', () => {
        it('returns null if canvas or sourceImg is missing', () => {
            const canvas = document.createElement('canvas')
            expect(renderCanvasPreview(null, null, null, null)).toBeNull()
            expect(renderCanvasPreview(canvas, null, null, null)).toBeNull()
        })

        it('draws transformed preview on canvas', () => {
            const canvas = document.createElement('canvas')
            const mockCtx = {
                clearRect: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                rotate: vi.fn(),
                scale: vi.fn(),
                drawImage: vi.fn(),
                filter: 'none',
            }
            vi.spyOn(canvas, 'getContext').mockReturnValue(
                mockCtx as unknown as CanvasRenderingContext2D
            )

            const mockImg = { naturalWidth: 400, naturalHeight: 300 } as HTMLImageElement
            const result = renderCanvasPreview(
                canvas,
                mockImg,
                { rotation: 90, flipH: true, flipV: false },
                { brightness: 120, contrast: 100, saturation: 100, blur: 0, sepia: 0, invert: 0 }
            )

            expect(result).toEqual({ boundW: 300, boundH: 400 })
            expect(canvas.width).toBe(300)
            expect(canvas.height).toBe(400)
            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 300, 400)
            expect(mockCtx.translate).toHaveBeenCalledWith(150, 200)
            expect(mockCtx.rotate).toHaveBeenCalled()
            expect(mockCtx.scale).toHaveBeenCalledWith(-1, 1)
            expect(mockCtx.drawImage).toHaveBeenCalled()
            expect(mockCtx.restore).toHaveBeenCalled()
        })
    })
})
