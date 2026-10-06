import { createRequire } from 'module'
import { describe, expect, it } from 'vitest'

import * as tsUtils from '../../Utils/assetUtils'

const require = createRequire(import.meta.url)
const cjsConstants = require('../../Utils/assetConstants.js')

describe('assetConstantsSync', () => {
    it('synchronizes shared directory and protocol constants', () => {
        expect(tsUtils.ASSETS_IMAGES_DIR).toBe(cjsConstants.ASSETS_IMAGES_DIR)
        expect(tsUtils.ASSET_PROTOCOL_SCHEME).toBe(cjsConstants.ASSET_PROTOCOL_SCHEME)
        expect(tsUtils.ASSET_PROTOCOL_HOST).toBe(cjsConstants.ASSET_PROTOCOL_HOST)
        expect(tsUtils.ASSET_URL_PREFIX).toBe(cjsConstants.ASSET_URL_PREFIX)
        expect(tsUtils.MAX_IMAGE_SIZE_BYTES).toBe(cjsConstants.MAX_IMAGE_SIZE_BYTES)
    })

    it('synchronizes supported image extensions list', () => {
        expect([...tsUtils.IMAGE_EXTENSIONS]).toEqual([...cjsConstants.IMAGE_EXTENSIONS])
    })
})
