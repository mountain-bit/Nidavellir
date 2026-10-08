import { CustomStylesService } from '../../../dist/Modules/Editor/index.js'
import { getIconSvg } from '../../../dist/Utils/icons.js'
import { t } from '../../../dist/Utils/translate.js'
import { setupCustomStyleModal } from './customStyleModal.js'

let sharedStyleModal = null
const activeStyleRenderers = new Set()

/**
 * Sets up the Custom Styles dropdown menu and its modal integration.
 *
 * @param {object} editor Active MarkdownEditor instance
 * @param {object} ctx Application UI Context
 * @param {(activeStates: object, ctx: object) => void} [onSelectionUpdate] Callback to refresh toolbar button states
 * @param {object} [options] Optional configuration (e.g. prefix, elements)
 * @returns {{ renderList: () => void, openModal: (style?: object | null) => void }}
 */
export function setupCustomStylesUI(editor, ctx, onSelectionUpdate, options = {}) {
    const prefix = options.prefix || ''
    const dropdownBtn =
        options.dropdownBtn ||
        document.getElementById(`${prefix}btn-editor-custom-styles-dropdown`) ||
        (!prefix ? document.getElementById('btn-editor-custom-styles-dropdown') : null)
    const dropdownMenu =
        options.dropdownMenu ||
        document.getElementById(`${prefix}editor-custom-styles-dropdown-menu`) ||
        (!prefix ? document.getElementById('editor-custom-styles-dropdown-menu') : null)
    const container =
        options.container ||
        document.getElementById(`${prefix}custom-styles-list-container`) ||
        (!prefix ? document.getElementById('custom-styles-list-container') : null)
    const clearBtn =
        options.clearBtn ||
        document.getElementById(`${prefix}btn-clear-custom-style`) ||
        (!prefix ? document.getElementById('btn-clear-custom-style') : null)
    const openModalBtn =
        options.openModalBtn ||
        document.getElementById(`${prefix}btn-open-custom-style-modal`) ||
        (!prefix ? document.getElementById('btn-open-custom-style-modal') : null)

    const renderList = () => {
        if (!container) return
        const styles = CustomStylesService.getStyles(ctx?.projectData)
        CustomStylesService.injectStyleSheet(styles)
        const activeId =
            editor && typeof editor.getActiveCustomStyle === 'function'
                ? editor.getActiveCustomStyle()
                : null

        container.innerHTML = ''
        styles.forEach(style => {
            const item = document.createElement('button')
            item.type = 'button'
            item.className =
                'w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-zinc-800 text-xs transition-colors cursor-pointer group'

            const left = document.createElement('div')
            left.className = 'flex items-center gap-2 overflow-hidden'

            const dot = document.createElement('span')
            dot.className = 'w-2.5 h-2.5 rounded-full shrink-0 shadow-xs'
            dot.style.backgroundColor = style.color || '#a1a1aa'

            const name = document.createElement('span')
            name.textContent = style.name
            name.className = 'truncate text-zinc-200 group-hover:text-white'
            if (style.italic) name.classList.add('italic')
            if (style.bold) name.classList.add('font-bold')

            left.appendChild(dot)
            left.appendChild(name)

            const right = document.createElement('div')
            right.className = 'flex items-center gap-1.5 shrink-0'

            if (activeId === style.id) {
                const check = document.createElement('span')
                check.className = 'text-blue-400 flex items-center'
                check.innerHTML = getIconSvg('check', 'w-3 h-3 text-blue-400')
                right.appendChild(check)
            }

            const edit = document.createElement('span')
            edit.className =
                'text-zinc-500 hover:text-zinc-200 p-0.5 rounded cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity flex items-center'
            edit.title = t('editor.styles.edit_style')
            edit.innerHTML = getIconSvg('edit', 'w-3 h-3')
            edit.addEventListener('click', e => {
                e.stopPropagation()
                if (dropdownMenu) dropdownMenu.classList.add('hidden')
                sharedStyleModal?.openModal(style)
            })
            right.appendChild(edit)

            item.appendChild(left)
            item.appendChild(right)

            item.addEventListener('click', e => {
                e.stopPropagation()
                if (dropdownMenu) dropdownMenu.classList.add('hidden')
                if (editor) {
                    editor.focus()
                    editor.toggleCustomStyle(style.id)
                    if (
                        typeof onSelectionUpdate === 'function' &&
                        typeof editor.getActiveFormatting === 'function'
                    ) {
                        onSelectionUpdate(editor.getActiveFormatting(), ctx)
                    }
                }
            })

            container.appendChild(item)
        })
    }

    activeStyleRenderers.add(renderList)

    if (!sharedStyleModal) {
        sharedStyleModal = setupCustomStyleModal(ctx, {
            onStyleSaved: () => activeStyleRenderers.forEach(render => render()),
            onStyleDeleted: () => activeStyleRenderers.forEach(render => render()),
        })
    }

    // Dropdown listeners
    dropdownBtn?.addEventListener('click', e => {
        e.stopPropagation()
        renderList()
        dropdownMenu?.classList.toggle('hidden')
    })

    document.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden')
    })

    clearBtn?.addEventListener('click', e => {
        e.stopPropagation()
        dropdownMenu?.classList.add('hidden')
        if (editor) {
            editor.focus()
            editor.unsetCustomStyle()
            if (
                typeof onSelectionUpdate === 'function' &&
                typeof editor.getActiveFormatting === 'function'
            ) {
                onSelectionUpdate(editor.getActiveFormatting(), ctx)
            }
        }
    })

    openModalBtn?.addEventListener('click', e => {
        e.stopPropagation()
        dropdownMenu?.classList.add('hidden')
        sharedStyleModal?.openModal(null)
    })

    return {
        renderList,
        openModal: style => sharedStyleModal?.openModal(style),
    }
}
