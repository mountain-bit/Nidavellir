import {
    CustomStylesService,
    EntitySyncService,
    MarkdownEditor,
} from '../../../../dist/Modules/Editor/index.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { importDroppedImage, setupElementDropZone } from '../../assets/assetPicker.js'
import { markFileDirty } from '../../modals/confirm/confirmModal.js'
import { openDescriptionEmbedModal } from '../modals/descriptionEmbedModal.js'
import { extractAvailableProjectEntities, openEntityLinkModal } from '../modals/entityLinkModal.js'
import {
    attachEditorContextMenuListener,
    hideEditorContextMenu,
    openEditorContextMenu,
    setupEditorContextMenu,
} from '../toolbar/editorContextMenu.js'
import { setupToolbarButtons, updateToolbarActiveStates } from '../toolbar/editorToolbar.js'
import {
    setupEditorImageDoubleClickHandler,
    setupEditorImageDropZone,
} from '../utils/editorImageHelpers.js'

export { hideEditorContextMenu, openEditorContextMenu, setupEditorContextMenu }

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
    const selection = ctx?.vm?.selection
    const selectedItem = selection?.getSelectedItem ? selection.getSelectedItem() : null
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

    const hasActiveFile = Boolean(ctx?.vm?.files?.getActiveFile?.())

    mainEditorInstance = new MarkdownEditor({
        element: mount,
        initialContent: '',
        editable: hasActiveFile,
        getCustomStyles: () => CustomStylesService.getStyles(ctx?.projectData),
        getProjectEntities: () => extractAvailableProjectEntities(ctx?.projectData || ctx),
        onUpdate: (markdown, entities) => {
            const files = ctx?.vm?.files
            const active = files?.getActiveFile ? files.getActiveFile() : null
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

    setupEditorImageDropZone(mount, () => mainEditorInstance, ctx, {
        canDrop: () => Boolean(ctx?.vm?.files?.getActiveFile?.()),
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
                    const active = ctx?.vm?.files?.getActiveFile?.()
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
        const layout = ctx?.vm?.layout
        if (layout?.setActiveMainView) {
            layout.setActiveMainView('graph')
            const graphBtn = document.getElementById('view-mode-graph-btn')
            graphBtn?.click()
        }
    })

    setEditorActiveState(hasActiveFile, mainEditorInstance)

    attachEditorContextMenuListener(mount, mainEditorInstance, ctx, () =>
        Boolean(ctx?.vm?.files?.getActiveFile?.())
    )

    setupEditorImageDoubleClickHandler(
        mount,
        () => mainEditorInstance,
        ctx,
        () => Boolean(ctx?.vm?.files?.getActiveFile?.())
    )

    return mainEditorInstance
}
