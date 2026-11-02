/**
 * Asset Manager Modal Coordinator.
 * Coordinates gallery grid, detail panel, upload, edit, rename, and delete actions.
 */

import {
    findAssetUsages,
    replaceAssetReferences,
} from '../../../../dist/Utils/assetUsageTracker.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { applyTranslations, t } from '../../../../dist/Utils/translate.js'
import { importDroppedImage, setupElementDropZone } from '../common/assetDropZone.js'
import { ensureActiveProjectPath } from '../common/assetPathResolver.js'
import { openImageEditor } from '../imageEditorModal.js'
import { pickProjectImage } from '../picker/assetPickerModal.js'
import { confirmDeleteAsset } from './assetDeleteDialog.js'
import { renderDetailPanel } from './assetDetailPanel.js'
import { renderManagerGrid } from './assetManagerGrid.js'
import { promptRenameAsset } from './assetRenameDialog.js'

let _activeCtx = null
let _assets = []
let _selectedAsset = null
let _isInitialized = false

/**
 * Opens the asset manager modal for current project.
 *
 * @param {object} ctx Application UI Context
 */
export async function openAssetManager(ctx) {
    _activeCtx = ctx
    const modal = document.getElementById('asset-manager-modal')
    if (!modal) return

    if (!_isInitialized) {
        setupAssetManagerEvents()
        _isInitialized = true
    }

    if (typeof applyTranslations === 'function') {
        applyTranslations()
    }
    modal.classList.remove('hidden')
    await refreshAssetList()
}

/**
 * Closes asset manager modal and clears selection.
 */
export function closeAssetManager() {
    const modal = document.getElementById('asset-manager-modal')
    if (modal) modal.classList.add('hidden')
    _selectedAsset = null
    renderDetailPanel(null, _activeCtx)
}

/**
 * Refreshes asset list from disk via IPC.
 */
export async function refreshAssetList() {
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api || typeof api.listImages !== 'function') return

    const projectPath = await ensureActiveProjectPath(_activeCtx)
    try {
        const res = await api.listImages(projectPath || null)
        if (res && res.success && Array.isArray(res.assets)) {
            _assets = res.assets
        } else {
            _assets = []
        }
    } catch (err) {
        console.error('Failed to list project assets:', err)
        _assets = []
    }

    renderFilteredGrid()
}

/**
 * Sets selected asset and updates grid highlight and detail panel.
 *
 * @param {object|null} asset
 */
export function selectAsset(asset) {
    _selectedAsset = asset
    const grid = document.getElementById('asset-manager-grid')
    if (grid) {
        const cards = grid.querySelectorAll('[data-asset-path]')
        cards.forEach(card => {
            const p = card.getAttribute('data-asset-path')
            if (asset && p === asset.relativePath) {
                card.classList.add('border-blue-500', 'ring-2', 'ring-blue-500/30')
                card.classList.remove('border-[#2d2d32]')
            } else {
                card.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500/30')
                card.classList.add('border-[#2d2d32]')
            }
        })
    }
    renderDetailPanel(asset, _activeCtx)
}

/**
 * Renders gallery grid with current search and filter values.
 */
export function renderFilteredGrid() {
    const grid = document.getElementById('asset-manager-grid')
    const emptyState = document.getElementById('asset-manager-empty')
    const countBadge = document.getElementById('asset-manager-count-badge')
    const searchInput = document.getElementById('asset-manager-search')
    const filterSelect = document.getElementById('asset-manager-filter-type')
    const sortSelect = document.getElementById('asset-manager-sort')

    const filtered = renderManagerGrid({
        grid,
        emptyState,
        countBadge,
        assets: _assets,
        query: searchInput?.value || '',
        filterType: filterSelect?.value || 'all',
        sortMode: sortSelect?.value || 'newest',
        selectedAsset: _selectedAsset,
        activeCtx: _activeCtx,
        onSelect: asset => selectAsset(asset),
    })

    if (_selectedAsset) {
        const stillPresent = filtered.find(a => a.relativePath === _selectedAsset.relativePath)
        if (stillPresent) {
            selectAsset(stillPresent)
        } else {
            selectAsset(null)
        }
    }
}

/**
 * Sets up event listeners for the asset manager modal controls.
 */
function setupAssetManagerEvents() {
    const modal = document.getElementById('asset-manager-modal')
    const closeBtn = document.getElementById('btn-close-asset-manager-modal')
    const uploadBtn = document.getElementById('btn-asset-manager-upload')
    const searchInput = document.getElementById('asset-manager-search')
    const filterSelect = document.getElementById('asset-manager-filter-type')
    const sortSelect = document.getElementById('asset-manager-sort')
    const dropzone = document.getElementById('asset-manager-dropzone')
    const dragOverlay = document.getElementById('asset-manager-drag-overlay')

    // Close
    if (closeBtn) closeBtn.onclick = () => closeAssetManager()
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeAssetManager()
        })
    }

    // Search and filters
    if (searchInput) searchInput.addEventListener('input', () => renderFilteredGrid())
    if (filterSelect) filterSelect.addEventListener('change', () => renderFilteredGrid())
    if (sortSelect) sortSelect.addEventListener('change', () => renderFilteredGrid())

    // Upload
    if (uploadBtn) {
        uploadBtn.onclick = async () => {
            const res = await pickProjectImage(_activeCtx, 'img')
            if (res && res.relativePath) {
                toast.success(
                    t('asset_manager.import_success_single', { name: res.fileName }),
                    t('asset_manager.title')
                )
                await refreshAssetList()
                const found = _assets.find(a => a.relativePath === res.relativePath)
                if (found) {
                    selectAsset(found)
                }
            }
        }
    }

    // Drag and Drop with Batch Support
    if (dropzone) {
        setupElementDropZone(dropzone, {
            overlayElement: dragOverlay,
            onFilesDrop: async files => {
                if (!files || files.length === 0) return
                let importedCount = 0
                let lastImported = null
                for (const file of files) {
                    const res = await importDroppedImage(file, _activeCtx, 'img')
                    if (res && res.relativePath) {
                        importedCount++
                        lastImported = res
                    }
                }
                if (importedCount > 0) {
                    if (importedCount === 1 && lastImported) {
                        toast.success(
                            t('asset_manager.import_success_single', {
                                name: lastImported.fileName,
                            }),
                            t('asset_manager.title')
                        )
                    } else {
                        toast.success(
                            t('asset_manager.import_success_multi', { count: importedCount }),
                            t('asset_manager.title')
                        )
                    }
                    await refreshAssetList()
                    if (lastImported) {
                        const found = _assets.find(
                            a => a.relativePath === lastImported.relativePath
                        )
                        if (found) {
                            selectAsset(found)
                        }
                    }
                }
            },
        })
    }

    // Action: Edit Image
    const editBtn = document.getElementById('btn-asset-action-edit-image')
    if (editBtn) {
        editBtn.onclick = () => {
            if (!_selectedAsset) return
            openImageEditor(_activeCtx, {
                src: _selectedAsset.relativePath,
                onSave: async () => {
                    await refreshAssetList()
                },
            })
        }
    }

    // Action: Rename Asset
    const renameBtn = document.getElementById('btn-asset-action-rename')
    if (renameBtn) {
        renameBtn.onclick = async () => {
            if (!_selectedAsset) return
            const currentName = _selectedAsset.fileName
            const newName = await promptRenameAsset(_selectedAsset)
            if (!newName || !newName.trim() || newName.trim() === currentName) return

            const api = window.electronAPI
            if (!api || typeof api.renameAsset !== 'function') return

            const projectPath = await ensureActiveProjectPath(_activeCtx)
            try {
                const res = await api.renameAsset(
                    _selectedAsset.relativePath,
                    newName.trim(),
                    projectPath || null
                )
                if (res && res.success && res.newRelativePath) {
                    // Refactor usages across project
                    const usagesCount = replaceAssetReferences(
                        _activeCtx,
                        res.oldRelativePath,
                        res.newRelativePath
                    )
                    toast.success(
                        usagesCount > 0
                            ? t('asset_manager.rename_success_usages', { count: usagesCount })
                            : t('asset_manager.rename_success'),
                        t('asset_manager.title')
                    )
                    await refreshAssetList()
                    const updated =
                        _assets.find(a => a.relativePath === res.newRelativePath) || null
                    selectAsset(updated)
                } else if (res && res.error) {
                    toast.error(
                        res.error || t('asset_manager.rename_failed'),
                        t('asset_manager.title')
                    )
                }
            } catch (err) {
                console.error('Rename asset failed:', err)
                toast.error(t('asset_manager.rename_failed'), t('asset_manager.title'))
            }
        }
    }

    // Action: Copy Markdown
    const copyMdBtn = document.getElementById('btn-asset-action-copy-markdown')
    if (copyMdBtn) {
        copyMdBtn.onclick = async () => {
            if (!_selectedAsset) return
            const mdTag = `![${_selectedAsset.fileName}](${_selectedAsset.relativePath})`
            try {
                await navigator.clipboard.writeText(mdTag)
                toast.success(t('asset_manager.copied_markdown_toast'), t('asset_manager.title'))
            } catch {
                toast.info(`Markdown: ${mdTag}`)
            }
        }
    }

    // Action: Open in Folder
    const openFolderBtn = document.getElementById('btn-asset-action-open-folder')
    if (openFolderBtn) {
        openFolderBtn.onclick = async () => {
            if (!_selectedAsset) return
            const api = window.electronAPI
            if (api && typeof api.openAssetInFolder === 'function') {
                const projectPath = await ensureActiveProjectPath(_activeCtx)
                await api.openAssetInFolder(_selectedAsset.relativePath, projectPath || null)
            }
        }
    }

    // Action: Delete Asset
    const deleteBtn = document.getElementById('btn-asset-action-delete')
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!_selectedAsset) return
            const usages = findAssetUsages(_activeCtx, _selectedAsset.relativePath)
            const confirmed = await confirmDeleteAsset(_selectedAsset, usages)
            if (!confirmed) return

            const api = window.electronAPI
            if (!api || typeof api.deleteAsset !== 'function') return

            const projectPath = await ensureActiveProjectPath(_activeCtx)
            try {
                const res = await api.deleteAsset(_selectedAsset.relativePath, projectPath || null)
                if (res && res.success) {
                    toast.success(t('asset_manager.delete_success'), t('asset_manager.title'))
                    selectAsset(null)
                    await refreshAssetList()
                } else if (res && res.error) {
                    toast.error(
                        res.error || t('asset_manager.delete_failed'),
                        t('asset_manager.title')
                    )
                }
            } catch (err) {
                console.error('Delete asset failed:', err)
                toast.error(t('asset_manager.delete_failed'), t('asset_manager.title'))
            }
        }
    }
}
