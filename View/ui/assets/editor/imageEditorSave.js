/**
 * Image Editor High-Resolution Processing and IPC Persistence.
 */

import { processImageToCanvas } from '../../../../dist/Modules/ImageEditor/index.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'

/**
 * Detects MIME type and recommended compression quality based on file extension.
 *
 * @param {string} relativePath
 * @returns {{ mimeType: string, quality: number }}
 */
export function detectMimeAndQuality(relativePath = '') {
    const ext = (relativePath || '').split('.').pop()?.toLowerCase() || ''
    if (ext === 'jpg' || ext === 'jpeg') {
        return { mimeType: 'image/jpeg', quality: 0.92 }
    }
    if (ext === 'webp') {
        return { mimeType: 'image/webp', quality: 0.92 }
    }
    return { mimeType: 'image/png', quality: 0.95 }
}

/**
 * Processes image at full resolution and saves it to disk via Electron IPC.
 *
 * @param {object} options
 * @param {HTMLImageElement} options.sourceImg
 * @param {object} options.crop
 * @param {object} options.resize
 * @param {object} options.transform
 * @param {object} options.adjustments
 * @param {string} options.originalRelativePath
 * @param {boolean} [options.overwrite=false]
 * @param {string} [options.projectPath='']
 * @param {HTMLButtonElement|null} [options.saveBtn=null]
 * @param {(res: object) => void} [options.onSuccess]
 * @returns {Promise<object|null>}
 */
export async function saveEditedImageFile(options) {
    const {
        sourceImg,
        crop,
        resize,
        transform,
        adjustments,
        originalRelativePath,
        overwrite = false,
        projectPath = '',
        saveBtn = null,
        onSuccess,
    } = options

    if (!sourceImg) return null

    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api || typeof api.saveEditedImage !== 'function') {
        toast.error('Electron IPC saveEditedImage unavailable', t('asset.error.title'))
        return null
    }

    const origText = saveBtn ? saveBtn.textContent : ''
    if (saveBtn) {
        saveBtn.disabled = true
        saveBtn.textContent = t('image_editor.saving') || 'Saving...'
    }

    try {
        // High-resolution processing
        const processedCanvas = processImageToCanvas(sourceImg, {
            crop,
            resize,
            transform,
            adjustments,
        })

        const { mimeType, quality } = detectMimeAndQuality(originalRelativePath)
        const dataUrl = processedCanvas.toDataURL(mimeType, quality)

        const res = await api.saveEditedImage({
            projectPath: projectPath || null,
            dataUrl,
            originalRelativePath,
            overwrite,
            prefix: 'edited',
        })

        if (res && res.success && res.relativePath) {
            toast.success(t('image_editor.success_saved') || 'Image saved successfully')
            if (typeof onSuccess === 'function') {
                onSuccess(res)
            }
            return res
        } else {
            toast.error(res?.error || t('asset.error.save_failed'), t('asset.error.title'))
            return null
        }
    } catch (err) {
        console.error('Error during image save:', err)
        toast.error(t('asset.error.save_failed'), t('asset.error.title'))
        return null
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false
            saveBtn.textContent = origText
        }
    }
}
