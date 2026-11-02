/**
 * Image processing utilities for cropping, resizing, transforming,
 * and applying color adjustments using HTML5 Canvas 2D API.
 */

export interface IImageAdjustments {
    brightness: number // Default 100 (%)
    contrast: number // Default 100 (%)
    saturation: number // Default 100 (%)
    sepia: number // Default 0 (%)
    grayscale: number // Default 0 (%)
    hueRotate: number // Default 0 (deg)
}

export interface ICropRect {
    x: number
    y: number
    width: number
    height: number
}

export interface ITransformOptions {
    rotation: number // Degrees: 0, 90, 180, 270
    flipH: boolean
    flipV: boolean
}

export interface IProcessImageOptions {
    crop?: ICropRect
    resize?: {
        width: number
        height: number
    }
    transform?: Partial<ITransformOptions>
    adjustments?: Partial<IImageAdjustments>
    mimeType?: string
    quality?: number
}

export const DEFAULT_ADJUSTMENTS: Readonly<IImageAdjustments> = Object.freeze({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
})

export const DEFAULT_TRANSFORM: Readonly<ITransformOptions> = Object.freeze({
    rotation: 0,
    flipH: false,
    flipV: false,
})

/**
 * Builds standard CSS filter string from image adjustments.
 */
export function buildCssFilter(adjustments?: Partial<IImageAdjustments>): string {
    const adj = { ...DEFAULT_ADJUSTMENTS, ...adjustments }
    const filters: string[] = []

    if (adj.brightness !== 100) filters.push(`brightness(${adj.brightness}%)`)
    if (adj.contrast !== 100) filters.push(`contrast(${adj.contrast}%)`)
    if (adj.saturation !== 100) filters.push(`saturate(${adj.saturation}%)`)
    if (adj.sepia > 0) filters.push(`sepia(${adj.sepia}%)`)
    if (adj.grayscale > 0) filters.push(`grayscale(${adj.grayscale}%)`)
    if (adj.hueRotate !== 0) filters.push(`hue-rotate(${adj.hueRotate}deg)`)

    return filters.length > 0 ? filters.join(' ') : 'none'
}

/**
 * Clamps crop rectangle inside image boundaries.
 */
export function clampCropRect(rect: ICropRect, imageWidth: number, imageHeight: number): ICropRect {
    const safeMaxX = Math.max(0, imageWidth - 1)
    const safeMaxY = Math.max(0, imageHeight - 1)
    const x = Math.max(0, Math.min(rect.x, safeMaxX))
    const y = Math.max(0, Math.min(rect.y, safeMaxY))
    const width = Math.max(1, Math.min(rect.width, imageWidth - x))
    const height = Math.max(1, Math.min(rect.height, imageHeight - y))

    return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
    }
}

/**
 * Calculates proportional target dimensions based on locked aspect ratio.
 */
export function calculateAspectDimensions(
    originalWidth: number,
    originalHeight: number,
    newDimension: { width?: number; height?: number }
): { width: number; height: number } {
    if (originalWidth <= 0 || originalHeight <= 0) {
        return {
            width: Math.max(1, newDimension.width || 1),
            height: Math.max(1, newDimension.height || 1),
        }
    }
    const ratio = originalWidth / originalHeight

    if (typeof newDimension.width === 'number' && typeof newDimension.height !== 'number') {
        const w = Math.max(1, Math.round(newDimension.width))
        return { width: w, height: Math.max(1, Math.round(w / ratio)) }
    }

    if (typeof newDimension.height === 'number' && typeof newDimension.width !== 'number') {
        const h = Math.max(1, Math.round(newDimension.height))
        return { width: Math.max(1, Math.round(h * ratio)), height: h }
    }

    return {
        width: Math.max(1, Math.round(newDimension.width || originalWidth)),
        height: Math.max(1, Math.round(newDimension.height || originalHeight)),
    }
}

/**
 * Normalizes rotation degrees to [0, 90, 180, 270].
 */
export function normalizeRotation(deg: number): number {
    if (!Number.isFinite(deg)) return 0
    const mod = ((deg % 360) + 360) % 360
    return (Math.round(mod / 90) * 90) % 360
}

/**
 * Executes full client-side image processing (transform, crop, adjustments, scale) onto an HTMLCanvasElement.
 */
export function processImageToCanvas(
    source: HTMLImageElement | HTMLCanvasElement,
    options: IProcessImageOptions = {}
): HTMLCanvasElement {
    const transform = { ...DEFAULT_TRANSFORM, ...options.transform }
    const rotation = normalizeRotation(transform.rotation)

    const isRotated90 = rotation === 90 || rotation === 270
    const sourceW = (source as HTMLImageElement).naturalWidth || source.width
    const sourceH = (source as HTMLImageElement).naturalHeight || source.height

    // 1. Stage 1: Orientation & rotation transform canvas
    const transformedCanvas = document.createElement('canvas')
    transformedCanvas.width = isRotated90 ? sourceH : sourceW
    transformedCanvas.height = isRotated90 ? sourceW : sourceH

    const tCtx = transformedCanvas.getContext('2d')
    if (!tCtx) throw new Error('Could not get 2D canvas context')

    tCtx.save()
    tCtx.translate(transformedCanvas.width / 2, transformedCanvas.height / 2)
    tCtx.rotate((rotation * Math.PI) / 180)
    tCtx.scale(transform.flipH ? -1 : 1, transform.flipV ? -1 : 1)
    tCtx.drawImage(source, -sourceW / 2, -sourceH / 2)
    tCtx.restore()

    // 2. Stage 2: Cropping
    const cropRect = options.crop
        ? clampCropRect(options.crop, transformedCanvas.width, transformedCanvas.height)
        : { x: 0, y: 0, width: transformedCanvas.width, height: transformedCanvas.height }

    // 3. Stage 3: Final Output Canvas (with optional scaling and filter adjustments)
    const outWidth = options.resize?.width
        ? Math.max(1, Math.round(options.resize.width))
        : cropRect.width
    const outHeight = options.resize?.height
        ? Math.max(1, Math.round(options.resize.height))
        : cropRect.height

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = outWidth
    outputCanvas.height = outHeight

    const outCtx = outputCanvas.getContext('2d')
    if (!outCtx) throw new Error('Could not get output 2D canvas context')

    // Apply color adjustments
    const filter = buildCssFilter(options.adjustments)
    if (filter !== 'none' && typeof outCtx.filter !== 'undefined') {
        outCtx.filter = filter
    }

    // High quality scaling
    outCtx.imageSmoothingEnabled = true
    outCtx.imageSmoothingQuality = 'high'

    outCtx.drawImage(
        transformedCanvas,
        cropRect.x,
        cropRect.y,
        cropRect.width,
        cropRect.height,
        0,
        0,
        outWidth,
        outHeight
    )

    return outputCanvas
}

/**
 * Converts processed canvas into base64 data URL string.
 */
export function canvasToDataUrl(
    canvas: HTMLCanvasElement,
    mimeType: string = 'image/png',
    quality: number = 0.92
): string {
    return canvas.toDataURL(mimeType, quality)
}

/**
 * Processes source image and returns resulting base64 data URL string.
 */
export function processImageToDataUrl(
    source: HTMLImageElement | HTMLCanvasElement,
    options: IProcessImageOptions = {}
): string {
    const canvas = processImageToCanvas(source, options)
    return canvasToDataUrl(canvas, options.mimeType, options.quality)
}
