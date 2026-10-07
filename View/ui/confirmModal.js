/**
 * Unsaved Changes Confirmation Dialog Controller
 * Provides an accessible, reusable confirmation modal when attempting to close
 * the NPC modal, the active project, or the entire application with unsaved changes.
 */

import { t } from '../../dist/Utils/translate.js'

/**
 * Tracks project files with unsaved changes in memory.
 */
const dirtyFiles = new Set()

export function markFileDirty(fileName) {
    if (fileName && typeof fileName === 'string') {
        dirtyFiles.add(fileName)
    }
}

export function markFileClean(fileName) {
    if (fileName && typeof fileName === 'string') {
        dirtyFiles.delete(fileName)
    }
}

export function hasUnsavedFileChanges() {
    return dirtyFiles.size > 0
}

export function getUnsavedFiles() {
    return Array.from(dirtyFiles)
}

export function clearDirtyFiles() {
    dirtyFiles.clear()
}

/**
 * Displays the unsaved changes confirmation modal and resolves with user choice.
 *
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 * @param {string} [options.message]
 * @param {string} [options.saveLabel]
 * @param {string} [options.dontSaveLabel]
 * @param {string} [options.cancelLabel]
 * @returns {Promise<'save' | 'dont_save' | 'cancel'>}
 */
export function showUnsavedChangesModal(options = {}) {
    const modal = document.getElementById('unsaved-changes-modal')
    if (!modal) {
        return Promise.resolve('dont_save')
    }

    const titleEl = document.getElementById('unsaved-changes-title')
    const subtitleEl = document.getElementById('unsaved-changes-subtitle')
    const messageEl = document.getElementById('unsaved-changes-message')
    const btnSave = document.getElementById('btn-unsaved-save')
    const btnDontSave = document.getElementById('btn-unsaved-dont-save')
    const btnCancel = document.getElementById('btn-unsaved-cancel')
    const btnClose = document.getElementById('btn-unsaved-close')

    if (titleEl) {
        titleEl.textContent = options.title || t('unsaved_changes.title') || 'Niezapisane zmiany'
    }
    if (subtitleEl) {
        subtitleEl.textContent =
            options.subtitle || t('unsaved_changes.subtitle') || 'Utrata wprowadzonych danych'
    }
    if (messageEl) {
        messageEl.textContent =
            options.message ||
            t('unsaved_changes.default_message') ||
            'Czy na pewno chcesz wyjść? Masz niezapisane zmiany, które zostaną bezpowrotnie utracone.'
    }
    if (btnSave) {
        btnSave.textContent = options.saveLabel || t('unsaved_changes.btn_save') || 'Zapisz'
    }
    if (btnDontSave) {
        btnDontSave.textContent =
            options.dontSaveLabel || t('unsaved_changes.btn_dont_save') || 'Nie zapisuj'
    }
    if (btnCancel) {
        btnCancel.textContent = options.cancelLabel || t('unsaved_changes.btn_cancel') || 'Anuluj'
    }

    modal.classList.remove('hidden')

    return new Promise(resolve => {
        let isDone = false

        const cleanup = () => {
            if (isDone) return
            isDone = true
            modal.classList.add('hidden')
            btnSave?.removeEventListener('click', onSave)
            btnDontSave?.removeEventListener('click', onDontSave)
            btnCancel?.removeEventListener('click', onCancel)
            btnClose?.removeEventListener('click', onCancel)
            document.removeEventListener('keydown', onKeydown)
        }

        const onSave = e => {
            e?.preventDefault?.()
            cleanup()
            resolve('save')
        }

        const onDontSave = e => {
            e?.preventDefault?.()
            cleanup()
            resolve('dont_save')
        }

        const onCancel = e => {
            e?.preventDefault?.()
            cleanup()
            resolve('cancel')
        }

        const onKeydown = e => {
            if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                cleanup()
                resolve('cancel')
            } else if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                cleanup()
                resolve('save')
            }
        }

        btnSave?.addEventListener('click', onSave)
        btnDontSave?.addEventListener('click', onDontSave)
        btnCancel?.addEventListener('click', onCancel)
        btnClose?.addEventListener('click', onCancel)
        document.addEventListener('keydown', onKeydown)
    })
}

/**
 * Prompts user if there are unsaved changes before closing project or application.
 *
 * @param {'app' | 'project'} [target='app']
 * @param {object} [ctx]
 * @param {object} [helpers]
 * @param {() => boolean} [helpers.hasUnsavedNpc]
 * @param {() => Promise<void> | void} [helpers.saveNpc]
 * @param {(ctx: object) => Promise<void> | void} [helpers.saveFiles]
 * @returns {Promise<boolean>} Resolves to true if confirmed/saved, false if cancelled.
 */
export async function confirmApplicationClose(target = 'app', ctx = null, helpers = {}) {
    const hasUnsavedNpc =
        helpers.hasUnsavedNpc ||
        helpers.hasUnsavedNpcChanges ||
        (() => {
            if (
                typeof window !== 'undefined' &&
                typeof window.hasUnsavedNpcChanges === 'function'
            ) {
                return window.hasUnsavedNpcChanges()
            }
            return false
        })

    const saveFiles = helpers.saveFiles || helpers.saveAllUnsavedFiles
    const saveNpc = helpers.saveNpc || helpers.executeNpcModalSave

    const npcDirty = hasUnsavedNpc()
    const filesDirty = hasUnsavedFileChanges()

    if (!npcDirty && !filesDirty) {
        return true
    }

    const message =
        target === 'project'
            ? t('unsaved_changes.project_message') ||
              'Czy na pewno chcesz zamknąć projekt? Masz niezapisane zmiany w projekcie, które zostaną bezpowrotnie utracone.'
            : t('unsaved_changes.app_message') ||
              'Czy na pewno chcesz zamknąć aplikację? Masz niezapisane zmiany w projekcie, które zostaną bezpowrotnie utracone.'

    const choice = await showUnsavedChangesModal({
        title: t('unsaved_changes.title') || 'Niezapisane zmiany',
        message,
    })

    if (choice === 'save') {
        if (filesDirty && typeof saveFiles === 'function') {
            await saveFiles(ctx)
        }
        if (npcDirty) {
            if (typeof saveNpc === 'function') {
                await saveNpc()
            } else if (
                typeof window !== 'undefined' &&
                typeof window.executeNpcModalSave === 'function'
            ) {
                window.executeNpcModalSave()
            }
        }
        clearDirtyFiles()
        return true
    } else if (choice === 'dont_save') {
        clearDirtyFiles()
        return true
    } else {
        return false
    }
}
