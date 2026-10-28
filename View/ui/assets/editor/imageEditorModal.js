/**
 * Image Editor Modal Coordinator.
 * Coordinates interactive cropping, scaling, rotation, color filters,
 * live preview canvas, and project persistence.
 */

import {
    calculateAspectDimensions,
    DEFAULT_ADJUSTMENTS,
    DEFAULT_TRANSFORM,
} from '../../../../dist/Modules/ImageEditor/index.js'
import { toAssetUrl, toRelativeAssetPath } from '../../../../dist/Utils/assetUtils.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { getActiveProjectPath } from '../common/assetPathResolver.js'
import { renderCanvasPreview } from './imageEditorCanvas.js'
import { setupCropInteractions, updateCropOverlayDOM } from './imageEditorCrop.js'
import { saveEditedImageFile } from './imageEditorSave.js'
import {
    calculateAspectCrop,
    createImageEditorState,
    getImageTransformedBounds,
    getNumericAspectRatio,
} from './imageEditorState.js'

let _imageEditorInstance = null

/**
 * Returns or creates the image editor modal singleton, updating its context.
 *
 * @param {object} ctx Application UI Context
 * @returns {object}
 */
export function getImageEditorModal(ctx) {
    if (!_imageEditorInstance) {
        _imageEditorInstance = setupImageEditorModal(ctx)
    } else if (ctx && typeof _imageEditorInstance.setContext === 'function') {
        _imageEditorInstance.setContext(ctx)
    }
    return _imageEditorInstance
}

/**
 * Opens image editor modal for a given asset src.
 *
 * @param {object} ctx Application UI context
 * @param {object} options
 * @param {string} options.src Relative path or asset URL
 * @param {Function} [options.onSave] Callback called with { relativePath, assetUrl, fileName }
 */
export function openImageEditor(ctx, options) {
    const modal = getImageEditorModal(ctx)
    modal.open(options)
}

/**
 * Initializes DOM elements and controllers for the image editor modal.
 *
 * @param {object} initialCtx Application UI Context
 * @returns {{ open: (opts: object) => void, close: () => void, setContext: (ctx: object) => void }}
 */
export function setupImageEditorModal(initialCtx) {
    let currentCtx = initialCtx
    const modal = document.getElementById('image-editor-modal')
    if (!modal) return { open: () => {}, close: () => {}, setContext: () => {} }

    const closeBtn = document.getElementById('btn-close-image-editor-modal')
    const cancelBtn = document.getElementById('btn-cancel-image-editor')
    const saveCopyBtn = document.getElementById('btn-image-editor-save-copy')
    const overwriteBtn = document.getElementById('btn-image-editor-overwrite')
    const resetAllBtn = document.getElementById('btn-image-editor-reset-all')

    const canvas = document.getElementById('image-editor-canvas')
    const cropOverlay = document.getElementById('image-editor-crop-overlay')
    const viewport = document.getElementById('image-editor-viewport-container')
    const dimsInfo = document.getElementById('image-editor-dimensions-info')

    // Tabs
    const tabBtnCrop = document.getElementById('tab-btn-crop')
    const tabBtnResize = document.getElementById('tab-btn-resize')
    const tabBtnAdjust = document.getElementById('tab-btn-adjust')
    const tabContentCrop = document.getElementById('tab-content-crop')
    const tabContentResize = document.getElementById('tab-content-resize')
    const tabContentAdjust = document.getElementById('tab-content-adjust')

    // Resize inputs
    const widthInput = document.getElementById('image-resize-width')
    const heightInput = document.getElementById('image-resize-height')
    const lockAspectCheckbox = document.getElementById('image-resize-lock-aspect')

    // Sliders
    const sliders = {
        brightness: document.getElementById('adj-brightness'),
        contrast: document.getElementById('adj-contrast'),
        saturation: document.getElementById('adj-saturation'),
        sepia: document.getElementById('adj-sepia'),
        grayscale: document.getElementById('adj-grayscale'),
        hueRotate: document.getElementById('adj-hue'),
    }
    const valLabels = {
        brightness: document.getElementById('val-brightness'),
        contrast: document.getElementById('val-contrast'),
        saturation: document.getElementById('val-saturation'),
        sepia: document.getElementById('val-sepia'),
        grayscale: document.getElementById('val-grayscale'),
        hueRotate: document.getElementById('val-hue'),
    }
    const resetAdjustBtn = document.getElementById('btn-reset-adjustments')

    // State
    const state = createImageEditorState()

    // Tab switching
    const selectTab = tabId => {
        const tabs = [
            { btn: tabBtnCrop, content: tabContentCrop, id: 'crop' },
            { btn: tabBtnResize, content: tabContentResize, id: 'resize' },
            { btn: tabBtnAdjust, content: tabContentAdjust, id: 'adjust' },
        ]

        tabs.forEach(t => {
            if (t.id === tabId) {
                t.btn?.classList.add('active', 'border-amber-400', 'text-amber-300')
                t.btn?.classList.remove('border-transparent', 'text-zinc-400')
                t.content?.classList.remove('hidden')
            } else {
                t.btn?.classList.remove('active', 'border-amber-400', 'text-amber-300')
                t.btn?.classList.add('border-transparent', 'text-zinc-400')
                t.content?.classList.add('hidden')
            }
        })

        if (cropOverlay) {
            cropOverlay.style.display = tabId === 'crop' ? 'block' : 'none'
        }
    }

    tabBtnCrop?.addEventListener('click', () => selectTab('crop'))
    tabBtnResize?.addEventListener('click', () => selectTab('resize'))
    tabBtnAdjust?.addEventListener('click', () => selectTab('adjust'))

    function syncCropDOM() {
        if (!state.sourceImg || !canvas) return
        const { width: boundW, height: boundH } = getImageTransformedBounds(
            state.sourceImg,
            state.transform.rotation
        )
        updateCropOverlayDOM(cropOverlay, canvas, boundW, boundH, state.crop)
    }

    function applyAspect() {
        if (!state.sourceImg) return
        const ratio = getNumericAspectRatio(state.aspectRatioMode)
        const { width: boundW, height: boundH } = getImageTransformedBounds(
            state.sourceImg,
            state.transform.rotation
        )
        state.crop = calculateAspectCrop(state.crop, boundW, boundH, ratio)
    }

    function updateDimensionsInfo() {
        if (!dimsInfo) return
        const w = state.resize.width || state.crop.width
        const h = state.resize.height || state.crop.height
        dimsInfo.textContent = `${w} × ${h} px`
    }

    function renderPreview() {
        renderCanvasPreview(canvas, state.sourceImg, state.transform, state.adjustments)
        requestAnimationFrame(() => syncCropDOM())
        updateDimensionsInfo()
    }

    // Aspect buttons
    document.querySelectorAll('#image-editor-aspect-presets [data-aspect]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#image-editor-aspect-presets [data-aspect]').forEach(b => {
                b.classList.remove('active', 'bg-amber-500', 'text-black', 'font-semibold')
                b.classList.add('bg-[#25252b]', 'text-zinc-300')
            })
            btn.classList.add('active', 'bg-amber-500', 'text-black', 'font-semibold')
            btn.classList.remove('bg-[#25252b]', 'text-zinc-300')

            state.aspectRatioMode = btn.getAttribute('data-aspect') || 'free'
            applyAspect()
            syncCropDOM()
        })
    })

    // Reset crop to full image bounds
    function resetCropToFull() {
        if (!state.sourceImg) return
        const { width: w, height: h } = getImageTransformedBounds(
            state.sourceImg,
            state.transform.rotation
        )
        state.crop = { x: 0, y: 0, width: w, height: h }
        state.resize = { width: w, height: h }
        if (widthInput) widthInput.value = w
        if (heightInput) heightInput.value = h
        applyAspect()
        syncCropDOM()
    }

    // Transformations
    document.getElementById('btn-editor-rotate-cw')?.addEventListener('click', () => {
        state.transform.rotation = (state.transform.rotation + 90) % 360
        resetCropToFull()
        renderPreview()
    })

    document.getElementById('btn-editor-rotate-ccw')?.addEventListener('click', () => {
        state.transform.rotation = (state.transform.rotation - 90 + 360) % 360
        resetCropToFull()
        renderPreview()
    })

    document.getElementById('btn-editor-flip-h')?.addEventListener('click', () => {
        state.transform.flipH = !state.transform.flipH
        renderPreview()
    })

    document.getElementById('btn-editor-flip-v')?.addEventListener('click', () => {
        state.transform.flipV = !state.transform.flipV
        renderPreview()
    })

    // Resize inputs
    widthInput?.addEventListener('input', () => {
        const val = parseInt(widthInput.value, 10)
        if (val > 0) {
            state.resize.width = val
            if (state.lockAspect) {
                const ratio = state.crop.width / (state.crop.height || 1)
                state.resize.height = Math.max(1, Math.round(val / ratio))
                if (heightInput) heightInput.value = state.resize.height
            }
            updateDimensionsInfo()
        }
    })

    heightInput?.addEventListener('input', () => {
        const val = parseInt(heightInput.value, 10)
        if (val > 0) {
            state.resize.height = val
            if (state.lockAspect) {
                const ratio = state.crop.width / (state.crop.height || 1)
                state.resize.width = Math.max(1, Math.round(val * ratio))
                if (widthInput) widthInput.value = state.resize.width
            }
            updateDimensionsInfo()
        }
    })

    lockAspectCheckbox?.addEventListener('change', () => {
        state.lockAspect = lockAspectCheckbox.checked
    })

    // Scale presets
    document.querySelectorAll('#image-editor-scale-presets button').forEach(btn => {
        btn.addEventListener('click', () => {
            const scale = parseFloat(btn.getAttribute('data-scale') || '0')
            const fixedW = parseInt(btn.getAttribute('data-width') || '0', 10)

            if (scale > 0) {
                state.resize.width = Math.max(1, Math.round(state.crop.width * scale))
                state.resize.height = Math.max(1, Math.round(state.crop.height * scale))
            } else if (fixedW > 0) {
                state.resize = calculateAspectDimensions(state.crop.width, state.crop.height, {
                    width: fixedW,
                })
            }

            if (widthInput) widthInput.value = state.resize.width
            if (heightInput) heightInput.value = state.resize.height
            updateDimensionsInfo()
        })
    })

    // Adjustment sliders
    Object.keys(sliders).forEach(key => {
        const slider = sliders[key]
        if (!slider) return
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value)
            state.adjustments[key] = val
            if (valLabels[key]) {
                valLabels[key].textContent = key === 'hueRotate' ? `${val}°` : `${val}%`
            }
            renderPreview()
        })
    })

    resetAdjustBtn?.addEventListener('click', () => {
        state.adjustments = { ...DEFAULT_ADJUSTMENTS }
        Object.keys(sliders).forEach(k => {
            if (sliders[k]) sliders[k].value = DEFAULT_ADJUSTMENTS[k]
            if (valLabels[k]) {
                valLabels[k].textContent =
                    k === 'hueRotate' ? `${DEFAULT_ADJUSTMENTS[k]}°` : `${DEFAULT_ADJUSTMENTS[k]}%`
            }
        })
        renderPreview()
    })

    resetAllBtn?.addEventListener('click', () => {
        state.transform = { ...DEFAULT_TRANSFORM }
        state.adjustments = { ...DEFAULT_ADJUSTMENTS }
        resetAdjustBtn?.click()
        resetCropToFull()
        renderPreview()
    })

    // Setup interactive crop box without memory leaks
    setupCropInteractions({
        cropOverlay,
        canvas,
        getSourceImg: () => state.sourceImg,
        getTransform: () => state.transform,
        getCrop: () => state.crop,
        getAspectRatioMode: () => state.aspectRatioMode,
        onCropChange: nextCrop => {
            state.crop = nextCrop
            state.resize.width = nextCrop.width
            state.resize.height = nextCrop.height
            if (widthInput) widthInput.value = nextCrop.width
            if (heightInput) heightInput.value = nextCrop.height
            syncCropDOM()
            updateDimensionsInfo()
        },
    })

    // Modal Lifecycle
    const open = options => {
        const { src, onSave } = options || {}
        if (!src) return

        state.originalRelativePath = toRelativeAssetPath(src)
        state.onSaveCallback = typeof onSave === 'function' ? onSave : null
        state.transform = { ...DEFAULT_TRANSFORM }
        state.adjustments = { ...DEFAULT_ADJUSTMENTS }
        state.aspectRatioMode = 'free'
        state.lockAspect = true
        if (lockAspectCheckbox) lockAspectCheckbox.checked = true

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            state.sourceImg = img
            state.isOpen = true
            modal.classList.remove('hidden')
            selectTab('crop')
            resetCropToFull()
            renderPreview()
        }
        img.onerror = () => {
            toast.error(t('asset.error.file_not_found'), t('asset.error.title'))
        }
        img.src = toAssetUrl(src)
    }

    const close = () => {
        state.isOpen = false
        state.sourceImg = null
        state.onSaveCallback = null
        modal.classList.add('hidden')
    }

    closeBtn?.addEventListener('click', close)
    cancelBtn?.addEventListener('click', close)

    // Window resize observer to keep crop box synchronized
    const ro = new ResizeObserver(() => {
        if (state.isOpen) syncCropDOM()
    })
    if (viewport) ro.observe(viewport)

    // Save Handlers
    async function handleSave(overwrite = false) {
        if (!state.sourceImg) return
        const projectPath = getActiveProjectPath(currentCtx)
        const saveBtn = overwrite ? overwriteBtn : saveCopyBtn

        await saveEditedImageFile({
            sourceImg: state.sourceImg,
            crop: state.crop,
            resize: state.resize,
            transform: state.transform,
            adjustments: state.adjustments,
            originalRelativePath: state.originalRelativePath,
            overwrite,
            projectPath,
            saveBtn,
            onSuccess: res => {
                if (typeof state.onSaveCallback === 'function') {
                    state.onSaveCallback(res)
                }
                close()
            },
        })
    }

    saveCopyBtn?.addEventListener('click', () => handleSave(false))
    overwriteBtn?.addEventListener('click', () => handleSave(true))

    return {
        open,
        close,
        setContext: newCtx => {
            currentCtx = newCtx
        },
    }
}
