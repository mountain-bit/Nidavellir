import { describe, expect, it } from 'vitest'

import {
    getAssetCategory,
    isAllowedAudioExtension,
    isAllowedImageExtension,
    isCustomAvatarPath,
    toAssetUrl,
    toRelativeAssetPath,
} from '../../Utils/assets/assetUtils'

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

        it('appends version query parameter for cache busting when provided', () => {
            expect(toAssetUrl('Assets/Images/test.png', 1728560000)).toBe(
                'asset://project/Assets/Images/test.png?v=1728560000'
            )
            expect(toAssetUrl('asset://project/Assets/Images/test.png', 'v2')).toBe(
                'asset://project/Assets/Images/test.png?v=v2'
            )
            expect(toAssetUrl('https://example.com/img.png?size=large', 123)).toBe(
                'https://example.com/img.png?size=large&v=123'
            )
        })

        it('does not append version query parameter to data URLs', () => {
            expect(toAssetUrl('data:image/png;base64,abc', 123)).toBe('data:image/png;base64,abc')
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

        it('strips query parameters and hashes from urls', () => {
            expect(toRelativeAssetPath('asset://project/Assets/Images/test.png?v=1728560000')).toBe(
                'Assets/Images/test.png'
            )
            expect(toRelativeAssetPath('Assets/Images/test.png?v=123#thumb')).toBe(
                'Assets/Images/test.png'
            )
        })

        it('leaves clean relative paths untouched', () => {
            expect(toRelativeAssetPath('Assets/Images/test.png')).toBe('Assets/Images/test.png')
        })
    })

    describe('getAssetCategory', () => {
        it('identifies image files and extensions', () => {
            expect(getAssetCategory('Assets/Images/hero.png')).toBe('image')
            expect(getAssetCategory('pic.webp')).toBe('image')
            expect(getAssetCategory('photo.jpg?v=123')).toBe('image')
            expect(getAssetCategory('svg')).toBe('image')
        })

        it('identifies audio files and extensions', () => {
            expect(getAssetCategory('Assets/Audio/theme.mp3')).toBe('audio')
            expect(getAssetCategory('sfx.ogg')).toBe('audio')
            expect(getAssetCategory('music.wav?v=456')).toBe('audio')
            expect(getAssetCategory('flac')).toBe('audio')
        })

        it('returns unknown for other extensions or invalid inputs', () => {
            expect(getAssetCategory('document.pdf')).toBe('unknown')
            expect(getAssetCategory('script.js')).toBe('unknown')
            expect(getAssetCategory('')).toBe('unknown')
            expect(getAssetCategory(null as unknown as string)).toBe('unknown')
        })
    })

    describe('extension helpers', () => {
        it('identifies valid image and audio extensions', () => {
            expect(isAllowedImageExtension('png')).toBe(true)
            expect(isAllowedImageExtension('.jpg')).toBe(true)
            expect(isAllowedImageExtension('mp3')).toBe(false)

            expect(isAllowedAudioExtension('mp3')).toBe(true)
            expect(isAllowedAudioExtension('.wav')).toBe(true)
            expect(isAllowedAudioExtension('png')).toBe(false)
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
