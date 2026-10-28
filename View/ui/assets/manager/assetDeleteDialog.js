/**
 * Asset Deletion Confirmation Dialog Controller.
 * Prompts user to confirm asset deletion with usage warnings.
 */

import { t } from '../../../../dist/Utils/translate.js'

/**
 * Confirms asset deletion with usage warnings using custom UI dialog (falls back to window.confirm).
 *
 * @param {object} asset Asset object
 * @param {Array<object>} [usages=[]] Array of entity usage objects
 * @returns {Promise<boolean>}
 */
export function confirmDeleteAsset(asset, usages = []) {
    if (!asset) return Promise.resolve(false)

    const dialog = document.getElementById('asset-delete-dialog')
    const msgEl = document.getElementById('asset-delete-message')
    const warnBox = document.getElementById('asset-delete-warning-box')
    const warnDetails = document.getElementById('asset-delete-warning-details')
    const btnConfirm = document.getElementById('btn-confirm-asset-delete')
    const btnCancel = document.getElementById('btn-cancel-asset-delete')

    if (!dialog || !btnConfirm) {
        let confirmMsg = `${t('asset_manager.delete_message')} (${asset.fileName})`
        if (usages.length > 0) {
            confirmMsg = `${t('asset_manager.delete_warning_used')}\n${usages.map(u => u.name).join(', ')}\n${t('asset_manager.delete_warning_hint')}\n\n${confirmMsg}`
        }
        return Promise.resolve(confirm(confirmMsg))
    }

    if (msgEl) {
        msgEl.textContent = `${t('asset_manager.delete_message')} (${asset.fileName})`
    }

    if (usages.length > 0) {
        if (warnBox) warnBox.classList.remove('hidden')
        if (warnDetails) {
            const places = usages.map(u => `${u.name} (${u.field})`).join(', ')
            warnDetails.textContent =
                t('asset_manager.used_in_prefix', { places }) || `Used in: ${places}`
        }
    } else {
        if (warnBox) warnBox.classList.add('hidden')
    }

    dialog.classList.remove('hidden')

    return new Promise(resolve => {
        let isHandled = false

        const onKeyDown = e => {
            if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
            }
        }

        const cleanup = () => {
            dialog.classList.add('hidden')
            btnConfirm.onclick = null
            if (btnCancel) btnCancel.onclick = null
            window.removeEventListener('keydown', onKeyDown)
        }

        const submit = () => {
            if (isHandled) return
            isHandled = true
            cleanup()
            resolve(true)
        }

        const cancel = () => {
            if (isHandled) return
            isHandled = true
            cleanup()
            resolve(false)
        }

        window.addEventListener('keydown', onKeyDown)
        btnConfirm.onclick = submit
        if (btnCancel) btnCancel.onclick = cancel
    })
}
