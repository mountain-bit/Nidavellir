import { t } from '../../dist/Utils/translate.js'

let isDirty = false
let cleanTimeout = null

/**
 * Returns whether the current project has unsaved modifications.
 *
 * @returns {boolean}
 */
export function isProjectDirty() {
    return isDirty
}

/**
 * Gets the current project name from the UI or window title.
 *
 * @returns {string}
 */
function getCurrentProjectName() {
    const titleEl = document.getElementById('project-name-display')
    return titleEl?.textContent?.trim() || 'Projekt'
}

/**
 * Updates the visual save state indicator in the window ribbon and document title.
 *
 * @param {'dirty' | 'saving' | 'saved' | 'clean'} state
 * @param {string} [customProjectName]
 */
export function updateProjectSaveIndicatorUI(state, customProjectName) {
    if (typeof document === 'undefined') return

    const projectName = customProjectName || getCurrentProjectName()
    const indicatorEl = document.getElementById('project-dirty-indicator')
    const saveBtns = document.querySelectorAll('[data-action="save"]')

    if (cleanTimeout) {
        clearTimeout(cleanTimeout)
        cleanTimeout = null
    }

    const resolveText = (key, fallback) => {
        if (typeof t === 'function') {
            const res = t(key)
            if (res && res !== key) return res
        }
        return fallback
    }

    if (state === 'dirty') {
        const unsavedLabel = resolveText('unsaved_changes.title', 'Niezapisane zmiany')

        if (indicatorEl) {
            indicatorEl.textContent = `• ${unsavedLabel}`
            indicatorEl.className =
                'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded text-amber-400 bg-amber-500/10 border border-amber-500/25 animate-pulse'
        }

        document.title = `• ${projectName} (${unsavedLabel}) - Silnik Gier Paragrafowych`

        saveBtns.forEach(btn => {
            btn.classList.add('ring-1', 'ring-amber-500/40')
        })
    } else if (state === 'saving') {
        const savingLabel = resolveText('project.saving', 'Zapisywanie...')

        if (indicatorEl) {
            indicatorEl.textContent = savingLabel
            indicatorEl.className =
                'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded text-zinc-400 bg-zinc-800/80 border border-zinc-700/60'
        }

        document.title = `Zapisywanie: ${projectName} - Silnik Gier Paragrafowych`
    } else if (state === 'saved') {
        const savedLabel = resolveText('toast.save_success', 'Zapisano')

        if (indicatorEl) {
            indicatorEl.textContent = savedLabel.startsWith('•') ? savedLabel : `• ${savedLabel}`
            indicatorEl.className =
                'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
        }

        document.title = `${projectName} - Silnik Gier Paragrafowych`

        saveBtns.forEach(btn => {
            btn.classList.remove('ring-1', 'ring-amber-500/40')
        })

        cleanTimeout = setTimeout(() => {
            if (!isDirty && indicatorEl) {
                indicatorEl.className = 'hidden'
                indicatorEl.textContent = ''
            }
        }, 2500)
    } else {
        // Clean
        if (indicatorEl) {
            indicatorEl.className = 'hidden'
            indicatorEl.textContent = ''
        }
        document.title = `${projectName} - Silnik Gier Paragrafowych`
        saveBtns.forEach(btn => {
            btn.classList.remove('ring-1', 'ring-amber-500/40')
        })
    }
}

/**
 * Marks the project as dirty (unsaved changes present) and updates the UI.
 */
export function markProjectDirty() {
    isDirty = true
    updateProjectSaveIndicatorUI('dirty')
}

/**
 * Marks the project as clean (saved or initialized) and updates the UI.
 */
export function markProjectClean() {
    isDirty = false
    updateProjectSaveIndicatorUI('clean')
}

/**
 * Indicates that saving is in progress.
 */
export function setProjectSaving() {
    updateProjectSaveIndicatorUI('saving')
}

/**
 * Indicates that the project has been saved successfully.
 */
export function setProjectSaved() {
    isDirty = false
    updateProjectSaveIndicatorUI('saved')
}
