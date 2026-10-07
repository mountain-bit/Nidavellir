import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import {
    getOrCreateMainEditor,
    setEditorActiveState,
    setupFontBrowserUI,
    updateEditorStats,
    updateToolbarActiveStates,
} from './editor/index.js'
import { escapeHtml } from './htmlTemplates.js'

export {
    getOrCreateMainEditor,
    setEditorActiveState,
    setupFontBrowserUI,
    updateToolbarActiveStates,
}

/**
 * Sets up drag-to-resize splitters for left drawer and right sidebar.
 *
 * @param {HTMLElement} leftDrawer
 * @param {HTMLElement} rightSidebar
 * @param {object} vm
 */
export function setupResizers(leftDrawer, rightSidebar, vm) {
    const leftResizer = document.getElementById('left-resizer')
    const rightResizer = document.getElementById('right-resizer')

    if (leftResizer && leftDrawer) {
        let isDraggingLeft = false
        let startX = 0
        let startWidth = 0
        let rafId = null

        leftResizer.addEventListener('mousedown', e => {
            e.preventDefault()
            isDraggingLeft = true
            startX = e.clientX
            startWidth = leftDrawer.getBoundingClientRect().width
            leftResizer.classList.add('resizing')
            document.body.classList.add('is-resizing')
        })

        window.addEventListener('mousemove', e => {
            if (!isDraggingLeft) return
            const clientX = e.clientX
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (!isDraggingLeft) return
                const delta = clientX - startX
                const newWidth = Math.max(180, Math.min(600, Math.round(startWidth + delta)))
                leftDrawer.style.width = `${newWidth}px`
                leftDrawer.style.setProperty('--left-drawer-width', `${newWidth}px`)
                vm.setLeftDrawerWidth(newWidth)
                window.dispatchEvent(new Event('resize'))
            })
        })

        window.addEventListener('mouseup', () => {
            if (isDraggingLeft) {
                isDraggingLeft = false
                if (rafId) {
                    cancelAnimationFrame(rafId)
                    rafId = null
                }
                leftResizer.classList.remove('resizing')
                document.body.classList.remove('is-resizing')
                window.dispatchEvent(new Event('resize'))
            }
        })
    }

    if (rightResizer && rightSidebar) {
        let isDraggingRight = false
        let startX = 0
        let startWidth = 0
        let rafId = null

        rightResizer.addEventListener('mousedown', e => {
            e.preventDefault()
            isDraggingRight = true
            startX = e.clientX
            startWidth = rightSidebar.getBoundingClientRect().width
            rightResizer.classList.add('resizing')
            document.body.classList.add('is-resizing')
        })

        window.addEventListener('mousemove', e => {
            if (!isDraggingRight) return
            const clientX = e.clientX
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (!isDraggingRight) return
                const delta = startX - clientX
                const newWidth = Math.max(220, Math.min(700, Math.round(startWidth + delta)))
                rightSidebar.style.width = `${newWidth}px`
                rightSidebar.style.setProperty('--right-sidebar-width', `${newWidth}px`)
                vm.setRightSidebarWidth(newWidth)
                window.dispatchEvent(new Event('resize'))
            })
        })

        window.addEventListener('mouseup', () => {
            if (isDraggingRight) {
                isDraggingRight = false
                if (rafId) {
                    cancelAnimationFrame(rafId)
                    rafId = null
                }
                rightResizer.classList.remove('resizing')
                document.body.classList.remove('is-resizing')
                window.dispatchEvent(new Event('resize'))
            }
        })
    }

    if (leftDrawer) {
        leftDrawer.addEventListener('transitionend', e => {
            if (e.target === leftDrawer && e.propertyName === 'width') {
                window.dispatchEvent(new Event('resize'))
            }
        })
    }
    if (rightSidebar) {
        rightSidebar.addEventListener('transitionend', e => {
            if (e.target === rightSidebar && e.propertyName === 'width') {
                window.dispatchEvent(new Event('resize'))
            }
        })
    }
}

/**
 * Updates Right Sidebar collapsed / expanded UI classes and toggle button states.
 *
 * @param {object} vm
 * @param {HTMLElement} rightSidebar
 * @param {HTMLElement} toggleRightSidebarBtn
 * @param {HTMLElement} reopenRightSidebarBtn
 */
export function updateRightSidebarUI(
    vm,
    rightSidebar,
    toggleRightSidebarBtn,
    reopenRightSidebarBtn
) {
    const isCollapsed = vm.isRightSidebarCollapsed()
    const rightResizer = document.getElementById('right-resizer')
    if (isCollapsed) {
        if (rightSidebar) rightSidebar.classList.add('collapsed')
        if (rightResizer) rightResizer.classList.add('collapsed')
        if (toggleRightSidebarBtn) toggleRightSidebarBtn.textContent = '‹'
        if (reopenRightSidebarBtn) reopenRightSidebarBtn.classList.remove('hidden')
    } else {
        if (rightSidebar) rightSidebar.classList.remove('collapsed')
        if (rightResizer) rightResizer.classList.remove('collapsed')
        if (toggleRightSidebarBtn) toggleRightSidebarBtn.textContent = '›'
        if (reopenRightSidebarBtn) reopenRightSidebarBtn.classList.add('hidden')
    }
}

/**
 * Updates central workspace mode (Graph vs Markdown) and editor content.
 *
 * @param {object} ctx Application UI Context
 */
export function updateMainWorkspaceUI(ctx) {
    const mainView = ctx.vm.getActiveMainView()
    const modeTitle = document.getElementById('workspace-mode-title')
    const markdownContainer = document.getElementById('markdown-container')
    const graphContainer = document.getElementById('graph-container')
    const viewGraphBtn = document.getElementById('view-mode-graph-btn')
    const viewMarkdownBtn = document.getElementById('view-mode-markdown-btn')
    const fileEditor = document.getElementById('file-editor')
    const activeLabel = document.getElementById('active-file-label')

    if (mainView === 'graph') {
        if (markdownContainer) markdownContainer.classList.add('hidden')
        if (graphContainer) graphContainer.classList.remove('hidden')
        if (viewGraphBtn) {
            viewGraphBtn.classList.add('bg-[#2e2e33]', 'text-white')
            viewGraphBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        }
        if (viewMarkdownBtn) {
            viewMarkdownBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
            viewMarkdownBtn.classList.remove('bg-[#2e2e33]', 'text-white')
        }
        if (modeTitle) {
            modeTitle.innerHTML = `<span class="text-blue-400 shrink-0">${getIconSvg('graph', 'w-3.5 h-3.5')}</span><span>${escapeHtml(t('graph.title'))}</span>`
        }
        if (ctx.showGraph) ctx.showGraph()
    } else {
        if (markdownContainer) markdownContainer.classList.remove('hidden')
        if (graphContainer) graphContainer.classList.add('hidden')
        if (viewMarkdownBtn) {
            viewMarkdownBtn.classList.add('bg-[#2e2e33]', 'text-white')
            viewMarkdownBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        }
        if (viewGraphBtn) {
            viewGraphBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
            viewGraphBtn.classList.remove('bg-[#2e2e33]', 'text-white')
        }
        if (modeTitle) {
            modeTitle.innerHTML = `<span class="text-blue-400 shrink-0">${getIconSvg('markdown', 'w-3.5 h-3.5')}</span><span>${escapeHtml(t('view_mode.text'))}</span>`
        }
    }

    const active = ctx.vm.getActiveFile()
    const hasActiveFile = Boolean(active)

    if (activeLabel) {
        const displayName =
            typeof ctx.vm?.getFileDisplayName === 'function'
                ? ctx.vm.getFileDisplayName(active)
                : active
        activeLabel.textContent = displayName || t('editor.no_open_file')
        if (active) {
            activeLabel.title = active
        } else {
            activeLabel.removeAttribute('title')
        }
    }
    const content = hasActiveFile ? ctx.files[active] || '' : ''
    if (fileEditor) {
        fileEditor.value = content
    }

    const editor = getOrCreateMainEditor(ctx)
    if (editor) {
        if (hasActiveFile) {
            editor.setMarkdown(content)
            updateEditorStats(editor)
        }
    }

    setEditorActiveState(hasActiveFile, editor)

    const saveStatus = document.getElementById('save-status')
    if (saveStatus) {
        saveStatus.textContent = ''
    }

    renderEditorTabs(ctx)
}

/**
 * Renders open file tabs in Markdown editor view.
 *
 * @param {object} ctx Application UI Context
 */
export function renderEditorTabs(ctx) {
    const editorTabsContainer = document.getElementById('editor-tabs')
    if (!editorTabsContainer) return

    const openFiles = ctx.vm.getOpenFiles()
    const activeFile = ctx.vm.getActiveFile()
    const closeFileTitle = t('editor.close_file')

    editorTabsContainer.innerHTML = openFiles
        .map(file => {
            const isActive = file === activeFile
            const activeClasses = isActive
                ? 'bg-[#18181b] text-white border-t-2 border-t-blue-500'
                : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'

            const displayName =
                typeof ctx.vm?.getFileDisplayName === 'function'
                    ? ctx.vm.getFileDisplayName(file)
                    : file

            return `
            <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-t cursor-pointer border-r border-[#333338] ${activeClasses}"
                data-tab-file="${escapeHtml(file)}" title="${escapeHtml(file)}">
                <span class="flex items-center gap-1.5">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${escapeHtml(displayName)}</span>
                </span>
                <button class="close-tab-btn hover:text-red-400 p-0.5 rounded inline-flex items-center" data-close-file="${escapeHtml(file)}" title="${escapeHtml(closeFileTitle)}">${getIconSvg('close', 'w-3 h-3')}</button>
            </div>
        `
        })
        .join('')

    editorTabsContainer.querySelectorAll('[data-tab-file]').forEach(tab => {
        tab.addEventListener('click', e => {
            if (e.target.classList.contains('close-tab-btn')) return
            const file = tab.dataset.tabFile
            ctx.vm.setActiveFile(file)
            updateMainWorkspaceUI(ctx)
        })
    })

    editorTabsContainer.querySelectorAll('[data-close-file]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const file = btn.dataset.closeFile
            ctx.vm.closeFile(file)
            updateMainWorkspaceUI(ctx)
        })
    })
}

/**
 * Updates graph zoom percentage badge and toolbar button states.
 *
 * @param {object} storyGraphInstance
 * @param {number} [zoomLevel]
 */
export function updateZoomToolbarUI(storyGraphInstance, zoomLevel) {
    const badge = document.getElementById('graph-zoom-level-badge')
    const zoomOutBtn = document.getElementById('btn-graph-zoom-out')
    const zoomInBtn = document.getElementById('btn-graph-zoom-in')

    const currentZoom =
        zoomLevel !== undefined ? zoomLevel : storyGraphInstance ? storyGraphInstance.getZoom() : 1
    const percentage = Math.round(currentZoom * 100)

    if (badge) {
        badge.textContent = `${percentage}%`
    }
    if (zoomOutBtn) {
        const isMin = currentZoom <= 0.051
        zoomOutBtn.classList.toggle('opacity-40', isMin)
        zoomOutBtn.classList.toggle('pointer-events-none', isMin)
    }
    if (zoomInBtn) {
        const isMax = currentZoom >= 3.99
        zoomInBtn.classList.toggle('opacity-40', isMax)
        zoomInBtn.classList.toggle('pointer-events-none', isMax)
    }
}

/**
 * Saves current active file to memory and disk via IPC.
 *
 * @param {object} ctx Application UI Context
 */
export function saveActiveFile(ctx) {
    const active = ctx.vm.getActiveFile()
    if (!active) return

    const editor = getOrCreateMainEditor(ctx)
    const content =
        editor && typeof editor.getMarkdown === 'function'
            ? editor.getMarkdown()
            : document.getElementById('file-editor')?.value || ''

    ctx.files[active] = content

    const fileEditor = document.getElementById('file-editor')
    if (fileEditor) fileEditor.value = content

    const saveStatus = document.getElementById('save-status')
    if (saveStatus) {
        saveStatus.textContent = 'Zapisywanie...'
        saveStatus.className = 'text-[11px] text-zinc-400'
    }

    const currentPath = window.currentProjectPath || ''
    if (window.electronAPI && window.electronAPI.saveMarkdownFile && currentPath) {
        window.electronAPI
            .saveMarkdownFile(currentPath, active, content)
            .then(res => {
                if (res && res.success) {
                    if (saveStatus) {
                        saveStatus.textContent = '• Zapisano'
                        saveStatus.className = 'text-[11px] text-emerald-400 font-medium'
                        setTimeout(() => {
                            if (saveStatus.textContent === '• Zapisano') {
                                saveStatus.textContent = ''
                            }
                        }, 2500)
                    }
                    if (res.recreated || res.warning === 'recreated') {
                        toast.warning(t('toast.file_recreated_warning'), t('toast.warning_title'))
                    } else {
                        toast.success(t('toast.save_success'), t('toast.success_title'))
                    }
                } else if (res && !res.success) {
                    toast.error(t('toast.save_error', { error: res.error }), t('toast.error_title'))
                }
            })
            .catch(err => {
                console.error('Error saving file:', err)
                toast.error(t('toast.save_error', { error: err.message }), t('toast.error_title'))
            })
    } else {
        if (saveStatus) {
            saveStatus.textContent = '• Zapisano (pamięć)'
            saveStatus.className = 'text-[11px] text-emerald-400 font-medium'
            setTimeout(() => {
                if (saveStatus.textContent.includes('Zapisano')) {
                    saveStatus.textContent = ''
                }
            }, 2500)
        }
        toast.success(t('toast.save_success'), t('toast.success_title'))
    }
}
