/**
 * Shared renderer-side helper for importing images into the active project.
 * Single place that resolves the project path, handles file drops, and reports import errors.
 */

import { toAssetUrl } from '../../dist/Utils/assetUtils.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'

/**
 * Resolves the active project path using the same sources as the rest of the View layer.
 *
 * @param {object} [ctx] Application UI Context
 * @returns {string}
 */
export function getActiveProjectPath(ctx) {
    if (ctx) {
        if (typeof ctx.projectPath === 'string' && ctx.projectPath) return ctx.projectPath
        if (typeof ctx.getProjectPath === 'function') {
            const fromCtx = ctx.getProjectPath()
            if (fromCtx) return fromCtx
        }
        if (ctx.projectData && typeof ctx.projectData.path === 'string' && ctx.projectData.path) {
            return ctx.projectData.path
        }
    }
    if (typeof window !== 'undefined' && window.currentProjectPath) {
        return window.currentProjectPath
    }
    return ''
}

/**
 * Ensures an active project path is determined, querying main process if necessary.
 *
 * @param {object} [ctx] Application UI Context
 * @returns {Promise<string>}
 */
export async function ensureActiveProjectPath(ctx) {
    let p = getActiveProjectPath(ctx)
    if (p) return p

    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (api && typeof api.getCurrentProject === 'function') {
        try {
            const cur = await api.getCurrentProject()
            if (cur) {
                if (typeof window !== 'undefined') window.currentProjectPath = cur
                if (ctx) ctx.projectPath = cur
                return cur
            }
        } catch (err) {
            console.warn('Could not query current project path from main process:', err)
        }
    }
    return ''
}

/**
 * Directly opens the native image picker and imports the file into the project.
 *
 * @param {object} [ctx] Application UI Context
 * @param {string} [prefix='img'] File name prefix (e.g. 'img', 'npc')
 * @returns {Promise<{ relativePath: string, fileName: string, assetUrl: string } | null>}
 */
export async function importImageNative(ctx, prefix = 'img') {
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api || typeof api.importImage !== 'function') return null

    try {
        const projectPath = await ensureActiveProjectPath(ctx)
        const res = await api.importImage(projectPath || null, prefix)
        if (res && res.success && res.relativePath) {
            return {
                relativePath: res.relativePath,
                fileName: res.fileName || '',
                assetUrl: res.assetUrl || '',
            }
        }
        if (res && !res.canceled) {
            toast.error(res.error || t('asset.error.import_failed'), t('asset.error.title'))
        }
    } catch (err) {
        console.error('Error importing project image:', err)
        toast.error(t('asset.error.import_failed'), t('asset.error.title'))
    }
    return null
}

/**
 * Opens the asset picker modal displaying all available project images
 * with search and upload options.
 *
 * @param {object} [ctx] Application UI Context
 * @param {object} [options]
 * @param {string} [options.prefix='img']
 * @param {string} [options.title]
 * @param {string} [options.currentRelativePath]
 * @returns {Promise<{ relativePath: string, fileName: string, assetUrl: string } | null>}
 */
export async function openAssetPickerModal(ctx, options = {}) {
    const modal = document.getElementById('asset-picker-modal')
    if (!modal) {
        return importImageNative(ctx, options.prefix || 'img')
    }

    const {
        prefix = 'img',
        title = t('asset_picker.title') || 'Wybierz grafikę z projektu',
        currentRelativePath = '',
    } = options

    const titleEl = document.getElementById('asset-picker-title')
    if (titleEl) titleEl.textContent = title

    const closeBtn = document.getElementById('btn-close-asset-picker-modal')
    const cancelBtn = document.getElementById('btn-asset-picker-cancel')
    const selectBtn = document.getElementById('btn-asset-picker-select')
    const uploadNewBtn = document.getElementById('btn-asset-picker-upload-new')
    const searchInput = document.getElementById('asset-picker-search')
    const grid = document.getElementById('asset-picker-grid')
    const emptyState = document.getElementById('asset-picker-empty')
    const selectedLabel = document.getElementById('asset-picker-selected-label')

    if (searchInput) searchInput.value = ''
    if (selectBtn) selectBtn.disabled = true
    if (selectedLabel) selectedLabel.textContent = 'Nie wybrano grafiki'

    const projectPath = await ensureActiveProjectPath(ctx)
    let assets = []
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (api && typeof api.listImages === 'function') {
        try {
            const res = await api.listImages(projectPath || null)
            if (res && res.success && Array.isArray(res.assets)) {
                assets = res.assets
            }
        } catch (err) {
            console.error('Error listing images in asset picker:', err)
        }
    }

    let selectedAsset = null
    if (currentRelativePath) {
        selectedAsset = assets.find(a => a.relativePath === currentRelativePath) || null
    }

    return new Promise(resolve => {
        let isDone = false

        const cleanup = () => {
            modal.classList.add('hidden')
            if (closeBtn) closeBtn.onclick = null
            if (cancelBtn) cancelBtn.onclick = null
            if (selectBtn) selectBtn.onclick = null
            if (uploadNewBtn) uploadNewBtn.onclick = null
            if (searchInput) searchInput.oninput = null
            modal.onclick = null
        }

        const finish = result => {
            if (isDone) return
            isDone = true
            cleanup()
            resolve(result)
        }

        const renderGrid = () => {
            if (!grid) return
            grid.innerHTML = ''
            const q = (searchInput?.value || '').trim().toLowerCase()
            const filtered = assets.filter(a => !q || a.fileName.toLowerCase().includes(q))

            if (filtered.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden')
            } else {
                if (emptyState) emptyState.classList.add('hidden')
            }

            filtered.forEach(asset => {
                const isSel = selectedAsset && selectedAsset.relativePath === asset.relativePath
                const card = document.createElement('div')
                card.className = `group flex flex-col bg-[#202024] border ${
                    isSel ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#2d2d32]'
                } hover:border-zinc-500 rounded-lg p-2 transition-all cursor-pointer select-none overflow-hidden shadow-sm`

                const url = asset.assetUrl || toAssetUrl(asset.relativePath)
                card.innerHTML = `
                    <div class="w-full h-24 rounded bg-black/40 overflow-hidden flex items-center justify-center mb-1.5 relative">
                        <img src="${url}" alt="${asset.fileName}" loading="lazy" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                    <span class="text-xs font-medium text-zinc-200 truncate" title="${asset.fileName}">${asset.fileName}</span>
                `

                card.addEventListener('click', () => {
                    selectedAsset = asset
                    renderGrid()
                })

                card.addEventListener('dblclick', () => {
                    selectedAsset = asset
                    finish(asset)
                })

                grid.appendChild(card)
            })

            if (selectedAsset) {
                if (selectedLabel) selectedLabel.textContent = `Wybrano: ${selectedAsset.fileName}`
                if (selectBtn) selectBtn.disabled = false
            } else {
                if (selectedLabel) selectedLabel.textContent = 'Nie wybrano grafiki'
                if (selectBtn) selectBtn.disabled = true
            }
        }

        if (closeBtn) closeBtn.onclick = () => finish(null)
        if (cancelBtn) cancelBtn.onclick = () => finish(null)
        modal.onclick = e => {
            if (e.target === modal) finish(null)
        }

        if (selectBtn) {
            selectBtn.onclick = () => {
                if (selectedAsset) finish(selectedAsset)
            }
        }

        if (uploadNewBtn) {
            uploadNewBtn.onclick = async () => {
                const imported = await importImageNative(ctx, prefix)
                if (imported && imported.relativePath) {
                    finish(imported)
                }
            }
        }

        if (searchInput) {
            searchInput.oninput = () => renderGrid()
        }

        renderGrid()
        modal.classList.remove('hidden')
    })
}

/**
 * Opens the asset picker gallery with available project images and upload capability.
 *
 * @param {object} [ctx] Application UI Context
 * @param {string} [prefix='img'] File name prefix (e.g. 'img', 'npc')
 * @param {object} [options] Additional picker options
 * @returns {Promise<{ relativePath: string, fileName: string, assetUrl: string } | null>}
 */
export async function pickProjectImage(ctx, prefix = 'img', options = {}) {
    if (options && options.directNativeDialog) {
        return importImageNative(ctx, prefix)
    }
    return openAssetPickerModal(ctx, { prefix, ...options })
}

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
 * Helper to attach drag-and-drop listeners to an element for image files.
 *
 * @param {HTMLElement} element Target DOM element
 * @param {object} options
 * @param {string} [options.highlightClass] CSS class(es) to add when dragging over
 * @param {(file: File, event: DragEvent) => Promise<void> | void} options.onFileDrop Callback on file drop
 * @param {HTMLElement} [options.overlayElement] Optional visual overlay element to unhide during dragover
 */
export function setupElementDropZone(element, options = {}) {
    if (!element || element.dataset.dropZoneInitialized === 'true') return
    element.dataset.dropZoneInitialized = 'true'

    const {
        highlightClass = 'ring-2 ring-blue-500 bg-blue-500/10',
        onFileDrop,
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

        if (files.length > 0 && typeof onFileDrop === 'function') {
            for (const file of files) {
                await onFileDrop(file, e)
            }
        }
    })
}
