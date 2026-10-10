/**
 * Asset Manager Modal Controller.
 * Provides a gallery grid for viewing, uploading, editing, renaming,
 * checking usage references, and deleting project assets.
 */

import { findAssetUsages, replaceAssetReferences } from '../../dist/Utils/assetUsageTracker.js'
import { toAssetUrl } from '../../dist/Utils/assetUtils.js'
import { toast } from '../../dist/Utils/toast.js'
import {
    ensureActiveProjectPath,
    importDroppedImage,
    pickProjectImage,
    setupElementDropZone,
} from './assetPicker.js'
import { openImageEditor } from './imageEditorModal.js'

let _activeCtx = null
let _assets = []
let _selectedAsset = null
let _isInitialized = false

function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const formatted = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
    return `${formatted} ${units[i]}`
}

function getIconForUsageType(type) {
    switch (type) {
        case 'hero':
            return '<app-icon name="character" class="w-3.5 h-3.5 text-blue-400"></app-icon>'
        case 'npc':
            return '<app-icon name="character" class="w-3.5 h-3.5 text-amber-400"></app-icon>'
        case 'scene':
            return '<app-icon name="scene" class="w-3.5 h-3.5 text-emerald-400"></app-icon>'
        case 'item':
            return '<app-icon name="item" class="w-3.5 h-3.5 text-purple-400"></app-icon>'
        case 'location':
            return '<app-icon name="location" class="w-3.5 h-3.5 text-teal-400"></app-icon>'
        default:
            return '<app-icon name="link" class="w-3.5 h-3.5 text-zinc-400"></app-icon>'
    }
}

export async function openAssetManager(ctx) {
    _activeCtx = ctx
    const modal = document.getElementById('asset-manager-modal')
    if (!modal) return

    if (!_isInitialized) {
        setupAssetManagerEvents()
        _isInitialized = true
    }

    modal.classList.remove('hidden')
    await refreshAssetList()
}

export function closeAssetManager() {
    const modal = document.getElementById('asset-manager-modal')
    if (modal) modal.classList.add('hidden')
    _selectedAsset = null
    renderDetailPanel(null)
}

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

function renderFilteredGrid() {
    const grid = document.getElementById('asset-manager-grid')
    const emptyState = document.getElementById('asset-manager-empty')
    const countBadge = document.getElementById('asset-manager-count-badge')
    const searchInput = document.getElementById('asset-manager-search')
    const filterSelect = document.getElementById('asset-manager-filter-type')
    const sortSelect = document.getElementById('asset-manager-sort')

    if (!grid) return

    const query = (searchInput?.value || '').trim().toLowerCase()
    const filterType = filterSelect?.value || 'all'
    const sortMode = sortSelect?.value || 'newest'

    let filtered = _assets.filter(asset => {
        if (!asset || !asset.fileName) return false
        if (query && !asset.fileName.toLowerCase().includes(query)) return false
        if (filterType !== 'all') {
            const ext = (asset.extension || '').toLowerCase()
            if (filterType === 'jpg' && ext !== 'jpg' && ext !== 'jpeg') return false
            else if (filterType !== 'jpg' && ext !== filterType) return false
        }
        return true
    })

    // Sort
    filtered.sort((a, b) => {
        if (sortMode === 'newest') return (b.modifiedAt || 0) - (a.modifiedAt || 0)
        if (sortMode === 'name_asc') return a.fileName.localeCompare(b.fileName)
        if (sortMode === 'name_desc') return b.fileName.localeCompare(a.fileName)
        if (sortMode === 'size_desc') return (b.size || 0) - (a.size || 0)
        return 0
    })

    if (countBadge) {
        const totalSize = filtered.reduce((acc, curr) => acc + (curr.size || 0), 0)
        countBadge.textContent = `${filtered.length} plików (${formatFileSize(totalSize)})`
    }

    grid.innerHTML = ''

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden')
        renderDetailPanel(null)
        return
    }

    if (emptyState) emptyState.classList.add('hidden')

    filtered.forEach(asset => {
        const card = document.createElement('div')
        const isSelected = _selectedAsset && _selectedAsset.relativePath === asset.relativePath
        card.className = `group relative flex flex-col bg-[#202024] border ${
            isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#2d2d32]'
        } hover:border-zinc-500 rounded-lg p-2 transition-all cursor-pointer select-none overflow-hidden shadow-sm`

        // Usages calculation
        const usages = findAssetUsages(_activeCtx, asset.relativePath)
        const hasUsages = usages.length > 0

        const url = asset.assetUrl || toAssetUrl(asset.relativePath)

        card.innerHTML = `
            <div class="w-full h-24 rounded bg-black/40 overflow-hidden flex items-center justify-center mb-1.5 relative">
                <img src="${url}" alt="${asset.fileName}" loading="lazy" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div class="absolute top-1 right-1">
                    ${
                        hasUsages
                            ? `<span class="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm font-medium">
                                <app-icon name="check" class="w-2.5 h-2.5 text-emerald-400"></app-icon>
                                <span>${usages.length}</span>
                               </span>`
                            : `<span class="bg-zinc-900/80 text-zinc-400 border border-zinc-700/60 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm font-medium">
                                <app-icon name="link" class="w-2.5 h-2.5 text-zinc-400"></app-icon>
                                <span>0</span>
                               </span>`
                    }
                </div>
            </div>
            <div class="flex flex-col min-w-0">
                <span class="text-xs font-medium text-zinc-200 truncate" title="${asset.fileName}">${asset.fileName}</span>
                <span class="text-[10px] text-zinc-400">${formatFileSize(asset.size)}</span>
            </div>
        `

        card.addEventListener('click', () => {
            _selectedAsset = asset
            renderFilteredGrid()
            renderDetailPanel(asset)
        })

        grid.appendChild(card)
    })

    if (_selectedAsset) {
        const stillPresent = filtered.find(a => a.relativePath === _selectedAsset.relativePath)
        if (stillPresent) {
            renderDetailPanel(stillPresent)
        } else {
            _selectedAsset = null
            renderDetailPanel(null)
        }
    }
}

function renderDetailPanel(asset) {
    const placeholder = document.getElementById('asset-detail-placeholder')
    const content = document.getElementById('asset-detail-content')
    if (!placeholder || !content) return

    if (!asset) {
        placeholder.classList.remove('hidden')
        content.classList.add('hidden')
        return
    }

    placeholder.classList.add('hidden')
    content.classList.remove('hidden')

    const img = document.getElementById('asset-detail-img')
    const nameEl = document.getElementById('asset-detail-name')
    const sizeEl = document.getElementById('asset-detail-size')
    const dimsEl = document.getElementById('asset-detail-dimensions')
    const pathEl = document.getElementById('asset-detail-path')
    const usageBadge = document.getElementById('asset-detail-usage-badge')
    const usageList = document.getElementById('asset-detail-usage-list')

    const url = asset.assetUrl || toAssetUrl(asset.relativePath)
    if (img) img.src = url
    if (nameEl) {
        nameEl.textContent = asset.fileName
        nameEl.title = asset.fileName
    }
    if (sizeEl) sizeEl.textContent = formatFileSize(asset.size)
    if (pathEl) {
        pathEl.textContent = asset.relativePath
        pathEl.title = asset.relativePath
    }

    // Resolve resolution
    if (dimsEl) {
        dimsEl.textContent = '...'
        const tempImg = new Image()
        tempImg.onload = () => {
            dimsEl.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`
        }
        tempImg.onerror = () => {
            dimsEl.textContent = 'Nieznane'
        }
        tempImg.src = url
    }

    // Check usages
    const usages = findAssetUsages(_activeCtx, asset.relativePath)
    if (usageBadge) {
        usageBadge.textContent = `${usages.length} miejsc`
        usageBadge.className =
            usages.length > 0
                ? 'px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700'
    }

    if (usageList) {
        usageList.innerHTML = ''
        if (usages.length === 0) {
            usageList.innerHTML = `<span class="text-zinc-500 italic p-1 text-[11px]">Plik nie jest obecnie powiązany z żadnym elementem gry.</span>`
        } else {
            usages.forEach(u => {
                const item = document.createElement('div')
                item.className =
                    'flex items-center justify-between p-1.5 rounded bg-[#202025] border border-zinc-800 text-zinc-300 hover:border-zinc-700 transition-colors'
                item.innerHTML = `
                    <div class="flex items-center gap-1.5 min-w-0">
                        ${getIconForUsageType(u.type)}
                        <span class="truncate font-medium text-zinc-200" title="${u.name}">${u.name}</span>
                    </div>
                    <span class="text-[10px] text-zinc-400 shrink-0 ml-1">${u.field}</span>
                `
                usageList.appendChild(item)
            })
        }
    }
}

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
                toast.success(`Zaimportowano: ${res.fileName}`, 'Zasoby graficzne')
                await refreshAssetList()
                const found = _assets.find(a => a.relativePath === res.relativePath)
                if (found) {
                    _selectedAsset = found
                    renderDetailPanel(found)
                }
            }
        }
    }

    // Drag and Drop
    if (dropzone) {
        setupElementDropZone(dropzone, {
            overlayElement: dragOverlay,
            onFileDrop: async file => {
                const res = await importDroppedImage(file, _activeCtx, 'img')
                if (res && res.relativePath) {
                    toast.success(`Zaimportowano: ${res.fileName}`, 'Zasoby graficzne')
                    await refreshAssetList()
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
            const newName = prompt(
                'Wpisz nową nazwę pliku (bez rozszerzenia):',
                currentName.replace(/\.[^/.]+$/, '')
            )
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
                    // Refactor usages
                    const usagesCount = replaceAssetReferences(
                        _activeCtx,
                        res.oldRelativePath,
                        res.newRelativePath
                    )
                    toast.success(
                        usagesCount > 0
                            ? `Zmieniono nazwę na ${res.newFileName} i zaktualizowano ${usagesCount} odwołań w projekcie!`
                            : `Zmieniono nazwę na ${res.newFileName}`,
                        'Zasoby graficzne'
                    )
                    await refreshAssetList()
                    _selectedAsset =
                        _assets.find(a => a.relativePath === res.newRelativePath) || null
                    renderDetailPanel(_selectedAsset)
                } else if (res && res.error) {
                    toast.error(res.error, 'Błąd zmiany nazwy')
                }
            } catch (err) {
                console.error('Rename asset failed:', err)
                toast.error('Nie udało się zmienić nazwy pliku.', 'Błąd')
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
                toast.success('Skopiowano znacznik Markdown do schowka!', 'Schowek')
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
            let confirmMsg = `Czy na pewno chcesz usunąć plik "${_selectedAsset.fileName}"?`
            if (usages.length > 0) {
                confirmMsg = `UWAGA: Plik jest obecnie używany w ${usages.length} miejscach projektu (${usages.map(u => u.name).join(', ')})!\nUsunięcie spowoduje brakujące grafiki w grze.\n\nCzy na pewno chcesz usunąć?`
            }

            if (!confirm(confirmMsg)) return

            const api = window.electronAPI
            if (!api || typeof api.deleteAsset !== 'function') return

            const projectPath = await ensureActiveProjectPath(_activeCtx)
            try {
                const res = await api.deleteAsset(_selectedAsset.relativePath, projectPath || null)
                if (res && res.success) {
                    toast.success(`Usunięto plik: ${_selectedAsset.fileName}`, 'Zasoby graficzne')
                    _selectedAsset = null
                    renderDetailPanel(null)
                    await refreshAssetList()
                } else if (res && res.error) {
                    toast.error(res.error, 'Błąd usuwania')
                }
            } catch (err) {
                console.error('Delete asset failed:', err)
                toast.error('Nie udało się usunąć pliku.', 'Błąd')
            }
        }
    }
}
