/**
 * Asset Manager Detail Panel Controller.
 * Displays selected asset metadata, natural dimensions, and project usage references.
 */

import { findAssetUsages } from '../../../../dist/Utils/assetUsageTracker.js'
import { toAssetUrl } from '../../../../dist/Utils/assetUtils.js'
import { t } from '../../../../dist/Utils/translate.js'
import { formatFileSize } from '../common/assetCardTemplate.js'

let _currentLoadingPath = ''

/**
 * Returns icon template corresponding to entity usage type.
 *
 * @param {string} type Entity category ('hero', 'npc', 'scene', 'item', 'location')
 * @returns {string} HTML string with app-icon
 */
export function getIconForUsageType(type) {
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

/**
 * Renders detail panel for the given asset or clears it.
 *
 * @param {object|null} asset Selected asset object
 * @param {object} [activeCtx] Application UI context
 */
export function renderDetailPanel(asset, activeCtx = null) {
    const placeholder = document.getElementById('asset-detail-placeholder')
    const content = document.getElementById('asset-detail-content')
    if (!placeholder || !content) return

    if (!asset) {
        _currentLoadingPath = ''
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

    const url = toAssetUrl(asset.relativePath, asset.modifiedAt)
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

    // Resolve image resolution safely (guard against out-of-order image loads)
    if (dimsEl) {
        dimsEl.textContent = t('asset_manager.loading_dimensions')
        const requestedPath = asset.relativePath
        _currentLoadingPath = requestedPath

        const tempImg = new Image()
        tempImg.onload = () => {
            if (_currentLoadingPath === requestedPath) {
                dimsEl.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`
            }
        }
        tempImg.onerror = () => {
            if (_currentLoadingPath === requestedPath) {
                dimsEl.textContent = t('asset_manager.unknown_dimensions')
            }
        }
        tempImg.src = url
    }

    // Check project usages
    const usages = findAssetUsages(activeCtx, asset.relativePath)
    if (usageBadge) {
        if (usages.length === 0) {
            usageBadge.textContent = t('asset_manager.no_usages')
        } else if (usages.length === 1) {
            usageBadge.textContent = t('asset_manager.places_count_singular', { count: 1 })
        } else {
            usageBadge.textContent = t('asset_manager.places_count', { count: usages.length })
        }
        usageBadge.className =
            usages.length > 0
                ? 'px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700'
    }

    if (usageList) {
        usageList.innerHTML = ''
        if (usages.length === 0) {
            const emptyText =
                t('asset_manager.no_usages_desc') ||
                'This file is not currently linked to any game entity.'
            usageList.innerHTML = `<span class="text-zinc-500 italic p-1 text-[11px]">${emptyText}</span>`
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
