// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import {
    createAssetCardElement,
    formatFileSize,
    getActiveProjectPath,
} from '../../View/ui/assets/common/index.js'

describe('Asset Common Utilities', () => {
    describe('formatFileSize', () => {
        it('formats zero or negative values as 0 B', () => {
            expect(formatFileSize(0)).toBe('0 B')
            expect(formatFileSize(-10)).toBe('0 B')
            expect(formatFileSize(null as unknown as number)).toBe('0 B')
            expect(formatFileSize(undefined as unknown as number)).toBe('0 B')
        })

        it('formats bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 B')
        })

        it('formats kilobytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.0 KB')
            expect(formatFileSize(2048)).toBe('2.0 KB')
            expect(formatFileSize(1536)).toBe('1.5 KB')
        })

        it('formats megabytes correctly', () => {
            expect(formatFileSize(1048576)).toBe('1.0 MB')
            expect(formatFileSize(5242880)).toBe('5.0 MB')
        })
    })

    describe('createAssetCardElement', () => {
        it('creates a card element with correct attributes and thumbnail', () => {
            const asset = {
                relativePath: 'Assets/Images/test_cover.png',
                fileName: 'test_cover.png',
                size: 2048,
                modifiedAt: 1600000000,
            }
            const onClick = vi.fn()
            const onDblClick = vi.fn()

            const card = createAssetCardElement({
                asset,
                isSelected: true,
                usagesCount: 3,
                showSize: true,
                onClick,
                onDblClick,
            })

            expect(card.getAttribute('data-asset-path')).toBe('Assets/Images/test_cover.png')
            expect(card.className).toContain('border-blue-500')
            expect(card.textContent).toContain('test_cover.png')
            expect(card.textContent).toContain('2.0 KB')
            expect(card.textContent).toContain('3')

            const img = card.querySelector('img')
            expect(img).not.toBeNull()
            expect(img?.getAttribute('alt')).toBe('test_cover.png')

            card.dispatchEvent(new MouseEvent('click'))
            expect(onClick).toHaveBeenCalledTimes(1)

            card.dispatchEvent(new MouseEvent('dblclick'))
            expect(onDblClick).toHaveBeenCalledTimes(1)
        })

        it('renders unselected card without usage badge when usagesCount is null', () => {
            const asset = {
                relativePath: 'Assets/Images/plain.png',
                fileName: 'plain.png',
                size: 100,
            }

            const card = createAssetCardElement({
                asset,
                isSelected: false,
                usagesCount: null,
            })

            expect(card.className).toContain('border-[#2d2d32]')
            expect(card.querySelector('app-icon')).toBeNull()
        })
    })

    describe('assetPathResolver', () => {
        it('resolves from ctx.vm.project.getPath()', () => {
            const ctx = {
                vm: {
                    project: {
                        getPath: (): string => '/workspace/gamebook-project',
                    },
                },
            }
            expect(getActiveProjectPath(ctx)).toBe('/workspace/gamebook-project')
        })

        it('returns empty string when no sources available', () => {
            expect(getActiveProjectPath(null)).toBe('')
            expect(getActiveProjectPath({})).toBe('')
        })
    })
})
