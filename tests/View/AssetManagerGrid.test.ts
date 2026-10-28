// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'

import {
    getIconForUsageType,
    renderDetailPanel,
} from '../../View/ui/assets/manager/assetDetailPanel.js'
import {
    calculateTotalSize,
    filterAndSortAssets,
} from '../../View/ui/assets/manager/assetManagerGrid.js'

describe('AssetManagerGrid and DetailPanel', () => {
    const sampleAssets = [
        {
            fileName: 'forest.png',
            relativePath: 'Assets/Images/forest.png',
            extension: 'png',
            size: 5000,
            modifiedAt: 100,
        },
        {
            fileName: 'castle.jpg',
            relativePath: 'Assets/Images/castle.jpg',
            extension: 'jpg',
            size: 20000,
            modifiedAt: 300,
        },
        {
            fileName: 'avatar.webp',
            relativePath: 'Assets/Images/avatar.webp',
            extension: 'webp',
            size: 1000,
            modifiedAt: 200,
        },
    ]

    describe('filterAndSortAssets', () => {
        it('returns empty array when input is not an array', () => {
            expect(filterAndSortAssets(null as unknown as [])).toEqual([])
        })

        it('filters by query and format correctly', () => {
            const res = filterAndSortAssets(sampleAssets, { query: 'cast', filterType: 'jpg' })
            expect(res).toHaveLength(1)
            expect(res[0].fileName).toBe('castle.jpg')
        })

        it('supports jpg filter for jpeg files', () => {
            const jpegAssets = [
                { fileName: 'pic.jpeg', relativePath: 'pic.jpeg', extension: 'jpeg' },
            ]
            const res = filterAndSortAssets(jpegAssets, { filterType: 'jpg' })
            expect(res).toHaveLength(1)
        })

        it('sorts by newest first (modifiedAt descending)', () => {
            const res = filterAndSortAssets(sampleAssets, { sortMode: 'newest' })
            expect(res.map(a => a.fileName)).toEqual(['castle.jpg', 'avatar.webp', 'forest.png'])
        })

        it('sorts by name_asc and name_desc', () => {
            const asc = filterAndSortAssets(sampleAssets, { sortMode: 'name_asc' })
            expect(asc.map(a => a.fileName)).toEqual(['avatar.webp', 'castle.jpg', 'forest.png'])

            const desc = filterAndSortAssets(sampleAssets, { sortMode: 'name_desc' })
            expect(desc.map(a => a.fileName)).toEqual(['forest.png', 'castle.jpg', 'avatar.webp'])
        })

        it('sorts by size_desc', () => {
            const res = filterAndSortAssets(sampleAssets, { sortMode: 'size_desc' })
            expect(res.map(a => a.fileName)).toEqual(['castle.jpg', 'forest.png', 'avatar.webp'])
        })
    })

    describe('calculateTotalSize', () => {
        it('sums sizes correctly', () => {
            expect(calculateTotalSize(sampleAssets)).toBe(26000)
            expect(calculateTotalSize([])).toBe(0)
            expect(calculateTotalSize(null as unknown as [])).toBe(0)
        })
    })

    describe('assetDetailPanel', () => {
        it('returns proper icon for usage types', () => {
            expect(getIconForUsageType('hero')).toContain('name="character"')
            expect(getIconForUsageType('npc')).toContain('name="character"')
            expect(getIconForUsageType('scene')).toContain('name="scene"')
            expect(getIconForUsageType('item')).toContain('name="item"')
            expect(getIconForUsageType('location')).toContain('name="location"')
            expect(getIconForUsageType('unknown')).toContain('name="link"')
        })

        it('shows placeholder and hides content when asset is null', () => {
            const placeholder = document.createElement('div')
            placeholder.id = 'asset-detail-placeholder'
            placeholder.className = 'hidden'

            const content = document.createElement('div')
            content.id = 'asset-detail-content'

            document.body.appendChild(placeholder)
            document.body.appendChild(content)

            renderDetailPanel(null)

            expect(placeholder.classList.contains('hidden')).toBe(false)
            expect(content.classList.contains('hidden')).toBe(true)

            document.body.removeChild(placeholder)
            document.body.removeChild(content)
        })
    })
})
