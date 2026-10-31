import { applyTranslations, initTranslations, t } from '../dist/Utils/translate.js'
import { MainWindowViewModel, ProjectManager } from '../dist/ViewModel/MainWindowViewModel.js'
if (typeof window !== 'undefined') {
    window.ProjectManager = ProjectManager
}
import { loadProjectData } from './projectData.js'
import { renderDetailsPanel, renderHistoryBar } from './ui/detailsPanel/detailsPanel.js'
import {
    populateFilterSelects,
    renderCharactersList,
    renderConnectionsList,
    renderDrawerSearchResults,
    renderFilterTags,
    renderItemsList,
    renderLocationsList,
    renderMainCharacter,
    renderParagraphsList,
    renderScenesList,
    renderTagsList,
    renderTraitsList,
    setupDrawerSearch,
    setupParagraphSearchAndFilters,
    setupSectionSearchInputs,
    updateFilterBadgeState,
} from './ui/drawer/index.js'
import {
    centerStoryGraph,
    getStoryGraphInstance,
    setupGraphZoomControls,
    showStoryGraph,
} from './ui/graph/index.js'
import { markFileDirty } from './ui/modals/confirm/confirmModal.js'
import { openHeroModal, setupHeroModal } from './ui/modals/hero/heroModal.js'
import {
    renderDynamicSuggestions,
    setupNpcModal,
    updateTraitsCounterUI,
} from './ui/modals/npc/npcModal.js'
import {
    applyLoadedProject,
    setupProjectIpcActions,
} from './ui/project/mainWindowProjectActions.js'
import { saveFullProject } from './ui/project/projectSaver.js'
import {
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
import { setupMainWindowHotkeys } from './ui/workspace/mainWindowHotkeys.js'
import { setupMainWindowSettings } from './ui/workspace/mainWindowSettings.js'
import { initQuickSearch, openQuickSearch } from './ui/workspace/quickSearch.js'
import { initTopBar, updateTopBarUI } from './ui/workspace/topBar.js'
import {
    renderEditorTabs,
    saveActiveFile,
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

// Active project data state (defaults to mock data; switchable to real data via loadProjectData)
let projectData = loadProjectData(vm)
vm.factory.ensureStartParagraph(projectData.projectParagraphs)

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
        vm.factory.ensureStartParagraph(projectData.projectParagraphs)
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
    set playerCharacter(val) {
        projectData.playerCharacter = val
    },
    get playerCharacters() {
        if (!Array.isArray(projectData.playerCharacters)) {
            projectData.playerCharacters = projectData.playerCharacter
                ? [projectData.playerCharacter]
                : []
        }
        return projectData.playerCharacters
    },
    set playerCharacters(val) {
        projectData.playerCharacters = val
    },
    get project() {
        return (
            vm.project ||
            (typeof ProjectManager !== 'undefined'
                ? ProjectManager.getInstance().getProject()
                : null)
        )
    },
    set project(p) {
        vm.project = p
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
    renderItemsList: () => renderItemsList(appContext),
    renderTraitsList: () => renderTraitsList(appContext),
    renderDynamicSuggestions: () => renderDynamicSuggestions(appContext),
    updateTraitsCounterUI: () => updateTraitsCounterUI(appContext),
    renderConnectionsList: () => renderConnectionsList(appContext),
    renderFilterTags: () => renderFilterTags(appContext),
    populateFilterSelects: () => populateFilterSelects(appContext),
    updateFilterBadgeState: () => updateFilterBadgeState(appContext),
    renderHistoryBar: () => renderHistoryBar(appContext),
    renderDetailsPanel: () => renderDetailsPanel(appContext),
    renderDrawerSearchResults: query => renderDrawerSearchResults(appContext, query),
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
        if (typeof vm?.layout?.setActiveLeftTab === 'function') {
            vm.layout.setActiveLeftTab('settings')
        } else if (vm.layout.getActiveLeftTab() !== 'settings') {
            vm.layout.toggleLeftTab('settings')
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
    const activeTab = vm.layout.getActiveLeftTab()
    if (!activeTab || !leftDrawerTitle) return

    const titleKeys = {
        paragraphs: 'left_panel.paragraphs',
        scenes: 'left_panel.scenes',
        characters: 'left_panel.characters',
        locations: 'left_panel.locations',
        items: 'left_panel.items',
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
    const activeTab = vm.layout.getActiveRibbonTab()
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
    const activeLeftTab = vm.layout.getActiveLeftTab()
    const isOpen = vm.layout.isLeftDrawerOpen()
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
        else if (activeLeftTab === 'items') renderItemsList(appContext)
        else if (activeLeftTab === 'traits') renderTraitsList(appContext)
        else if (activeLeftTab === 'tags') renderTagsList(appContext)
        else if (activeLeftTab === 'main-character') renderMainCharacter(appContext)
        else if (activeLeftTab === 'search') renderDrawerSearchResults(appContext)
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
        renderItemsList(appContext)
    }
    if (type === 'item') {
        renderItemsList(appContext)
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
    vm.selection.selectElement(entity, type, parent)
    updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
    renderHistoryBar(appContext)
    renderDetailsPanel(appContext)
}

// Event Listeners Registration
document.querySelectorAll('[data-ribbon-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.ribbonTab
        vm.layout.setActiveRibbonTab(tab)
        updateRibbonUI()
    })
})

document.querySelectorAll('[data-left-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.leftTab
        vm.layout.toggleLeftTab(tab)
        updateLeftDrawerUI()
    })
})

if (closeLeftDrawerBtn) {
    closeLeftDrawerBtn.addEventListener('click', () => {
        vm.layout.closeLeftDrawer()
        updateLeftDrawerUI()
    })
}

if (toggleRightSidebarBtn) {
    toggleRightSidebarBtn.addEventListener('click', () => {
        vm.layout.toggleRightSidebar()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
}

if (reopenRightSidebarBtn) {
    reopenRightSidebarBtn.addEventListener('click', () => {
        vm.layout.setRightSidebarCollapsed(false)
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
}

document.querySelectorAll('[data-file]').forEach(btn => {
    btn.addEventListener('click', () => {
        const fileName = btn.dataset.file
        if (fileName) {
            vm.files.setActiveFile(fileName)
            updateMainWorkspaceUI(appContext)
        }
    })
})

if (viewMarkdownBtn) {
    viewMarkdownBtn.addEventListener('click', () => {
        vm.layout.setActiveMainView('markdown')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
}

if (viewGraphBtn) {
    viewGraphBtn.addEventListener('click', () => {
        vm.layout.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
}

document.querySelectorAll('[data-action="show-graph"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="switch-markdown"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.setActiveMainView('markdown')
        updateMainWorkspaceUI(appContext)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="open-main-character"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.toggleLeftTab('main-character')
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
        vm.layout.toggleLeftTab('characters')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="open-locations"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.toggleLeftTab('locations')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="open-items"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.toggleLeftTab('traits')
        updateLeftDrawerUI()
    })
})

document.querySelectorAll('[data-action="toggle-left-drawer"]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (vm.layout.isLeftDrawerOpen()) {
            vm.layout.closeLeftDrawer()
        } else {
            vm.layout.toggleLeftTab(vm.layout.getActiveLeftTab() || 'paragraphs')
        }
        updateLeftDrawerUI()
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="toggle-right-sidebar"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.toggleRightSidebar()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
        updateTopBarUI(appContext)
    })
})

document.querySelectorAll('[data-action="new-scene"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.layout.toggleLeftTab('scenes')
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
        vm.layout.toggleLeftTab('connections')
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

// Setup modular project actions and global listeners
setupProjectIpcActions(appContext)
setupMainWindowHotkeys(appContext)

if (fileEditor) {
    fileEditor.addEventListener('input', () => {
        const active = vm.files.getActiveFile()
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
                            applyLoadedProject(appContext, projectInstance, openRes.path || cur)
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
            applyLoadedProject(appContext, existingProj, appContext.projectPath)
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

        const initialLeftWidth = vm.layout.getLeftDrawerWidth()
        if (leftDrawer) {
            leftDrawer.style.width = `${initialLeftWidth}px`
            leftDrawer.style.setProperty('--left-drawer-width', `${initialLeftWidth}px`)
        }

        const initialRightWidth = vm.layout.getRightSidebarWidth()
        if (rightSidebar) {
            rightSidebar.style.width = `${initialRightWidth}px`
            rightSidebar.style.setProperty('--right-sidebar-width', `${initialRightWidth}px`)
        }

        setupParagraphSearchAndFilters(appContext)
        setupDrawerSearch(appContext)
        setupSectionSearchInputs(appContext)
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

        // Settings panel bindings
        setupMainWindowSettings(appContext)
    } catch (err) {
        console.error('Fatal initialization error in MainWindow:', err)
    }
}

initApp()
