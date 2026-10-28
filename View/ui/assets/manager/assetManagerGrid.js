/**
 * Asset Manager Grid Renderer, Filter, and Sorter.
 */

import { findAssetUsages } from '../../../../dist/Utils/assetUsageTracker.js'
import { t } from '../../../../dist/Utils/translate.js'
import { createAssetCardElement, formatFileSize } from '../common/assetCardTemplate.js'

/**
 * Filters and sorts assets array based on search query, extension filter, and sort mode.
 *
 * @param {Array<object>} assets Full assets list
 * @param {object} [options]
 * @param {string} [options.query=''] File name search query
 * @param {string} [options.filterType='all'] Format filter ('all', 'jpg', 'png', etc.)
 * @param {string} [options.sortMode='newest'] Sorting mode ('newest', 'name_asc', 'name_desc', 'size_desc')
 * @returns {Array<object>} Filtered and sorted assets array
 */
export function filterAndSortAssets(assets, options = {}) {
    if (!Array.isArray(assets)) return []

    const { query = '', filterType = 'all', sortMode = 'newest' } = options
    const q = (query || '').trim().toLowerCase()

    let filtered = assets.filter(asset => {
        if (!asset || !asset.fileName) return false
        if (q && !asset.fileName.toLowerCase().includes(q)) return false
        if (filterType !== 'all') {
            const ext = (asset.extension || '').toLowerCase()
            if (filterType === 'jpg' && ext !== 'jpg' && ext !== 'jpeg') return false
            else if (filterType !== 'jpg' && ext !== filterType) return false
        }
        return true
    })

    filtered.sort((a, b) => {
        if (sortMode === 'newest') return (b.modifiedAt || 0) - (a.modifiedAt || 0)
        if (sortMode === 'name_asc') return a.fileName.localeCompare(b.fileName)
        if (sortMode === 'name_desc') return b.fileName.localeCompare(a.fileName)
        if (sortMode === 'size_desc') return (b.size || 0) - (a.size || 0)
        return 0
    })

    return filtered
}

/**
 * Calculates total byte size of an asset array.
 *
 * @param {Array<object>} assets
 * @returns {number}
 */
export function calculateTotalSize(assets) {
    if (!Array.isArray(assets)) return 0
    return assets.reduce((acc, curr) => acc + (curr?.size || 0), 0)
}

/**
 * Renders filtered and sorted asset cards into manager grid container.
 *
 * @param {object} options
 * @param {HTMLElement} options.grid Target grid container
 * @param {HTMLElement} [options.emptyState] Empty state container
 * @param {HTMLElement} [options.countBadge] Count & size badge container
 * @param {Array<object>} options.assets Full assets array
 * @param {string} [options.query=''] Search query
 * @param {string} [options.filterType='all'] Extension filter
 * @param {string} [options.sortMode='newest'] Sort mode
 * @param {object|null} [options.selectedAsset=null] Currently selected asset
 * @param {object} [options.activeCtx=null] Application UI context
 * @param {(asset: object) => void} options.onSelect Selection callback
 * @returns {Array<object>} Filtered list of assets
 */
export function renderManagerGrid(options) {
    const {
        grid,
        emptyState = null,
        countBadge = null,
        assets = [],
        query = '',
        filterType = 'all',
        sortMode = 'newest',
        selectedAsset = null,
        activeCtx = null,
        onSelect,
    } = options

    if (!grid) return []

    const filtered = filterAndSortAssets(assets, { query, filterType, sortMode })

    if (countBadge) {
        const totalSize = calculateTotalSize(filtered)
        countBadge.textContent = t('asset_manager.files_count', {
            count: filtered.length,
            size: formatFileSize(totalSize),
        })
    }

    grid.innerHTML = ''

    if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden')
        return filtered
    }

    if (emptyState) emptyState.classList.add('hidden')

    filtered.forEach(asset => {
        const isSelected = Boolean(
            selectedAsset && selectedAsset.relativePath === asset.relativePath
        )
        const usages = findAssetUsages(activeCtx, asset.relativePath)

        const card = createAssetCardElement({
            asset,
            isSelected,
            usagesCount: usages.length,
            showSize: true,
            onClick: () => {
                if (typeof onSelect === 'function') onSelect(asset)
            },
        })

        grid.appendChild(card)
    })

    return filtered
}
