const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const { protocol, net } = require('electron')
const { isPathInsideBase } = require('../../Utils/fs/fsSecurity')
const { ASSET_PROTOCOL_SCHEME, ASSET_PROTOCOL_HOST } = require('../../Utils/assets/assetConstants')
const ProjectService = require('./ProjectService')

/**
 * Resolves an `asset://project/...` request URL to an absolute file path inside the project.
 * Pure function (no Electron dependencies) so it can be unit-tested.
 *
 * @param {string} requestUrl
 * @param {string|null} projectDir
 * @returns {{ ok: true, fullPath: string } | { ok: false, status: number, reason: string }}
 */
function resolveAssetRequestPath(requestUrl, projectDir) {
    if (!projectDir) {
        return { ok: false, status: 404, reason: 'No project loaded' }
    }

    let urlObj
    try {
        urlObj = new URL(requestUrl)
    } catch {
        return { ok: false, status: 400, reason: 'Malformed URL' }
    }

    if (urlObj.protocol !== `${ASSET_PROTOCOL_SCHEME}:` || urlObj.host !== ASSET_PROTOCOL_HOST) {
        return { ok: false, status: 400, reason: 'Unsupported asset host' }
    }

    let relativePath
    try {
        relativePath = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''))
    } catch {
        return { ok: false, status: 400, reason: 'Malformed path' }
    }

    if (!relativePath) {
        return { ok: false, status: 400, reason: 'Empty path' }
    }

    const fullPath = path.resolve(projectDir, relativePath)
    if (!isPathInsideBase(projectDir, fullPath)) {
        return { ok: false, status: 403, reason: 'Forbidden' }
    }

    return { ok: true, fullPath }
}

/**
 * Registers privileged scheme for custom asset:// protocol.
 * Must be called before app.whenReady().
 */
function registerAssetScheme() {
    if (protocol && typeof protocol.registerSchemesAsPrivileged === 'function') {
        protocol.registerSchemesAsPrivileged([
            {
                scheme: ASSET_PROTOCOL_SCHEME,
                privileges: {
                    standard: true,
                    secure: true,
                    supportFetchAPI: true,
                    corsEnabled: true,
                    stream: true,
                    bypassCSP: true,
                },
            },
        ])
    }
}

/**
 * Registers protocol handler for asset:// requests.
 * Called when app is ready.
 */
function registerAssetProtocol() {
    if (!protocol || typeof protocol.handle !== 'function') return

    protocol.handle(ASSET_PROTOCOL_SCHEME, async request => {
        try {
            const resolved = resolveAssetRequestPath(
                request.url,
                ProjectService.getCurrentProjectDir()
            )
            if (!resolved.ok) {
                return new Response(resolved.reason, { status: resolved.status })
            }
            if (!fs.existsSync(resolved.fullPath)) {
                return new Response('Asset not found', { status: 404 })
            }
            const fileUrl = pathToFileURL(resolved.fullPath).toString()
            try {
                const response = await net.fetch(fileUrl)
                const headers = new Headers(response.headers)
                headers.set('Cache-Control', 'no-cache, must-revalidate')
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                })
            } catch {
                return net.fetch(fileUrl)
            }
        } catch (err) {
            console.error('Error handling asset protocol request:', err)
            return new Response('Internal error', { status: 500 })
        }
    })
}

module.exports = {
    registerAssetScheme,
    registerAssetProtocol,
    resolveAssetRequestPath,
}
