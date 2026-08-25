import {
    applyTranslations,
    getLanguage,
    initTranslations,
    setLanguage,
    t,
} from '../dist/Utils/translate.js'
import { MainWindowViewModel } from '../dist/ViewModel/MainWindowViewModel.js'

const vm = new MainWindowViewModel()

// DOM elements
const leftDrawer = document.getElementById('left-drawer')
const leftDrawerTitle = document.getElementById('left-drawer-title')
const closeLeftDrawerBtn = document.getElementById('close-left-drawer-btn')

const rightSidebar = document.getElementById('right-sidebar')
const toggleRightSidebarBtn = document.getElementById('toggle-right-sidebar-btn')
const reopenRightSidebarBtn = document.getElementById('reopen-right-sidebar-btn')

const markdownContainer = document.getElementById('markdown-container')
const graphContainer = document.getElementById('graph-container')

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
    vm.stworzTag('Ważne', '#ef4444'),
    vm.stworzTag('Walka', '#dc2626'),
    vm.stworzTag('Magia', '#8b5cf6'),
]
let projectCharacters = [vm.stworzPostac('Strażnik miejski'), vm.stworzPostac('Kupiec Jan')]
let projectLocations = [vm.stworzLokacje('Karczma Pod Różą'), vm.stworzLokacje('Mroczny Las')]
let projectTraits = [vm.stworzCeche('Siła'), vm.stworzCeche('Zręczność')]

// Active context menu & color picker state
let activeContextMenuTarget = null
let activeTagForColor = null

// Left Drawer Title Mapping
function updateLeftDrawerTitle() {
    const activeTab = vm.getActiveLeftTab()
    if (!activeTab) return

    const titleKeys = {
        paragraphs: 'left_panel.paragraphs',
        scenes: 'left_panel.scenes',
        characters: 'left_panel.characters',
        locations: 'left_panel.locations',
        traits: 'left_panel.traits',
        'main-character': 'left_panel.main_character',
        tags: 'left_panel.tags',
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

    document.querySelectorAll('[data-left-tab]').forEach(btn => {
        if (isOpen && btn.dataset.leftTab === activeLeftTab) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })

    if (isOpen && activeLeftTab) {
        leftDrawer.classList.remove('collapsed')
        updateLeftDrawerTitle()

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

// Paragraph Search & Filter Popover Controls
function setupParagraphSearchAndFilters() {
    const searchInput = document.getElementById('paragraph-search-input')
    const filterBtn = document.getElementById('paragraph-filter-btn')
    const filterPopover = document.getElementById('paragraph-filter-popover')
    const clearFiltersBtn = document.getElementById('btn-clear-paragraph-filters')
    const badge = document.getElementById('active-filter-badge')

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            vm.setParagraphSearchQuery(searchInput.value)
        })
    }

    if (filterBtn && filterPopover) {
        filterBtn.addEventListener('click', e => {
            e.stopPropagation()
            filterPopover.classList.toggle('hidden')
        })

        document.addEventListener('click', e => {
            if (!filterPopover.contains(e.target) && !filterBtn.contains(e.target)) {
                filterPopover.classList.add('hidden')
            }
        })
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            vm.clearParagraphFilters()
            if (searchInput) searchInput.value = ''
            if (badge) badge.classList.add('hidden')
            if (filterPopover) filterPopover.classList.add('hidden')
        })
    }
}

// Context Menu and Section Handlers
function setupSectionControlsAndContextMenu() {
    const ctxMenu = document.getElementById('custom-context-menu')
    const colorPickerPopover = document.getElementById('tag-color-picker-popover')

    // Close menus when clicking anywhere outside
    document.addEventListener('click', e => {
        if (ctxMenu && !ctxMenu.contains(e.target)) {
            ctxMenu.classList.add('hidden')
        }
        if (
            colorPickerPopover &&
            !colorPickerPopover.contains(e.target) &&
            !e.target.classList.contains('tag-color-badge')
        ) {
            colorPickerPopover.classList.add('hidden')
        }
    })

    // Setup '+' Creation Buttons & Forms
    const sections = [
        {
            type: 'tag',
            btnId: 'btn-add-tag',
            formId: 'tag-create-form',
            inputId: 'tag-create-name',
            submitId: 'tag-create-submit',
            cancelId: 'tag-create-cancel',
            searchId: 'tag-search-input',
            defaultName: 'Nowy tag',
        },
        {
            type: 'character',
            btnId: 'btn-add-character',
            formId: 'character-create-form',
            inputId: 'character-create-name',
            submitId: 'character-create-submit',
            cancelId: 'character-create-cancel',
            searchId: 'character-search-input',
            defaultName: 'Nowa postać',
        },
        {
            type: 'location',
            btnId: 'btn-add-location',
            formId: 'location-create-form',
            inputId: 'location-create-name',
            submitId: 'location-create-submit',
            cancelId: 'location-create-cancel',
            searchId: 'location-search-input',
            defaultName: 'Nowa lokacja',
        },
        {
            type: 'trait',
            btnId: 'btn-add-trait',
            formId: 'trait-create-form',
            inputId: 'trait-create-name',
            submitId: 'trait-create-submit',
            cancelId: 'trait-create-cancel',
            searchId: 'trait-search-input',
            defaultName: 'Nowa cecha',
        },
    ]

    sections.forEach(sec => {
        const btn = document.getElementById(sec.btnId)
        const form = document.getElementById(sec.formId)
        const input = document.getElementById(sec.inputId)
        const submit = document.getElementById(sec.submitId)
        const cancel = document.getElementById(sec.cancelId)
        const searchInput = document.getElementById(sec.searchId)

        if (btn && form) {
            btn.addEventListener('click', () => {
                form.classList.toggle('hidden')
                if (!form.classList.contains('hidden') && input) input.focus()
            })
        }

        if (cancel && form) {
            cancel.addEventListener('click', () => {
                form.classList.add('hidden')
            })
        }

        if (submit && form && input) {
            const handleAdd = () => {
                const name = input.value.trim() || sec.defaultName
                if (sec.type === 'tag') {
                    projectTags.push(vm.stworzTag(name))
                    renderTagsList()
                } else if (sec.type === 'character') {
                    projectCharacters.push(vm.stworzPostac(name))
                    renderCharactersList()
                } else if (sec.type === 'location') {
                    projectLocations.push(vm.stworzLokacje(name))
                    renderLocationsList()
                } else if (sec.type === 'trait') {
                    projectTraits.push(vm.stworzCeche(name))
                    renderTraitsList()
                }
                input.value = ''
                form.classList.add('hidden')
            }

            submit.addEventListener('click', handleAdd)
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') handleAdd()
            })
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const val = searchInput.value
                if (sec.type === 'tag') {
                    vm.setTagSearchQuery(val)
                    renderTagsList()
                } else if (sec.type === 'character') {
                    vm.setCharacterSearchQuery(val)
                    renderCharactersList()
                } else if (sec.type === 'location') {
                    vm.setLocationSearchQuery(val)
                    renderLocationsList()
                } else if (sec.type === 'trait') {
                    vm.setTraitSearchQuery(val)
                    renderTraitsList()
                }
            })
        }
    })

    // Context Menu Buttons
    const ctxEditTitle = document.getElementById('ctx-edit-title')
    const ctxAddTagToggle = document.getElementById('ctx-add-tag-toggle')
    const ctxAddTagList = document.getElementById('ctx-add-tag-list')
    const ctxAddTagChevron = document.getElementById('ctx-add-tag-chevron')
    const ctxAddTraitToggle = document.getElementById('ctx-add-trait-toggle')
    const ctxAddTraitList = document.getElementById('ctx-add-trait-list')
    const ctxAddTraitChevron = document.getElementById('ctx-add-trait-chevron')
    const ctxDelete = document.getElementById('ctx-delete')

    if (ctxEditTitle) {
        ctxEditTitle.addEventListener('click', () => {
            if (!activeContextMenuTarget) return
            const newName = prompt('Wprowadź nową nazwę:', activeContextMenuTarget.name)
            if (newName !== null && newName.trim() !== '') {
                activeContextMenuTarget.item.ustawNazwe(newName.trim())
                refreshActiveSection(activeContextMenuTarget.type)
            }
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    if (ctxDelete) {
        ctxDelete.addEventListener('click', () => {
            if (!activeContextMenuTarget) return
            const confirmDel = confirm(
                `Czy na pewno chcesz usunąć: "${activeContextMenuTarget.name}"?`
            )
            if (confirmDel) {
                const id = activeContextMenuTarget.id
                if (activeContextMenuTarget.type === 'tag') {
                    projectTags = projectTags.filter(t => t.pobierzID() !== id)
                } else if (activeContextMenuTarget.type === 'character') {
                    projectCharacters = projectCharacters.filter(c => c.pobierzID() !== id)
                } else if (activeContextMenuTarget.type === 'location') {
                    projectLocations = projectLocations.filter(l => l.pobierzID() !== id)
                } else if (activeContextMenuTarget.type === 'trait') {
                    projectTraits = projectTraits.filter(tr => tr.pobierzID() !== id)
                }
                refreshActiveSection(activeContextMenuTarget.type)
            }
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    // Expandable "Dodaj tag" sub-list toggle
    if (ctxAddTagToggle && ctxAddTagList) {
        ctxAddTagToggle.addEventListener('click', e => {
            e.stopPropagation()
            const isHidden = ctxAddTagList.classList.contains('hidden')
            ctxAddTagList.classList.toggle('hidden')
            if (ctxAddTagChevron) {
                ctxAddTagChevron.textContent = isHidden ? '▾' : '▸'
            }
            if (isHidden) {
                // Populate the tag list
                ctxAddTagList.innerHTML =
                    projectTags.length === 0
                        ? `<div class="px-3 py-1.5 text-gray-500 italic">Brak tagów</div>`
                        : projectTags
                              .map(
                                  tag => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-tag-id="${tag.pobierzID()}">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${tag.pobierzKolor()}"></span>
                            <span>${tag.pobierzNazwe()}</span>
                        </button>
                    `
                              )
                              .join('')

                // Attach click handlers to tag sub-items
                ctxAddTagList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const tagObj = projectTags.find(t => t.pobierzID() === btn.dataset.tagId)
                        if (tagObj) {
                            activeContextMenuTarget.item.dodajTag(tagObj)
                            refreshActiveSection(activeContextMenuTarget.type)
                        }
                        if (ctxMenu) ctxMenu.classList.add('hidden')
                    })
                })
            }
        })
    }

    // Expandable "Dodaj cechę" sub-list toggle
    if (ctxAddTraitToggle && ctxAddTraitList) {
        ctxAddTraitToggle.addEventListener('click', e => {
            e.stopPropagation()
            const isHidden = ctxAddTraitList.classList.contains('hidden')
            ctxAddTraitList.classList.toggle('hidden')
            if (ctxAddTraitChevron) {
                ctxAddTraitChevron.textContent = isHidden ? '▾' : '▸'
            }
            if (isHidden) {
                // Populate the trait list
                ctxAddTraitList.innerHTML =
                    projectTraits.length === 0
                        ? `<div class="px-3 py-1.5 text-gray-500 italic">Brak cech</div>`
                        : projectTraits
                              .map(
                                  tr => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-trait-id="${tr.pobierzID()}">
                            <span class="text-blue-400">⚡</span>
                            <span>${tr.pobierzNazwe()}</span>
                        </button>
                    `
                              )
                              .join('')

                // Attach click handlers to trait sub-items
                ctxAddTraitList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const traitObj = projectTraits.find(
                            tr => tr.pobierzID() === btn.dataset.traitId
                        )
                        if (traitObj) {
                            activeContextMenuTarget.item.dodajCecha(traitObj)
                            renderCharactersList()
                        }
                        if (ctxMenu) ctxMenu.classList.add('hidden')
                    })
                })
            }
        })
    }

    // Color Picker Popover Preset Colors
    document.querySelectorAll('#preset-colors-grid button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (activeTagForColor) {
                activeTagForColor.ustawKolor(btn.dataset.color)
                renderTagsList()
            }
            if (colorPickerPopover) colorPickerPopover.classList.add('hidden')
        })
    })

    const customColorInput = document.getElementById('tag-custom-color-input')
    if (customColorInput) {
        customColorInput.addEventListener('input', () => {
            if (activeTagForColor) {
                activeTagForColor.ustawKolor(customColorInput.value)
                renderTagsList()
            }
        })
    }

    // Initial List Rendering
    renderTagsList()
    renderCharactersList()
    renderLocationsList()
    renderTraitsList()
}

function refreshActiveSection(type) {
    if (type === 'tag') renderTagsList()
    if (type === 'character') renderCharactersList()
    if (type === 'location') renderLocationsList()
    if (type === 'trait') renderTraitsList()
}

// Renderers for 4 Sections
function renderTagsList() {
    const container = document.getElementById('tags-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterTags(projectTags)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(
            tag => `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="tag" data-item-id="${tag.pobierzID()}">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="tag-color-badge w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer shrink-0" style="background-color: ${tag.pobierzKolor()}" title="Zmień kolor"></span>
                    <span class="font-medium text-white truncate text-xs">${tag.pobierzNazwe()}</span>
                </div>
                
            </div>
        `
        )
        .join('')

    attachContextMenuListeners(container, 'tag', projectTags)
    attachColorPickerListeners(container)
}

function renderCharactersList() {
    const container = document.getElementById('characters-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterCharacters(projectCharacters)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_characters">${t('left_panel.no_characters')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(c => {
            const tagsBadges = c
                .pobierzTagi()
                .map(
                    t =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${t.pobierzKolor()}">${t.pobierzNazwe()}</span>`
                )
                .join(' ')
            const traitsBadges = c
                .pobierzCechy()
                .map(
                    tr =>
                        `<span class="px-1 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[9px]">${tr.pobierzNazwe()}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="character" data-item-id="${c.pobierzID()}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate">👤 ${c.pobierzNazwe()}</span>
                    </div>
                    ${tagsBadges || traitsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges} ${traitsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachContextMenuListeners(container, 'character', projectCharacters)
}

function renderLocationsList() {
    const container = document.getElementById('locations-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterLocations(projectLocations)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_locations">${t('left_panel.no_locations')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(l => {
            const tagsBadges = l
                .pobierzTagi()
                .map(
                    t =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${t.pobierzKolor()}">${t.pobierzNazwe()}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="location" data-item-id="${l.pobierzID()}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate">📍 ${l.pobierzNazwe()}</span>
                    </div>
                    ${tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachContextMenuListeners(container, 'location', projectLocations)
}

function renderTraitsList() {
    const container = document.getElementById('traits-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterTraits(projectTraits)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_traits">${t('left_panel.no_traits')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(
            tr => `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="trait" data-item-id="${tr.pobierzID()}">
                <span class="font-medium text-white text-xs truncate">⚡ ${tr.pobierzNazwe()}</span>
            </div>
        `
        )
        .join('')

    attachContextMenuListeners(container, 'trait', projectTraits)
}

// Helpers for Context Menu & Color Picker Listeners
function attachContextMenuListeners(container, type, sourceArray) {
    const ctxMenu = document.getElementById('custom-context-menu')
    const ctxAddTagGroup = document.getElementById('ctx-add-tag-group')
    const ctxAddTraitGroup = document.getElementById('ctx-add-trait-group')
    const ctxAddTagList = document.getElementById('ctx-add-tag-list')
    const ctxAddTraitList = document.getElementById('ctx-add-trait-list')
    const ctxAddTagChevron = document.getElementById('ctx-add-tag-chevron')
    const ctxAddTraitChevron = document.getElementById('ctx-add-trait-chevron')

    container.querySelectorAll('.drawer-item').forEach(el => {
        el.addEventListener('contextmenu', e => {
            e.preventDefault()
            e.stopPropagation()

            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.pobierzID() === id)
            if (!item) return

            activeContextMenuTarget = {
                type: type,
                id: id,
                name: item.pobierzNazwe(),
                item: item,
            }

            // Reset expandable sub-lists (collapse them)
            if (ctxAddTagList) {
                ctxAddTagList.classList.add('hidden')
                ctxAddTagList.innerHTML = ''
            }
            if (ctxAddTraitList) {
                ctxAddTraitList.classList.add('hidden')
                ctxAddTraitList.innerHTML = ''
            }
            if (ctxAddTagChevron) ctxAddTagChevron.textContent = '▸'
            if (ctxAddTraitChevron) ctxAddTraitChevron.textContent = '▸'

            // Show/hide tag group
            if (ctxAddTagGroup) {
                if (type === 'character' || type === 'location') {
                    ctxAddTagGroup.classList.remove('hidden')
                } else {
                    ctxAddTagGroup.classList.add('hidden')
                }
            }

            // Show/hide trait group
            if (ctxAddTraitGroup) {
                if (type === 'character') {
                    ctxAddTraitGroup.classList.remove('hidden')
                } else {
                    ctxAddTraitGroup.classList.add('hidden')
                }
            }

            if (ctxMenu) {
                ctxMenu.style.left = `${e.clientX}px`
                ctxMenu.style.top = `${e.clientY}px`
                ctxMenu.classList.remove('hidden')
            }
        })
    })
}

function attachColorPickerListeners(container) {
    const colorPickerPopover = document.getElementById('tag-color-picker-popover')
    container.querySelectorAll('.tag-color-badge').forEach(badge => {
        badge.addEventListener('click', e => {
            e.stopPropagation()
            const parent = badge.closest('.drawer-item')
            if (!parent) return
            const tagId = parent.dataset.itemId
            activeTagForColor = projectTags.find(t => t.pobierzID() === tagId)

            if (colorPickerPopover) {
                const rect = badge.getBoundingClientRect()
                colorPickerPopover.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`
                colorPickerPopover.style.top = `${rect.bottom + 4}px`
                colorPickerPopover.classList.remove('hidden')
            }
        })
    })
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

// Render Central Workspace
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

    const active = vm.getActiveFile()
    const activeLabel = document.getElementById('active-file-label')
    if (activeLabel) {
        activeLabel.textContent = active || 'Brak otwartego pliku'
    }
    if (fileEditor) {
        fileEditor.value = active ? files[active] || '' : ''
    }

    renderEditorTabs()
}

function renderEditorTabs() {
    const editorTabsContainer = document.getElementById('editor-tabs')
    if (!editorTabsContainer) return

    const openFiles = vm.getOpenFiles()
    const activeFile = vm.getActiveFile()

    editorTabsContainer.innerHTML = openFiles
        .map(file => {
            const isActive = file === activeFile
            const activeClasses = isActive
                ? 'bg-[#18181b] text-white border-t-2 border-t-blue-500'
                : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#2e2e33] hover:text-white'

            return `
            <div class="flex items-center gap-1.5 px-3 py-1 text-xs rounded-t cursor-pointer border-r border-[#333338] ${activeClasses}"
                data-tab-file="${file}">
                <span>📄 ${file}</span>
                <button class="close-tab-btn hover:text-red-400 p-0.5 rounded" data-close-file="${file}" title="Zamknij plik">×</button>
            </div>
        `
        })
        .join('')

    editorTabsContainer.querySelectorAll('[data-tab-file]').forEach(tab => {
        tab.addEventListener('click', e => {
            if (e.target.classList.contains('close-tab-btn')) return
            const file = tab.dataset.tabFile
            vm.setActiveFile(file)
            updateMainWorkspaceUI()
        })
    })

    editorTabsContainer.querySelectorAll('[data-close-file]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const file = btn.dataset.closeFile
            vm.closeFile(file)
            updateMainWorkspaceUI()
        })
    })
}

function showGraph() {
    const graphElement = document.getElementById('story-graph')
    if (!graphElement) return

    if (window.cytoscape) {
        window.cytoscape({
            container: graphElement,
            elements: [
                { data: { id: 'p1', label: 'Paragraf 1: Prolog' } },
                { data: { id: 'p2', label: 'Paragraf 2: Las' } },
                { data: { id: 'p3', label: 'Paragraf 3: Jaskinia' } },
                { data: { id: 'e1', source: 'p1', target: 'p2', label: 'Wybór 1' } },
                { data: { id: 'e2', source: 'p1', target: 'p3', label: 'Wybór 2' } },
            ],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#3b82f6',
                        label: 'data(label)',
                        color: '#fff',
                        'font-size': '12px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        width: '120px',
                        height: '40px',
                        shape: 'roundrectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': '#60a5fa',
                        'target-arrow-color': '#60a5fa',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        label: 'data(label)',
                        color: '#9ca3af',
                        'font-size': '10px',
                    },
                },
            ],
            layout: { name: 'grid', rows: 2 },
        })
    }
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
        updateRightSidebarUI()
    })
}

if (reopenRightSidebarBtn) {
    reopenRightSidebarBtn.addEventListener('click', () => {
        vm.setRightSidebarCollapsed(false)
        updateRightSidebarUI()
    })
}

document.querySelectorAll('[data-file]').forEach(btn => {
    btn.addEventListener('click', () => {
        const fileName = btn.dataset.file
        if (fileName) {
            vm.setActiveFile(fileName)
            updateMainWorkspaceUI()
        }
    })
})

viewMarkdownBtn.addEventListener('click', () => {
    vm.setActiveMainView('markdown')
    updateMainWorkspaceUI()
})

viewGraphBtn.addEventListener('click', () => {
    vm.setActiveMainView('graph')
    updateMainWorkspaceUI()
})

fileEditor.addEventListener('input', () => {
    const active = vm.getActiveFile()
    if (active) {
        files[active] = fileEditor.value
        if (saveStatus) saveStatus.textContent = 'Niezapisane zmiany'
    }
})

// Initial Render & i18n setup
async function initApp() {
    await initTranslations()
    applyTranslations()
    setupParagraphSearchAndFilters()
    setupSectionControlsAndContextMenu()
    updateRibbonUI()
    updateLeftDrawerUI()
    updateRightSidebarUI()
    updateMainWorkspaceUI()

    const langSelect = document.getElementById('settings-language-select')
    if (langSelect) {
        langSelect.value = getLanguage()
        langSelect.addEventListener('change', async () => {
            const newLang = langSelect.value
            await setLanguage(newLang)
            applyTranslations()
            updateLeftDrawerUI()
        })
    }
}

initApp()
