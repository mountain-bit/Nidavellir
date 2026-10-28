/**
 * Image Editor Crop Overlay & Interaction Controller.
 * Provides handle dragging, box moving, clamping, and event lifecycle management.
 */

import { clampCropRect } from '../../../../dist/Modules/ImageEditor/index.js'
import { getImageTransformedBounds, getNumericAspectRatio } from './imageEditorState.js'

/**
 * Calculates updated crop rectangle during move drag.
 *
 * @param {object} origCrop
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {number} boundW
 * @param {number} boundH
 * @returns {object}
 */
export function calculateCropMove(origCrop, deltaX, deltaY, boundW, boundH) {
    const nextX = Math.round(origCrop.x + deltaX)
    const nextY = Math.round(origCrop.y + deltaY)
    return {
        x: Math.max(0, Math.min(nextX, boundW - origCrop.width)),
        y: Math.max(0, Math.min(nextY, boundH - origCrop.height)),
        width: origCrop.width,
        height: origCrop.height,
    }
}

/**
 * Calculates updated crop rectangle during handle resize drag.
 *
 * @param {object} origCrop
 * @param {string} handle Handle identifier (e.g. 'se', 'nw', 'n', 'w')
 * @param {number} deltaX
 * @param {number} deltaY
 * @param {number} boundW
 * @param {number} boundH
 * @param {number|null} targetRatio Optional fixed aspect ratio
 * @returns {object}
 */
export function calculateCropResize(origCrop, handle, deltaX, deltaY, boundW, boundH, targetRatio) {
    let newX = origCrop.x
    let newY = origCrop.y
    let newW = origCrop.width
    let newH = origCrop.height

    if (handle.includes('e')) newW = origCrop.width + deltaX
    if (handle.includes('s')) newH = origCrop.height + deltaY
    if (handle.includes('w')) {
        newW = origCrop.width - deltaX
        newX = origCrop.x + deltaX
    }
    if (handle.includes('n')) {
        newH = origCrop.height - deltaY
        newY = origCrop.y + deltaY
    }

    if (targetRatio) {
        newH = Math.round(newW / targetRatio)
    }

    if (newW >= 20 && newH >= 20) {
        return clampCropRect({ x: newX, y: newY, width: newW, height: newH }, boundW, boundH)
    }

    return origCrop
}

/**
 * Synchronizes crop overlay DOM element positioning with canvas display size.
 *
 * @param {HTMLElement} cropOverlay
 * @param {HTMLCanvasElement} canvas
 * @param {number} boundW
 * @param {number} boundH
 * @param {object} crop
 */
export function updateCropOverlayDOM(cropOverlay, canvas, boundW, boundH, crop) {
    if (!cropOverlay || !canvas || !boundW || !boundH || !crop) return

    const scaleX = (canvas.clientWidth || 1) / boundW
    const scaleY = (canvas.clientHeight || 1) / boundH

    const left = Math.round(crop.x * scaleX)
    const top = Math.round(crop.y * scaleY)
    const width = Math.round(crop.width * scaleX)
    const height = Math.round(crop.height * scaleY)

    cropOverlay.style.left = `${left}px`
    cropOverlay.style.top = `${top}px`
    cropOverlay.style.width = `${width}px`
    cropOverlay.style.height = `${height}px`
}

/**
 * Sets up drag and resize interactions for the crop overlay.
 * Avoids memory leaks by attaching mousemove/mouseup listeners ONLY during drag.
 *
 * @param {object} options
 * @param {HTMLElement} options.cropOverlay
 * @param {HTMLCanvasElement} options.canvas
 * @param {() => HTMLImageElement|null} options.getSourceImg
 * @param {() => object} options.getTransform
 * @param {() => object} options.getCrop
 * @param {() => string} options.getAspectRatioMode
 * @param {(newCrop: object) => void} options.onCropChange
 * @returns {{ cleanup: () => void }}
 */
export function setupCropInteractions(options) {
    const {
        cropOverlay,
        canvas,
        getSourceImg,
        getTransform,
        getCrop,
        getAspectRatioMode,
        onCropChange,
    } = options

    if (!cropOverlay) return { cleanup: () => {} }

    let dragData = null

    const onMouseMove = e => {
        if (!dragData) return
        const sourceImg = getSourceImg()
        if (!sourceImg || !canvas) return

        const transform = getTransform()
        const { width: boundW, height: boundH } = getImageTransformedBounds(
            sourceImg,
            transform.rotation
        )
        if (!boundW || !boundH) return

        const scale = boundW / (canvas.clientWidth || boundW)
        const deltaX = (e.clientX - dragData.startX) * scale
        const deltaY = (e.clientY - dragData.startY) * scale
        const ratio = getNumericAspectRatio(getAspectRatioMode())

        let nextCrop = null
        if (dragData.type === 'move') {
            nextCrop = calculateCropMove(dragData.origCrop, deltaX, deltaY, boundW, boundH)
        } else if (dragData.type === 'resize') {
            nextCrop = calculateCropResize(
                dragData.origCrop,
                dragData.handle,
                deltaX,
                deltaY,
                boundW,
                boundH,
                ratio
            )
        }

        if (nextCrop && typeof onCropChange === 'function') {
            onCropChange(nextCrop)
        }
    }

    const onMouseUp = () => {
        dragData = null
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
    }

    const onMouseDown = e => {
        const handle = e.target.getAttribute('data-handle')
        dragData = {
            type: handle ? 'resize' : 'move',
            handle: handle || '',
            startX: e.clientX,
            startY: e.clientY,
            origCrop: { ...getCrop() },
        }
        e.preventDefault()
        e.stopPropagation()

        // Attach listeners ONLY while mouse is pressed
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    cropOverlay.addEventListener('mousedown', onMouseDown)

    const cleanup = () => {
        cropOverlay.removeEventListener('mousedown', onMouseDown)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        dragData = null
    }

    return { cleanup }
}
