/**
 * Editor Context Menu Module
 *
 * Handles the floating right-click context menu within rich text editors:
 * linking selection to project entities, editing existing mention badges,
 * and unlinking badges.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { openEntityLinkModal } from '../modals/entityLinkModal.js'

let activeEditorContextMenuData = null
let isContextMenuInitialized = false

/**
 * Returns current active context menu data payload (for testing and debugging).
 *
 * @returns {object|null}
 */
export function getActiveContextMenuData() {
    return activeEditorContextMenuData
}

/**
 * Hides the editor context menu.
 */
export function hideEditorContextMenu() {
    const menu = document.getElementById('editor-context-menu')
    if (menu) {
        menu.classList.add('hidden')
    }
    activeEditorContextMenuData = null
}

/**
 * Opens editor context menu for selection or badge.
 *
 * @param {number} x Screen X coordinate
 * @param {number} y Screen Y coordinate
 * @param {object} data
 * @param {HTMLElement} [data.badge]
 * @param {number|null} [data.badgePos]
 * @param {string} [data.selectedText]
 * @param {object} [data.editor]
 */
export function openEditorContextMenu(x, y, data = {}) {
    const menu = document.getElementById('editor-context-menu')
    if (!menu) return

    activeEditorContextMenuData = data

    const linkBtn = document.getElementById('ctx-editor-link-selection')
    const linkLabel = document.getElementById('ctx-editor-link-selection-label')
    const editBadgeBtn = document.getElementById('ctx-editor-edit-badge')
    const unlinkBadgeBtn = document.getElementById('ctx-editor-unlink-badge')

    let hasOptions = false

    if (data.selectedText && data.selectedText.trim()) {
        const textPreview = data.selectedText.trim()
        const truncated = textPreview.length > 20 ? textPreview.substring(0, 20) + '…' : textPreview
        if (linkLabel) {
            linkLabel.textContent = t('editor.context_menu.link_selection', { text: truncated })
        }
        if (linkBtn) linkBtn.classList.remove('hidden')
        hasOptions = true
    } else {
        if (linkBtn) linkBtn.classList.add('hidden')
    }

    if (data.badge) {
        if (editBadgeBtn) editBadgeBtn.classList.remove('hidden')
        if (unlinkBadgeBtn) unlinkBadgeBtn.classList.remove('hidden')
        hasOptions = true
    } else {
        if (editBadgeBtn) editBadgeBtn.classList.add('hidden')
        if (unlinkBadgeBtn) unlinkBadgeBtn.classList.add('hidden')
    }

    if (!hasOptions) {
        hideEditorContextMenu()
        return
    }

    const menuWidth = 220
    const menuHeight = 110
    const margin = 10

    let left = x
    let top = y

    if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin
    }
    if (left < margin) {
        left = margin
    }

    if (top + menuHeight > window.innerHeight - margin) {
        top = top - menuHeight
    }
    if (top < margin) {
        top = margin
    }

    menu.style.left = `${Math.round(left)}px`
    menu.style.top = `${Math.round(top)}px`
    menu.classList.remove('hidden')
}

/**
 * Sets up action handlers for the editor context menu.
 *
 * @param {object} editor Default editor fallback
 * @param {object} ctx Application UI Context
 */
export function setupEditorContextMenu(editor, ctx) {
    if (isContextMenuInitialized) return
    isContextMenuInitialized = true

    const linkBtn = document.getElementById('ctx-editor-link-selection')
    const editBadgeBtn = document.getElementById('ctx-editor-edit-badge')
    const unlinkBadgeBtn = document.getElementById('ctx-editor-unlink-badge')

    linkBtn?.addEventListener('click', () => {
        const data = activeEditorContextMenuData
        hideEditorContextMenu()
        const targetEditor = data?.editor || editor
        if (data?.selectedText) {
            openEntityLinkModal(targetEditor, ctx, {
                initialLabel: data.selectedText.trim(),
                point: { x: data.x, y: data.y },
            })
        }
    })

    editBadgeBtn?.addEventListener('click', () => {
        const data = activeEditorContextMenuData
        hideEditorContextMenu()
        const targetEditor = data?.editor || editor
        if (data?.badge) {
            const id = data.badge.getAttribute('data-entity-id') || ''
            const type = data.badge.getAttribute('data-entity-type') || 'location'
            const label =
                data.badge.getAttribute('data-label') || data.badge.textContent?.trim() || id
            const rect = data.badge.getBoundingClientRect()
            openEntityLinkModal(targetEditor, ctx, {
                initialLabel: label,
                initialEntityId: id,
                initialType: type,
                badgePos: data.badgePos,
                targetRect: rect,
            })
        }
    })

    unlinkBadgeBtn?.addEventListener('click', () => {
        const data = activeEditorContextMenuData
        hideEditorContextMenu()
        const targetEditor = data?.editor || editor
        if (data?.badge && typeof targetEditor.unlinkEntityMention === 'function') {
            const label =
                data.badge.getAttribute('data-label') || data.badge.textContent?.trim() || ''
            targetEditor.unlinkEntityMention(data.badgePos, label)
            toast.info(t('editor.entity_modal.toast_unlinked'), t('editor.sync_title'))
        }
    })

    document.addEventListener('click', e => {
        const menu = document.getElementById('editor-context-menu')
        if (menu && !menu.contains(e.target)) {
            hideEditorContextMenu()
        }
    })
}

/**
 * Attaches right-click context menu trigger to an editor DOM container.
 *
 * @param {HTMLElement} mount Editor mount container
 * @param {object} editor MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {() => boolean} [canTrigger] Guard function (e.g. check for active file)
 */
export function attachEditorContextMenuListener(mount, editor, ctx, canTrigger = () => true) {
    if (!mount) return

    mount.addEventListener('contextmenu', e => {
        if (!canTrigger()) return

        const target = e.target
        const badge = target?.closest?.('.entity-mention-badge')
        const selectedText =
            typeof editor.getSelectedText === 'function' ? editor.getSelectedText() : ''

        if (badge || (selectedText && selectedText.trim().length > 0)) {
            e.preventDefault()
            e.stopPropagation()

            const treeCtxMenu = document.getElementById('custom-context-menu')
            if (treeCtxMenu) treeCtxMenu.classList.add('hidden')

            let badgePos = null
            if (badge) {
                try {
                    const rawEditor = editor.getRawEditor()
                    const view = rawEditor?.view
                    if (view && typeof view.posAtDOM === 'function') {
                        badgePos = view.posAtDOM(badge, 0)
                    }
                } catch {
                    badgePos = null
                }
            }

            openEditorContextMenu(e.clientX, e.clientY, {
                editor,
                x: e.clientX,
                y: e.clientY,
                badge,
                badgePos,
                selectedText,
            })
        }
    })
}
