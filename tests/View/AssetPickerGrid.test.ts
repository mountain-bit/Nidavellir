// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import {
    filterAssetsByQuery,
    renderPickerGrid,
} from '../../View/ui/assets/picker/assetPickerGrid.js'

describe('AssetPickerGrid', () => {
    const sampleAssets = [
        { fileName: 'forest_day.png', relativePath: 'Assets/Images/forest_day.png' },
        { fileName: 'forest_night.jpg', relativePath: 'Assets/Images/forest_night.jpg' },
        { fileName: 'hero_portrait.png', relativePath: 'Assets/Images/hero_portrait.png' },
    ]

    describe('filterAssetsByQuery', () => {
        it('returns empty array when input is not an array', () => {
            expect(filterAssetsByQuery(null as unknown as [])).toEqual([])
            expect(filterAssetsByQuery(undefined as unknown as [])).toEqual([])
        })

        it('returns all assets when query is empty or whitespace', () => {
            expect(filterAssetsByQuery(sampleAssets, '')).toEqual(sampleAssets)
            expect(filterAssetsByQuery(sampleAssets, '   ')).toEqual(sampleAssets)
        })

        it('filters case-insensitively by fileName', () => {
            const results = filterAssetsByQuery(sampleAssets, 'FOREST')
            expect(results).toHaveLength(2)
            expect(results[0].fileName).toBe('forest_day.png')
            expect(results[1].fileName).toBe('forest_night.jpg')
        })

        it('returns empty list when no matches', () => {
            const results = filterAssetsByQuery(sampleAssets, 'castle')
            expect(results).toHaveLength(0)
        })
    })

    describe('renderPickerGrid', () => {
        it('renders cards and manages empty state visibility', () => {
            const grid = document.createElement('div')
            const emptyState = document.createElement('div')
            emptyState.className = 'hidden'

            const onSelect = vi.fn()
            const onConfirm = vi.fn()

            const rendered = renderPickerGrid({
                grid,
                emptyState,
                assets: sampleAssets,
                query: 'night',
                selectedAsset: sampleAssets[1],
                onSelect,
                onConfirm,
            })

            expect(rendered).toHaveLength(1)
            expect(grid.children).toHaveLength(1)
            expect(emptyState.classList.contains('hidden')).toBe(true)

            const card = grid.children[0] as HTMLElement
            expect(card.getAttribute('data-asset-path')).toBe('Assets/Images/forest_night.jpg')
            expect(card.className).toContain('border-blue-500')

            card.dispatchEvent(new MouseEvent('click'))
            expect(onSelect).toHaveBeenCalledWith(sampleAssets[1])

            card.dispatchEvent(new MouseEvent('dblclick'))
            expect(onConfirm).toHaveBeenCalledWith(sampleAssets[1])
        })

        it('shows empty state when no matching assets exist', () => {
            const grid = document.createElement('div')
            const emptyState = document.createElement('div')
            emptyState.className = 'hidden'

            renderPickerGrid({
                grid,
                emptyState,
                assets: sampleAssets,
                query: 'dragon',
                onSelect: vi.fn(),
                onConfirm: vi.fn(),
            })

            expect(grid.children).toHaveLength(0)
            expect(emptyState.classList.contains('hidden')).toBe(false)
        })

        it('returns empty array if grid element is missing', () => {
            const res = renderPickerGrid({
                grid: null as unknown as HTMLElement,
                assets: sampleAssets,
                onSelect: vi.fn(),
                onConfirm: vi.fn(),
            })
            expect(res).toEqual([])
        })
    })
})
