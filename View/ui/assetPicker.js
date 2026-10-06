/**
 * Shared renderer-side helper for importing images into the active project.
 * Single place that resolves the project path and reports import errors.
 */

import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'

/**
 * Resolves the active project path using the same sources as the rest of the View layer.
 *
 * @param {object} [ctx] Application UI Context
 * @returns {string}
 */
export function getActiveProjectPath(ctx) {
    if (ctx) {
        if (typeof ctx.projectPath === 'string' && ctx.projectPath) return ctx.projectPath
        if (typeof ctx.getProjectPath === 'function') {
            const fromCtx = ctx.getProjectPath()
            if (fromCtx) return fromCtx
        }
    }
    if (typeof window !== 'undefined' && window.currentProjectPath) {
        return window.currentProjectPath
    }
    return ''
}

/**
 * Opens the native image picker, imports the file into the project and returns the result.
 * Shows an error toast on failure; user cancellation is silent.
 *
 * @param {object} [ctx] Application UI Context
 * @param {string} [prefix='img'] File name prefix (e.g. 'img', 'npc')
 * @returns {Promise<{ relativePath: string, fileName: string, assetUrl: string } | null>}
 */
export async function pickProjectImage(ctx, prefix = 'img') {
    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (!api || typeof api.importImage !== 'function') return null

    try {
        const res = await api.importImage(getActiveProjectPath(ctx) || null, prefix)
        if (res && res.success && res.relativePath) {
            return {
                relativePath: res.relativePath,
                fileName: res.fileName || '',
                assetUrl: res.assetUrl || '',
            }
        }
        if (res && !res.canceled) {
            toast.error(res.error || t('asset.error.import_failed'), t('asset.error.title'))
        }
    } catch (err) {
        console.error('Error importing project image:', err)
        toast.error(t('asset.error.import_failed'), t('asset.error.title'))
    }
    return null
}
