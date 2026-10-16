/**
 * Auto-Save Service
 * Periodically saves the project state in the background when unsaved changes exist.
 */

import { saveFullProject } from './projectSaver.js'
import { isProjectDirty } from './projectStateTracker.js'

export const DEFAULT_AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let autoSaveTimer = null
let isAutoSaveRunning = false
let currentIntervalMs = DEFAULT_AUTOSAVE_INTERVAL_MS

/**
 * Checks whether auto-save is enabled in user settings (localStorage).
 * Defaults to true if not explicitly set.
 *
 * @returns {boolean}
 */
export function isAutoSaveEnabled() {
    if (typeof localStorage === 'undefined') return true
    const val = localStorage.getItem('silnik_auto_save_enabled')
    return val === null ? true : val === 'true'
}

/**
 * Updates the user preference for auto-save and updates timer state.
 *
 * @param {boolean} enabled
 * @param {object} [ctx]
 */
export function setAutoSaveEnabled(enabled, ctx = null) {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('silnik_auto_save_enabled', String(Boolean(enabled)))
    }
    if (enabled) {
        if (ctx) startAutoSave(ctx, currentIntervalMs)
    } else {
        stopAutoSave()
    }
}

/**
 * Performs a single auto-save cycle if there are unsaved changes and a valid project path.
 *
 * @param {object} ctx Application context
 * @returns {Promise<{ success: boolean, skipped?: boolean, error?: string }>}
 */
export async function triggerAutoSaveCycle(ctx) {
    if (!ctx) return { success: false, skipped: true, error: 'Missing application context' }

    // If there are no unsaved changes, do not perform save
    if (!isProjectDirty()) {
        return { success: true, skipped: true }
    }

    // Only auto-save if project path is set to avoid opening folder picker modal
    const projectPath =
        (typeof ctx.getProjectPath === 'function' ? ctx.getProjectPath() : ctx.projectPath) ||
        (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
        ''

    if (!projectPath) {
        return { success: false, skipped: true, error: 'No project folder chosen yet' }
    }

    try {
        const result = await saveFullProject(ctx, { isAutoSave: true })
        return result
    } catch (err) {
        console.error('Auto-save cycle failed:', err)
        return { success: false, error: err?.message || String(err) }
    }
}

/**
 * Starts the periodic auto-save timer.
 *
 * @param {object} ctx Application UI Context
 * @param {number} [intervalMs=300000] Interval in milliseconds (default: 5 minutes)
 */
export function startAutoSave(ctx, intervalMs = DEFAULT_AUTOSAVE_INTERVAL_MS) {
    stopAutoSave()
    currentIntervalMs = intervalMs

    if (!isAutoSaveEnabled()) return

    isAutoSaveRunning = true
    autoSaveTimer = setInterval(() => {
        if (isAutoSaveEnabled()) {
            triggerAutoSaveCycle(ctx)
        }
    }, intervalMs)
}

/**
 * Stops the periodic auto-save timer.
 */
export function stopAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
        autoSaveTimer = null
    }
    isAutoSaveRunning = false
}

/**
 * Returns whether the auto-save timer is actively running.
 *
 * @returns {boolean}
 */
export function isAutoSaveRunningStatus() {
    return isAutoSaveRunning
}
