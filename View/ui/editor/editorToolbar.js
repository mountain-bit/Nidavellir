import { CustomStylesService } from '../../../dist/Modules/Editor/index.js'
import { t } from '../../../dist/Utils/translate.js'
import { pickProjectImage } from '../assets/assetPicker.js'
import { setupCustomStylesUI } from './customStylesMenu.js'
import { openDescriptionEmbedModal } from './descriptionEmbedModal.js'
import { openEntityLinkModal } from './entityLinkModal.js'

export const TOOLBAR_BUTTON_STATE_MAP = [
    { id: 'btn-editor-p', key: 'paragraph' },
    { id: 'btn-editor-h1', key: 'h1' },
    { id: 'btn-editor-h2', key: 'h2' },
    { id: 'btn-editor-h3', key: 'h3' },
    { id: 'btn-editor-h4', key: 'h4' },
    { id: 'btn-editor-h5', key: 'h5' },
    { id: 'btn-editor-bold', key: 'bold' },
    { id: 'btn-editor-italic', key: 'italic' },
    { id: 'btn-editor-underline', key: 'underline' },
    { id: 'btn-editor-strike', key: 'strike' },
    { id: 'btn-editor-bullet-list', key: 'bulletList' },
    { id: 'btn-editor-ordered-list', key: 'orderedList' },
    { id: 'btn-editor-quote', key: 'blockquote' },
    { id: 'btn-editor-dialog', key: 'dialog' },
]

/**
 * Returns toolbar button mappings, optionally prefixed for scoped toolbars.
 *
 * @param {string} [prefix='']
 * @returns {Array<{ id: string, key: string }>}
 */
export function getToolbarButtonMap(prefix = '') {
    if (!prefix) return TOOLBAR_BUTTON_STATE_MAP
    return TOOLBAR_BUTTON_STATE_MAP.map(item => ({
        id: `${prefix}${item.id}`,
        key: item.key,
    }))
}

/**
 * Updates CSS active highlights for editor toolbar buttons based on selection state.
 *
 * @param {object} activeStates State map from TipTap activeFormatting
 * @param {object} ctx Application UI Context
 * @param {object} [options] Optional options with prefix or buttonMap
 */
export function updateToolbarActiveStates(activeStates, ctx, options = {}) {
    if (!activeStates) return
    const prefix = options.prefix || ''
    const buttonMap = options.buttonMap || getToolbarButtonMap(prefix)

    buttonMap.forEach(({ id, key }) => {
        const btn = document.getElementById(id)
        if (!btn) return
        const isActive = Boolean(activeStates[key])
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false')
        if (isActive) {
            btn.classList.add('bg-blue-600/30', 'text-blue-300', 'ring-1', 'ring-blue-500/50')
            btn.classList.remove('text-zinc-300', 'text-zinc-400')
        } else {
            btn.classList.remove('bg-blue-600/30', 'text-blue-300', 'ring-1', 'ring-blue-500/50')
            if (id.endsWith('h4') || id.endsWith('h5')) {
                btn.classList.add('text-zinc-400')
            } else {
                btn.classList.add('text-zinc-300')
            }
        }
    })

    const customStylesBtn =
        document.getElementById(`${prefix}btn-editor-custom-styles-dropdown`) ||
        (!prefix ? document.getElementById('btn-editor-custom-styles-dropdown') : null)
    const activeLabel =
        document.getElementById(`${prefix}label-active-custom-style`) ||
        (!prefix ? document.getElementById('label-active-custom-style') : null)

    if (customStylesBtn && activeLabel) {
        if (activeStates.customStyle && activeStates.activeCustomStyleId) {
            const styles = CustomStylesService.getStyles(ctx?.projectData)
            const matched = styles.find(s => s.id === activeStates.activeCustomStyleId)
            activeLabel.textContent = matched
                ? matched.name
                : t('editor.toolbar.custom_style') || 'Własny styl'
            customStylesBtn.setAttribute('aria-pressed', 'true')
            customStylesBtn.classList.add(
                'bg-blue-600/30',
                'text-blue-300',
                'ring-1',
                'ring-blue-500/50'
            )
        } else {
            activeLabel.textContent = t('editor.toolbar.styles_label') || 'Style tekstu'
            customStylesBtn.setAttribute('aria-pressed', 'false')
            customStylesBtn.classList.remove(
                'bg-blue-600/30',
                'text-blue-300',
                'ring-1',
                'ring-blue-500/50'
            )
        }
    }
}

let defaultToolbarInitialized = false

/**
 * Sets up formatting button clicks and entity mention menu in the editor toolbar.
 *
 * @param {object} editor MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {object} [options] Optional options with prefix (e.g. 'npc-')
 */
export function setupToolbarButtons(editor, ctx, options = {}) {
    if (!editor) return
    const prefix = options.prefix || ''
    const toolbarEl =
        options.toolbarEl ||
        document.getElementById(`${prefix}editor-toolbar`) ||
        (!prefix ? document.getElementById('editor-toolbar') : null)

    if (toolbarEl && toolbarEl.dataset.toolbarInitialized === 'true') {
        return
    }
    if (toolbarEl) {
        toolbarEl.dataset.toolbarInitialized = 'true'
    } else if (!prefix && defaultToolbarInitialized) {
        return
    }
    if (!prefix) {
        defaultToolbarInitialized = true
    }

    const bindClick = (id, fn) => {
        const btn =
            document.getElementById(`${prefix}${id}`) ||
            (!prefix ? document.getElementById(id) : null)
        if (btn) {
            btn.addEventListener('click', e => {
                e.preventDefault()
                fn()
                if (typeof editor.getActiveFormatting === 'function') {
                    updateToolbarActiveStates(editor.getActiveFormatting(), ctx, options)
                }
            })
        }
    }

    bindClick('btn-editor-p', () => editor.setParagraph())
    bindClick('btn-editor-h1', () => editor.toggleHeading(1))
    bindClick('btn-editor-h2', () => editor.toggleHeading(2))
    bindClick('btn-editor-h3', () => editor.toggleHeading(3))
    bindClick('btn-editor-h4', () => editor.toggleHeading(4))
    bindClick('btn-editor-h5', () => editor.toggleHeading(5))
    bindClick('btn-editor-bold', () => editor.toggleBold())
    bindClick('btn-editor-italic', () => editor.toggleItalic())
    bindClick('btn-editor-underline', () => editor.toggleUnderline())
    bindClick('btn-editor-strike', () => editor.toggleStrike())
    bindClick('btn-editor-bullet-list', () => editor.toggleBulletList())
    bindClick('btn-editor-ordered-list', () => editor.toggleOrderedList())
    bindClick('btn-editor-quote', () => editor.toggleBlockquote())
    bindClick('btn-editor-dialog', () => editor.toggleDialog())
    bindClick('btn-editor-image', async () => {
        const image = await pickProjectImage(ctx, 'img')
        if (image) {
            editor.setImage({ src: image.relativePath, alt: image.fileName })
        }
    })

    setupCustomStylesUI(
        editor,
        ctx,
        (states, context) => updateToolbarActiveStates(states, context, options),
        options
    )

    const dropdownBtn =
        document.getElementById(`${prefix}btn-insert-entity-dropdown`) ||
        (!prefix ? document.getElementById('btn-insert-entity-dropdown') : null)
    const dropdownMenu =
        document.getElementById(`${prefix}editor-entity-dropdown-menu`) ||
        (!prefix ? document.getElementById('editor-entity-dropdown-menu') : null)
    const openLinkModalBtn =
        document.getElementById(`${prefix}btn-open-entity-link-modal`) ||
        (!prefix ? document.getElementById('btn-open-entity-link-modal') : null)

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', e => {
            e.stopPropagation()
            dropdownMenu.classList.toggle('hidden')
        })

        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden')
        })

        if (openLinkModalBtn) {
            openLinkModalBtn.addEventListener('click', e => {
                e.stopPropagation()
                dropdownMenu.classList.add('hidden')
                const selectedText =
                    typeof editor.getSelectedText === 'function' ? editor.getSelectedText() : ''
                const rect =
                    typeof openLinkModalBtn.getBoundingClientRect === 'function'
                        ? openLinkModalBtn.getBoundingClientRect()
                        : null
                openEntityLinkModal(editor, ctx, {
                    initialLabel: selectedText ? selectedText.trim() : '',
                    initialType: 'all',
                    targetRect: rect,
                })
            })
        }

        dropdownMenu.querySelectorAll('[data-entity-type]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation()
                dropdownMenu.classList.add('hidden')
                const type = btn.getAttribute('data-entity-type') || 'all'
                const selectedText =
                    typeof editor.getSelectedText === 'function' ? editor.getSelectedText() : ''
                openEntityLinkModal(editor, ctx, {
                    initialLabel: selectedText,
                    initialType: type,
                })
            })
        })

        const menuEmbedBtn =
            document.getElementById(`${prefix}btn-menu-insert-description-embed`) ||
            (!prefix ? document.getElementById('btn-menu-insert-description-embed') : null)
        if (menuEmbedBtn) {
            menuEmbedBtn.addEventListener('click', e => {
                e.stopPropagation()
                dropdownMenu.classList.add('hidden')
                const rect =
                    typeof menuEmbedBtn.getBoundingClientRect === 'function'
                        ? menuEmbedBtn.getBoundingClientRect()
                        : null
                openDescriptionEmbedModal(editor, ctx, { targetRect: rect })
            })
        }
    }

    const embedBtn =
        document.getElementById(`${prefix}btn-insert-description-embed`) ||
        (!prefix ? document.getElementById('btn-insert-description-embed') : null)
    if (embedBtn) {
        embedBtn.addEventListener('click', e => {
            e.preventDefault()
            const rect =
                typeof embedBtn.getBoundingClientRect === 'function'
                    ? embedBtn.getBoundingClientRect()
                    : null
            openDescriptionEmbedModal(editor, ctx, { targetRect: rect })
        })
    }
}
