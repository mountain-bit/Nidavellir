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
    const text = titleEl?.textContent?.trim()
    const placeholder =
        (typeof t === 'function' ? t('topbar.project_placeholder') : '') || 'Brak projektu'
    if (text && text !== placeholder && text !== 'No project' && text !== 'Kein Projekt') {
        return text
    }
    return 'Projekt'
}

/**
 * Updates the project name display in the top bar and syncs window title.
 * If a name is present, it removes data-i18n to prevent translation overrides.
 * If no name is provided, it applies the localized project placeholder.
 *
 * @param {string} [name] - Project name to display.
 */
export function updateProjectNameUI(name) {
    if (typeof document === 'undefined') return

    const titleEl = document.getElementById('project-name-display')
    const cleanName = (name || '').trim()

    if (titleEl) {
        if (cleanName) {
            titleEl.textContent = cleanName
            titleEl.removeAttribute('data-i18n')
            titleEl.title = cleanName
            titleEl.classList.remove('italic', 'text-zinc-400')
            titleEl.classList.add('text-zinc-200')
        } else {
            const placeholder =
                (typeof t === 'function' ? t('topbar.project_placeholder') : '') || 'Brak projektu'
            titleEl.setAttribute('data-i18n', 'topbar.project_placeholder')
            titleEl.textContent = placeholder
            titleEl.title = placeholder
            titleEl.classList.add('italic', 'text-zinc-400')
            titleEl.classList.remove('text-zinc-200')
        }
    }

    const currentName =
        cleanName ||
        (typeof t === 'function' ? t('topbar.project_placeholder') : '') ||
        'Brak projektu'
    updateProjectSaveIndicatorUI(isProjectDirty() ? 'dirty' : 'clean', currentName)
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

        document.title = `• ${projectName} (${unsavedLabel}) - Nidavelir`

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

        document.title = `Zapisywanie: ${projectName} - Nidavelir`
    } else if (state === 'saved') {
        const savedLabel = resolveText('toast.save_success', 'Zapisano')

        if (indicatorEl) {
            indicatorEl.textContent = savedLabel.startsWith('•') ? savedLabel : `• ${savedLabel}`
            indicatorEl.className =
                'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/25'
        }

        document.title = `${projectName} - Nidavelir`

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
        document.title = `${projectName} - Nidavelir`
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
