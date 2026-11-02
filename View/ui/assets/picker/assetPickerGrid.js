/**
 * Asset Picker Grid Renderer and Filter.
 */

import { createAssetCardElement } from '../common/assetCardTemplate.js'

/**
 * Filters asset list by file name query.
 *
 * @param {Array<object>} assets
 * @param {string} [query='']
 * @returns {Array<object>}
 */
export function filterAssetsByQuery(assets, query = '') {
    if (!Array.isArray(assets)) return []
    const q = (query || '').trim().toLowerCase()
    if (!q) return assets
    return assets.filter(a => a && a.fileName && a.fileName.toLowerCase().includes(q))
}

/**
 * Renders filtered asset cards into target grid container.
 *
 * @param {object} options
 * @param {HTMLElement} options.grid Target grid container
 * @param {HTMLElement} [options.emptyState] Empty state container to toggle
 * @param {Array<object>} options.assets Full assets array
 * @param {string} [options.query=''] Search query
 * @param {object|null} [options.selectedAsset=null] Currently selected asset
 * @param {(asset: object) => void} options.onSelect Selection callback
 * @param {(asset: object) => void} options.onConfirm Confirmation (e.g. dblclick) callback
 * @returns {Array<object>} Filtered assets list
 */
export function renderPickerGrid(options) {
    const {
        grid,
        emptyState = null,
        assets = [],
        query = '',
        selectedAsset = null,
        onSelect,
        onConfirm,
    } = options

    if (!grid) return []

    grid.innerHTML = ''
    const filtered = filterAssetsByQuery(assets, query)

    if (emptyState) {
        if (filtered.length === 0) {
            emptyState.classList.remove('hidden')
        } else {
            emptyState.classList.add('hidden')
        }
    }

    filtered.forEach(asset => {
        const isSel = Boolean(selectedAsset && selectedAsset.relativePath === asset.relativePath)
        const card = createAssetCardElement({
            asset,
            isSelected: isSel,
            showSize: false,
            onClick: () => {
                if (typeof onSelect === 'function') onSelect(asset)
            },
            onDblClick: () => {
                if (typeof onConfirm === 'function') onConfirm(asset)
            },
        })
        grid.appendChild(card)
    })

    return filtered
}
