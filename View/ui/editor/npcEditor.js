import { CustomStylesService, MarkdownEditor } from '../../../dist/Modules/Editor/index.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { importDroppedImage, setupElementDropZone } from '../assetPicker.js'
import { openImageEditor } from '../imageEditorModal.js'
import { setupToolbarButtons, updateToolbarActiveStates } from './editorToolbar.js'
import { extractAvailableProjectEntities, openEntityLinkModal } from './entityLinkModal.js'
import { openEditorContextMenu, setupEditorContextMenu } from './mainEditor.js'

let npcEditorInstance = null

/**
 * Returns current NPC editor instance or null if not yet initialized.
 *
 * @returns {object|null}
 */
export function getNpcEditorInstance() {
    return npcEditorInstance
}

/**
 * Updates words and characters counter in NPC editor header/footer.
 *
 * @param {object} [editor=npcEditorInstance] Active NPC editor instance
 */
export function updateNpcEditorStats(editor = npcEditorInstance) {
    const statsEl = document.getElementById('npc-editor-stats')
    if (!statsEl || !editor) return
    const words = typeof editor.getWordCount === 'function' ? editor.getWordCount() : 0
    const chars = typeof editor.getCharacterCount === 'function' ? editor.getCharacterCount() : 0
    statsEl.textContent = t('editor.stats', { words, chars })
}

/**
 * Destroys current NPC editor instance.
 */
export function destroyNpcEditor() {
    if (npcEditorInstance) {
        if (typeof npcEditorInstance.destroy === 'function') {
            try {
                npcEditorInstance.destroy()
            } catch {
                // Ignore teardown errors
            }
        }
        npcEditorInstance = null
    }
}

/**
 * Creates or retrieves the NPC MarkdownEditor instance.
 *
 * @param {object} ctx Application UI Context
 * @returns {object|null}
 */
export function getOrCreateNpcEditor(ctx) {
    if (npcEditorInstance) return npcEditorInstance

    const mount = document.getElementById('npc-rich-editor-mount')
    if (!mount) return null

    const textarea = document.getElementById('npc-description-textarea')
    const initialText = textarea ? textarea.value : ''

    npcEditorInstance = new MarkdownEditor({
        element: mount,
        initialContent: initialText,
        editable: true,
        getCustomStyles: () => CustomStylesService.getStyles(ctx?.projectData),
        getProjectEntities: () => extractAvailableProjectEntities(ctx?.projectData || ctx),
        onUpdate: markdown => {
            if (textarea) {
                textarea.value = markdown
            }
            updateNpcEditorStats(npcEditorInstance)
        },
        onEntityClick: entity => {
            openEntityLinkModal(npcEditorInstance, ctx, {
                initialLabel: entity.label || entity.name,
                initialEntityId: entity.id,
                initialType: entity.type,
                badgePos: entity.pos,
                targetRect: entity.rect,
                point: entity.clientPoint,
            })
        },
        onSelectionUpdate: activeStates => {
            updateToolbarActiveStates(activeStates, ctx, { prefix: 'npc-' })
        },
    })

    setupToolbarButtons(npcEditorInstance, ctx, { prefix: 'npc-' })
    setupEditorContextMenu(npcEditorInstance, ctx)

    // Setup dropzone for dragging images directly into NPC editor
    setupElementDropZone(mount, {
        highlightClass: 'ring-2 ring-blue-500 bg-blue-500/10',
        onFileDrop: async file => {
            const imported = await importDroppedImage(file, ctx, 'img')
            if (imported) {
                npcEditorInstance.setImage({
                    src: imported.relativePath,
                    alt: imported.fileName,
                })
                toast.success(t('asset.image_inserted') || 'Grafika została wstawiona')
            }
        },
    })

    // Setup right click context menu for selection and mention badges
    mount.addEventListener('contextmenu', e => {
        const target = e.target
        const badge = target?.closest?.('.entity-mention-badge')
        const selectedText =
            typeof npcEditorInstance.getSelectedText === 'function'
                ? npcEditorInstance.getSelectedText()
                : ''

        if (badge || (selectedText && selectedText.trim().length > 0)) {
            e.preventDefault()
            e.stopPropagation()

            let badgePos = null
            if (badge) {
                try {
                    const rawEditor = npcEditorInstance.getRawEditor()
                    const view = rawEditor?.view
                    if (view && typeof view.posAtDOM === 'function') {
                        badgePos = view.posAtDOM(badge, 0)
                    }
                } catch {
                    badgePos = null
                }
            }

            openEditorContextMenu(e.clientX, e.clientY, {
                editor: npcEditorInstance,
                x: e.clientX,
                y: e.clientY,
                badge,
                badgePos,
                selectedText,
            })
        }
    })

    // Setup double click to edit images
    mount.addEventListener('dblclick', e => {
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
            const rawEditor = npcEditorInstance.getRawEditor()
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
                    typeof npcEditorInstance.updateImage === 'function'
                ) {
                    const success = npcEditorInstance.updateImage(imgPos, {
                        src: relativePath,
                        alt: fileName || img.getAttribute('alt') || '',
                    })
                    if (success) return
                }
                npcEditorInstance.setImage({
                    src: relativePath,
                    alt: fileName || img.getAttribute('alt') || '',
                })
            },
        })
    })

    // Keep rich editor in sync if raw textarea value changes via input event
    if (textarea) {
        textarea.addEventListener('input', () => {
            if (
                npcEditorInstance &&
                typeof npcEditorInstance.setMarkdown === 'function' &&
                npcEditorInstance.getMarkdown() !== textarea.value
            ) {
                npcEditorInstance.setMarkdown(textarea.value)
                updateNpcEditorStats(npcEditorInstance)
            }
        })
    }

    updateNpcEditorStats(npcEditorInstance)

    return npcEditorInstance
}
