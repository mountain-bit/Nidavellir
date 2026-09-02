import { toast } from '../dist/Utils/toast.js'
import {
    applyTranslations,
    getLanguage,
    initTranslations,
    setLanguage,
    t,
} from '../dist/Utils/translate.js'
import {
    DEFAULT_TAG_COLOR,
    Description,
    ENTITY_CATEGORIES,
    MainWindowViewModel,
    Paragraph,
    Scene,
} from '../dist/ViewModel/MainWindowViewModel.js'

const vm = new MainWindowViewModel()

// Utility for XSS safety
function escapeHtml(str) {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

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

// Context Menu DOM elements (cached)
const ctxMenu = document.getElementById('custom-context-menu')
const ctxEditTitle = document.getElementById('ctx-edit-title')
const ctxAddTagGroup = document.getElementById('ctx-add-tag-group')
const ctxAddTagToggle = document.getElementById('ctx-add-tag-toggle')
const ctxAddTagList = document.getElementById('ctx-add-tag-list')
const ctxAddTagChevron = document.getElementById('ctx-add-tag-chevron')
const ctxAddTraitGroup = document.getElementById('ctx-add-trait-group')
const ctxAddTraitToggle = document.getElementById('ctx-add-trait-toggle')
const ctxAddTraitList = document.getElementById('ctx-add-trait-list')
const ctxAddTraitChevron = document.getElementById('ctx-add-trait-chevron')
const ctxDelete = document.getElementById('ctx-delete')
const colorPickerPopover = document.getElementById('tag-color-picker-popover')

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
        new Description('Budzisz się w starej karczmie. Za oknem szaleje burza.'),
        [],
        false,
        undefined,
        [projectTags[0]]
    ),
    new Paragraph(
        'p2',
        'Mroczny trakt leśny',
        new Description('Ścieżka prowadzi przez gęsty las pełen niebezpieczeństw.'),
        [],
        false,
        undefined,
        [projectTags[1]]
    ),
    new Paragraph(
        'p3',
        'Komnata runiczna',
        new Description('Blask runów oświetla starożytne zwoje i artefakty.'),
        [],
        false,
        undefined,
        [projectTags[2]]
    ),
]
let projectScenes = [
    new Scene(
        's1',
        'Wstęp do przygody',
        new Description(),
        [projectParagraphs[0]],
        [projectCharacters[0]]
    ),
    new Scene(
        's2',
        'Eksploracja lasu',
        new Description(),
        [projectParagraphs[1], projectParagraphs[2]],
        [projectCharacters[1]]
    ),
]

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
    const leftResizer = document.getElementById('left-resizer')

    document.querySelectorAll('[data-left-tab]').forEach(btn => {
        if (isOpen && btn.dataset.leftTab === activeLeftTab) {
            btn.classList.add('active')
        } else {
            btn.classList.remove('active')
        }
    })

    if (isOpen && activeLeftTab) {
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
    } else {
        leftDrawer.classList.add('collapsed')
        if (leftResizer) leftResizer.classList.add('collapsed')
    }
}

// Paragraph Filter Popover: Tag Badges & Selects
function renderFilterTags() {
    const filterTagsContainer = document.getElementById('filter-tags-list')
    if (!filterTagsContainer) return

    const selectedTag = vm.getSelectedFilterTag()

    if (projectTags.length === 0) {
        filterTagsContainer.innerHTML = `<span class="text-[10px] text-gray-500 italic" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</span>`
        return
    }

    filterTagsContainer.innerHTML = projectTags
        .map(tag => {
            const isSelected = selectedTag === tag.getId() || selectedTag === tag.getName()
            const borderClass = isSelected
                ? 'ring-2 ring-white font-bold scale-105 shadow-md'
                : 'opacity-85 hover:opacity-100 hover:scale-105'

            return `
            <button type="button" class="filter-tag-badge px-2 py-0.5 rounded text-[10px] text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 ${borderClass}" 
                style="background-color: ${escapeHtml(tag.getColor())}" 
                data-tag-id="${escapeHtml(tag.getId())}" 
                data-tag-name="${escapeHtml(tag.getName())}">
                ${isSelected ? '✓ ' : ''}${escapeHtml(tag.getName())}
            </button>
        `
        })
        .join('')

    filterTagsContainer.querySelectorAll('.filter-tag-badge').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation()
            const tagId = btn.dataset.tagId
            const tagName = btn.dataset.tagName
            const currentSelected = vm.getSelectedFilterTag()
            if (currentSelected === tagId || currentSelected === tagName) {
                vm.setSelectedFilterTag(null)
            } else {
                vm.setSelectedFilterTag(tagName || tagId)
            }
            updateFilterBadgeState()
            renderFilterTags()
            renderParagraphsList()
        })
    })
}

function populateFilterSelects() {
    const charSelect = document.getElementById('filter-character-select')
    const sceneSelect = document.getElementById('filter-scene-select')

    if (charSelect) {
        const currentVal = vm.getSelectedFilterCharacter() || ''
        charSelect.innerHTML =
            `<option value="" data-i18n="left_panel.all_characters">${t('left_panel.all_characters')}</option>` +
            projectCharacters
                .map(
                    c =>
                        `<option value="${escapeHtml(c.getId())}" ${c.getId() === currentVal ? 'selected' : ''}>${escapeHtml(c.getName())}</option>`
                )
                .join('')
    }

    if (sceneSelect) {
        const currentVal = vm.getSelectedFilterScene() || ''
        sceneSelect.innerHTML =
            `<option value="" data-i18n="left_panel.all_scenes">${t('left_panel.all_scenes')}</option>` +
            projectScenes
                .map(
                    s =>
                        `<option value="${escapeHtml(s.getId())}" ${s.getId() === currentVal ? 'selected' : ''}>${escapeHtml(s.getName())}</option>`
                )
                .join('')
    }
}

function updateFilterBadgeState() {
    const badge = document.getElementById('active-filter-badge')
    if (!badge) return
    const hasActiveFilter = Boolean(
        vm.getSelectedFilterTag() || vm.getSelectedFilterCharacter() || vm.getSelectedFilterScene()
    )
    if (hasActiveFilter) {
        badge.classList.remove('hidden')
    } else {
        badge.classList.add('hidden')
    }
}

// Paragraph Search & Filter Popover Controls
function setupParagraphSearchAndFilters() {
    const searchInput = document.getElementById('paragraph-search-input')
    const filterBtn = document.getElementById('paragraph-filter-btn')
    const filterPopover = document.getElementById('paragraph-filter-popover')
    const clearFiltersBtn = document.getElementById('btn-clear-paragraph-filters')
    const charSelect = document.getElementById('filter-character-select')
    const sceneSelect = document.getElementById('filter-scene-select')

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            vm.setParagraphSearchQuery(searchInput.value)
            renderParagraphsList()
        })
    }

    if (filterBtn && filterPopover) {
        filterBtn.addEventListener('click', e => {
            e.stopPropagation()
            const isHidden = filterPopover.classList.contains('hidden')
            filterPopover.classList.toggle('hidden')
            if (isHidden) {
                renderFilterTags()
                populateFilterSelects()
            }
        })

        document.addEventListener('click', e => {
            if (!filterPopover.contains(e.target) && !filterBtn.contains(e.target)) {
                filterPopover.classList.add('hidden')
            }
        })
    }

    if (charSelect) {
        charSelect.addEventListener('change', () => {
            vm.setSelectedFilterCharacter(charSelect.value || null)
            updateFilterBadgeState()
            renderParagraphsList()
        })
    }

    if (sceneSelect) {
        sceneSelect.addEventListener('change', () => {
            vm.setSelectedFilterScene(sceneSelect.value || null)
            updateFilterBadgeState()
            renderParagraphsList()
        })
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            vm.clearParagraphFilters()
            if (searchInput) searchInput.value = ''
            if (charSelect) charSelect.value = ''
            if (sceneSelect) sceneSelect.value = ''
            updateFilterBadgeState()
            renderFilterTags()
            renderParagraphsList()
            if (filterPopover) filterPopover.classList.add('hidden')
        })
    }

    renderFilterTags()
    populateFilterSelects()
    renderParagraphsList()
    renderScenesList()
}

// Context Menu and Section Handlers
function setupSectionControlsAndContextMenu() {
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
            getDefaultName: () => t('tags.default_name'),
        },
        {
            type: 'character',
            btnId: 'btn-add-character',
            formId: 'character-create-form',
            inputId: 'character-create-name',
            submitId: 'character-create-submit',
            cancelId: 'character-create-cancel',
            searchId: 'character-search-input',
            getDefaultName: () => t('character.default_name'),
        },
        {
            type: 'location',
            btnId: 'btn-add-location',
            formId: 'location-create-form',
            inputId: 'location-create-name',
            submitId: 'location-create-submit',
            cancelId: 'location-create-cancel',
            searchId: 'location-search-input',
            getDefaultName: () => t('location.default_name'),
        },
        {
            type: 'trait',
            btnId: 'btn-add-trait',
            formId: 'trait-create-form',
            inputId: 'trait-create-name',
            submitId: 'trait-create-submit',
            cancelId: 'trait-create-cancel',
            searchId: 'trait-search-input',
            getDefaultName: () => t('trait.default_name'),
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
            const handleAdd = async () => {
                const defaultName = sec.getDefaultName()
                const name = input.value.trim() || defaultName
                let createdItem = null
                let category = null

                if (sec.type === 'tag') {
                    createdItem = vm.createTag(name, DEFAULT_TAG_COLOR, defaultName)
                    projectTags.push(createdItem)
                    renderTagsList()
                    renderFilterTags()
                } else if (sec.type === 'character') {
                    createdItem = vm.createCharacter(name, defaultName)
                    category = ENTITY_CATEGORIES.NPC
                    projectCharacters.push(createdItem)
                    renderCharactersList()
                    populateFilterSelects()
                } else if (sec.type === 'location') {
                    createdItem = vm.createLocation(name, defaultName)
                    category = ENTITY_CATEGORIES.LOCATIONS
                    projectLocations.push(createdItem)
                    renderLocationsList()
                } else if (sec.type === 'trait') {
                    createdItem = vm.createStat(name, defaultName)
                    category = ENTITY_CATEGORIES.RULES
                    projectStats.push(createdItem)
                    renderTraitsList()
                }

                let persistSuccess = true

                if (
                    window.electronAPI &&
                    window.electronAPI.createEntity &&
                    category &&
                    createdItem
                ) {
                    const currentPath = window.currentProjectPath || ''
                    if (currentPath) {
                        try {
                            const res = await window.electronAPI.createEntity({
                                projectPath: currentPath,
                                category: category,
                                entityData: createdItem.toJSON
                                    ? createdItem.toJSON()
                                    : { ...createdItem },
                            })
                            if (res && !res.success) {
                                persistSuccess = false
                                toast.error(
                                    res.error || t('errors.unknownError'),
                                    t('toast.error_title')
                                )
                            }
                        } catch (err) {
                            persistSuccess = false
                            console.error('Error saving entity via IPC:', err)
                            toast.error(
                                err.message || t('errors.unknownError'),
                                t('toast.error_title')
                            )
                        }
                    }
                }

                if (persistSuccess) {
                    toast.success(
                        t('toast.element_created', { name }),
                        t('toast.element_created_title')
                    )
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
                    vm.setStatSearchQuery(val)
                    renderTraitsList()
                }
            })
        }
    })

    if (ctxEditTitle) {
        ctxEditTitle.addEventListener('click', () => {
            if (!activeContextMenuTarget) return
            const newName = prompt(t('context_menu.rename_prompt'), activeContextMenuTarget.name)
            if (newName !== null && newName.trim() !== '') {
                activeContextMenuTarget.item.setName(newName.trim())
                refreshActiveSection(activeContextMenuTarget.type)
            }
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    if (ctxDelete) {
        ctxDelete.addEventListener('click', () => {
            if (!activeContextMenuTarget) return
            const confirmDel = confirm(
                t('context_menu.confirm_delete', { name: activeContextMenuTarget.name })
            )
            if (confirmDel) {
                const id = activeContextMenuTarget.id
                if (activeContextMenuTarget.type === 'tag') {
                    projectTags = projectTags.filter(t => t.getId() !== id)
                    renderFilterTags()
                } else if (activeContextMenuTarget.type === 'character') {
                    projectCharacters = projectCharacters.filter(c => c.getId() !== id)
                    populateFilterSelects()
                } else if (activeContextMenuTarget.type === 'location') {
                    projectLocations = projectLocations.filter(l => l.getId() !== id)
                } else if (activeContextMenuTarget.type === 'trait') {
                    projectStats = projectStats.filter(tr => tr.getId() !== id)
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
                        ? `<div class="px-3 py-1.5 text-gray-500 italic" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</div>`
                        : projectTags
                              .map(
                                  tag => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-tag-id="${escapeHtml(tag.getId())}">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${escapeHtml(tag.getColor())}"></span>
                            <span>${escapeHtml(tag.getName())}</span>
                        </button>
                    `
                              )
                              .join('')

                // Attach click handlers to tag sub-items
                ctxAddTagList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const tagObj = projectTags.find(t => t.getId() === btn.dataset.tagId)
                        if (tagObj) {
                            activeContextMenuTarget.item.addTag(tagObj)
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
                    projectStats.length === 0
                        ? `<div class="px-3 py-1.5 text-gray-500 italic" data-i18n="left_panel.no_traits">${t('left_panel.no_traits')}</div>`
                        : projectStats
                              .map(
                                  tr => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-trait-id="${escapeHtml(tr.getId())}">
                            <span class="text-blue-400">⚡</span>
                            <span>${escapeHtml(tr.getName())}</span>
                        </button>
                    `
                              )
                              .join('')

                // Attach click handlers to trait sub-items
                ctxAddTraitList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const traitObj = projectStats.find(tr => tr.getId() === btn.dataset.traitId)
                        if (traitObj) {
                            activeContextMenuTarget.item.addStat(traitObj)
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
                activeTagForColor.setColor(btn.dataset.color)
                renderTagsList()
                renderFilterTags()
                renderParagraphsList()
            }
            if (colorPickerPopover) colorPickerPopover.classList.add('hidden')
        })
    })

    const customColorInput = document.getElementById('tag-custom-color-input')
    if (customColorInput) {
        customColorInput.addEventListener('input', () => {
            if (activeTagForColor) {
                activeTagForColor.setColor(customColorInput.value)
                renderTagsList()
                renderFilterTags()
                renderParagraphsList()
            }
        })
    }

    // Initial List Rendering
    renderTagsList()
    renderCharactersList()
    renderLocationsList()
    renderTraitsList()
    renderParagraphsList()
    renderScenesList()
}

function refreshActiveSection(type) {
    if (type === 'tag') {
        renderTagsList()
        renderFilterTags()
        renderParagraphsList()
    }
    if (type === 'character') {
        renderCharactersList()
        populateFilterSelects()
    }
    if (type === 'location') renderLocationsList()
    if (type === 'trait') renderTraitsList()
    if (type === 'paragraph') renderParagraphsList()
    if (type === 'scene') {
        renderScenesList()
        populateFilterSelects()
    }
}

// Renderers for Sections
function renderParagraphsList() {
    const container = document.getElementById('paragraphs-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterParagraphs(projectParagraphs)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_paragraphs">${t('left_panel.no_paragraphs')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(p => {
            const tagsBadges = p
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')

            return `
            <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="paragraph" data-item-id="${escapeHtml(p.getId())}">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-white text-xs truncate">📄 § ${escapeHtml(p.getTitle() || p.getId())}</span>
                </div>
                ${tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges}</div>` : ''}
            </div>
        `
        })
        .join('')

    attachItemSelectionListeners(container, 'paragraph', projectParagraphs)
}

function renderScenesList() {
    const container = document.getElementById('scenes-list-container')
    if (!container) return

    if (projectScenes.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_scenes">${t('left_panel.no_scenes')}</p>`
        return
    }

    container.innerHTML = projectScenes
        .map(s => {
            return `
            <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="scene" data-item-id="${escapeHtml(s.getId())}">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-white text-xs truncate">🎬 ${escapeHtml(s.getName() || s.getId())}</span>
                </div>
            </div>
        `
        })
        .join('')

    attachItemSelectionListeners(container, 'scene', projectScenes)
}

function renderTagsList() {
    const container = document.getElementById('tags-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterTags(projectTags)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</p>`
        return
    }

    const changeColorTitle = t('tags.change_color')
    container.innerHTML = filtered
        .map(
            tag => `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="tag" data-item-id="${escapeHtml(tag.getId())}">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="tag-color-badge w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer shrink-0" style="background-color: ${escapeHtml(tag.getColor())}" title="${escapeHtml(changeColorTitle)}"></span>
                    <span class="font-medium text-white truncate text-xs">${escapeHtml(tag.getName())}</span>
                </div>
            </div>
        `
        )
        .join('')

    attachContextMenuListeners(container, 'tag', projectTags)
    attachColorPickerListeners(container)
    attachItemSelectionListeners(container, 'tag', projectTags)
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
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')
            const traitsBadges = c
                .getStats()
                .map(
                    tr =>
                        `<span class="px-1 py-0.5 rounded bg-blue-900/60 text-blue-200 text-[9px]">${escapeHtml(tr.getName())}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="character" data-item-id="${escapeHtml(c.getId())}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate">👤 ${escapeHtml(c.getName())}</span>
                    </div>
                    ${tagsBadges || traitsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges} ${traitsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachContextMenuListeners(container, 'character', projectCharacters)
    attachItemSelectionListeners(container, 'character', projectCharacters)
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
                .getTags()
                .map(
                    tObj =>
                        `<span class="px-1 py-0.5 rounded text-[9px] text-white" style="background-color: ${escapeHtml(tObj.getColor())}">${escapeHtml(tObj.getName())}</span>`
                )
                .join(' ')

            return `
                <div class="drawer-item group p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="location" data-item-id="${escapeHtml(l.getId())}">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-white text-xs truncate">📍 ${escapeHtml(l.getName())}</span>
                    </div>
                    ${tagsBadges ? `<div class="flex flex-wrap gap-1 mt-1">${tagsBadges}</div>` : ''}
                </div>
            `
        })
        .join('')

    attachContextMenuListeners(container, 'location', projectLocations)
    attachItemSelectionListeners(container, 'location', projectLocations)
}

function renderTraitsList() {
    const container = document.getElementById('traits-list-container')
    if (!container) return

    const filtered = vm.searchAndFilterStats(projectStats)
    if (filtered.length === 0) {
        container.innerHTML = `<p class="italic text-gray-500" data-i18n="left_panel.no_traits">${t('left_panel.no_traits')}</p>`
        return
    }

    container.innerHTML = filtered
        .map(
            tr => `
            <div class="drawer-item group flex items-center justify-between p-1.5 rounded bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 mb-1 cursor-pointer" data-item-type="trait" data-item-id="${escapeHtml(tr.getId())}">
                <span class="font-medium text-white text-xs truncate">⚡ ${escapeHtml(tr.getName())}</span>
            </div>
        `
        )
        .join('')

    attachContextMenuListeners(container, 'trait', projectStats)
    attachItemSelectionListeners(container, 'trait', projectStats)
}

// Helpers for Context Menu & Color Picker Listeners
function attachContextMenuListeners(container, type, sourceArray) {
    container.querySelectorAll('.drawer-item').forEach(el => {
        el.addEventListener('contextmenu', e => {
            e.preventDefault()
            e.stopPropagation()

            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.getId() === id)
            if (!item) return

            activeContextMenuTarget = {
                type: type,
                id: id,
                name: item.getName(),
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
    container.querySelectorAll('.tag-color-badge').forEach(badge => {
        badge.addEventListener('click', e => {
            e.stopPropagation()
            const parent = badge.closest('.drawer-item')
            if (!parent) return
            const tagId = parent.dataset.itemId
            activeTagForColor = projectTags.find(t => t.getId() === tagId)

            if (colorPickerPopover) {
                const rect = badge.getBoundingClientRect()
                colorPickerPopover.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`
                colorPickerPopover.style.top = `${rect.bottom + 4}px`
                colorPickerPopover.classList.remove('hidden')
            }
        })
    })
}

// Selection and Details Panel UI
function selectEntity(entity, type, parent) {
    vm.selectElement(entity, type, parent)
    updateRightSidebarUI()
    renderHistoryBar()
    renderDetailsPanel()
}

function getTypeIcon(type) {
    switch (type) {
        case 'paragraph':
            return '📄 §'
        case 'scene':
            return '🎬'
        case 'character':
            return '👤'
        case 'location':
            return '📍'
        case 'stat':
        case 'trait':
            return '⚡'
        case 'tag':
            return '🏷️'
        case 'item':
            return '🎒'
        case 'class':
            return '🛡️'
        default:
            return '📄'
    }
}

function getTypeBadgeColor(type) {
    switch (type) {
        case 'paragraph':
            return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
        case 'scene':
            return 'bg-blue-900/60 text-blue-300 border-blue-700/50'
        case 'character':
            return 'bg-purple-900/60 text-purple-300 border-purple-700/50'
        case 'location':
            return 'bg-amber-900/60 text-amber-300 border-amber-700/50'
        case 'stat':
        case 'trait':
            return 'bg-cyan-900/60 text-cyan-300 border-cyan-700/50'
        case 'tag':
            return 'bg-pink-900/60 text-pink-300 border-pink-700/50'
        case 'item':
            return 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50'
        default:
            return 'bg-zinc-800 text-zinc-300 border-zinc-700'
    }
}

function renderHistoryBar() {
    const container = document.getElementById('history-tabs-container')
    if (!container) return
    container.innerHTML = ''

    const history = vm.getHistory()
    const selected = vm.getSelectedItem()

    if (history.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-gray-500 italic px-1 select-none">${t('details.history')}: brak</span>`
        return
    }

    const scrollWrapper = document.createElement('div')
    scrollWrapper.className =
        'flex items-center gap-1 min-w-0 flex-1 overflow-x-auto custom-scrollbar py-0.5'

    history.forEach(item => {
        const isActive = selected && selected.id === item.id && selected.type === item.type
        const tab = document.createElement('button')
        tab.type = 'button'
        tab.className = `group flex items-center gap-1 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            isActive
                ? 'bg-[#2a2a2f] text-white border border-blue-500/50 font-medium'
                : 'bg-[#1e1e22] text-[#a1a1aa] hover:bg-[#25252a] hover:text-white border border-transparent'
        }`

        const icon = document.createElement('span')
        icon.className = 'text-[10px] opacity-80'
        icon.textContent = getTypeIcon(item.type)

        const nameSpan = document.createElement('span')
        nameSpan.className = 'truncate max-w-[100px]'
        nameSpan.textContent = item.name

        const closeBtn = document.createElement('span')
        closeBtn.className = 'ml-0.5 hover:text-red-400 opacity-60 hover:opacity-100 rounded px-0.5'
        closeBtn.textContent = '×'
        closeBtn.title = t('buttons.close')
        closeBtn.addEventListener('click', e => {
            e.stopPropagation()
            vm.closeHistoryItem(item.id)
            renderHistoryBar()
            renderDetailsPanel()
        })

        tab.appendChild(icon)
        tab.appendChild(nameSpan)
        tab.appendChild(closeBtn)

        tab.addEventListener('click', () => {
            vm.selectHistoryItem(item.id)
            renderHistoryBar()
            renderDetailsPanel()
        })

        scrollWrapper.appendChild(tab)
    })

    const closeAllBtn = document.createElement('button')
    closeAllBtn.type = 'button'
    closeAllBtn.className =
        'shrink-0 ml-auto px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-red-400 hover:bg-[#27272a] rounded transition-colors cursor-pointer'
    closeAllBtn.title = t('details.close_all')
    closeAllBtn.textContent = '✕✕'
    closeAllBtn.addEventListener('click', () => {
        vm.closeAllHistory()
        renderHistoryBar()
        renderDetailsPanel()
    })

    container.appendChild(scrollWrapper)
    container.appendChild(closeAllBtn)
}

function renderDetailsPanel() {
    const container = document.getElementById('details-content')
    if (!container) return
    container.innerHTML = ''

    const item = vm.getSelectedItem()
    if (!item) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-64">
                <div class="text-3xl mb-3 text-gray-600">§</div>
                <p class="text-xs leading-relaxed max-w-[200px]" data-i18n="details.no_selection">${t('details.no_selection')}</p>
            </div>
        `
        return
    }

    const { entity, type } = item

    let entityScope = []
    if (type === 'paragraph') entityScope = projectParagraphs
    else if (type === 'scene') entityScope = projectScenes
    else if (type === 'character') entityScope = projectCharacters
    else if (type === 'location') entityScope = projectLocations
    else if (type === 'stat' || type === 'trait') entityScope = projectStats
    else if (type === 'tag') entityScope = projectTags

    // --- MODUL 1: Typ & ID ---
    const headerMod = document.createElement('section')
    headerMod.className = 'border-b border-[#333338] p-3 space-y-2'
    headerMod.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-bold tracking-widest text-[#71717a]">${t('details.type')}</span>
            <span class="px-2 py-0.5 text-[11px] rounded border ${getTypeBadgeColor(type)} font-medium">${type.toUpperCase()}</span>
        </div>
        <div class="text-[10px] text-gray-500 font-mono truncate">ID: ${escapeHtml(item.id)}</div>
    `
    container.appendChild(headerMod)

    // --- MODUL 2: Nazwa z walidacją Live i kolizją ---
    const nameMod = document.createElement('section')
    nameMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
    nameMod.innerHTML = `
        <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.name')}</label>
        <input id="details-name-input" type="text" value="${escapeHtml(item.name)}"
            class="w-full bg-[#18181b] border border-[#3f3f46] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
        <div id="details-name-error" class="hidden text-[11px] text-red-400"></div>
    `
    const nameInput = nameMod.querySelector('#details-name-input')
    const nameError = nameMod.querySelector('#details-name-error')

    const validateAndSaveName = () => {
        const val = nameInput.value.trim()
        const res = vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
            return false
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
            vm.updateName(val, entityScope)
            renderHistoryBar()
            refreshActiveSection(type)
            return true
        }
    }

    nameInput.addEventListener('input', () => {
        const val = nameInput.value.trim()
        const res = vm.validateName(val, item, entityScope)
        if (!res.valid) {
            nameError.textContent = res.message || t('details.name_required')
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')
        } else {
            nameError.classList.add('hidden')
            nameInput.classList.remove('border-red-500')
        }
    })

    nameInput.addEventListener('blur', validateAndSaveName)
    nameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            if (validateAndSaveName()) nameInput.blur()
        }
    })
    container.appendChild(nameMod)

    // --- MODUL 3: Numeracja Paragrafu (dla Paragrafu) ---
    if (type === 'paragraph' && entity instanceof Paragraph) {
        const numMod = document.createElement('section')
        numMod.className = 'border-b border-[#333338] p-3 space-y-2'
        const isLocked = entity.getIsNumberLocked()
        const customNum = entity.getNumber()

        numMod.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.paragraph_number')}</span>
                <span id="details-number-mode-badge" class="text-[10px] font-medium px-2 py-0.5 rounded ${
                    isLocked
                        ? 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }">
                    ${isLocked ? `#${customNum || 1} (${t('details.custom_number')})` : t('details.auto_number')}
                </span>
            </div>
            <div class="flex items-center gap-2 pt-1">
                <label class="flex items-center gap-1.5 text-xs text-[#d4d4d8] cursor-pointer select-none">
                    <input type="checkbox" id="details-number-lock" ${isLocked ? 'checked' : ''} class="rounded accent-blue-500 cursor-pointer" />
                    <span>${t('details.lock_number')}</span>
                </label>
                <input id="details-custom-number" type="number" value="${isLocked && customNum ? customNum : ''}" placeholder="${t('details.custom_number_placeholder')}"
                    ${!isLocked ? 'disabled' : ''}
                    class="w-28 bg-[#18181b] border border-[#3f3f46] disabled:opacity-30 rounded px-2 py-0.5 text-xs text-white text-right focus:outline-none focus:border-blue-500" />
            </div>
        `

        const lockCheckbox = numMod.querySelector('#details-number-lock')
        const customNumInput = numMod.querySelector('#details-custom-number')
        const modeBadge = numMod.querySelector('#details-number-mode-badge')

        lockCheckbox.addEventListener('change', () => {
            const locked = lockCheckbox.checked
            vm.toggleNumberLock(locked)
            customNumInput.disabled = !locked
            if (!locked) {
                vm.updateCustomNumber(0)
                customNumInput.value = ''
                if (modeBadge) {
                    modeBadge.className =
                        'text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700'
                    modeBadge.textContent = t('details.auto_number')
                }
            } else {
                const parsed = parseInt(customNumInput.value, 10) || 1
                vm.updateCustomNumber(parsed)
                customNumInput.value = String(parsed)
                if (modeBadge) {
                    modeBadge.className =
                        'text-[10px] font-medium px-2 py-0.5 rounded bg-amber-900/50 text-amber-300 border border-amber-700/50'
                    modeBadge.textContent = `#${parsed} (${t('details.custom_number')})`
                }
            }
            renderParagraphsList()
        })

        customNumInput.addEventListener('input', () => {
            const val = parseInt(customNumInput.value, 10) || 0
            vm.updateCustomNumber(val)
            if (modeBadge && lockCheckbox.checked) {
                modeBadge.textContent = `#${val} (${t('details.custom_number')})`
            }
            renderParagraphsList()
        })

        container.appendChild(numMod)
    }

    // --- MODUL 4: Streszczenie ---
    if (entity.getContent && entity.getContent()) {
        const summaryMod = document.createElement('section')
        summaryMod.className = 'border-b border-[#333338] p-3 space-y-1.5'
        const currentSummary = entity.getContent().getSummary() || ''

        summaryMod.innerHTML = `
            <label class="block text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.summary')}</label>
            <textarea id="details-summary-input" rows="2" placeholder="${t('details.summary_placeholder')}"
                class="w-full bg-[#18181b] border border-[#3f3f46] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none">${escapeHtml(currentSummary)}</textarea>
        `

        const summaryInput = summaryMod.querySelector('#details-summary-input')
        summaryInput.addEventListener('input', () => {
            vm.updateSummary(summaryInput.value)
        })

        container.appendChild(summaryMod)
    }

    // --- MODUL 5: Pliki Narracyjne (text.md & author.md) ---
    if (entity.getContent) {
        const filesMod = document.createElement('section')
        filesMod.className = 'border-b border-[#333338] p-3 space-y-2'
        filesMod.innerHTML = `
            <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.description_files')}</div>
            <div class="flex flex-col gap-1.5">
                <button id="btn-open-player-text" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                    <span>📄 ${t('details.open_player_text')}</span>
                    <span class="text-blue-400 font-bold">→</span>
                </button>
                <button id="btn-open-author-notes" type="button" class="w-full px-2.5 py-1.5 bg-[#27272a] hover:bg-[#323238] border border-[#3f3f46] rounded text-xs text-white text-left flex items-center justify-between cursor-pointer">
                    <span>📝 ${t('details.open_author_notes')}</span>
                    <span class="text-blue-400 font-bold">→</span>
                </button>
            </div>
        `

        filesMod.querySelector('#btn-open-player-text').addEventListener('click', () => {
            const { fileName, content } = vm.openOrCreateDescriptionFile('text')
            if (fileName) {
                files[fileName] = content
                updateMainWorkspaceUI()
                toast.success(`${t('details.open_player_text')}: ${t('details.file_created')}`)
            }
        })

        filesMod.querySelector('#btn-open-author-notes').addEventListener('click', () => {
            const { fileName, content } = vm.openOrCreateDescriptionFile('author')
            if (fileName) {
                files[fileName] = content
                updateMainWorkspaceUI()
                toast.success(`${t('details.open_author_notes')}: ${t('details.file_created')}`)
            }
        })

        container.appendChild(filesMod)
    }

    // --- MODUL 6: Tagi ---
    if (entity.getTags && entity.addTag && entity.removeTag) {
        const tagsMod = document.createElement('section')
        tagsMod.className = 'border-b border-[#333338] p-3 space-y-2'
        const currentTags = entity.getTags() || []

        tagsMod.innerHTML = `
            <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.tags')}</div>
            <div id="details-tags-list" class="flex flex-wrap gap-1 min-h-[22px]"></div>
            <div class="flex gap-1 pt-1">
                <select id="details-add-tag-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                    <option value="">${t('left_panel.no_tags')}</option>
                </select>
                <button id="btn-details-add-tag" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                    ${t('details.add_tag')}
                </button>
            </div>
        `

        const tagsListEl = tagsMod.querySelector('#details-tags-list')
        currentTags.forEach(tObj => {
            const chip = document.createElement('span')
            chip.className =
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-white'
            chip.style.backgroundColor = tObj.getColor() || DEFAULT_TAG_COLOR
            chip.innerHTML = `<span>#${escapeHtml(tObj.getName())}</span><button class="hover:text-red-200 ml-0.5 cursor-pointer" title="${t('buttons.delete')}">×</button>`
            chip.querySelector('button').addEventListener('click', () => {
                vm.removeTagFromSelected(tObj.getId())
                renderDetailsPanel()
                refreshActiveSection(type)
            })
            tagsListEl.appendChild(chip)
        })

        const tagSelect = tagsMod.querySelector('#details-add-tag-select')
        tagSelect.innerHTML =
            `<option value="">-- ${t('details.tags')} --</option>` +
            projectTags
                .map(
                    tObj =>
                        `<option value="${escapeHtml(tObj.getId())}">${escapeHtml(tObj.getName())}</option>`
                )
                .join('')

        tagsMod.querySelector('#btn-details-add-tag').addEventListener('click', () => {
            const selectedId = tagSelect.value
            const tagObj = projectTags.find(t => t.getId() === selectedId)
            if (tagObj) {
                vm.addTagToSelected(tagObj)
                renderDetailsPanel()
                refreshActiveSection(type)
            }
        })

        container.appendChild(tagsMod)
    }

    // --- MODUL 7: Cechy / Statystyki (dla NPC / Postaci) ---
    if (entity.getStats && entity.addStat && entity.removeStat) {
        const statsMod = document.createElement('section')
        statsMod.className = 'border-b border-[#333338] p-3 space-y-2'
        const statsList = entity.getStats() || []

        statsMod.innerHTML = `
            <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('details.traits')}</div>
            <div id="details-stats-list" class="flex flex-col gap-1 min-h-[20px]"></div>
            <div class="flex gap-1 pt-1">
                <select id="details-add-stat-select" class="flex-1 bg-[#18181b] border border-[#3f3f46] rounded px-2 py-1 text-xs text-white focus:outline-none">
                    <option value="">-- ${t('details.traits')} --</option>
                </select>
                <button id="btn-details-add-stat" type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium cursor-pointer">
                    ${t('details.add_trait')}
                </button>
            </div>
        `

        const statsListEl = statsMod.querySelector('#details-stats-list')
        statsList.forEach(st => {
            const row = document.createElement('div')
            row.className =
                'flex items-center justify-between bg-[#18181b] px-2 py-1 rounded border border-[#27272a] text-xs'
            row.innerHTML = `
                <span class="text-[#d4d4d8] font-medium">⚡ ${escapeHtml(st.getName())}</span>
                <button class="text-gray-400 hover:text-red-400 font-bold ml-1 cursor-pointer" title="${t('buttons.delete')}">×</button>
            `
            row.querySelector('button').addEventListener('click', () => {
                vm.removeStatFromSelected(st.getId())
                renderDetailsPanel()
                refreshActiveSection(type)
            })
            statsListEl.appendChild(row)
        })

        const statSelect = statsMod.querySelector('#details-add-stat-select')
        statSelect.innerHTML =
            `<option value="">-- ${t('details.traits')} --</option>` +
            projectStats
                .map(
                    st =>
                        `<option value="${escapeHtml(st.getId())}">${escapeHtml(st.getName())}</option>`
                )
                .join('')

        statsMod.querySelector('#btn-details-add-stat').addEventListener('click', () => {
            const statId = statSelect.value
            const statObj = projectStats.find(s => s.getId() === statId)
            if (statObj) {
                vm.addStatToSelected(statObj)
                renderDetailsPanel()
                refreshActiveSection(type)
            }
        })

        container.appendChild(statsMod)
    }

    // --- MODUL 8: Szybkie akcje / Graf ---
    const actionsMod = document.createElement('section')
    actionsMod.className = 'p-3 space-y-2'
    actionsMod.innerHTML = `
        <div class="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wide">${t('right_panel.quick_actions')}</div>
        <button id="btn-details-show-graph" class="w-full py-1.5 px-3 rounded bg-[#2e2e33] hover:bg-[#38383f] text-xs text-left text-white flex items-center justify-between cursor-pointer" type="button">
            <span>${t('right_panel.show_story_graph')}</span>
            <span>⌘</span>
        </button>
    `
    actionsMod.querySelector('#btn-details-show-graph').addEventListener('click', () => {
        vm.setActiveMainView('graph')
        updateMainWorkspaceUI()
    })
    container.appendChild(actionsMod)
}

function setupResizers() {
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

    // Smooth transition end sync for responsive components
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

function attachItemSelectionListeners(container, type, sourceArray) {
    container.querySelectorAll('.drawer-item').forEach(el => {
        el.addEventListener('dblclick', e => {
            e.preventDefault()
            const id = el.dataset.itemId
            const item = sourceArray.find(x => x.getId() === id)
            if (item) {
                selectEntity(item, type === 'trait' ? 'stat' : type)
            }
        })
    })
}

// Render Right Sidebar UI
function updateRightSidebarUI() {
    const isCollapsed = vm.isRightSidebarCollapsed()
    const rightResizer = document.getElementById('right-resizer')
    if (isCollapsed) {
        rightSidebar.classList.add('collapsed')
        if (rightResizer) rightResizer.classList.add('collapsed')
        toggleRightSidebarBtn.textContent = '‹'
        reopenRightSidebarBtn.classList.remove('hidden')
    } else {
        rightSidebar.classList.remove('collapsed')
        if (rightResizer) rightResizer.classList.remove('collapsed')
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
        viewGraphBtn.classList.add('bg-[#2e2e33]', 'text-white')
        viewGraphBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        viewMarkdownBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
        viewMarkdownBtn.classList.remove('bg-[#2e2e33]', 'text-white')
        showGraph()
    } else {
        markdownContainer.classList.remove('hidden')
        graphContainer.classList.add('hidden')
        viewMarkdownBtn.classList.add('bg-[#2e2e33]', 'text-white')
        viewMarkdownBtn.classList.remove('bg-transparent', 'text-[#a1a1aa]')
        viewGraphBtn.classList.add('bg-transparent', 'text-[#a1a1aa]')
        viewGraphBtn.classList.remove('bg-[#2e2e33]', 'text-white')
    }

    const active = vm.getActiveFile()
    const activeLabel = document.getElementById('active-file-label')
    if (activeLabel) {
        activeLabel.textContent = active || t('editor.no_open_file')
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
                <span>📄 ${escapeHtml(file)}</span>
                <button class="close-tab-btn hover:text-red-400 p-0.5 rounded" data-close-file="${escapeHtml(file)}" title="${escapeHtml(closeFileTitle)}">×</button>
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
        window.cyInstance = window.cytoscape({
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

window.addEventListener('resize', () => {
    if (window.cyInstance) {
        window.cyInstance.resize()
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

async function saveActiveFile() {
    const active = vm.getActiveFile()
    if (!active) return

    const content = fileEditor ? fileEditor.value : ''
    files[active] = content

    const currentPath = window.currentProjectPath || ''
    if (window.electronAPI && window.electronAPI.saveMarkdownFile && currentPath) {
        try {
            const res = await window.electronAPI.saveMarkdownFile(currentPath, active, content)
            if (res && res.success) {
                if (saveStatus) saveStatus.textContent = ''
                if (res.recreated || res.warning === 'recreated') {
                    toast.warning(t('toast.file_recreated_warning'), t('toast.warning_title'))
                } else {
                    toast.success(t('toast.save_success'), t('toast.success_title'))
                }
            } else if (res && !res.success) {
                toast.error(t('toast.save_error', { error: res.error }), t('toast.error_title'))
            }
        } catch (err) {
            console.error('Error saving file:', err)
            toast.error(t('toast.save_error', { error: err.message }), t('toast.error_title'))
        }
    } else {
        if (saveStatus) saveStatus.textContent = ''
        toast.success(t('toast.save_success'), t('toast.success_title'))
    }
}

document.querySelectorAll('[data-action="save"]').forEach(btn => {
    btn.addEventListener('click', saveActiveFile)
})

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveActiveFile()
    }
})

fileEditor.addEventListener('input', () => {
    const active = vm.getActiveFile()
    if (active) {
        files[active] = fileEditor.value
        if (saveStatus) saveStatus.textContent = t('editor.unsaved_changes')
    }
})

// Initial Render & i18n setup
async function initApp() {
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

    setupParagraphSearchAndFilters()
    setupSectionControlsAndContextMenu()
    setupResizers()
    updateRibbonUI()
    updateLeftDrawerUI()
    updateRightSidebarUI()
    renderHistoryBar()
    renderDetailsPanel()
    updateMainWorkspaceUI()

    const langSelect = document.getElementById('settings-language-select')
    if (langSelect) {
        langSelect.value = getLanguage()
        langSelect.addEventListener('change', async () => {
            const newLang = langSelect.value
            await setLanguage(newLang)
            applyTranslations()
            updateLeftDrawerUI()
            renderFilterTags()
            populateFilterSelects()
            renderParagraphsList()
            renderScenesList()
            renderTagsList()
            renderCharactersList()
            renderLocationsList()
            renderTraitsList()
            renderHistoryBar()
            renderDetailsPanel()
            updateMainWorkspaceUI()
        })
    }
}

initApp()
