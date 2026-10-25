import { getIconSvg } from '../../../dist/Utils/icons.js'
import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import {
    DEFAULT_TAG_COLOR,
    ENTITY_CATEGORIES,
    EntityLinkUpdateService,
    ProjectManager,
    Scene,
} from '../../../dist/ViewModel/MainWindowViewModel.js'
import { escapeHtml } from '../common/htmlTemplates.js'
import { openPlaytestSimulator } from '../modals/playtest/playtestModal.js'
import { markProjectDirty } from '../project/projectStateTracker.js'

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
    if (ctxAddTagChevron) ctxAddTagChevron.innerHTML = getIconSvg('chevron-right', 'w-3 h-3')
    if (ctxAddTraitChevron) ctxAddTraitChevron.innerHTML = getIconSvg('chevron-right', 'w-3 h-3')

    if (ctxAddTagGroup) {
        if (target.type === 'character' || target.type === 'location' || target.type === 'item') {
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

    const ctxCreateFromTemplate = document.getElementById('ctx-create-character-from-template')
    if (ctxCreateFromTemplate) {
        if (target.type === 'template') {
            ctxCreateFromTemplate.classList.remove('hidden')
        } else {
            ctxCreateFromTemplate.classList.add('hidden')
        }
    }

    const ctxPlaytest = document.getElementById('ctx-playtest-from-here')
    if (ctxPlaytest) {
        if (target.type === 'paragraph') {
            ctxPlaytest.classList.remove('hidden')
        } else {
            ctxPlaytest.classList.add('hidden')
        }
    }

    const ctxEditTitle = document.getElementById('ctx-edit-title')
    if (ctxEditTitle) {
        if (target.type === 'paragraph' && target.item?.getIsStart && target.item.getIsStart()) {
            ctxEditTitle.classList.add('opacity-40', 'cursor-not-allowed')
            ctxEditTitle.title =
                t('graph.start_node_cannot_be_renamed') ||
                'Nazwa węzła START nie może być zmieniana'
        } else {
            ctxEditTitle.classList.remove('opacity-40', 'cursor-not-allowed')
            ctxEditTitle.removeAttribute('title')
        }
    }

    const ctxDelete = document.getElementById('ctx-delete')
    if (ctxDelete) {
        if (target.type === 'paragraph' && target.item?.getIsStart && target.item.getIsStart()) {
            ctxDelete.classList.add('opacity-40', 'cursor-not-allowed')
            ctxDelete.title =
                t('graph.start_node_cannot_be_deleted') || 'Węzeł START nie może zostać usunięty'
        } else {
            ctxDelete.classList.remove('opacity-40', 'cursor-not-allowed')
            ctxDelete.removeAttribute('title')
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
            type: 'item',
            btnId: 'btn-add-item',
            formId: 'item-create-form',
            inputId: 'item-create-name',
            submitId: 'item-create-submit',
            cancelId: 'item-create-cancel',
            searchId: 'item-search-input',
            getDefaultName: () =>
                t('left_panel.default_item_name') || t('items.default_name') || 'Nowy przedmiot',
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
                input.value = ''
                const valInput = form.querySelector('#trait-create-value')
                if (valInput) valInput.value = ''
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
                    markProjectDirty()
                } else if (sec.type === 'scene') {
                    createdItem = ctx.vm.createScene(name, defaultName)
                    category = ENTITY_CATEGORIES.SCENES
                    ctx.projectScenes.push(createdItem)
                    ctx.renderScenesList()
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                    markProjectDirty()
                } else if (sec.type === 'location') {
                    createdItem = ctx.vm.createLocation(name, defaultName)
                    category = ENTITY_CATEGORIES.LOCATIONS
                    ctx.projectLocations.push(createdItem)
                    ctx.renderLocationsList()
                    markProjectDirty()
                } else if (sec.type === 'item') {
                    createdItem = ctx.vm.createItem(name, defaultName)
                    category = ENTITY_CATEGORIES.ITEMS
                    if (!Array.isArray(ctx.projectItems)) ctx.projectItems = []
                    ctx.projectItems.push(createdItem)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.addItem) proj.addItem(createdItem)
                    if (ctx.renderItemsList) ctx.renderItemsList()
                    markProjectDirty()
                } else if (sec.type === 'trait') {
                    const typeSelect = document.getElementById('trait-create-type')
                    const selectedType = typeSelect ? typeSelect.value : 'stat'
                    const valInput = document.getElementById('trait-create-value')
                    const customVal = valInput ? valInput.value.trim() : ''

                    category = ENTITY_CATEGORIES.RULES

                    let defaultTraitName = defaultName
                    if (selectedType === 'parameter') {
                        defaultTraitName = t('left_panel.default_parameter_name') || 'Nowy parametr'
                    } else if (selectedType === 'skill') {
                        defaultTraitName = t('left_panel.default_skill_name') || 'Nowa umiejętność'
                    } else if (selectedType === 'feature') {
                        defaultTraitName = t('left_panel.default_feature_name') || 'Nowy przymiot'
                    } else {
                        defaultTraitName =
                            t('left_panel.default_stat_name') || defaultName || 'Nowa cecha'
                    }
                    const traitName = input.value.trim() || defaultTraitName

                    const projectModel =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project

                    if (selectedType === 'parameter') {
                        const isFormula =
                            customVal.includes('+') ||
                            customVal.includes('-') ||
                            customVal.includes('*') ||
                            customVal.includes('/')
                        createdItem = ctx.vm.createParameter(
                            traitName,
                            defaultTraitName,
                            isFormula ? 'formula' : 'direct',
                            isFormula ? '' : customVal || 10,
                            isFormula ? customVal : ''
                        )
                        if (!Array.isArray(ctx.projectParameters)) ctx.projectParameters = []
                        ctx.projectParameters.push(createdItem)
                        if (projectModel?.addGlobalParameter) {
                            projectModel.addGlobalParameter(createdItem)
                        } else if (projectModel?.addParameter) {
                            projectModel.addParameter(createdItem)
                        }
                    } else if (selectedType === 'skill') {
                        createdItem = ctx.vm.createSkill(
                            traitName,
                            defaultTraitName,
                            'direct',
                            customVal || '+1'
                        )
                        if (!Array.isArray(ctx.projectSkills)) ctx.projectSkills = []
                        ctx.projectSkills.push(createdItem)
                        if (projectModel?.addGlobalSkill) {
                            projectModel.addGlobalSkill(createdItem)
                        } else if (projectModel?.addSkill) {
                            projectModel.addSkill(createdItem)
                        }
                    } else if (selectedType === 'feature') {
                        createdItem = ctx.vm.createFeature(traitName, defaultTraitName)
                        if (customVal && createdItem.getDescription) {
                            createdItem.getDescription().setText(customVal)
                        }
                        if (!Array.isArray(ctx.projectFeatures)) ctx.projectFeatures = []
                        ctx.projectFeatures.push(createdItem)
                        if (projectModel?.addGlobalFeature) {
                            projectModel.addGlobalFeature(createdItem)
                        } else if (projectModel?.addFeature) {
                            projectModel.addFeature(createdItem)
                        }
                    } else {
                        createdItem = ctx.vm.createStat(traitName, defaultTraitName)
                        if (customVal) createdItem.setValue(customVal)
                        if (!Array.isArray(ctx.projectStats)) ctx.projectStats = []
                        ctx.projectStats.push(createdItem)
                        if (projectModel?.addGlobalStat) {
                            projectModel.addGlobalStat(createdItem)
                        } else if (projectModel?.addStat) {
                            projectModel.addStat(createdItem)
                        }
                    }
                    if (valInput) valInput.value = ''
                    ctx.renderTraitsList()
                    markProjectDirty()
                }

                let persistSuccess = true

                if (
                    window.electronAPI &&
                    window.electronAPI.createEntity &&
                    category &&
                    createdItem
                ) {
                    const currentPath =
                        (typeof ctx.getProjectPath === 'function'
                            ? ctx.getProjectPath()
                            : ctx.projectPath) ||
                        window.currentProjectPath ||
                        ''
                    if (currentPath) {
                        try {
                            const entityData = createdItem.toJSON
                                ? createdItem.toJSON()
                                : { ...createdItem }
                            if (sec.type === 'trait') {
                                const typeSelect = document.getElementById('trait-create-type')
                                entityData.type = typeSelect ? typeSelect.value : 'stat'
                            }
                            const res = await window.electronAPI.createEntity({
                                projectPath: currentPath,
                                category: category,
                                entityData,
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
                if (e.key === 'Escape') {
                    input.value = ''
                    const valInput = form.querySelector('#trait-create-value')
                    if (valInput) valInput.value = ''
                    form.classList.add('hidden')
                }
            })
            const valInput = form.querySelector('#trait-create-value')
            if (valInput) {
                valInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') {
                        input.value = ''
                        valInput.value = ''
                        form.classList.add('hidden')
                    }
                })
            }
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
                } else if (sec.type === 'item') {
                    if (typeof ctx.vm.setItemSearchQuery === 'function') {
                        ctx.vm.setItemSearchQuery(val)
                    }
                    if (ctx.renderItemsList) ctx.renderItemsList()
                } else if (sec.type === 'trait') {
                    ctx.vm.setStatSearchQuery(val)
                    if (typeof ctx.vm.setParameterSearchQuery === 'function') {
                        ctx.vm.setParameterSearchQuery(val)
                    }
                    if (typeof ctx.vm.setSkillSearchQuery === 'function') {
                        ctx.vm.setSkillSearchQuery(val)
                    }
                    if (typeof ctx.vm.setFeatureSearchQuery === 'function') {
                        ctx.vm.setFeatureSearchQuery(val)
                    }
                    ctx.renderTraitsList()
                }
            })
        }
    })

    const ctxPlaytest = document.getElementById('ctx-playtest-from-here')
    if (ctxPlaytest) {
        ctxPlaytest.addEventListener('click', () => {
            if (!activeContextMenuTarget || activeContextMenuTarget.type !== 'paragraph') return
            const pId = activeContextMenuTarget.item?.getId
                ? activeContextMenuTarget.item.getId()
                : activeContextMenuTarget.item?.id
            openPlaytestSimulator(ctx, pId)
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    const ctxCreateFromTemplate = document.getElementById('ctx-create-character-from-template')
    if (ctxCreateFromTemplate) {
        ctxCreateFromTemplate.addEventListener('click', () => {
            if (!activeContextMenuTarget || activeContextMenuTarget.type !== 'template') return
            const tpl = activeContextMenuTarget.item
            if (typeof ctx.openNpcModal === 'function') {
                ctx.openNpcModal({ mode: 'character', applyTemplate: tpl })
            }
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    if (ctxEditTitle) {
        ctxEditTitle.addEventListener('click', () => {
            if (!activeContextMenuTarget) return

            // START node CANNOT be renamed
            if (
                activeContextMenuTarget.type === 'paragraph' &&
                activeContextMenuTarget.item?.getIsStart &&
                activeContextMenuTarget.item.getIsStart()
            ) {
                toast.warning(
                    t('graph.start_node_cannot_be_renamed') ||
                        'Nazwa węzła START nie może być zmieniana'
                )
                if (ctxMenu) ctxMenu.classList.add('hidden')
                return
            }

            const newName = prompt(t('context_menu.rename_prompt'), activeContextMenuTarget.name)
            if (newName !== null && newName.trim() !== '') {
                const trimmed = newName.trim()
                const oldName =
                    activeContextMenuTarget.name ||
                    (typeof activeContextMenuTarget.item.getName === 'function'
                        ? activeContextMenuTarget.item.getName()
                        : typeof activeContextMenuTarget.item.getTitle === 'function'
                          ? activeContextMenuTarget.item.getTitle()
                          : '')

                if (typeof activeContextMenuTarget.item.setName === 'function') {
                    activeContextMenuTarget.item.setName(trimmed)
                } else if (typeof activeContextMenuTarget.item.setTitle === 'function') {
                    activeContextMenuTarget.item.setTitle(trimmed)
                }
                activeContextMenuTarget.name = trimmed

                const targetId =
                    typeof activeContextMenuTarget.item.getId === 'function'
                        ? activeContextMenuTarget.item.getId()
                        : activeContextMenuTarget.item.id || ''

                if (typeof ctx?.vm?.updateFileDisplayNameForEntity === 'function') {
                    ctx.vm.updateFileDisplayNameForEntity(oldName, trimmed, targetId)
                }

                if (oldName && oldName !== trimmed) {
                    EntityLinkUpdateService.updateEntityReferences(
                        {
                            id: targetId,
                            oldName,
                            newName: trimmed,
                            type: activeContextMenuTarget.type,
                        },
                        ctx
                    )
                }

                ctx.refreshActiveSection(activeContextMenuTarget.type)
                markProjectDirty()
            }
            if (ctxMenu) ctxMenu.classList.add('hidden')
        })
    }

    if (ctxDelete) {
        ctxDelete.addEventListener('click', () => {
            if (!activeContextMenuTarget) return

            // START node CANNOT be deleted
            if (
                activeContextMenuTarget.type === 'paragraph' &&
                activeContextMenuTarget.item?.getIsStart &&
                activeContextMenuTarget.item.getIsStart()
            ) {
                toast.warning(
                    t('graph.start_node_cannot_be_deleted') ||
                        'Węzeł START nie może zostać usunięty'
                )
                if (ctxMenu) ctxMenu.classList.add('hidden')
                return
            }

            const confirmDel = confirm(
                t('context_menu.confirm_delete', { name: activeContextMenuTarget.name })
            )
            if (confirmDel) {
                const id = activeContextMenuTarget.id
                if (activeContextMenuTarget.type === 'tag') {
                    const idx = ctx.projectTags.findIndex(tObj => tObj.getId() === id)
                    if (idx !== -1) ctx.projectTags.splice(idx, 1)
                    if (ctx.renderFilterTags) ctx.renderFilterTags()
                } else if (activeContextMenuTarget.type === 'paragraph') {
                    const deleted = ctx.vm.deleteParagraph(
                        id,
                        ctx.projectParagraphs,
                        ctx.projectScenes
                    )
                    if (deleted) {
                        toast.success(t('toast.paragraph_deleted') || 'Paragraf został usunięty')
                        if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                    }
                } else if (activeContextMenuTarget.type === 'scene') {
                    const idx = ctx.projectScenes.findIndex(s => s.getId() === id)
                    if (idx !== -1) ctx.projectScenes.splice(idx, 1)
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                    if (ctx.storyGraphInstance) ctx.storyGraphInstance.render(true)
                } else if (activeContextMenuTarget.type === 'character') {
                    const idx = ctx.projectCharacters.findIndex(c => c.getId() === id)
                    if (idx !== -1) ctx.projectCharacters.splice(idx, 1)
                    if (ctx.populateFilterSelects) ctx.populateFilterSelects()
                } else if (activeContextMenuTarget.type === 'template') {
                    const tpls = ctx.projectTemplates || []
                    const idx = tpls.findIndex(
                        t => (typeof t.getId === 'function' ? t.getId() : t.id) === id
                    )
                    if (idx !== -1) tpls.splice(idx, 1)
                    if (ctx.vm?.project && typeof ctx.vm.project.removeTemplate === 'function') {
                        ctx.vm.project.removeTemplate(id)
                    }
                } else if (activeContextMenuTarget.type === 'location') {
                    const idx = ctx.projectLocations.findIndex(l => l.getId() === id)
                    if (idx !== -1) ctx.projectLocations.splice(idx, 1)
                } else if (activeContextMenuTarget.type === 'item') {
                    const idx = (ctx.projectItems || []).findIndex(
                        it => (typeof it.getId === 'function' ? it.getId() : it.id) === id
                    )
                    if (idx !== -1) ctx.projectItems.splice(idx, 1)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.removeItem) proj.removeItem(id)
                } else if (
                    activeContextMenuTarget.type === 'trait' ||
                    activeContextMenuTarget.type === 'stat'
                ) {
                    const idx = ctx.projectStats.findIndex(tr => tr.getId() === id)
                    if (idx !== -1) ctx.projectStats.splice(idx, 1)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.removeGlobalStat) proj.removeGlobalStat(id)
                    else if (proj?.removeStat) proj.removeStat(id)
                } else if (activeContextMenuTarget.type === 'parameter') {
                    const idx = (ctx.projectParameters || []).findIndex(p => p.getId() === id)
                    if (idx !== -1) ctx.projectParameters.splice(idx, 1)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.removeGlobalParameter) proj.removeGlobalParameter(id)
                    else if (proj?.removeParameter) proj.removeParameter(id)
                } else if (activeContextMenuTarget.type === 'skill') {
                    const idx = (ctx.projectSkills || []).findIndex(sk => sk.getId() === id)
                    if (idx !== -1) ctx.projectSkills.splice(idx, 1)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.removeGlobalSkill) proj.removeGlobalSkill(id)
                    else if (proj?.removeSkill) proj.removeSkill(id)
                } else if (activeContextMenuTarget.type === 'feature') {
                    const idx = (ctx.projectFeatures || []).findIndex(f => f.getId() === id)
                    if (idx !== -1) ctx.projectFeatures.splice(idx, 1)
                    const proj =
                        (typeof ProjectManager !== 'undefined' &&
                            ProjectManager?.getInstance?.()?.getProject?.()) ||
                        ctx.vm?.project ||
                        ctx.projectData?.project
                    if (proj?.removeGlobalFeature) proj.removeGlobalFeature(id)
                    else if (proj?.removeFeature) proj.removeFeature(id)
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
                ctxAddTagChevron.innerHTML = isHidden
                    ? getIconSvg('chevron-down', 'w-3 h-3')
                    : getIconSvg('chevron-right', 'w-3 h-3')
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
                ctxAddTraitChevron.innerHTML = isHidden
                    ? getIconSvg('chevron-down', 'w-3 h-3')
                    : getIconSvg('chevron-right', 'w-3 h-3')
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
