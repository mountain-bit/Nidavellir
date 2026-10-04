import { EntitySyncService, MarkdownEditor } from '../../dist/Modules/Editor/index.js'
import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import { escapeHtml } from './htmlTemplates.js'

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

let mainEditorInstance = null
let toolbarInitialized = false

function updateEditorStats(editor) {
    const statsEl = document.getElementById('editor-stats')
    if (!statsEl || !editor) return
    const words = editor.getWordCount()
    const chars = editor.getCharacterCount()
    statsEl.textContent = `${words} słów · ${chars} znaków`
}

function syncEntitiesWithActiveObject(ctx, entities) {
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
                    `Powiązano lokację: ${syncRes.addedLocations.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
            if (syncRes.addedCharacters.length > 0) {
                toast.info(
                    `Powiązano postać: ${syncRes.addedCharacters.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    `Powiązano tag: ${syncRes.addedTags.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
        }
    } else if (typeof entityObj.addTag === 'function') {
        const syncRes = EntitySyncService.syncWithNPC(entityObj, entities, ctx.projectData)
        if (syncRes.changed) {
            changed = true
            if (syncRes.addedTags.length > 0) {
                toast.info(
                    `Dodano cechę: ${syncRes.addedTags.join(', ')}`,
                    'Automatyczne powiązanie'
                )
            }
        }
    }

    if (changed && typeof ctx.renderDetailsPanel === 'function') {
        ctx.renderDetailsPanel(ctx)
    }
}

function setupToolbarButtons(editor) {
    if (toolbarInitialized || !editor) return
    toolbarInitialized = true

    const bindClick = (id, fn) => {
        const btn = document.getElementById(id)
        if (btn) {
            btn.addEventListener('click', e => {
                e.preventDefault()
                fn()
            })
        }
    }

    bindClick('btn-editor-bold', () => editor.toggleBold())
    bindClick('btn-editor-italic', () => editor.toggleItalic())
    bindClick('btn-editor-h1', () => editor.toggleHeading(1))
    bindClick('btn-editor-h2', () => editor.toggleHeading(2))
    bindClick('btn-editor-h3', () => editor.toggleHeading(3))
    bindClick('btn-editor-bullet-list', () => editor.toggleBulletList())
    bindClick('btn-editor-ordered-list', () => editor.toggleOrderedList())
    bindClick('btn-editor-quote', () => editor.toggleBlockquote())

    const dropdownBtn = document.getElementById('btn-insert-entity-dropdown')
    const dropdownMenu = document.getElementById('editor-entity-dropdown-menu')

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', e => {
            e.stopPropagation()
            dropdownMenu.classList.toggle('hidden')
        })

        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden')
        })

        dropdownMenu.querySelectorAll('[data-entity-type]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation()
                dropdownMenu.classList.add('hidden')
                editor.focus()
                const rawEditor = editor.getRawEditor()
                if (rawEditor) {
                    rawEditor.chain().focus().insertContent('@').run()
                }
            })
        })
    }
}

export function getOrCreateMainEditor(ctx) {
    if (mainEditorInstance) return mainEditorInstance

    const mount = document.getElementById('rich-editor-mount')
    if (!mount) return null

    mainEditorInstance = new MarkdownEditor({
        element: mount,
        initialContent: '',
        getProjectEntities: () => {
            const entities = []
            const locations = ctx.projectData?.locations || ctx.projectLocations || []
            locations.forEach(loc => {
                const id = loc.getId ? loc.getId() : loc.id
                const name = loc.getName ? loc.getName() : loc.name
                if (id && name) entities.push({ id, name, type: 'location' })
            })
            const characters = ctx.projectData?.characters || ctx.projectCharacters || []
            characters.forEach(char => {
                const id = char.getId ? char.getId() : char.id
                const name = char.getName ? char.getName() : char.name
                if (id && name) entities.push({ id, name, type: 'character' })
            })
            const tags = ctx.projectData?.tags || ctx.projectTags || []
            tags.forEach(tag => {
                const id = tag.getId ? tag.getId() : tag.id
                const name = tag.getName ? tag.getName() : tag.name
                if (name) entities.push({ id: id || name, name, type: 'tag' })
            })
            return entities
        },
        onUpdate: (markdown, entities) => {
            const active = ctx.vm.getActiveFile()
            if (active) {
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
            toast.info(`${entity.name} (${entity.type})`, 'Słowo kluczowe')
        },
    })

    setupToolbarButtons(mainEditorInstance)
    return mainEditorInstance
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
    if (activeLabel) {
        activeLabel.textContent = active || t('editor.no_open_file')
    }
    const content = active ? ctx.files[active] || '' : ''
    if (fileEditor) {
        fileEditor.value = content
    }

    const editor = getOrCreateMainEditor(ctx)
    if (editor) {
        editor.setMarkdown(content)
        updateEditorStats(editor)
    }

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

            return `
            <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-t cursor-pointer border-r border-[#333338] ${activeClasses}"
                data-tab-file="${escapeHtml(file)}">
                <span class="flex items-center gap-1.5">
                    <span class="text-blue-400 shrink-0">${getIconSvg('paragraph', 'w-3.5 h-3.5')}</span>
                    <span>${escapeHtml(file)}</span>
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
