/**
 * Shared Asset Card Template and Formatting Utilities.
 */

import { toAssetUrl } from '../../../../dist/Utils/assetUtils.js'

/**
 * Formats byte size into human readable string (e.g. "128 KB", "2.4 MB").
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const formatted = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
    return `${formatted} ${units[i]}`
}

/**
 * Creates a standard asset preview card DOM element.
 *
 * @param {object} options
 * @param {object} options.asset Asset object { relativePath, fileName, size, modifiedAt, assetUrl }
 * @param {boolean} [options.isSelected=false] Whether card is currently selected
 * @param {number|null} [options.usagesCount=null] Number of usages (if badge to be shown)
 * @param {boolean} [options.showSize=true] Whether to show formatted file size
 * @param {Function} [options.onClick] Click callback
 * @param {Function} [options.onDblClick] Double-click callback
 * @returns {HTMLDivElement}
 */
export function createAssetCardElement(options) {
    const {
        asset,
        isSelected = false,
        usagesCount = null,
        showSize = true,
        onClick,
        onDblClick,
    } = options

    const card = document.createElement('div')
    card.setAttribute('data-asset-path', asset.relativePath)
    card.className = `group relative flex flex-col bg-[#202024] border ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#2d2d32]'
    } hover:border-zinc-500 rounded-lg p-2 transition-all cursor-pointer select-none overflow-hidden shadow-sm`

    const url = asset.assetUrl || toAssetUrl(asset.relativePath, asset.modifiedAt)

    let badgeHtml = ''
    if (typeof usagesCount === 'number') {
        const hasUsages = usagesCount > 0
        badgeHtml = `
            <div class="absolute top-1 right-1">
                ${
                    hasUsages
                        ? `<span class="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm font-medium">
                            <app-icon name="check" class="w-2.5 h-2.5 text-emerald-400"></app-icon>
                            <span>${usagesCount}</span>
                           </span>`
                        : `<span class="bg-zinc-900/80 text-zinc-400 border border-zinc-700/60 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm font-medium">
                            <app-icon name="link" class="w-2.5 h-2.5 text-zinc-400"></app-icon>
                            <span>0</span>
                           </span>`
                }
            </div>`
    }

    const sizeHtml = showSize
        ? `<span class="text-[10px] text-zinc-400">${formatFileSize(asset.size)}</span>`
        : ''

    card.innerHTML = `
        <div class="w-full h-24 rounded bg-black/40 overflow-hidden flex items-center justify-center mb-1.5 relative">
            <img src="${url}" alt="${asset.fileName}" loading="lazy" class="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ${badgeHtml}
        </div>
        <div class="flex flex-col min-w-0">
            <span class="text-xs font-medium text-zinc-200 truncate" title="${asset.fileName}">${asset.fileName}</span>
            ${sizeHtml}
        </div>
    `

    if (typeof onClick === 'function') {
        card.addEventListener('click', onClick)
    }
    if (typeof onDblClick === 'function') {
        card.addEventListener('dblclick', onDblClick)
    }

    return card
}
