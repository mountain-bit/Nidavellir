/* global cytoscape */
import { MainWindowViewModel } from '../dist/ViewModel/MainWindowViewModel.js'

const files = {}

const vm = new MainWindowViewModel()
let graph = null

// DOM Elements
const leftDrawer = document.getElementById('left-drawer')
const leftDrawerTitle = document.getElementById('left-drawer-title')
const closeLeftDrawerBtn = document.getElementById('close-left-drawer-btn')
const rightSidebar = document.getElementById('right-sidebar')
const toggleRightSidebarBtn = document.getElementById('toggle-right-sidebar-btn')
const reopenRightSidebarBtn = document.getElementById('reopen-right-sidebar-btn')

const markdownContainer = document.getElementById('markdown-container')
const graphContainer = document.getElementById('graph-container')
const fileEditor = document.getElementById('file-editor')
const editorTabs = document.getElementById('editor-tabs')
const activeFileLabel = document.getElementById('active-file-label')
const saveStatus = document.getElementById('save-status')
const viewMarkdownBtn = document.getElementById('view-mode-markdown-btn')
const viewGraphBtn = document.getElementById('view-mode-graph-btn')

// Ribbon Elements
const ribbonTabBtns = document.querySelectorAll('.ribbon-tab-btn')
const ribbonTabContents = document.querySelectorAll('.ribbon-tab-content')

// Left Drawer Titles mapping
const drawerTitles = {
    explorer: 'Eksplorator Projektu',
    scenes: 'Lista Scen i Paragrafów',
    search: 'Wyszukiwanie',
    settings: 'Ustawienia Edytora',
}

// Render Ribbon Tabs
function updateRibbonUI() {
    const activeTab = vm.getActiveRibbonTab()
    ribbonTabBtns.forEach(btn => {
        const isTab = btn.dataset.ribbonTab === activeTab
        btn.className = `ribbon-tab-btn px-4 py-1.5 font-medium border-b-2 text-xs transition-colors ${
            isTab
                ? 'border-blue-500 text-white bg-[#28282c]'
                : 'border-transparent text-[#a1a1aa] hover:text-white hover:bg-[#252528]'
        }`
    })

    ribbonTabContents.forEach(panel => {
        if (panel.id === `ribbon-panel-${activeTab}`) {
            panel.classList.remove('hidden')
        } else {
            panel.classList.add('hidden')
        }
    })
}

// Render Left Drawer & Icon Bar UI
function updateLeftDrawerUI() {
    const activeLeftTab = vm.getActiveLeftTab()
    const isOpen = vm.isLeftDrawerOpen()

    // Icon bar items
    document.querySelectorAll('[data-left-tab]').forEach(btn => {
        if (isOpen && btn.dataset.leftTab === activeLeftTab) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })

    // Left Drawer panel width & visibility
    if (isOpen && activeLeftTab) {
        leftDrawer.classList.remove('collapsed')
        leftDrawerTitle.textContent = drawerTitles[activeLeftTab] || 'Panel Boczny'

        // Hide all drawer tab contents and show active one
        document.querySelectorAll('.left-tab-content').forEach(content => {
            if (content.id === `left-content-${activeLeftTab}`) {
                content.classList.remove('hidden')
            } else {
                content.classList.add('hidden')
            }
        })
    } else {
        leftDrawer.classList.add('collapsed')
    }
}

// Render Right Sidebar UI
function updateRightSidebarUI() {
    const isCollapsed = vm.isRightSidebarCollapsed()
    if (isCollapsed) {
        rightSidebar.classList.add('collapsed')
        toggleRightSidebarBtn.textContent = '‹'
        reopenRightSidebarBtn.classList.remove('hidden')
    } else {
        rightSidebar.classList.remove('collapsed')
        toggleRightSidebarBtn.textContent = '›'
        reopenRightSidebarBtn.classList.add('hidden')
    }
}

// Render Central Workspace (Markdown / Graph)
function updateMainWorkspaceUI() {
    const mainView = vm.getActiveMainView()
    if (mainView === 'graph') {
        markdownContainer.classList.add('hidden')
        graphContainer.classList.remove('hidden')
        viewGraphBtn.className = 'px-2.5 py-1 text-xs rounded bg-[#2e2e33] text-white'
        viewMarkdownBtn.className =
            'px-2.5 py-1 text-xs rounded bg-transparent text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'
        showGraph()
    } else {
        markdownContainer.classList.remove('hidden')
        graphContainer.classList.add('hidden')
        viewMarkdownBtn.className = 'px-2.5 py-1 text-xs rounded bg-[#2e2e33] text-white'
        viewGraphBtn.className =
            'px-2.5 py-1 text-xs rounded bg-transparent text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'
    }

    renderTabs()
    updateExplorerUI()
    updateSelectedDetails()
}

function updateSelectedDetails() {
    const activeFile = vm.getActiveFile()
    const selectedElem = document.getElementById('selected-element')
    const selectedType = document.getElementById('selected-type')

    if (vm.getActiveMainView() === 'graph') {
        selectedElem.textContent = 'Graf historii'
        selectedType.textContent = 'Wizualizacja'
    } else if (activeFile) {
        selectedElem.textContent = activeFile
        selectedType.textContent = activeFile.startsWith('Scena') ? 'Scena' : 'Dokument'
        activeFileLabel.textContent = activeFile
        if (files[activeFile] !== undefined) {
            fileEditor.value = files[activeFile]
        }
    } else {
        selectedElem.textContent = 'Brak pliku'
        selectedType.textContent = '—'
        activeFileLabel.textContent = '—'
        fileEditor.value = ''
    }
}

function renderTabs() {
    const openFiles = vm.getOpenFiles()
    const activeFile = vm.getActiveFile()

    editorTabs.replaceChildren(
        ...openFiles.map(fileName => {
            const tab = document.createElement('div')
            const isActive = fileName === activeFile && vm.getActiveMainView() === 'markdown'
            tab.className = `flex items-center gap-2 px-3 py-1 text-xs rounded-t border-t-2 cursor-pointer transition-colors ${
                isActive
                    ? 'border-blue-500 bg-[#18181b] text-white font-medium'
                    : 'border-transparent bg-[#252528] text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'
            }`

            const label = document.createElement('span')
            label.textContent = fileName
            label.addEventListener('click', () => {
                vm.setActiveFile(fileName)
                updateMainWorkspaceUI()
            })

            const closeBtn = document.createElement('span')
            closeBtn.className = 'hover:text-red-400 ml-1 text-sm'
            closeBtn.textContent = '×'
            closeBtn.addEventListener('click', e => {
                e.stopPropagation()
                vm.closeFile(fileName)
                updateMainWorkspaceUI()
            })

            tab.appendChild(label)
            tab.appendChild(closeBtn)
            return tab
        })
    )
}

function updateExplorerUI() {
    const explorerFileList = document.getElementById('explorer-file-list')
    if (!explorerFileList) return
    const fileNames = Object.keys(files)
    if (fileNames.length === 0) {
        explorerFileList.innerHTML =
            '<li class="p-2 text-xs text-[#a1a1aa] italic">Brak plików w projekcie</li>'
        return
    }
    explorerFileList.replaceChildren(
        ...fileNames.map(fileName => {
            const li = document.createElement('li')
            const btn = document.createElement('button')
            btn.className =
                'w-full text-left px-2.5 py-1.5 rounded text-xs text-[#e4e4e7] hover:bg-[#2c2c30] focus:bg-[#323238] flex items-center gap-2'
            btn.type = 'button'
            btn.innerHTML = `<span>${fileName.endsWith('.md') ? '▤' : '◇'}</span> <span>${fileName}</span>`
            btn.addEventListener('click', () => {
                vm.setActiveFile(fileName)
                updateMainWorkspaceUI()
            })
            li.appendChild(btn)
            return li
        })
    )
}

function showGraph() {
    if (!graph) {
        graph = cytoscape({
            container: document.getElementById('story-graph'),
            elements: [],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#2563eb',
                        label: 'data(label)',
                        color: '#ffffff',
                        'font-size': 12,
                        'text-valign': 'center',
                        'text-halign': 'center',
                        width: 120,
                        height: 44,
                        shape: 'round-rectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': '#475569',
                        'target-arrow-color': '#475569',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                    },
                },
            ],
            layout: { name: 'breadthfirst', directed: true, padding: 40 },
        })
    }
    requestAnimationFrame(() => graph.resize().fit(undefined, 40))
}

// Event Listeners Initialization

// Ribbon Tab Clicks
ribbonTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.ribbonTab
        if (tab) {
            vm.setActiveRibbonTab(tab)
            updateRibbonUI()
        }
    })
})

// Left Icon Bar Item Clicks (Toggle logic: click same icon -> close drawer; click other -> switch drawer tab)
document.querySelectorAll('[data-left-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.leftTab
        if (tab) {
            vm.toggleLeftTab(tab)
            updateLeftDrawerUI()
        }
    })
})

// Close Left Drawer Button
closeLeftDrawerBtn.addEventListener('click', () => {
    vm.closeLeftDrawer()
    updateLeftDrawerUI()
})

// Right Sidebar Toggle Arrow Button
toggleRightSidebarBtn.addEventListener('click', () => {
    vm.toggleRightSidebar()
    updateRightSidebarUI()
})

reopenRightSidebarBtn.addEventListener('click', () => {
    vm.toggleRightSidebar()
    updateRightSidebarUI()
})

// Action Buttons
document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.dataset.action
        switch (action) {
            case 'new-file':
            case 'new-scene': {
                const count = Object.keys(files).length
                const name = `Scena ${count}`
                files[name] = `# ${name}\n\nTreść nowej sceny.`
                vm.setActiveFile(name)
                updateMainWorkspaceUI()
                break
            }
            case 'save':
                if (saveStatus) {
                    saveStatus.textContent = 'Zapisano'
                    setTimeout(() => {
                        saveStatus.textContent = 'Gotowy'
                    }, 2000)
                }
                break
            case 'show-graph':
                vm.setActiveMainView('graph')
                updateMainWorkspaceUI()
                break
            case 'switch-markdown':
                vm.setActiveMainView('markdown')
                updateMainWorkspaceUI()
                break
            case 'toggle-left-drawer':
                if (vm.isLeftDrawerOpen()) {
                    vm.closeLeftDrawer()
                } else {
                    vm.toggleLeftTab('explorer')
                }
                updateLeftDrawerUI()
                break
            case 'toggle-right-sidebar':
                vm.toggleRightSidebar()
                updateRightSidebarUI()
                break
        }
    })
})

// File Selection in Explorer
document.querySelectorAll('[data-file]').forEach(btn => {
    btn.addEventListener('click', () => {
        const fileName = btn.dataset.file
        if (fileName) {
            vm.setActiveFile(fileName)
            updateMainWorkspaceUI()
        }
    })
})

// View Mode Buttons
viewMarkdownBtn.addEventListener('click', () => {
    vm.setActiveMainView('markdown')
    updateMainWorkspaceUI()
})

viewGraphBtn.addEventListener('click', () => {
    vm.setActiveMainView('graph')
    updateMainWorkspaceUI()
})

// Textarea Editing
fileEditor.addEventListener('input', () => {
    const active = vm.getActiveFile()
    if (active) {
        files[active] = fileEditor.value
        if (saveStatus) saveStatus.textContent = 'Niezapisane zmiany'
    }
})

// Initial Render
updateRibbonUI()
updateLeftDrawerUI()
updateRightSidebarUI()
updateMainWorkspaceUI()
