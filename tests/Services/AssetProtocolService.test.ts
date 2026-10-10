import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { resolveAssetRequestPath } = require('../../main/services/AssetProtocolService.js')

describe('AssetProtocolService.resolveAssetRequestPath', () => {
    const projectDir = path.resolve(os.tmpdir(), 'sgp-mock-project')

    it('resolves valid asset URLs inside project directory', () => {
        const res = resolveAssetRequestPath('asset://project/Assets/Images/hero.png', projectDir)
        expect(res.ok).toBe(true)
        if (res.ok) {
            expect(res.fullPath).toBe(path.resolve(projectDir, 'Assets/Images/hero.png'))
        }
    })

    it('ignores query parameters (e.g. cache-busting ?v=...) when resolving paths', () => {
        const res = resolveAssetRequestPath(
            'asset://project/Assets/Images/hero.png?v=1728560000',
            projectDir
        )
        expect(res.ok).toBe(true)
        if (res.ok) {
            expect(res.fullPath).toBe(path.resolve(projectDir, 'Assets/Images/hero.png'))
        }
    })

    it('blocks directory traversal attempts escaping project root', () => {
        const res = resolveAssetRequestPath('asset://project/%2e%2e%2fsecret.txt', projectDir)
        expect(res.ok).toBe(false)
        if (!res.ok) {
            expect(res.status).toBe(403)
        }
    })

    it('rejects unsupported host or protocol', () => {
        const badHost = resolveAssetRequestPath('asset://external/Assets/img.png', projectDir)
        expect(badHost.ok).toBe(false)
        if (!badHost.ok) {
            expect(badHost.status).toBe(400)
        }

        const badProto = resolveAssetRequestPath('https://project/Assets/img.png', projectDir)
        expect(badProto.ok).toBe(false)
    })

    it('returns 404 when no project directory is loaded', () => {
        const res = resolveAssetRequestPath('asset://project/Assets/Images/hero.png', null)
        expect(res.ok).toBe(false)
        if (!res.ok) {
            expect(res.status).toBe(404)
        }
    })
})
