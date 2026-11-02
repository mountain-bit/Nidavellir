/**
 * Asset Picker Modal Controller.
 * Handles opening the picker dialog, image listing via IPC, selection,
 * search input filtering, and native file import triggers.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { ensureActiveProjectPath } from '../common/assetPathResolver.js'
import { renderPickerGrid } from './assetPickerGrid.js'

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
        title = t('asset_picker.title') || 'Select Project Image',
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
    if (selectedLabel) {
        selectedLabel.textContent = t('asset_picker.none_selected') || 'No image selected'
    }

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

        const updateSelectionUI = () => {
            if (selectedAsset) {
                if (selectedLabel) {
                    selectedLabel.textContent =
                        t('asset_picker.selected_label', {
                            name: selectedAsset.fileName,
                        }) || `Selected: ${selectedAsset.fileName}`
                }
                if (selectBtn) selectBtn.disabled = false
            } else {
                if (selectedLabel) {
                    selectedLabel.textContent =
                        t('asset_picker.none_selected') || 'No image selected'
                }
                if (selectBtn) selectBtn.disabled = true
            }
        }

        const render = () => {
            renderPickerGrid({
                grid,
                emptyState,
                assets,
                query: searchInput?.value || '',
                selectedAsset,
                onSelect: asset => {
                    selectedAsset = asset
                    updateSelectionUI()
                    render()
                },
                onConfirm: asset => {
                    selectedAsset = asset
                    finish(asset)
                },
            })
            updateSelectionUI()
        }

        const onKeyDown = e => {
            if (e.key === 'Escape') {
                e.preventDefault()
                finish(null)
            }
        }

        const cleanup = () => {
            modal.classList.add('hidden')
            window.removeEventListener('keydown', onKeyDown)
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

        if (closeBtn) closeBtn.onclick = () => finish(null)
        if (cancelBtn) cancelBtn.onclick = () => finish(null)
        modal.onclick = e => {
            if (e.target === modal) finish(null)
        }

        window.addEventListener('keydown', onKeyDown)

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
            searchInput.oninput = () => render()
        }

        render()
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
