import { CustomStylesService, MarkdownEditor } from '../../../../dist/Modules/Editor/index.js'
import { extractAvailableProjectEntities, openEntityLinkModal } from '../modals/entityLinkModal.js'
import { setupEditorContextMenu } from '../toolbar/editorContextMenu.js'
import { setupToolbarButtons, updateToolbarActiveStates } from '../toolbar/editorToolbar.js'
import {
    setupEditorImageDoubleClickHandler,
    setupEditorImageDropZone,
} from '../utils/editorImageHelpers.js'

let heroEditorInstance = null

export function getHeroEditorInstance() {
    return heroEditorInstance
}

export function updateHeroEditorStats() {
    // Kept as safe no-op since word and char count badges were removed per user request
}

export function destroyHeroEditor() {
    if (heroEditorInstance) {
        if (typeof heroEditorInstance.destroy === 'function') {
            try {
                heroEditorInstance.destroy()
            } catch {
                // Ignore teardown errors
            }
        }
        heroEditorInstance = null
    }
}

export function getOrCreateHeroEditor(ctx) {
    if (heroEditorInstance) return heroEditorInstance

    const mount = document.getElementById('hero-rich-editor-mount')
    if (!mount) return null

    const textarea = document.getElementById('hero-description-textarea')
    const initialText = textarea ? textarea.value : ''

    try {
        heroEditorInstance = new MarkdownEditor({
            element: mount,
            initialContent: initialText,
            editable: true,
            getCustomStyles: () => CustomStylesService.getStyles(ctx?.projectData),
            getProjectEntities: () => extractAvailableProjectEntities(ctx?.projectData || ctx),
            onUpdate: markdown => {
                if (textarea) {
                    textarea.value = markdown
                }
            },
            onEntityClick: entity => {
                openEntityLinkModal(heroEditorInstance, ctx, {
                    initialLabel: entity.label || entity.name,
                    initialEntityId: entity.id,
                    initialType: entity.type,
                    badgePos: entity.pos,
                    targetRect: entity.rect,
                    point: entity.clientPoint,
                })
            },
            onSelectionUpdate: activeStates => {
                updateToolbarActiveStates(activeStates, ctx, { prefix: 'hero-' })
            },
        })

        heroEditorInstance.setContent = content => {
            if (typeof heroEditorInstance.setMarkdown === 'function') {
                heroEditorInstance.setMarkdown(content || '')
            }
        }

        setupToolbarButtons(heroEditorInstance, ctx, { prefix: 'hero-' })
        setupEditorContextMenu(heroEditorInstance, ctx)

        setupEditorImageDropZone(mount, () => heroEditorInstance, ctx)
        setupEditorImageDoubleClickHandler(mount, () => heroEditorInstance, ctx)

        updateHeroEditorStats(heroEditorInstance)
        return heroEditorInstance
    } catch (err) {
        console.warn('Could not initialize rich Hero editor, fallback to textarea:', err)
        return null
    }
}
