/**
 * Project Path Resolution Helper for Asset Subsystem.
 * Resolves active project path from UI Context or Electron API.
 */

/**
 * Resolves the active project path using context or fallback sources.
 *
 * @param {object} [ctx] Application UI Context
 * @returns {string} Absolute project path or empty string
 */
export function getActiveProjectPath(ctx) {
    if (ctx) {
        if (typeof ctx.projectPath === 'string' && ctx.projectPath) return ctx.projectPath
        if (typeof ctx.getProjectPath === 'function') {
            const fromCtx = ctx.getProjectPath()
            if (fromCtx) return fromCtx
        }
        if (ctx.projectData && typeof ctx.projectData.path === 'string' && ctx.projectData.path) {
            return ctx.projectData.path
        }
        if (ctx.vm && ctx.vm.project && typeof ctx.vm.project.getPath === 'function') {
            const fromVm = ctx.vm.project.getPath()
            if (fromVm) return fromVm
        }
    }
    if (typeof window !== 'undefined' && window.currentProjectPath) {
        return window.currentProjectPath
    }
    return ''
}

/**
 * Ensures an active project path is determined, querying main process if necessary.
 *
 * @param {object} [ctx] Application UI Context
 * @returns {Promise<string>}
 */
export async function ensureActiveProjectPath(ctx) {
    let p = getActiveProjectPath(ctx)
    if (p) return p

    const api = typeof window !== 'undefined' ? window.electronAPI : null
    if (api && typeof api.getCurrentProject === 'function') {
        try {
            const cur = await api.getCurrentProject()
            if (cur) {
                if (typeof window !== 'undefined') window.currentProjectPath = cur
                if (ctx) ctx.projectPath = cur
                return cur
            }
        } catch (err) {
            console.warn('Could not query current project path from main process:', err)
        }
    }
    return ''
}
