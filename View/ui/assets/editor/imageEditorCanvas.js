/**
 * Image Editor Canvas Preview Renderer.
 * Applies 2D affine transformations, CSS color filters, and renders image preview.
 */

import { buildCssFilter, normalizeRotation } from '../../../../dist/Modules/ImageEditor/index.js'
import { getImageTransformedBounds } from './imageEditorState.js'

/**
 * Renders transformed and filtered preview image onto HTML5 canvas.
 *
 * @param {HTMLCanvasElement} canvas Target preview canvas
 * @param {HTMLImageElement|null} sourceImg Loaded source image
 * @param {object} transform Transform settings { rotation, flipH, flipV }
 * @param {object} adjustments Color adjustment sliders
 * @returns {{ boundW: number, boundH: number } | null}
 */
export function renderCanvasPreview(canvas, sourceImg, transform, adjustments) {
    if (!canvas || !sourceImg) return null

    const { width: boundW, height: boundH } = getImageTransformedBounds(
        sourceImg,
        transform?.rotation || 0
    )
    if (!boundW || !boundH) return null

    canvas.width = boundW
    canvas.height = boundH

    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return null

    ctx2d.clearRect(0, 0, boundW, boundH)
    ctx2d.save()

    // Position origin at center
    ctx2d.translate(boundW / 2, boundH / 2)

    // Rotation
    const rot = normalizeRotation(transform?.rotation || 0)
    ctx2d.rotate((rot * Math.PI) / 180)

    // Flipping
    const scaleX = transform?.flipH ? -1 : 1
    const scaleY = transform?.flipV ? -1 : 1
    ctx2d.scale(scaleX, scaleY)

    // Color filters
    if (adjustments) {
        const filter = buildCssFilter(adjustments)
        if (filter !== 'none' && typeof ctx2d.filter !== 'undefined') {
            ctx2d.filter = filter
        }
    }

    ctx2d.drawImage(sourceImg, -sourceImg.naturalWidth / 2, -sourceImg.naturalHeight / 2)

    ctx2d.restore()

    return { boundW, boundH }
}
