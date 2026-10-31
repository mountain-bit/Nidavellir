import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { saveFullProject } from '../project/projectSaver.js'
import { markProjectDirty } from '../project/projectStateTracker.js'

/**
 * Registers global window event listeners for Electron drag-and-drop navigation prevention
 * and global keyboard shortcuts (Ctrl+S for project save, Delete/Backspace for node deletion).
 *
 * @param {object} appContext - Shared application context
 */
export function setupMainWindowHotkeys(appContext) {
    // Prevent OS default file navigation on unhandled drag/drop in Electron
    window.addEventListener('dragover', e => {
        e.preventDefault()
    })
    window.addEventListener('drop', e => {
        e.preventDefault()
    })

    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault()
            saveFullProject(appContext)
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeEl = document.activeElement
            const isInput =
                activeEl &&
                (activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.isContentEditable)
            if (isInput) return

            const vm = appContext.vm
            if (!vm?.selection) return

            const sel = vm.selection.getSelectedItem()
            if (sel && sel.type === 'paragraph' && sel.entity) {
                if (sel.entity.getIsStart && sel.entity.getIsStart()) {
                    toast.warning(
                        t('graph.start_node_cannot_be_deleted') ||
                            'Węzeł START nie może zostać usunięty'
                    )
                    return
                }
                const confirmDel = confirm(
                    t('context_menu.confirm_delete', {
                        name: sel.entity.getTitle() || sel.entity.getId(),
                    })
                )
                if (confirmDel) {
                    const paragraphs = appContext.projectParagraphs || []
                    const scenes = appContext.projectScenes || []
                    const deleted = vm.graph?.deleteParagraph(
                        sel.entity.getId(),
                        paragraphs,
                        scenes
                    )
                    if (deleted) {
                        markProjectDirty()
                        vm.selection.clearSelection()
                        if (typeof appContext.refreshActiveSection === 'function') {
                            appContext.refreshActiveSection('paragraph')
                        }
                        const sg = appContext.storyGraphInstance
                        if (sg && typeof sg.render === 'function') {
                            sg.render(true)
                        }
                        toast.success(t('toast.paragraph_deleted') || 'Paragraf został usunięty')
                    }
                }
            }
        }
    })
}
