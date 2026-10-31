import { CustomStylesService, MarkdownEditor } from '../../../../dist/Modules/Editor/index.js'
import { t } from '../../../../dist/Utils/translate.js'
import { extractAvailableProjectEntities, openEntityLinkModal } from '../modals/entityLinkModal.js'
import {
    attachEditorContextMenuListener,
    setupEditorContextMenu,
} from '../toolbar/editorContextMenu.js'
import { setupToolbarButtons, updateToolbarActiveStates } from '../toolbar/editorToolbar.js'
import {
    setupEditorImageDoubleClickHandler,
    setupEditorImageDropZone,
} from '../utils/editorImageHelpers.js'

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

    setupEditorImageDropZone(mount, () => npcEditorInstance, ctx)
    attachEditorContextMenuListener(mount, npcEditorInstance, ctx)
    setupEditorImageDoubleClickHandler(mount, () => npcEditorInstance, ctx)

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
