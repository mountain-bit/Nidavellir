/**
 * Drag & Drop and File Import Helpers for Assets Subsystem.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { ensureActiveProjectPath } from './assetPathResolver.js'

/**
 * Imports a dropped or selected File object directly into the active project.
 * Supports both native file system paths (via Electron webUtils) and base64 data URLs.
 *
 * @param {File} file Dropped File object from DragEvent
 * @param {object} [ctx] Application UI Context
 * @param {string} [prefix='img'] File name prefix (e.g. 'img', 'npc')
 * @returns {Promise<{ relativePath: string, fileName: string, assetUrl: string } | null>}
 */
export async function importDroppedImage(file, ctx, prefix = 'img') {
    if (!file) return null
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api) return null

    const projectPath = await ensureActiveProjectPath(ctx)

    // 1. Try to obtain native OS file path
    let filePath = ''
    if (typeof api.getPathForFile === 'function') {
        try {
            filePath = api.getPathForFile(file)
        } catch {
            // ignore
        }
    }
    if (!filePath && file.path) {
        filePath = file.path
    }

    if (filePath && typeof api.importImageFile === 'function') {
        try {
            const res = await api.importImageFile(projectPath || null, filePath, prefix)
            if (res && res.success && res.relativePath) {
                return {
                    relativePath: res.relativePath,
                    fileName: res.fileName || '',
                    assetUrl: res.assetUrl || '',
                }
            }
            if (res && res.error) {
                toast.error(res.error, t('asset.error.title'))
            }
        } catch (err) {
            console.error('Error importing dropped image file by path:', err)
            toast.error(t('asset.error.import_failed'), t('asset.error.title'))
        }
        return null
    }

    // 2. Fallback: read file content as base64 data URL
    if (typeof api.saveEditedImage === 'function') {
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            const res = await api.saveEditedImage({
                projectPath: projectPath || null,
                dataUrl,
                originalRelativePath: file.name || 'dropped-image.png',
                prefix,
            })

            if (res && res.success && res.relativePath) {
                return {
                    relativePath: res.relativePath,
                    fileName: res.fileName || '',
                    assetUrl: res.assetUrl || '',
                }
            }
            if (res && res.error) {
                toast.error(res.error, t('asset.error.title'))
            }
        } catch (err) {
            console.error('Error saving dropped image as data URL:', err)
            toast.error(t('asset.error.import_failed'), t('asset.error.title'))
        }
    }
    return null
}

/**
 * Attaches drag-and-drop listeners to an element for image files.
 *
 * @param {HTMLElement} element Target DOM element
 * @param {object} options
 * @param {string} [options.highlightClass] CSS class(es) to add when dragging over
 * @param {(file: File, event: DragEvent) => Promise<void> | void} [options.onFileDrop] Single file drop callback
 * @param {(files: File[], event: DragEvent) => Promise<void> | void} [options.onFilesDrop] Batch files drop callback
 * @param {HTMLElement} [options.overlayElement] Optional visual overlay element to unhide during dragover
 */
export function setupElementDropZone(element, options = {}) {
    if (!element || element.dataset.dropZoneInitialized === 'true') return
    element.dataset.dropZoneInitialized = 'true'

    const {
        highlightClass = 'ring-2 ring-blue-500 bg-blue-500/10',
        onFileDrop,
        onFilesDrop,
        overlayElement = null,
    } = options

    let dragCounter = 0

    const isImageDrag = e => {
        if (!e.dataTransfer) return false
        const types = Array.from(e.dataTransfer.types || [])
        return types.includes('Files')
    }

    element.addEventListener('dragenter', e => {
        if (!isImageDrag(e)) return
        e.preventDefault()
        dragCounter++
        if (highlightClass) {
            highlightClass.split(' ').forEach(cls => cls && element.classList.add(cls))
        }
        if (overlayElement) overlayElement.classList.remove('hidden')
    })

    element.addEventListener('dragover', e => {
        if (!isImageDrag(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    })

    element.addEventListener('dragleave', e => {
        if (!isImageDrag(e)) return
        e.preventDefault()
        dragCounter = Math.max(0, dragCounter - 1)
        if (dragCounter === 0) {
            if (highlightClass) {
                highlightClass.split(' ').forEach(cls => cls && element.classList.remove(cls))
            }
            if (overlayElement) overlayElement.classList.add('hidden')
        }
    })

    element.addEventListener('drop', async e => {
        if (!isImageDrag(e)) return
        e.preventDefault()
        e.stopPropagation()
        dragCounter = 0
        if (highlightClass) {
            highlightClass.split(' ').forEach(cls => cls && element.classList.remove(cls))
        }
        if (overlayElement) overlayElement.classList.add('hidden')

        const files = Array.from(e.dataTransfer.files || []).filter(
            f => f.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name)
        )

        if (files.length > 0) {
            if (typeof onFilesDrop === 'function') {
                await onFilesDrop(files, e)
            } else if (typeof onFileDrop === 'function') {
                for (const file of files) {
                    await onFileDrop(file, e)
                }
            }
        }
    })
}
