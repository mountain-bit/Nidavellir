import {
    CustomStylesService,
    EntitySyncService,
    MarkdownEditor,
} from '../../../dist/Modules/Editor/index.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { importDroppedImage, setupElementDropZone } from '../assets/assetPicker.js'
import { openImageEditor } from '../assets/imageEditorModal.js'
import { markFileDirty } from '../modals/confirmModal.js'
import { openDescriptionEmbedModal } from './descriptionEmbedModal.js'
import { setupToolbarButtons, updateToolbarActiveStates } from './editorToolbar.js'
import { extractAvailableProjectEntities, openEntityLinkModal } from './entityLinkModal.js'

let mainEditorInstance = null

/**
 * Returns current main editor instance or null if not yet initialized.
 */
export function getMainEditorInstance() {
    return mainEditorInstance
}

/**
 * Updates words and characters counter in editor footer.
 *
 * @param {object} editor Active editor instance
 */
export function updateEditorStats(editor) {
    const statsEl = document.getElementById('editor-stats')
    if (!statsEl || !editor) return
    const words = editor.getWordCount()
    const chars = editor.getCharacterCount()
    statsEl.textContent = t('editor.stats', { words, chars })
}

/**
 * Automatically syncs mentioned entities with the currently active scene/paragraph/NPC.
 *
 * @param {object} ctx Application UI Context
 * @param {Array<{ id: string, name: string, type: string }>} entities
 */
export function syncEntitiesWithActiveObject(ctx, entities) {
    const selectedItem = ctx.vm && ctx.vm.getSelectedItem ? ctx.vm.getSelectedItem() : null
    if (!selectedItem || !selectedItem.entity) return

    const entityObj = selectedItem.entity
    let changed = false

    if (
        typeof entityObj.addLocation === 'function' &&
        typeof entityObj.addCharacter === 'function'
    ) {
        const syncRes = EntitySyncService.syncWithParagraph(entityObj, entities, ctx.projectData)
        if (syncRes.changed) {
            changed = true
            if (syncRes.addedLocations.length > 0) {
                toast.info(
                    t('editor.sync_location', { names: syncRes.addedLocations.join(', ') }),
                    t('editor.sync_title')
                )
            }
            if (syncRes.addedCharacters.length > 0) {
                toast.info(
                    t('editor.sync_character', { names: syncRes.addedCharacters.join(', ') }),
                    t('editor.sync_title')
                )
            }
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    t('editor.sync_tag', { names: syncRes.addedTags.join(', ') }),
                    t('editor.sync_title')
                )
            }
        }
    } else if (typeof entityObj.addTag === 'function') {
        const syncRes = EntitySyncService.syncWithNPC(entityObj, entities, ctx.projectData)
        if (syncRes.changed) {
            changed = true
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    t('editor.sync_trait', { names: syncRes.addedTags.join(', ') }),
                    t('editor.sync_title')
                )
            }
        }
    }

    if (changed && typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
}

let activeEditorContextMenuData = null
let isContextMenuInitialized = false

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
 * @param {number} x
 * @param {number} y
 * @param {object} data
 */
export function openEditorContextMenu(x, y, data) {
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
 * @param {object} editor
 * @param {object} ctx
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
 * Sets visual and functional active state of the editor.
 * When false, the editor mount, subheader stats, and toolbar are hidden/disabled,
 * and the empty state placeholder is displayed.
 *
 * @param {boolean} isActive
 * @param {object} [editor]
 */
export function setEditorActiveState(isActive, editor = mainEditorInstance) {
    const emptyState = document.getElementById('editor-empty-state')
    const mount = document.getElementById('rich-editor-mount')
    const toolbar = document.getElementById('editor-toolbar')
    const statsEl = document.getElementById('editor-stats')
    const activeLabel = document.getElementById('active-file-label')

    if (isActive) {
        if (emptyState) emptyState.classList.add('hidden')
        if (mount) mount.classList.remove('hidden')
        if (toolbar) toolbar.classList.remove('hidden')
        if (statsEl) statsEl.classList.remove('hidden')
        if (editor && typeof editor.setEditable === 'function') {
            editor.setEditable(true)
        }
    } else {
        if (emptyState) emptyState.classList.remove('hidden')
        if (mount) mount.classList.add('hidden')
        if (toolbar) toolbar.classList.add('hidden')
        if (statsEl) {
            statsEl.classList.add('hidden')
            statsEl.textContent = ''
        }
        if (activeLabel) {
            activeLabel.textContent = t('editor.no_open_file')
        }
        if (editor && typeof editor.setEditable === 'function') {
            editor.setEditable(false)
        }
        if (editor && typeof editor.setMarkdown === 'function') {
            editor.setMarkdown('')
        }
    }
}

/**
 * Creates or retrieves the singleton MarkdownEditor instance.
 *
 * @param {object} ctx Application UI Context
 * @returns {MarkdownEditor | null}
 */
export function getOrCreateMainEditor(ctx) {
    if (mainEditorInstance) return mainEditorInstance

    const mount = document.getElementById('rich-editor-mount')
    if (!mount) return null

    const hasActiveFile = Boolean(ctx?.vm?.getActiveFile?.())

    mainEditorInstance = new MarkdownEditor({
        element: mount,
        initialContent: '',
        editable: hasActiveFile,
        getCustomStyles: () => CustomStylesService.getStyles(ctx?.projectData),
        getProjectEntities: () => extractAvailableProjectEntities(ctx?.projectData || ctx),
        onUpdate: (markdown, entities) => {
            const active = ctx.vm.getActiveFile()
            if (active) {
                markFileDirty(active)
                ctx.files[active] = markdown
                const fileEditor = document.getElementById('file-editor')
                if (fileEditor) fileEditor.value = markdown

                const saveStatus = document.getElementById('save-status')
                if (saveStatus) {
                    saveStatus.textContent = `• ${t('editor.unsaved_changes')}`
                    saveStatus.className = 'text-[11px] text-amber-400 font-medium'
                }

                updateEditorStats(mainEditorInstance)
                syncEntitiesWithActiveObject(ctx, entities)
            }
        },
        onEntityClick: entity => {
            openEntityLinkModal(mainEditorInstance, ctx, {
                initialLabel: entity.label || entity.name,
                initialEntityId: entity.id,
                initialType: entity.type,
                badgePos: entity.pos,
                targetRect: entity.rect,
                point: entity.clientPoint,
            })
        },
        onDescriptionEmbedClick: embed => {
            openDescriptionEmbedModal(mainEditorInstance, ctx, {
                initialEntityId: embed.id,
                initialType: embed.type,
                initialVariant: embed.variant,
                embedPos: embed.pos,
                targetRect: embed.rect,
                point: embed.clientPoint,
            })
        },
        onSelectionUpdate: activeStates => {
            updateToolbarActiveStates(activeStates, ctx)
        },
    })

    setupToolbarButtons(mainEditorInstance, ctx)
    setupEditorContextMenu(mainEditorInstance, ctx)

    setupElementDropZone(mount, {
        highlightClass: 'ring-2 ring-blue-500 bg-blue-500/10',
        onFileDrop: async file => {
            if (!ctx?.vm?.getActiveFile?.()) {
                toast.warning(
                    t('editor.no_open_file') || 'Otwórz najpierw plik, aby wstawić grafikę'
                )
                return
            }
            const imported = await importDroppedImage(file, ctx, 'img')
            if (imported) {
                mainEditorInstance.setImage({
                    src: imported.relativePath,
                    alt: imported.fileName,
                })
                toast.success(t('asset.image_inserted') || 'Grafika została wstawiona')
            }
        },
    })

    const fileEditor = document.getElementById('file-editor')
    if (fileEditor) {
        setupElementDropZone(fileEditor, {
            highlightClass: 'ring-2 ring-blue-500 bg-blue-500/10',
            onFileDrop: async file => {
                const imported = await importDroppedImage(file, ctx, 'img')
                if (imported) {
                    const snippet = `\n\n![${imported.fileName}](${imported.relativePath})\n`
                    fileEditor.value += snippet
                    const active = ctx?.vm?.getActiveFile?.()
                    if (active && ctx.files) {
                        ctx.files[active] = fileEditor.value
                    }
                    toast.success(t('asset.image_inserted') || 'Grafika została wstawiona')
                }
            },
        })
    }

    const emptyStateGraphBtn = document.getElementById('btn-empty-state-open-graph')
    emptyStateGraphBtn?.addEventListener('click', () => {
        if (ctx?.vm?.setActiveMainView) {
            ctx.vm.setActiveMainView('graph')
            const graphBtn = document.getElementById('view-mode-graph-btn')
            graphBtn?.click()
        }
    })

    setEditorActiveState(hasActiveFile, mainEditorInstance)

    mount.addEventListener('contextmenu', e => {
        if (!ctx?.vm?.getActiveFile?.()) return

        const target = e.target
        const badge = target?.closest?.('.entity-mention-badge')
        const selectedText =
            typeof mainEditorInstance.getSelectedText === 'function'
                ? mainEditorInstance.getSelectedText()
                : ''

        if (badge || (selectedText && selectedText.trim().length > 0)) {
            e.preventDefault()
            e.stopPropagation()

            const treeCtxMenu = document.getElementById('custom-context-menu')
            if (treeCtxMenu) treeCtxMenu.classList.add('hidden')

            let badgePos = null
            if (badge) {
                try {
                    const rawEditor = mainEditorInstance.getRawEditor()
                    const view = rawEditor?.view
                    if (view && typeof view.posAtDOM === 'function') {
                        badgePos = view.posAtDOM(badge, 0)
                    }
                } catch {
                    badgePos = null
                }
            }

            openEditorContextMenu(e.clientX, e.clientY, {
                x: e.clientX,
                y: e.clientY,
                badge,
                badgePos,
                selectedText,
            })
        }
    })

    mount.addEventListener('dblclick', e => {
        if (!ctx?.vm?.getActiveFile?.()) return

        const target = e.target
        const img =
            target?.closest?.('img.gamebook-image') ||
            (target?.tagName === 'IMG' && target.closest?.('.gamebook-image-container')
                ? target
                : null)

        if (!img) return

        e.preventDefault()
        e.stopPropagation()

        const rawSrc = img.getAttribute('src') || ''
        if (!rawSrc) return

        let imgPos = null
        try {
            const rawEditor = mainEditorInstance.getRawEditor()
            const view = rawEditor?.view
            if (view && typeof view.posAtDOM === 'function') {
                imgPos = view.posAtDOM(img, 0)
            }
        } catch {
            imgPos = null
        }

        openImageEditor(ctx, {
            src: rawSrc,
            onSave: ({ relativePath, fileName }) => {
                if (
                    typeof imgPos === 'number' &&
                    typeof mainEditorInstance.updateImage === 'function'
                ) {
                    const success = mainEditorInstance.updateImage(imgPos, {
                        src: relativePath,
                        alt: fileName || img.getAttribute('alt') || '',
                    })
                    if (success) return
                }
                mainEditorInstance.setImage({
                    src: relativePath,
                    alt: fileName || img.getAttribute('alt') || '',
                })
            },
        })
    })

    return mainEditorInstance
}
