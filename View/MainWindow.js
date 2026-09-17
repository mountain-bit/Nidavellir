import { StoryGraph } from '../dist/Modules/Graph/index.js'
import { toast } from '../dist/Utils/toast.js'
import {
    applyTranslations,
    getLanguage,
    initTranslations,
    setLanguage,
    t,
} from '../dist/Utils/translate.js'
import {
    Choice,
    DEFAULT_SCENE_COLOR,
    Description,
    MainWindowViewModel,
    Paragraph,
    Scene,
    TextCondition,
} from '../dist/ViewModel/MainWindowViewModel.js'
import {
    handleColorSelection,
    openColorPicker,
    openContextMenu,
    setupSectionControlsAndContextMenu,
} from './ui/contextMenu.js'
import { renderDetailsPanel, renderHistoryBar } from './ui/detailsPanel.js'
import {
    renderCharactersList,
    renderConnectionsList,
    renderLocationsList,
    renderParagraphsList,
    renderScenesList,
    renderTagsList,
    renderTraitsList,
} from './ui/drawerLists.js'
import {
    populateFilterSelects,
    renderFilterTags,
    setupParagraphSearchAndFilters,
    updateFilterBadgeState,
} from './ui/filterPopover.js'
import {
    renderEditorTabs,
    saveActiveFile,
    setupResizers,
    updateMainWorkspaceUI,
    updateRightSidebarUI,
    updateZoomToolbarUI,
} from './ui/workspace.js'

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

// Mock files state
const files = {
    'Wprowadzenie.md': '# Wprowadzenie\n\nWitaj w edytorze gry paragrafowej...',
    'Zasady.md': '# Zasady Gry\n\nTwój bohater posiada cechy oraz ekwipunek...',
}

// In-memory project entities state
let projectTags = [
    vm.createTag('Ważne', '#ef4444'),
    vm.createTag('Walka', '#dc2626'),
    vm.createTag('Magia', '#8b5cf6'),
]
let projectCharacters = [vm.createCharacter('Strażnik miejski'), vm.createCharacter('Kupiec Jan')]
let projectLocations = [vm.createLocation('Karczma Pod Różą'), vm.createLocation('Mroczny Las')]
let projectStats = [vm.createStat('Siła'), vm.createStat('Zręczność')]
let projectParagraphs = [
    new Paragraph(
        'p1',
        'Prolog: Przebudzenie',
        new Description(
            'Budzisz się w starej karczmie. Za oknem szaleje burza.',
            'Przebudzenie w gospodzie podczas nocnej nawałnicy.'
        ),
        [
            new Choice(
                'c1',
                'Idź do lasu',
                'p1',
                'p2',
                new TextCondition('cond1', 'Pochodnia', 'Wymagana zapalona pochodnia')
            ),
            new Choice('c2', 'Zbadaj komnatę', 'p1', 'p3'),
        ],
        false,
        undefined,
        [projectTags[0]]
    ),
    new Paragraph(
        'p2',
        'Mroczny trakt leśny',
        new Description(
            'Ścieżka prowadzi przez gęsty las pełen niebezpieczeństw.',
            'Wkroczenie na niebezpieczny trakt w leśnych ostępach.'
        ),
        [],
        false,
        undefined,
        [projectTags[1]]
    ),
    new Paragraph(
        'p3',
        'Komnata runiczna',
        new Description(
            'Blask runów oświetla starożytne zwoje i artefakty.',
            'Odnalezienie sekretnej komnaty z mistycznymi runami.'
        ),
        [],
        false,
        undefined,
        [projectTags[2]]
    ),
]

projectParagraphs[0].setPosition({ x: 180, y: 180 })
projectParagraphs[1].setPosition({ x: 480, y: 90 })
projectParagraphs[2].setPosition({ x: 480, y: 290 })

let projectScenes = [
    new Scene(
        's1',
        'Wstęp do przygody',
        new Description(),
        [projectParagraphs[0]],
        [projectCharacters[0]],
        null,
        [],
        '',
        { x: 50, y: 70 },
        260,
        220,
        DEFAULT_SCENE_COLOR || '#3b82f6'
    ),
    new Scene(
        's2',
        'Eksploracja lasu',
        new Description(),
        [projectParagraphs[1], projectParagraphs[2]],
        [projectCharacters[1]],
        null,
        [],
        '',
        { x: 350, y: 20 },
        260,
        360,
        '#10b981'
    ),
]

let storyGraphInstance = null

/**
 * Shared Application Context passed to modular UI renderers.
 */
const appContext = {
    vm,
    get projectTags() {
        return projectTags
    },
    get projectCharacters() {
        return projectCharacters
    },
    get projectLocations() {
        return projectLocations
    },
    get projectStats() {
        return projectStats
    },
    get projectParagraphs() {
        return projectParagraphs
    },
    get projectScenes() {
        return projectScenes
    },
    get files() {
        return files
    },
    get storyGraphInstance() {
        return storyGraphInstance
    },
    selectEntity,
    refreshActiveSection,
    renderParagraphsList: () => renderParagraphsList(appContext),
    renderScenesList: () => renderScenesList(appContext),
    renderTagsList: () => renderTagsList(appContext),
    renderCharactersList: () => renderCharactersList(appContext),
    renderLocationsList: () => renderLocationsList(appContext),
    renderTraitsList: () => renderTraitsList(appContext),
    renderConnectionsList: () => renderConnectionsList(appContext),
    renderFilterTags: () => renderFilterTags(appContext),
    populateFilterSelects: () => populateFilterSelects(appContext),
    updateFilterBadgeState: () => updateFilterBadgeState(appContext),
    renderHistoryBar: () => renderHistoryBar(appContext),
    renderDetailsPanel: () => renderDetailsPanel(appContext),
    renderEditorTabs: () => renderEditorTabs(appContext),
    updateMainWorkspaceUI: () => updateMainWorkspaceUI(appContext),
    openContextMenu,
    openColorPicker,
    handleColorSelection: color => handleColorSelection(color, appContext),
    showGraph: (force = false) => showGraph(force),
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
    } else if (leftDrawer) {
        leftDrawer.classList.add('collapsed')
        if (leftResizer) leftResizer.classList.add('collapsed')
    }
}

function refreshActiveSection(type) {
    if (type === 'tag') {
        renderTagsList(appContext)
        renderFilterTags(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (type === 'character') {
        renderCharactersList(appContext)
        populateFilterSelects(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (type === 'location') {
        renderLocationsList(appContext)
        renderParagraphsList(appContext)
        renderScenesList(appContext)
    }
    if (type === 'trait') renderTraitsList(appContext)
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
    vm.selectElement(entity, type, parent)
    updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
    renderHistoryBar(appContext)
    renderDetailsPanel(appContext)
}

function showGraph(forceRebuild = false) {
    const canvasContainer = document.getElementById('story-graph')
    const nodesLayer = document.getElementById('graph-nodes-layer')
    if (!canvasContainer || !nodesLayer) return

    if (!storyGraphInstance) {
        storyGraphInstance = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: vm.getConnectionLineStyle(),
            wheelSensitivity: vm.getZoomSensitivity(),
            onZoomChange: lvl => updateZoomToolbarUI(storyGraphInstance, lvl),
            getParagraphs: () => projectParagraphs,
            getScenes: () => projectScenes,
            getTags: () => projectTags,
            getCharacters: () => projectCharacters,
            getLocations: () => projectLocations,
            onItemAssigned: () => {
                renderParagraphsList(appContext)
                renderScenesList(appContext)
                renderTagsList(appContext)
                renderCharactersList(appContext)
                renderLocationsList(appContext)
                renderDetailsPanel(appContext)
                if (storyGraphInstance) storyGraphInstance.render(true)
            },
            onSelectParagraph: (p, scene) => {
                if (vm.isRightSidebarCollapsed()) {
                    vm.setRightSidebarCollapsed(false)
                    updateRightSidebarUI(
                        vm,
                        rightSidebar,
                        toggleRightSidebarBtn,
                        reopenRightSidebarBtn
                    )
                }
                selectEntity(p, 'paragraph', scene)
            },
            onSelectScene: scene => {
                if (vm.isRightSidebarCollapsed()) {
                    vm.setRightSidebarCollapsed(false)
                    updateRightSidebarUI(
                        vm,
                        rightSidebar,
                        toggleRightSidebarBtn,
                        reopenRightSidebarBtn
                    )
                }
                selectEntity(scene, 'scene')
            },
            onSelectChoice: (choice, fromP) => {
                if (vm.isRightSidebarCollapsed()) {
                    vm.setRightSidebarCollapsed(false)
                    updateRightSidebarUI(
                        vm,
                        rightSidebar,
                        toggleRightSidebarBtn,
                        reopenRightSidebarBtn
                    )
                }
                selectEntity(choice, 'choice', fromP)
            },
            onSceneAssignmentChange: () => {
                renderScenesList(appContext)
                renderParagraphsList(appContext)
                populateFilterSelects(appContext)
            },
            onCreateParagraph: title => {
                const newP = vm.createParagraph(title)
                projectParagraphs.push(newP)
                renderParagraphsList(appContext)
                return newP
            },
            onCreateConnection: (fromParagraph, toParagraph, choiceName) => {
                const choice = vm.createChoice(fromParagraph, toParagraph, choiceName)
                renderConnectionsList(appContext)
                renderParagraphsList(appContext)
                return choice
            },
            onToast: (type, msg, title) => {
                if (type === 'success') toast.success(msg, title)
                else if (type === 'error') toast.error(msg, title)
                else if (type === 'warning') toast.warning(msg, title)
                else toast.info(msg, title)
            },
            t,
        })
    }

    if (!canvasContainer.dataset.dropBound) {
        canvasContainer.dataset.dropBound = 'true'
        canvasContainer.addEventListener('dragover', e => {
            e.preventDefault()
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy'
            }
        })
        canvasContainer.addEventListener('drop', e => {
            e.preventDefault()
            const sceneId =
                (e.dataTransfer && e.dataTransfer.getData('application/x-scene-id')) ||
                (e.dataTransfer && e.dataTransfer.getData('text/plain'))
            if (!sceneId) return
            const scene = projectScenes.find(s => s.getId() === sceneId)
            if (!scene) return

            const rect = canvasContainer.getBoundingClientRect()
            const clientX = e.clientX - rect.left
            const clientY = e.clientY - rect.top

            if (storyGraphInstance) {
                const cy = storyGraphInstance.getCyInstance()
                let graphPos = { x: clientX, y: clientY }
                if (cy && typeof cy.pan === 'function' && typeof cy.zoom === 'function') {
                    const pan = cy.pan()
                    const zoom = cy.zoom() || 1
                    graphPos = {
                        x: Math.round((clientX - pan.x) / zoom),
                        y: Math.round((clientY - pan.y) / zoom),
                    }
                }
                storyGraphInstance.addSceneToGraph(scene, graphPos)
                toast.success(
                    t('toast.scene_placed_on_graph', { name: scene.getName() }),
                    t('toast.scene_placed_title')
                )
                renderScenesList(appContext)
                renderParagraphsList(appContext)
                populateFilterSelects(appContext)
            }
        })
    }

    storyGraphInstance.render(forceRebuild)
    updateZoomToolbarUI(storyGraphInstance)
}

// Graph Zoom Toolbar Controls
const btnGraphZoomOut = document.getElementById('btn-graph-zoom-out')
if (btnGraphZoomOut) {
    btnGraphZoomOut.addEventListener('click', () => {
        if (storyGraphInstance) {
            storyGraphInstance.zoomOut()
            updateZoomToolbarUI(storyGraphInstance)
        }
    })
}

const btnGraphZoomIn = document.getElementById('btn-graph-zoom-in')
if (btnGraphZoomIn) {
    btnGraphZoomIn.addEventListener('click', () => {
        if (storyGraphInstance) {
            storyGraphInstance.zoomIn()
            updateZoomToolbarUI(storyGraphInstance)
        }
    })
}

const btnGraphZoomReset = document.getElementById('btn-graph-zoom-reset')
if (btnGraphZoomReset) {
    btnGraphZoomReset.addEventListener('click', () => {
        if (storyGraphInstance) {
            storyGraphInstance.resetZoom()
            updateZoomToolbarUI(storyGraphInstance)
        }
    })
}

const btnGraphZoomFit = document.getElementById('btn-graph-zoom-fit')
if (btnGraphZoomFit) {
    btnGraphZoomFit.addEventListener('click', () => {
        if (storyGraphInstance) {
            storyGraphInstance.fit()
            updateZoomToolbarUI(storyGraphInstance)
        }
    })
}

window.addEventListener('resize', () => {
    if (storyGraphInstance) {
        storyGraphInstance.resize()
    }
})

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
    })
}

if (reopenRightSidebarBtn) {
    reopenRightSidebarBtn.addEventListener('click', () => {
        vm.setRightSidebarCollapsed(false)
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
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
    })
}

if (viewGraphBtn) {
    viewGraphBtn.addEventListener('click', () => {
        vm.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
    })
}

document.querySelectorAll('[data-action="show-graph"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.setActiveMainView('graph')
        updateMainWorkspaceUI(appContext)
    })
})

document.querySelectorAll('[data-action="switch-markdown"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.setActiveMainView('markdown')
        updateMainWorkspaceUI(appContext)
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
    })
})

document.querySelectorAll('[data-action="toggle-right-sidebar"]').forEach(btn => {
    btn.addEventListener('click', () => {
        vm.toggleRightSidebar()
        updateRightSidebarUI(vm, rightSidebar, toggleRightSidebarBtn, reopenRightSidebarBtn)
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
    btn.addEventListener('click', () => saveActiveFile(appContext))
})

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveActiveFile(appContext)
    }
})

if (fileEditor) {
    fileEditor.addEventListener('input', () => {
        const active = vm.getActiveFile()
        if (active) {
            files[active] = fileEditor.value
            if (saveStatus) saveStatus.textContent = t('editor.unsaved_changes')
        }
    })
}

// Initial Render & i18n setup
async function initApp() {
    try {
        await initTranslations()
        applyTranslations()

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
        setupResizers(leftDrawer, rightSidebar, vm)

        // Initial drawer lists & filters rendering
        renderParagraphsList(appContext)
        renderScenesList(appContext)
        renderConnectionsList(appContext)
        renderCharactersList(appContext)
        renderLocationsList(appContext)
        renderTraitsList(appContext)
        renderTagsList(appContext)
        renderFilterTags(appContext)
        populateFilterSelects(appContext)

        updateRibbonUI()
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
                updateLeftDrawerUI()
                renderFilterTags(appContext)
                populateFilterSelects(appContext)
                renderParagraphsList(appContext)
                renderScenesList(appContext)
                renderConnectionsList(appContext)
                renderTagsList(appContext)
                renderCharactersList(appContext)
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
                if (storyGraphInstance) {
                    storyGraphInstance.setWheelSensitivity(val)
                }
                if (zoomSensValue) {
                    zoomSensValue.textContent = `${Math.round(val * 100)}%`
                }
            })
        }
    } catch (err) {
        console.error('Fatal initialization error in MainWindow:', err)
    }
}

initApp()
