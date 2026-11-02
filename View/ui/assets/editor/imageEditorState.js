/**
 * Image Editor State Model and Aspect Ratio Utilities.
 */

import {
    clampCropRect,
    DEFAULT_ADJUSTMENTS,
    DEFAULT_TRANSFORM,
    normalizeRotation,
} from '../../../../dist/Modules/ImageEditor/index.js'

/**
 * Creates a fresh default image editor state object.
 *
 * @returns {object}
 */
export function createImageEditorState() {
    return {
        isOpen: false,
        sourceImg: null,
        originalRelativePath: '',
        onSaveCallback: null,
        transform: { ...DEFAULT_TRANSFORM },
        crop: { x: 0, y: 0, width: 100, height: 100 },
        isCroppingActive: true,
        aspectRatioMode: 'free', // 'free', '1:1', '16:9', '4:3', '3:2'
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        resize: { width: 0, height: 0 },
        lockAspect: true,
    }
}

/**
 * Returns numeric float aspect ratio for given mode string.
 *
 * @param {string} mode
 * @returns {number|null}
 */
export function getNumericAspectRatio(mode) {
    switch (mode) {
        case '1:1':
            return 1
        case '16:9':
            return 16 / 9
        case '4:3':
            return 4 / 3
        case '3:2':
            return 3 / 2
        default:
            return null
    }
}

/**
 * Computes bounding dimensions of an image after rotation.
 *
 * @param {HTMLImageElement|null} sourceImg
 * @param {number} [rotation=0]
 * @returns {{ width: number, height: number }}
 */
export function getImageTransformedBounds(sourceImg, rotation = 0) {
    if (!sourceImg) return { width: 0, height: 0 }
    const rot = normalizeRotation(rotation)
    const isRot90 = rot === 90 || rot === 270
    return {
        width: isRot90 ? sourceImg.naturalHeight : sourceImg.naturalWidth,
        height: isRot90 ? sourceImg.naturalWidth : sourceImg.naturalHeight,
    }
}

/**
 * Adjusts crop rectangle to match a specified aspect ratio within bounds.
 *
 * @param {object} crop Current crop { x, y, width, height }
 * @param {number} boundW Max allowed width
 * @param {number} boundH Max allowed height
 * @param {number|null} targetRatio Target aspect ratio (width / height)
 * @returns {object} Updated clamped crop rectangle
 */
export function calculateAspectCrop(crop, boundW, boundH, targetRatio) {
    if (!targetRatio || !boundW || !boundH) {
        return clampCropRect({ ...crop }, boundW, boundH)
    }

    let newW = crop.width
    let newH = Math.round(newW / targetRatio)

    if (newH > boundH) {
        newH = boundH
        newW = Math.round(newH * targetRatio)
    }
    if (newW > boundW) {
        newW = boundW
        newH = Math.round(newW / targetRatio)
    }

    return clampCropRect(
        {
            x: crop.x,
            y: crop.y,
            width: newW,
            height: newH,
        },
        boundW,
        boundH
    )
}
