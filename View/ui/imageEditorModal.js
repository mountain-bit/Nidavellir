/**
 * Image Editor Modal Controller.
 * Provides interactive client-side cropping, scaling, rotation, and color adjustments
 * with live Canvas preview and project persistence via AssetService.
 */

import {
    buildCssFilter,
    calculateAspectDimensions,
    clampCropRect,
    DEFAULT_ADJUSTMENTS,
    DEFAULT_TRANSFORM,
    normalizeRotation,
    processImageToCanvas,
} from '../../dist/Modules/ImageEditor/index.js'
import { toAssetUrl, toRelativeAssetPath } from '../../dist/Utils/assetUtils.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { getActiveProjectPath } from './assetPicker.js'

let _imageEditorInstance = null

export function getImageEditorModal(ctx) {
    if (!_imageEditorInstance) {
        _imageEditorInstance = setupImageEditorModal(ctx)
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

export function setupImageEditorModal(ctx) {
    const modal = document.getElementById('image-editor-modal')
    if (!modal) return { open: () => {}, close: () => {} }

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
    const state = {
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

        // Crop overlay visibility
        if (cropOverlay) {
            cropOverlay.style.display = tabId === 'crop' ? 'block' : 'none'
        }
    }

    tabBtnCrop?.addEventListener('click', () => selectTab('crop'))
    tabBtnResize?.addEventListener('click', () => selectTab('resize'))
    tabBtnAdjust?.addEventListener('click', () => selectTab('adjust'))

    // Aspect buttons
    document.querySelectorAll('#image-editor-aspect-presets [data-aspect]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#image-editor-aspect-presets [data-aspect]').forEach(b => {
                b.classList.remove('active', 'bg-amber-500', 'text-black', 'font-semibold')
                b.classList.add('bg-[#25252b]', 'text-zinc-300')
            })
            btn.classList.add('active', 'bg-amber-500', 'text-black', 'font-semibold')
            btn.classList.remove('bg-[#25252b]', 'text-zinc-300')

            const aspect = btn.getAttribute('data-aspect') || 'free'
            state.aspectRatioMode = aspect
            applyAspectToCrop()
            updateCropOverlayDOM()
        })
    })

    function getNumericAspectRatio() {
        switch (state.aspectRatioMode) {
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

    function applyAspectToCrop() {
        const targetRatio = getNumericAspectRatio()
        if (!targetRatio || !state.sourceImg) return

        const currentW = state.crop.width
        let newH = Math.round(currentW / targetRatio)
        let newW = currentW

        const rot = normalizeRotation(state.transform.rotation)
        const isRot90 = rot === 90 || rot === 270
        const boundW = isRot90 ? state.sourceImg.naturalHeight : state.sourceImg.naturalWidth
        const boundH = isRot90 ? state.sourceImg.naturalWidth : state.sourceImg.naturalHeight

        if (newH > boundH) {
            newH = boundH
            newW = Math.round(newH * targetRatio)
        }
        if (newW > boundW) {
            newW = boundW
            newH = Math.round(newW / targetRatio)
        }

        state.crop.width = newW
        state.crop.height = newH
        state.crop = clampCropRect(state.crop, boundW, boundH)
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

    // Reset crop to whole transformed image
    function resetCropToFull() {
        if (!state.sourceImg) return
        const rot = normalizeRotation(state.transform.rotation)
        const isRot90 = rot === 90 || rot === 270
        const w = isRot90 ? state.sourceImg.naturalHeight : state.sourceImg.naturalWidth
        const h = isRot90 ? state.sourceImg.naturalWidth : state.sourceImg.naturalHeight

        state.crop = { x: 0, y: 0, width: w, height: h }
        state.resize = { width: w, height: h }
        if (widthInput) widthInput.value = w
        if (heightInput) heightInput.value = h
        applyAspectToCrop()
        updateCropOverlayDOM()
    }

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

    // Resize preset buttons
    document.querySelectorAll('#image-editor-scale-presets button').forEach(btn => {
        btn.addEventListener('click', () => {
            const scale = parseFloat(btn.getAttribute('data-scale') || '0')
            const fixedW = parseInt(btn.getAttribute('data-width') || '0', 10)

            if (scale > 0) {
                state.resize.width = Math.max(1, Math.round(state.crop.width * scale))
                state.resize.height = Math.max(1, Math.round(state.crop.height * scale))
            } else if (fixedW > 0) {
                const dims = calculateAspectDimensions(state.crop.width, state.crop.height, {
                    width: fixedW,
                })
                state.resize = dims
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

    // Interactive Crop Box Drag and Handle Resizing
    let dragData = null

    function setupCropInteractions() {
        if (!cropOverlay) return

        cropOverlay.addEventListener('mousedown', e => {
            const handle = e.target.getAttribute('data-handle')
            if (handle) {
                dragData = {
                    type: 'resize',
                    handle,
                    startX: e.clientX,
                    startY: e.clientY,
                    origCrop: { ...state.crop },
                }
            } else {
                dragData = {
                    type: 'move',
                    startX: e.clientX,
                    startY: e.clientY,
                    origCrop: { ...state.crop },
                }
            }
            e.preventDefault()
            e.stopPropagation()
        })

        window.addEventListener('mousemove', e => {
            if (!dragData || !state.sourceImg || !canvas) return

            const rot = normalizeRotation(state.transform.rotation)
            const isRot90 = rot === 90 || rot === 270
            const boundW = isRot90 ? state.sourceImg.naturalHeight : state.sourceImg.naturalWidth
            const boundH = isRot90 ? state.sourceImg.naturalWidth : state.sourceImg.naturalHeight

            const scale = boundW / (canvas.clientWidth || boundW)
            const deltaX = (e.clientX - dragData.startX) * scale
            const deltaY = (e.clientY - dragData.startY) * scale
            const orig = dragData.origCrop
            const ratio = getNumericAspectRatio()

            if (dragData.type === 'move') {
                const nextX = Math.round(orig.x + deltaX)
                const nextY = Math.round(orig.y + deltaY)
                state.crop.x = Math.max(0, Math.min(nextX, boundW - state.crop.width))
                state.crop.y = Math.max(0, Math.min(nextY, boundH - state.crop.height))
            } else if (dragData.type === 'resize') {
                const h = dragData.handle
                let newX = orig.x
                let newY = orig.y
                let newW = orig.width
                let newH = orig.height

                if (h.includes('e')) newW = orig.width + deltaX
                if (h.includes('s')) newH = orig.height + deltaY
                if (h.includes('w')) {
                    newW = orig.width - deltaX
                    newX = orig.x + deltaX
                }
                if (h.includes('n')) {
                    newH = orig.height - deltaY
                    newY = orig.y + deltaY
                }

                if (ratio) {
                    newH = Math.round(newW / ratio)
                }

                if (newW >= 20 && newH >= 20) {
                    state.crop.x = newX
                    state.crop.y = newY
                    state.crop.width = newW
                    state.crop.height = newH
                    state.crop = clampCropRect(state.crop, boundW, boundH)
                }
            }

            state.resize.width = state.crop.width
            state.resize.height = state.crop.height
            if (widthInput) widthInput.value = state.resize.width
            if (heightInput) heightInput.value = state.resize.height

            updateCropOverlayDOM()
            updateDimensionsInfo()
        })

        window.addEventListener('mouseup', () => {
            dragData = null
        })
    }

    setupCropInteractions()

    function updateCropOverlayDOM() {
        if (!cropOverlay || !canvas || !state.sourceImg) return

        const rot = normalizeRotation(state.transform.rotation)
        const isRot90 = rot === 90 || rot === 270
        const boundW = isRot90 ? state.sourceImg.naturalHeight : state.sourceImg.naturalWidth
        const boundH = isRot90 ? state.sourceImg.naturalWidth : state.sourceImg.naturalHeight

        const scaleX = (canvas.clientWidth || 1) / boundW
        const scaleY = (canvas.clientHeight || 1) / boundH

        const left = Math.round(state.crop.x * scaleX)
        const top = Math.round(state.crop.y * scaleY)
        const width = Math.round(state.crop.width * scaleX)
        const height = Math.round(state.crop.height * scaleY)

        cropOverlay.style.left = `${left}px`
        cropOverlay.style.top = `${top}px`
        cropOverlay.style.width = `${width}px`
        cropOverlay.style.height = `${height}px`
    }

    function renderPreview() {
        if (!canvas || !state.sourceImg) return

        const rot = normalizeRotation(state.transform.rotation)
        const isRot90 = rot === 90 || rot === 270
        const boundW = isRot90 ? state.sourceImg.naturalHeight : state.sourceImg.naturalWidth
        const boundH = isRot90 ? state.sourceImg.naturalWidth : state.sourceImg.naturalHeight

        canvas.width = boundW
        canvas.height = boundH

        const ctx2d = canvas.getContext('2d')
        if (!ctx2d) return

        ctx2d.clearRect(0, 0, boundW, boundH)
        ctx2d.save()

        // Transformations
        ctx2d.translate(boundW / 2, boundH / 2)
        ctx2d.rotate((rot * Math.PI) / 180)
        ctx2d.scale(state.transform.flipH ? -1 : 1, state.transform.flipV ? -1 : 1)

        // CSS Filter
        const filter = buildCssFilter(state.adjustments)
        if (filter !== 'none' && typeof ctx2d.filter !== 'undefined') {
            ctx2d.filter = filter
        }

        ctx2d.drawImage(
            state.sourceImg,
            -state.sourceImg.naturalWidth / 2,
            -state.sourceImg.naturalHeight / 2
        )
        ctx2d.restore()

        requestAnimationFrame(() => updateCropOverlayDOM())
        updateDimensionsInfo()
    }

    function updateDimensionsInfo() {
        if (!dimsInfo) return
        const w = state.resize.width || state.crop.width
        const h = state.resize.height || state.crop.height
        dimsInfo.textContent = `${w} × ${h} px`
    }

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
        if (state.isOpen) updateCropOverlayDOM()
    })
    if (viewport) ro.observe(viewport)

    // Save Handlers
    async function handleSave(overwrite = false) {
        if (!state.sourceImg) return

        const api = typeof window !== 'undefined' ? window.electronAPI : null
        if (!api || typeof api.saveEditedImage !== 'function') {
            toast.error('Electron IPC saveEditedImage unavailable', t('asset.error.title'))
            return
        }

        const saveBtn = overwrite ? overwriteBtn : saveCopyBtn
        const origText = saveBtn ? saveBtn.textContent : ''
        if (saveBtn) {
            saveBtn.disabled = true
            saveBtn.textContent = t('image_editor.saving') || 'Zapisywanie...'
        }

        try {
            // High-resolution processing
            const processedCanvas = processImageToCanvas(state.sourceImg, {
                crop: state.crop,
                resize: state.resize,
                transform: state.transform,
                adjustments: state.adjustments,
            })

            const origExt = (state.originalRelativePath || '').split('.').pop()?.toLowerCase() || ''
            let mimeType = 'image/png'
            let quality = 0.95
            if (origExt === 'jpg' || origExt === 'jpeg') {
                mimeType = 'image/jpeg'
                quality = 0.92
            } else if (origExt === 'webp') {
                mimeType = 'image/webp'
                quality = 0.92
            }

            const dataUrl = processedCanvas.toDataURL(mimeType, quality)
            const projectPath = getActiveProjectPath(ctx)

            const res = await api.saveEditedImage({
                projectPath: projectPath || null,
                dataUrl,
                originalRelativePath: state.originalRelativePath,
                overwrite,
                prefix: 'edited',
            })

            if (res && res.success && res.relativePath) {
                toast.success(
                    t('image_editor.success_saved') || 'Grafika została pomyślnie zapisana'
                )
                if (typeof state.onSaveCallback === 'function') {
                    state.onSaveCallback(res)
                }
                close()
            } else {
                toast.error(res?.error || t('asset.error.save_failed'), t('asset.error.title'))
            }
        } catch (err) {
            console.error('Error during image save:', err)
            toast.error(t('asset.error.save_failed'), t('asset.error.title'))
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false
                saveBtn.textContent = origText
            }
        }
    }

    saveCopyBtn?.addEventListener('click', () => handleSave(false))
    overwriteBtn?.addEventListener('click', () => handleSave(true))

    return { open, close }
}
