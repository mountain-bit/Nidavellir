import { describe, expect, it } from 'vitest'

import { isCustomAvatarPath, toAssetUrl, toRelativeAssetPath } from '../../Utils/assetUtils'

describe('assetUtils', () => {
    describe('toAssetUrl', () => {
        it('prefixes clean relative paths with asset://project/', () => {
            expect(toAssetUrl('Assets/Images/test.png')).toBe(
                'asset://project/Assets/Images/test.png'
            )
            expect(toAssetUrl('images/hero.jpg')).toBe('asset://project/images/hero.jpg')
        })

        it('normalizes backslashes to forward slashes', () => {
            expect(toAssetUrl('Assets\\Images\\test.png')).toBe(
                'asset://project/Assets/Images/test.png'
            )
        })

        it('preserves existing asset://, http://, https://, and data: urls', () => {
            expect(toAssetUrl('asset://project/Assets/Images/test.png')).toBe(
                'asset://project/Assets/Images/test.png'
            )
            expect(toAssetUrl('https://example.com/image.png')).toBe(
                'https://example.com/image.png'
            )
            expect(toAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
        })

        it('returns empty string for invalid inputs', () => {
            expect(toAssetUrl('')).toBe('')
            expect(toAssetUrl(null as unknown as string)).toBe('')
        })
    })

    describe('toRelativeAssetPath', () => {
        it('removes asset://project/ prefix', () => {
            expect(toRelativeAssetPath('asset://project/Assets/Images/test.png')).toBe(
                'Assets/Images/test.png'
            )
        })

        it('removes asset:/// or asset:// prefix', () => {
            expect(toRelativeAssetPath('asset:///Assets/Images/test.png')).toBe(
                'Assets/Images/test.png'
            )
            expect(toRelativeAssetPath('asset://Assets/Images/test.png')).toBe(
                'Assets/Images/test.png'
            )
        })

        it('leaves clean relative paths untouched', () => {
            expect(toRelativeAssetPath('Assets/Images/test.png')).toBe('Assets/Images/test.png')
        })
    })

    describe('isCustomAvatarPath', () => {
        it('returns true for relative paths and image file extensions', () => {
            expect(isCustomAvatarPath('Assets/Images/avatar.png')).toBe(true)
            expect(isCustomAvatarPath('Assets\\Images\\avatar.jpg')).toBe(true)
            expect(isCustomAvatarPath('portrait.webp')).toBe(true)
            expect(isCustomAvatarPath('npc_1.svg')).toBe(true)
        })

        it('returns false for preset avatar identifiers', () => {
            expect(isCustomAvatarPath('warrior')).toBe(false)
            expect(isCustomAvatarPath('mage')).toBe(false)
            expect(isCustomAvatarPath('rogue')).toBe(false)
            expect(isCustomAvatarPath('')).toBe(false)
            expect(isCustomAvatarPath(null as unknown as string)).toBe(false)
        })
    })
})
