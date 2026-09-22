import { getIconSvg } from '../../dist/Utils/icons.js'
import { toast } from '../../dist/Utils/toast.js'
import { t } from '../../dist/Utils/translate.js'
import {
    DEFAULT_TAG_COLOR,
    ENTITY_CATEGORIES,
    Scene,
} from '../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from './htmlTemplates.js'

let activeContextMenuTarget = null
let activeEntityForColor = null

/**
 * Opens the custom context menu at specified coordinates.
 *
 * @param {number} x
 * @param {number} y
 * @param {object} target
 */
export function openContextMenu(x, y, target) {
    activeContextMenuTarget = target
    const ctxMenu = document.getElementById('custom-context-menu')
    const ctxAddTagGroup = document.getElementById('ctx-add-tag-group')
    const ctxAddTraitGroup = document.getElementById('ctx-add-trait-group')
    const ctxAddTagList = document.getElementById('ctx-add-tag-list')
    const ctxAddTraitList = document.getElementById('ctx-add-trait-list')
    const ctxAddTagChevron = document.getElementById('ctx-add-tag-chevron')
    const ctxAddTraitChevron = document.getElementById('ctx-add-trait-chevron')

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

    if (ctxAddTagGroup) {
        if (target.type === 'character' || target.type === 'location') {
            ctxAddTagGroup.classList.remove('hidden')
        } else {
            ctxAddTagGroup.classList.add('hidden')
        }
    }

    if (ctxAddTraitGroup) {
        if (target.type === 'character') {
            ctxAddTraitGroup.classList.remove('hidden')
        } else {
            ctxAddTraitGroup.classList.add('hidden')
        }
    }

    if (ctxMenu) {
        ctxMenu.style.left = `${x}px`
        ctxMenu.style.top = `${y}px`
        ctxMenu.classList.remove('hidden')
    }
}

/**
 * Opens the color picker popover anchored to an element.
 *
 * @param {HTMLElement} badgeEl
 * @param {object} entity
 */
export function openColorPicker(badgeEl, entity) {
    activeEntityForColor = entity
    const colorPickerPopover = document.getElementById('tag-color-picker-popover')
    if (colorPickerPopover && activeEntityForColor) {
        const currentColor = activeEntityForColor.getColor() || '#3b82f6'
        const customColorInput = document.getElementById('tag-custom-color-input')
        if (customColorInput) {
            customColorInput.value = currentColor
        }
        const rect = badgeEl.getBoundingClientRect()
        colorPickerPopover.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`
        colorPickerPopover.style.top = `${rect.bottom + 4}px`
        colorPickerPopover.classList.remove('hidden')
    }
}

/**
 * Applies a selected color to the currently active entity for color picking.
 *
 * @param {string} newColor
 * @param {object} ctx
 */
export function handleColorSelection(newColor, ctx) {
    if (!activeEntityForColor) return
    activeEntityForColor.setColor(newColor)
    if (
        activeEntityForColor instanceof Scene ||
        typeof activeEntityForColor.getWidth === 'function'
    ) {
        ctx.renderScenesList()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.updateParagraphNodeColors(
                ctx.projectParagraphs,
                ctx.projectScenes
            )
            ctx.storyGraphInstance.updateSceneNodeBadges(ctx.projectScenes)
            const sceneEl = document.querySelector(
                `scene-node[data-scene-id="${activeEntityForColor.getId()}"]`
            )
            if (sceneEl) {
                sceneEl.themeColor = newColor
            }
        }
        if (ctx.vm.getSelectedItem()?.id === activeEntityForColor.getId()) {
            if (ctx.renderDetailsPanel) ctx.renderDetailsPanel(ctx)
        }
    } else {
        ctx.renderTagsList()
        if (ctx.renderFilterTags) ctx.renderFilterTags()
        ctx.renderParagraphsList()
        if (ctx.storyGraphInstance) {
            ctx.storyGraphInstance.render(true)
        }
        if (ctx.vm.getSelectedItem()?.id === activeEntityForColor.getId()) {
            if (ctx.renderDetailsPanel) ctx.renderDetailsPanel(ctx)
        }
    }
}

/**
 * Initializes context menu, sublists, color picker popover, and drawer "+" add controls.
 *
 * @param {object} ctx Application UI Context
 */
export function setupSectionControlsAndContextMenu(ctx) {
    const ctxMenu = document.getElementById('custom-context-menu')
    const colorPickerPopover = document.getElementById('tag-color-picker-popover')
    const ctxEditTitle = document.getElementById('ctx-edit-title')
    const ctxDelete = document.getElementById('ctx-delete')
    const ctxAddTagToggle = document.getElementById('ctx-add-tag-toggle')
    const ctxAddTagList = document.getElementById('ctx-add-tag-list')
    const ctxAddTagChevron = document.getElementById('ctx-add-tag-chevron')
    const ctxAddTraitToggle = document.getElementById('ctx-add-trait-toggle')
    const ctxAddTraitList = document.getElementById('ctx-add-trait-list')
    const ctxAddTraitChevron = document.getElementById('ctx-add-trait-chevron')

    // Close menus when clicking anywhere outside
    document.addEventListener('click', e => {
        if (ctxMenu && !ctxMenu.contains(e.target)) {
            ctxMenu.classList.add('hidden')
        }
        if (
            colorPickerPopover &&
            !colorPickerPopover.contains(e.target) &&
            !e.target.classList.contains('tag-color-badge') &&
            !e.target.classList.contains('scene-color-badge')
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
            type: 'scene',
            btnId: 'btn-add-scene',
            formId: 'scene-create-form',
            inputId: 'scene-create-name',
            submitId: 'scene-create-submit',
            cancelId: 'scene-create-cancel',
            searchId: 'scene-search-input',
            getDefaultName: () => t('scene.default_name'),
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
                    createdItem = ctx.vm.createTag(name, DEFAULT_TAG_COLOR, defaultName)
                    ctx.projectTags.push(createdItem)
                    ctx.renderTagsList()
                    if (ctx.renderFilterTags) ctx.renderFilterTags()
                } else if (sec.type === 'scene') {
                    createdItem = ctx.vm.createScene(name, defaultName)
                    category = ENTITY_CATEGORIES.SCENES
                    ctx.projectScenes.push(createdItem)
                    ctx.renderScenesList()
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                } else if (sec.type === 'location') {
                    createdItem = ctx.vm.createLocation(name, defaultName)
                    category = ENTITY_CATEGORIES.LOCATIONS
                    ctx.projectLocations.push(createdItem)
                    ctx.renderLocationsList()
                } else if (sec.type === 'trait') {
                    createdItem = ctx.vm.createStat(name, defaultName)
                    category = ENTITY_CATEGORIES.RULES
                    ctx.projectStats.push(createdItem)
                    ctx.renderTraitsList()
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
                    ctx.vm.setTagSearchQuery(val)
                    ctx.renderTagsList()
                } else if (sec.type === 'scene') {
                    ctx.vm.setSceneSearchQuery(val)
                    ctx.renderScenesList()
                } else if (sec.type === 'character') {
                    ctx.vm.setCharacterSearchQuery(val)
                    ctx.renderCharactersList()
                } else if (sec.type === 'location') {
                    ctx.vm.setLocationSearchQuery(val)
                    ctx.renderLocationsList()
                } else if (sec.type === 'trait') {
                    ctx.vm.setStatSearchQuery(val)
                    ctx.renderTraitsList()
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
                ctx.refreshActiveSection(activeContextMenuTarget.type)
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
                    const idx = ctx.projectTags.findIndex(tObj => tObj.getId() === id)
                    if (idx !== -1) ctx.projectTags.splice(idx, 1)
                    if (ctx.renderFilterTags) ctx.renderFilterTags()
                } else if (activeContextMenuTarget.type === 'scene') {
                    const idx = ctx.projectScenes.findIndex(s => s.getId() === id)
                    if (idx !== -1) ctx.projectScenes.splice(idx, 1)
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                } else if (activeContextMenuTarget.type === 'character') {
                    const idx = ctx.projectCharacters.findIndex(c => c.getId() === id)
                    if (idx !== -1) ctx.projectCharacters.splice(idx, 1)
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                } else if (activeContextMenuTarget.type === 'location') {
                    const idx = ctx.projectLocations.findIndex(l => l.getId() === id)
                    if (idx !== -1) ctx.projectLocations.splice(idx, 1)
                } else if (activeContextMenuTarget.type === 'trait') {
                    const idx = ctx.projectStats.findIndex(tr => tr.getId() === id)
                    if (idx !== -1) ctx.projectStats.splice(idx, 1)
                }
                ctx.refreshActiveSection(activeContextMenuTarget.type)
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
                ctxAddTagList.innerHTML =
                    ctx.projectTags.length === 0
                        ? `<div class="px-3 py-1.5 text-gray-500 italic" data-i18n="left_panel.no_tags">${t('left_panel.no_tags')}</div>`
                        : ctx.projectTags
                              .map(
                                  tag => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-tag-id="${escapeHtml(tag.getId())}">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${escapeHtml(tag.getColor())}"></span>
                            <span>${escapeHtml(tag.getName())}</span>
                        </button>
                    `
                              )
                              .join('')

                ctxAddTagList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const tagObj = ctx.projectTags.find(
                            tObj => tObj.getId() === btn.dataset.tagId
                        )
                        if (tagObj) {
                            activeContextMenuTarget.item.addTag(tagObj)
                            ctx.refreshActiveSection(activeContextMenuTarget.type)
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
                ctxAddTraitList.innerHTML =
                    ctx.projectStats.length === 0
                        ? `<div class="px-3 py-1.5 text-gray-500 italic" data-i18n="left_panel.no_traits">${t('left_panel.no_traits')}</div>`
                        : ctx.projectStats
                              .map(
                                  tr => `
                        <button type="button" class="ctx-sublist-item w-full px-4 py-1.5 text-left hover:bg-blue-600 hover:text-white flex items-center gap-2 cursor-pointer text-[#d4d4d8]" data-trait-id="${escapeHtml(tr.getId())}">
                            <span class="text-blue-400 shrink-0">${getIconSvg('trait', 'w-3.5 h-3.5')}</span>
                            <span>${escapeHtml(tr.getName())}</span>
                        </button>
                    `
                              )
                              .join('')

                ctxAddTraitList.querySelectorAll('.ctx-sublist-item').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (!activeContextMenuTarget) return
                        const traitObj = ctx.projectStats.find(
                            tr => tr.getId() === btn.dataset.traitId
                        )
                        if (traitObj) {
                            activeContextMenuTarget.item.addStat(traitObj)
                            ctx.renderCharactersList()
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
            handleColorSelection(btn.dataset.color, ctx)
            if (colorPickerPopover) colorPickerPopover.classList.add('hidden')
        })
    })

    const customColorInput = document.getElementById('tag-custom-color-input')
    if (customColorInput) {
        customColorInput.addEventListener('input', () => {
            handleColorSelection(customColorInput.value, ctx)
        })
    }

    // Initial List Rendering
    if (ctx.renderTagsList) ctx.renderTagsList()
    if (ctx.renderCharactersList) ctx.renderCharactersList()
    if (ctx.renderLocationsList) ctx.renderLocationsList()
    if (ctx.renderTraitsList) ctx.renderTraitsList()
    if (ctx.renderParagraphsList) ctx.renderParagraphsList()
    if (ctx.renderScenesList) ctx.renderScenesList()
    if (ctx.renderConnectionsList) ctx.renderConnectionsList()
}
