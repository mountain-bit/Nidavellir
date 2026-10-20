import { toast } from '../dist/Utils/toast.js'
import {
    applyTranslations,
    getLanguage,
    initTranslations,
    setLanguage,
    t,
} from '../dist/Utils/translate.js'
import { MainWindowViewModel, ProjectManager } from '../dist/ViewModel/MainWindowViewModel.js'
import { extractProjectData, loadProjectData } from './projectData.js'
import { renderDetailsPanel, renderHistoryBar } from './ui/detailsPanel/detailsPanel.js'
import {
    renderCharactersList,
    renderConnectionsList,
    renderLocationsList,
    renderMainCharacter,
    renderParagraphsList,
    renderScenesList,
    renderTagsList,
    renderTraitsList,
} from './ui/drawer/drawerLists.js'
import {
    populateFilterSelects,
    renderFilterTags,
    setupParagraphSearchAndFilters,
    updateFilterBadgeState,
} from './ui/drawer/filterPopover.js'
import {
    centerStoryGraph,
    getStoryGraphInstance,
    setupGraphZoomControls,
    showStoryGraph,
} from './ui/graph/index.js'
import { confirmApplicationClose, markFileDirty } from './ui/modals/confirm/confirmModal.js'
import { openHeroModal, setupHeroModal } from './ui/modals/hero/heroModal.js'
import {
    executeNpcModalSave,
    hasUnsavedNpcChanges,
    renderDynamicSuggestions,
    setupNpcModal,
    updateTraitsCounterUI,
} from './ui/modals/npc/npcModal.js'
import {
    isAutoSaveEnabled,
    setAutoSaveEnabled,
    startAutoSave,
} from './ui/project/autoSaveService.js'
import { saveFullProject } from './ui/project/projectSaver.js'
import {
    isProjectDirty,
    markProjectClean,
    markProjectDirty,
    updateProjectNameUI,
} from './ui/project/projectStateTracker.js'
import {
    handleColorSelection,
    openColorPicker,
    openContextMenu,
    setupSectionControlsAndContextMenu,
} from './ui/workspace/contextMenu.js'
import { initQuickSearch, openQuickSearch } from './ui/workspace/quickSearch.js'
import { initTopBar, updateTopBarUI } from './ui/workspace/topBar.js'
import {
    renderEditorTabs,
    saveActiveFile,
    saveAllUnsavedFiles,
    setupResizers,
    updateMainWorkspaceUI,
    updateRightSidebarUI,
    updateZoomToolbarUI,
} from './ui/workspace/workspace.js'

// ViewModel instance
const vm = new MainWindowViewModel()

// DOM elements
const leftDrawer = document.getElementById('left-drawer')
const leftDrawerTitle = document.getElementById('left-drawer-title')
const closeLeftDrawerBtn = document.getElementById('close-left-drawer-btn')

const rightSidebar = document.getElementById('right-sidebar')
const toggleRightSidebarBtn = document.getElementById('toggle-right-sidebar-btn')
const reopenRightSidebarBtn = document.getElementById('reopen-right-sidebar-btn')

const viewMarkdownBtn = document.getElementById('view-mode-markdown-btn')
const viewGraphBtn = document.getElementById('view-mode-graph-btn')

const fileEditor = document.getElementById('file-editor')
const saveStatus = document.getElementById('save-status')

// Active project data state (defaults to mock data; easily switchable to real data via loadProjectData)
let projectData = loadProjectData(vm)
vm.ensureStartParagraph(projectData.projectParagraphs)

/**
 * Shared Application Context passed to modular UI renderers.
 */
const appContext = {
    vm,
    projectPath: '',
    getProjectPath() {
        return (
            this.projectPath ||
            (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
            ''
        )
    },
    get projectData() {
        return projectData
    },
    setProjectData(newData) {
        projectData = newData
    },
    get projectTags() {
        if (!Array.isArray(projectData.projectTags)) {
            projectData.projectTags = []
        }
        return projectData.projectTags
    },
    set projectTags(val) {
        projectData.projectTags = val
    },
    get projectCharacters() {
        if (!Array.isArray(projectData.projectCharacters)) {
            projectData.projectCharacters = []
        }
        return projectData.projectCharacters
    },
    set projectCharacters(val) {
        projectData.projectCharacters = val
    },
    get projectTemplates() {
        if (!Array.isArray(projectData.projectTemplates)) {
            projectData.projectTemplates = []
        }
        return projectData.projectTemplates
    },
    set projectTemplates(val) {
        projectData.projectTemplates = val
    },
    get projectItems() {
        if (!Array.isArray(projectData.projectItems)) {
            projectData.projectItems = Array.isArray(projectData.items) ? projectData.items : []
        }
        return projectData.projectItems
    },
    set projectItems(val) {
        projectData.projectItems = val
        projectData.items = val
    },
    get projectLocations() {
        if (!Array.isArray(projectData.projectLocations)) {
            projectData.projectLocations = []
        }
        return projectData.projectLocations
    },
    set projectLocations(val) {
        projectData.projectLocations = val
    },
    get projectStats() {
        if (!Array.isArray(projectData.projectStats)) {
            projectData.projectStats = []
        }
        return projectData.projectStats
    },
    set projectStats(val) {
        projectData.projectStats = val
    },
    get projectSkills() {
        if (!Array.isArray(projectData.projectSkills)) {
            projectData.projectSkills = []
        }
        return projectData.projectSkills
    },
    set projectSkills(val) {
        projectData.projectSkills = val
    },
    get projectParameters() {
        if (!Array.isArray(projectData.projectParameters)) {
            projectData.projectParameters = []
        }
        return projectData.projectParameters
    },
    set projectParameters(val) {
        projectData.projectParameters = val
    },
    get projectFeatures() {
        if (!Array.isArray(projectData.projectFeatures)) {
            projectData.projectFeatures = []
        }
        return projectData.projectFeatures
    },
    set projectFeatures(val) {
        projectData.projectFeatures = val
    },
    get projectParagraphs() {
        if (!Array.isArray(projectData.projectParagraphs)) {
            projectData.projectParagraphs = []
        }
        vm.ensureStartParagraph(projectData.projectParagraphs)
        return projectData.projectParagraphs
    },
    get projectScenes() {
        return projectData.projectScenes
    },
    get files() {
        return projectData.files
    },
    get playerCharacter() {
        return projectData.playerCharacter || null
    },
    get playerCharacters() {
        return (
            projectData.playerCharacters ||
            (projectData.playerCharacter ? [projectData.playerCharacter] : [])
        )
    },
    get storyGraphInstance() {
        return getStoryGraphInstance()
    },
    updateRightSidebarUI: () =>
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn),
    saveActiveFile: () => saveActiveFile(appContext),
    selectEntity,
    refreshActiveSection,
    renderParagraphsList: () => renderParagraphsList(appContext),
    renderScenesList: () => renderScenesList(appContext),
    renderTagsList: () => renderTagsList(appContext),
    renderCharactersList: () => renderCharactersList(appContext),
    renderMainCharacter: () => renderMainCharacter(appContext),
    renderLocationsList: () => renderLocationsList(appContext),
    renderTraitsList: () => renderTraitsList(appContext),
    renderDynamicSuggestions: () => renderDynamicSuggestions(appContext),
    updateTraitsCounterUI: () => updateTraitsCounterUI(appContext),
    renderConnectionsList: () => renderConnectionsList(appContext),
    renderFilterTags: () => renderFilterTags(appContext),
    populateFilterSelects: () => populateFilterSelects(appContext),
    updateFilterBadgeState: () => updateFilterBadgeState(appContext),
    renderHistoryBar: () => renderHistoryBar(appContext),
    renderDetailsPanel: () => renderDetailsPanel(appContext),
    renderEditorTabs: () => renderEditorTabs(appContext),
    updateMainWorkspaceUI: () => updateMainWorkspaceUI(appContext),
    openHeroModal: opts => openHeroModal(opts),
    openContextMenu,
    openColorPicker,
    handleColorSelection: color => handleColorSelection(color, appContext),
    showGraph: (force = false) => showStoryGraph(appContext, force),
    centerGraph: (animate = true) => centerStoryGraph(appContext, animate),
    updateZoomToolbarUI: (sg, lvl) => updateZoomToolbarUI(sg || getStoryGraphInstance(), lvl),
    updateLeftDrawerUI: () => updateLeftDrawerUI(),
    openSettings: () => {
        if (typeof vm.setActiveLeftTab === 'function') {
            vm.setActiveLeftTab('settings')
        } else if (vm.getActiveLeftTab() !== 'settings') {
            vm.toggleLeftTab('settings')
        }
        updateLeftDrawerUI()
        updateTopBarUI(appContext)
    },
    openQuickSearch: () => openQuickSearch(appContext),
    markProjectDirty: () => markProjectDirty(),
    markProjectClean: () => markProjectClean(),
}

// Left Drawer Title Mapping
function updateLeftDrawerTitle() {
    const activeTab = vm.getActiveLeftTab()
    if (!activeTab || !leftDrawerTitle) return

    const titleKeys = {
        paragraphs: 'left_panel.paragraphs',
        scenes: 'left_panel.scenes',
        characters: 'left_panel.characters',
        locations: 'left_panel.locations',
        traits: 'left_panel.traits',
        'main-character': 'left_panel.main_character',
        tags: 'left_panel.tags',
        connections: 'left_panel.connections',
        explorer: 'left_panel.explorer',
        search: 'left_panel.search',
        settings: 'left_panel.settings',
    }

    const key = titleKeys[activeTab]
    if (key) {
        leftDrawerTitle.setAttribute('data-i18n', key)
        leftDrawerTitle.textContent = t(key)
    }
}

// Ribbon UI Tabs
function updateRibbonUI() {
    const activeTab = vm.getActiveRibbonTab()
    document.querySelectorAll('[data-ribbon-tab]').forEach(tabBtn => {
        if (tabBtn.dataset.ribbonTab === activeTab) {
            tabBtn.classList.add('border-blue-500', 'text-white', 'bg-[#28282c]')
            tabBtn.classList.remove('border-transparent', 'text-[#a1a1aa]')
        } else {
            tabBtn.classList.remove('border-blue-500', 'text-white', 'bg-[#28282c]')
            tabBtn.classList.add('border-transparent', 'text-[#a1a1aa]')
        }
    })

    document.querySelectorAll('.ribbon-tab-content').forEach(pane => {
        if (pane.id === `ribbon-panel-${activeTab}`) {
            pane.classList.remove('hidden')
        } else {
            pane.classList.add('hidden')
        }
    })
}

// Render Left Drawer & Icon Bar UI
function updateLeftDrawerUI() {
    const activeLeftTab = vm.getActiveLeftTab()
    const isOpen = vm.isLeftDrawerOpen()
    const leftResizer = document.getElementById('left-resizer')

    document.querySelectorAll('[data-left-tab]').forEach(btn => {
        if (isOpen && btn.dataset.leftTab === activeLeftTab) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })

    if (isOpen && activeLeftTab && leftDrawer) {
        leftDrawer.classList.remove('collapsed')
        if (leftResizer) leftResizer.classList.remove('collapsed')
        updateLeftDrawerTitle()

        document.querySelectorAll('.left-tab-content').forEach(content => {
            if (content.id === `left-content-${activeLeftTab}`) {
                content.classList.remove('hidden')
            } else {
                content.classList.add('hidden')
            }
        })

        if (activeLeftTab === 'paragraphs') renderParagraphsList(appContext)
        else if (activeLeftTab === 'scenes') renderScenesList(appContext)
        else if (activeLeftTab === 'connections') renderConnectionsList(appContext)
        else if (activeLeftTab === 'characters') renderCharactersList(appContext)
        else if (activeLeftTab === 'locations') renderLocationsList(appContext)
        else if (activeLeftTab === 'traits') renderTraitsList(appContext)
        else if (activeLeftTab === 'tags') renderTagsList(appContext)
        else if (activeLeftTab === 'main-character') renderMainCharacter(appContext)
    } else if (leftDrawer) {
        leftDrawer.classList.add('collapsed')
        if (leftResizer) leftResizer.classList.add('collapsed')
    }
    updateTopBarUI(appContext)
}

function refreshActiveSection(type) {
    markProjectDirty()
    if (type === 'tag') {
        renderTagsList(appContext)
        renderFilterTags(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (
        type === 'character' ||
        type === 'player_character' ||
        type === 'playerCharacter' ||
        type === 'main-character'
    ) {
        renderCharactersList(appContext)
        renderMainCharacter(appContext)
        populateFilterSelects(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (type === 'location') {
        renderLocationsList(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (
        type === 'trait' ||
        type === 'stat' ||
        type === 'parameter' ||
        type === 'skill' ||
        type === 'feature'
    ) {
        renderTraitsList(appContext)
        renderDynamicSuggestions(appContext)
        updateTraitsCounterUI(appContext)
    }
    if (type === 'paragraph') {
        renderParagraphsList(appContext)
        renderConnectionsList(appContext)
        renderScenesList(appContext)
    }
    if (type === 'choice' || type === 'connection') {
        renderConnectionsList(appContext)
        renderParagraphsList(appContext)
    }
    if (type === 'scene') {
        renderScenesList(appContext)
        populateFilterSelects(appContext)
        renderParagraphsList(appContext)
    }
}

function selectEntity(entity, type, parent) {
    if (entity && typeof entity === 'object' && typeof entity.getId !== 'function' && entity.id) {
        const effType = type || entity.type
        if (effType === 'paragraph' && Array.isArray(projectData?.projectParagraphs)) {
            const found = projectData.projectParagraphs.find(
                p => (typeof p.getId === 'function' ? p.getId() : p.id) === entity.id
            )
            if (found) {
                entity = found
                type = 'paragraph'
            }
        } else if (effType === 'scene' && Array.isArray(projectData?.projectScenes)) {
            const found = projectData.projectScenes.find(
                s => (typeof s.getId === 'function' ? s.getId() : s.id) === entity.id
            )
            if (found) {
                entity = found
                type = 'scene'
            }
        }
    }
    vm.selectElement(entity, type, parent)
    updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
    renderHistoryBar(appContext)
    renderDetailsPanel(appContext)
}

// Event Listeners Registration
document.querySelectorAll('[data-ribbon-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.ribbonTab
        vm.setActiveRibbonTab(tab)
        updateRibbonUI()
    })
})

document.querySelectorAll('[data-left-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.leftTab
        vm.toggleLeftTab(tab)
        updateLeftDrawerUI()
    })
})

if (closeLeftDrawerBtn) {
    closeLeftDrawerBtn.addEventListener('click', () => {
        vm.closeLeftDrawer()
        updateLeftDrawerUI()
    })
}

if (toggleRightSidebarBtn) {
    toggleRightSidebarBtn.addEventListener('click', () => {
        vm.toggleRightSidebar()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
}

if (reopenRightSidebarBtn) {
    reopenRightSidebarBtn.addEventListener('click', () => {
        vm.setRightSidebarCollapsed(false)
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
}

document.querySelectorAll('[data-file]').forEach(btn => {
    btn.addEventListener('click', () => {
        const fileName = btn.dataset.file
        if (fileName) {
            vm.setActiveFile(fileName)
            updateMainWorkspaceUI(appContext)
        }
    })
})

if (viewMarkdownBtn) {
    viewMarkdownBtn.addEventListener('click', () => {
        vm.setActiveMainView('markdown')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
}

if (viewGraphBtn) {
    viewGraphBtn.addEventListener('click', () => {
        vm.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
}

document.querySelectorAll('[data-action="show-graph"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="switch-markdown"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.setActiveMainView('markdown')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="open-main-character"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('main-character')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="open-hero-modal"]').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault()
        e.stopPropagation()
        openHeroModal({ ctx: appContext })
    })
})

document.querySelectorAll('[data-action="open-npcs"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('characters')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="open-locations"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('locations')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="open-items"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('traits')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="toggle-left-drawer"]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (vm.isLeftDrawerOpen()) {
            vm.closeLeftDrawer()
        } else {
            vm.toggleLeftTab(vm.getActiveLeftTab() || 'paragraphs')
        }
        updateLeftDrawerUI()
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="toggle-right-sidebar"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleRightSidebar()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="new-scene"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('scenes')
        updateLeftDrawerUI()
        const sceneForm = document.getElementById('scene-create-form')
        if (sceneForm) {
            sceneForm.classList.remove('hidden')
            const input = document.getElementById('scene-create-name')
            if (input) input.focus()
        }
    })
})

document.querySelectorAll('[data-action="link-scenes"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleLeftTab('connections')
        updateLeftDrawerUI()
        const connForm = document.getElementById('connection-create-form')
        if (connForm) {
            connForm.classList.remove('hidden')
        }
    })
})

document.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', () => saveFullProject(appContext))
})

function applyLoadedProject(projectInstance, projectPath) {
    if (!projectInstance) return

    const realData = extractProjectData(projectInstance, {})
    vm.ensureStartParagraph(realData.projectParagraphs)
    projectData = realData
    appContext.projectPath = projectPath || ''
    window.currentProjectPath = projectPath || ''

    markProjectClean()
    const projName =
        projectInstance.getName() ||
        (projectPath ? projectPath.split(/[\\/]/).filter(Boolean).pop() : '') ||
        'Projekt'
    updateProjectNameUI(projName)

    if (typeof vm.clearSelection === 'function') {
        vm.clearSelection()
    }

    renderParagraphsList(appContext)
    renderScenesList(appContext)
    renderConnectionsList(appContext)
    renderCharactersList(appContext)
    renderLocationsList(appContext)
    renderTraitsList(appContext)
    renderTagsList(appContext)
    renderFilterTags(appContext)
    populateFilterSelects(appContext)
    renderHistoryBar(appContext)
    renderDetailsPanel(appContext)
    updateMainWorkspaceUI(appContext)

    const sg = getStoryGraphInstance()
    if (sg) {
        sg.render(true)
    }
}

document.querySelectorAll('[data-action="open-project"]').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (window.electronAPI && typeof window.electronAPI.openProject === 'function') {
            try {
                const res = await window.electronAPI.openProject()
                if (res && res.success && res.project) {
                    const projectDir = res.path
                        ? res.path.endsWith('project.json')
                            ? res.path.replace(/[\\/]project\.json$/i, '')
                            : res.path
                        : ''
                    const projectInstance = ProjectManager.getInstance().load(
                        res.project,
                        res.entities || {},
                        res.path || projectDir
                    )
                    applyLoadedProject(projectInstance, projectDir || res.path)
                    toast.success(t('project.opened') || 'Projekt został pomyślnie otwarty')
                } else if (res && !res.success && res.error) {
                    toast.error(res.error)
                }
            } catch (err) {
                console.error('Error opening project:', err)
                toast.error(t('error.open_project_failed') || 'Nie udało się otworzyć projektu')
            }
        }
    })
})

document.querySelectorAll('[data-action="restore-project"]').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (window.electronAPI && typeof window.electronAPI.restoreProjectZip === 'function') {
            const canProceed = await confirmApplicationClose('project', appContext, {
                hasUnsavedNpc: hasUnsavedNpcChanges,
                saveNpc: () => executeNpcModalSave(appContext),
                saveFiles: ctx => saveAllUnsavedFiles(ctx),
                isProjectDirty: () => isProjectDirty(),
                saveFullProject: ctx => saveFullProject(ctx),
                markProjectClean: () => markProjectClean(),
            })
            if (!canProceed) return

            try {
                const res = await window.electronAPI.restoreProjectZip()
                if (res && res.success && res.project) {
                    const projectDir = res.path
                        ? res.path.endsWith('project.json')
                            ? res.path.replace(/[\\/]project\.json$/i, '')
                            : res.path
                        : ''
                    const projectInstance = ProjectManager.getInstance().load(
                        res.project,
                        res.entities || {},
                        res.path || projectDir
                    )
                    applyLoadedProject(projectInstance, projectDir || res.path)
                    toast.success(
                        t('start_window.restore_project_success') ||
                            'Projekt został pomyślnie przywrócony z archiwum ZIP!'
                    )
                } else if (res && !res.success && !res.canceled && res.error) {
                    toast.error(res.error)
                }
            } catch (err) {
                console.error('Error restoring project from zip:', err)
                toast.error(
                    t('start_window.restore_project_error') ||
                        'Nie udało się przywrócić projektu z pliku ZIP'
                )
            }
        }
    })
})

document.querySelectorAll('[data-action="close-project"]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const canClose = await confirmApplicationClose('project', appContext, {
            hasUnsavedNpc: hasUnsavedNpcChanges,
            saveNpc: () => executeNpcModalSave(appContext),
            saveFiles: ctx => saveAllUnsavedFiles(ctx),
            isProjectDirty: () => isProjectDirty(),
            saveFullProject: ctx => saveFullProject(ctx),
            markProjectClean: () => markProjectClean(),
        })
        if (
            canClose &&
            window.electronAPI &&
            typeof window.electronAPI.loadStartWindow === 'function'
        ) {
            window.electronAPI.loadStartWindow()
        }
    })
})

if (window.electronAPI && typeof window.electronAPI.onAppCloseRequested === 'function') {
    window.electronAPI.onAppCloseRequested(async () => {
        const canClose = await confirmApplicationClose('app', appContext, {
            hasUnsavedNpc: hasUnsavedNpcChanges,
            saveNpc: () => executeNpcModalSave(appContext),
            saveFiles: ctx => saveAllUnsavedFiles(ctx),
            isProjectDirty: () => isProjectDirty(),
            saveFullProject: ctx => saveFullProject(ctx),
            markProjectClean: () => markProjectClean(),
        })
        if (canClose && typeof window.electronAPI.forceCloseApp === 'function') {
            window.electronAPI.forceCloseApp()
        }
    })
}

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

        const sel = vm.getSelectedItem()
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
                const deleted = vm.deleteParagraph(
                    sel.entity.getId(),
                    projectData.projectParagraphs,
                    projectData.projectScenes
                )
                if (deleted) {
                    markProjectDirty()
                    vm.clearSelection()
                    refreshActiveSection('paragraph')
                    const sg = getStoryGraphInstance()
                    if (sg) sg.render(true)
                    toast.success(t('toast.paragraph_deleted') || 'Paragraf został usunięty')
                }
            }
        }
    }
})

if (fileEditor) {
    fileEditor.addEventListener('input', () => {
        const active = vm.getActiveFile()
        if (active) {
            markFileDirty(active)
            markProjectDirty()
            projectData.files[active] = fileEditor.value
            if (saveStatus) saveStatus.textContent = t('editor.unsaved_changes')
        }
    })
}

// Initial Render & i18n setup
async function initApp() {
    try {
        await initTranslations()
        applyTranslations()

        let projectLoaded = false

        if (window.electronAPI && typeof window.electronAPI.getCurrentProject === 'function') {
            try {
                const cur = await window.electronAPI.getCurrentProject()
                if (cur) {
                    window.currentProjectPath = cur
                    appContext.projectPath = cur
                    if (typeof window.electronAPI.openProject === 'function') {
                        const openRes = await window.electronAPI.openProject(cur)
                        if (openRes && openRes.success && openRes.project) {
                            const projectInstance = ProjectManager.getInstance().load(
                                openRes.project,
                                openRes.entities || {},
                                openRes.path || cur
                            )
                            projectData = extractProjectData(projectInstance, {})
                            vm.ensureStartParagraph(projectData.projectParagraphs)
                            markProjectClean()
                            const projName =
                                projectInstance.getName() ||
                                openRes.project.name ||
                                (cur ? cur.split(/[\\/]/).filter(Boolean).pop() : '') ||
                                'Projekt'
                            updateProjectNameUI(projName)
                            projectLoaded = true
                        }
                    }
                }
            } catch (err) {
                console.warn('Could not query current project path on startup:', err)
            }
        }

        if (!projectLoaded && ProjectManager.getInstance().getProject()) {
            const existingProj = ProjectManager.getInstance().getProject()
            projectData = extractProjectData(existingProj, {})
            vm.ensureStartParagraph(projectData.projectParagraphs)
            markProjectClean()
            updateProjectNameUI(existingProj.getName())
            projectLoaded = true
        }

        if (!projectLoaded) {
            const curProj = ProjectManager.getInstance().getProject()
            if (curProj && curProj.getName()) {
                updateProjectNameUI(curProj.getName())
            } else if (
                projectData &&
                (projectData.name ||
                    (projectData.projectParagraphs && projectData.projectParagraphs.length > 0))
            ) {
                updateProjectNameUI(projectData.name || 'Moja Gra')
            } else {
                updateProjectNameUI('')
            }
        }

        const initialLeftWidth = vm.getLeftDrawerWidth()
        if (leftDrawer) {
            leftDrawer.style.width = `${initialLeftWidth}px`
            leftDrawer.style.setProperty('--left-drawer-width', `${initialLeftWidth}px`)
        }

        const initialRightWidth = vm.getRightSidebarWidth()
        if (rightSidebar) {
            rightSidebar.style.width = `${initialRightWidth}px`
            rightSidebar.style.setProperty('--right-sidebar-width', `${initialRightWidth}px`)
        }

        setupParagraphSearchAndFilters(appContext)
        setupSectionControlsAndContextMenu(appContext)
        setupNpcModal(appContext)
        setupHeroModal(appContext)
        setupResizers(leftDrawer, rightSidebar, vm)
        setupGraphZoomControls(appContext, getStoryGraphInstance)

        // Initial drawer lists & filters rendering
        renderParagraphsList(appContext)
        renderScenesList(appContext)
        renderConnectionsList(appContext)
        renderCharactersList(appContext)
        renderMainCharacter(appContext)
        renderLocationsList(appContext)
        renderTraitsList(appContext)
        renderTagsList(appContext)
        renderFilterTags(appContext)
        populateFilterSelects(appContext)

        updateRibbonUI()
        initTopBar(appContext)
        initQuickSearch(appContext)
        updateTopBarUI(appContext)
        updateLeftDrawerUI()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        renderHistoryBar(appContext)
        renderDetailsPanel(appContext)
        updateMainWorkspaceUI(appContext)

        const langSelect = document.getElementById('settings-language-select')
        if (langSelect) {
            langSelect.value = getLanguage()
            langSelect.addEventListener('change', async () => {
                const newLang = langSelect.value
                await setLanguage(newLang)
                applyTranslations()
                const currentProj = ProjectManager.getInstance().getProject()
                if (currentProj && currentProj.getName()) {
                    updateProjectNameUI(currentProj.getName())
                } else {
                    const titleEl = document.getElementById('project-name-display')
                    const currentTitle = titleEl?.textContent?.trim()
                    if (
                        !titleEl ||
                        titleEl.hasAttribute('data-i18n') ||
                        !currentTitle ||
                        currentTitle === t('topbar.project_placeholder')
                    ) {
                        updateProjectNameUI('')
                    }
                }
                updateLeftDrawerUI()
                renderFilterTags(appContext)
                populateFilterSelects(appContext)
                renderParagraphsList(appContext)
                renderScenesList(appContext)
                renderConnectionsList(appContext)
                renderTagsList(appContext)
                renderCharactersList(appContext)
                renderMainCharacter(appContext)
                renderLocationsList(appContext)
                renderTraitsList(appContext)
                renderHistoryBar(appContext)
                renderDetailsPanel(appContext)
                updateMainWorkspaceUI(appContext)
            })
        }

        const zoomSensSlider = document.getElementById('settings-zoom-sensitivity')
        const zoomSensValue = document.getElementById('settings-zoom-sensitivity-value')
        if (zoomSensSlider) {
            const currentSens = vm.getZoomSensitivity()
            zoomSensSlider.value = String(currentSens)
            if (zoomSensValue) {
                zoomSensValue.textContent = `${Math.round(currentSens * 100)}%`
            }
            zoomSensSlider.addEventListener('input', () => {
                const val = parseFloat(zoomSensSlider.value)
                vm.setZoomSensitivity(val)
                const sg = getStoryGraphInstance()
                if (sg) {
                    sg.setWheelSensitivity(val)
                }
                if (zoomSensValue) {
                    zoomSensValue.textContent = `${Math.round(val * 100)}%`
                }
            })
        }

        const autoSaveCheckbox = document.getElementById('settings-auto-save')
        if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = isAutoSaveEnabled()
            autoSaveCheckbox.addEventListener('change', () => {
                const enabled = autoSaveCheckbox.checked
                setAutoSaveEnabled(enabled, appContext)
                const title =
                    typeof t === 'function' &&
                    t('toast.auto_save_title') !== 'toast.auto_save_title'
                        ? t('toast.auto_save_title')
                        : 'Auto-zapis'
                const msg = enabled
                    ? typeof t === 'function' &&
                      t('toast.auto_save_enabled') !== 'toast.auto_save_enabled'
                        ? t('toast.auto_save_enabled')
                        : 'Włączono automatyczny zapis w tle.'
                    : typeof t === 'function' &&
                        t('toast.auto_save_disabled') !== 'toast.auto_save_disabled'
                      ? t('toast.auto_save_disabled')
                      : 'Wyłączono automatyczny zapis w tle.'
                toast.info(msg, title)
            })
        }

        if (isAutoSaveEnabled()) {
            startAutoSave(appContext)
        }
    } catch (err) {
        console.error('Fatal initialization error in MainWindow:', err)
    }
}

initApp()
