import { createRequire } from 'module'
import { describe, expect, it } from 'vitest'

import * as tsUtils from '../../Utils/assets/assetUtils'

const require = createRequire(import.meta.url)
const cjsConstants = require('../../Utils/assets/assetConstants.js')

describe('assetConstantsSync', () => {
    it('synchronizes shared directory and protocol constants', () => {
        expect(tsUtils.ASSETS_ROOT_DIR).toBe(cjsConstants.ASSETS_ROOT_DIR)
        expect(tsUtils.ASSETS_IMAGES_DIR).toBe(cjsConstants.ASSETS_IMAGES_DIR)
        expect(tsUtils.ASSETS_AUDIO_DIR).toBe(cjsConstants.ASSETS_AUDIO_DIR)
        expect(tsUtils.ASSET_PROTOCOL_SCHEME).toBe(cjsConstants.ASSET_PROTOCOL_SCHEME)
        expect(tsUtils.ASSET_PROTOCOL_HOST).toBe(cjsConstants.ASSET_PROTOCOL_HOST)
        expect(tsUtils.ASSET_URL_PREFIX).toBe(cjsConstants.ASSET_URL_PREFIX)
        expect(tsUtils.MAX_IMAGE_SIZE_BYTES).toBe(cjsConstants.MAX_IMAGE_SIZE_BYTES)
    })

    it('synchronizes supported image extensions list', () => {
        expect([...tsUtils.IMAGE_EXTENSIONS]).toEqual([...cjsConstants.IMAGE_EXTENSIONS])
    })

    it('synchronizes supported audio extensions list', () => {
        expect([...tsUtils.AUDIO_EXTENSIONS]).toEqual([...cjsConstants.AUDIO_EXTENSIONS])
    })

    it('synchronizes asset category classification and path builder functions', () => {
        const testFiles = ['hero.png', 'sound.mp3', 'clip.wav', 'bg.webp', 'script.js']
        for (const f of testFiles) {
            expect(tsUtils.getAssetCategory(f)).toBe(cjsConstants.getAssetCategory(f))
        }
        expect(tsUtils.buildRelativeImagePath('hero.png')).toBe(
            cjsConstants.buildRelativeImagePath('hero.png')
        )
        expect(tsUtils.buildAssetUrl('Assets/Images/hero.png', 42)).toBe(
            cjsConstants.buildAssetUrl('Assets/Images/hero.png', 42)
        )
    })
})
