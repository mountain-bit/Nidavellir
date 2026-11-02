/**
 * Asset Rename Dialog Controller.
 * Prompts user for a new asset name using custom UI dialog.
 */

import { t } from '../../../../dist/Utils/translate.js'

/**
 * Prompts user for a new asset name using custom UI dialog (falls back to window.prompt).
 *
 * @param {object} asset Asset object with fileName and optional extension
 * @returns {Promise<string | null>}
 */
export function promptRenameAsset(asset) {
    if (!asset || !asset.fileName) return Promise.resolve(null)

    const dialog = document.getElementById('asset-rename-dialog')
    const input = document.getElementById('asset-rename-input')
    const extBadge = document.getElementById('asset-rename-ext-badge')
    const btnConfirm = document.getElementById('btn-confirm-asset-rename')
    const btnCancel = document.getElementById('btn-cancel-asset-rename')
    const btnCancelX = document.getElementById('btn-cancel-asset-rename-x')

    const currentBase = asset.fileName.replace(/\.[^/.]+$/, '')

    if (!dialog || !input || !btnConfirm) {
        const val = prompt(t('asset_manager.rename_label'), currentBase)
        return Promise.resolve(val ? val.trim() : null)
    }

    const ext = asset.extension ? `.${asset.extension}` : ''
    if (extBadge) extBadge.textContent = ext

    input.value = currentBase
    dialog.classList.remove('hidden')
    input.focus()
    input.select()

    return new Promise(resolve => {
        let isHandled = false

        const cleanup = () => {
            dialog.classList.add('hidden')
            btnConfirm.onclick = null
            if (btnCancel) btnCancel.onclick = null
            if (btnCancelX) btnCancelX.onclick = null
            input.onkeydown = null
        }

        const submit = () => {
            if (isHandled) return
            isHandled = true
            const val = input.value.trim()
            cleanup()
            resolve(val || null)
        }

        const cancel = () => {
            if (isHandled) return
            isHandled = true
            cleanup()
            resolve(null)
        }

        btnConfirm.onclick = submit
        if (btnCancel) btnCancel.onclick = cancel
        if (btnCancelX) btnCancelX.onclick = cancel

        input.onkeydown = e => {
            if (e.key === 'Enter') {
                e.preventDefault()
                submit()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
            }
        }
    })
}
