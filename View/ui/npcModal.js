/**
 * NPC Creation Floating Window Controller (Facade)
 * Orchestrates window lifecycle, dragging interactions, avatar selection,
 * form inputs, and narrative drawer, delegating sub-responsibilities to specialized modules.
 */

import { applyTranslations, t } from '../../dist/Utils/translate.js'
import { evaluateFormula, parseStatValueAsNumber } from './npcModal/formulaEvaluator.js'
import { saveNpcCharacter as saveNpcCharacterHelper } from './npcModal/npcCharacterSaver.js'
import { clampModalPosition, initDraggable, initResizable } from './npcModal/npcDraggable.js'
import {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcTag,
    addNpcVital,
    applyTemplate,
    closeTemplateDropdown,
    confirmCustomAttribute,
    confirmNpcSkill,
    confirmNpcStat,
    confirmNpcVital,
    editCustomAttribute,
    editNpcSkill,
    editNpcStat,
    editNpcVital,
    getAvailableTemplates,
    initAvatarGrid,
    initNpcTagsController,
    initTemplateDropdownController,
    isTemplateDropdownOpen,
    openTemplateDropdown,
    removeAppliedTemplate,
    removeCustomAttribute,
    removeNpcSkill,
    removeNpcStat,
    removeNpcTag,
    removeNpcVital,
    renderAppliedTemplates,
    renderCustomAttributes,
    renderDynamicSuggestions,
    renderNpcSkills,
    renderNpcStats,
    renderNpcTags,
    renderNpcVitals,
    renderTemplateDropdownList,
    syncActiveModalInputs,
    toggleTemplateDropdown,
    updateSelectedAvatarPreview,
    updateSkillStatDropdowns,
    updateVitalFormulasPreview,
} from './npcModal/npcSectionControllers.js'
import * as state from './npcModal/npcState.js'
import { saveNpcTemplate as saveNpcTemplateHelper } from './npcModal/npcTemplateSaver.js'
import { getTraitsCounts, updateTraitsCounterUI } from './npcModal/npcTraitsCounter.js'
import {
    extractTemplateAttributes,
    extractTemplateSkills,
    extractTemplateStats,
    extractTemplateTags,
    extractTemplateVitals,
} from './npcModal/templateMerger.js'

// Re-export pure domain & section helpers for 100% public API compatibility
export {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcTag,
    addNpcVital,
    applyTemplate,
    closeTemplateDropdown,
    confirmCustomAttribute,
    confirmNpcSkill,
    confirmNpcStat,
    confirmNpcVital,
    editCustomAttribute,
    editNpcSkill,
    editNpcStat,
    editNpcVital,
    evaluateFormula,
    getAvailableTemplates,
    getTraitsCounts,
    initNpcTagsController,
    initTemplateDropdownController,
    isTemplateDropdownOpen,
    openTemplateDropdown,
    parseStatValueAsNumber,
    removeAppliedTemplate,
    removeCustomAttribute,
    removeNpcSkill,
    removeNpcStat,
    removeNpcTag,
    removeNpcVital,
    renderAppliedTemplates,
    renderCustomAttributes,
    renderDynamicSuggestions,
    renderNpcSkills,
    renderNpcStats,
    renderNpcTags,
    renderNpcVitals,
    renderTemplateDropdownList,
    toggleTemplateDropdown,
    updateSelectedAvatarPreview,
    updateSkillStatDropdowns,
    updateTraitsCounterUI,
    updateVitalFormulasPreview,
}

export const getModalMode = state.getModalMode
export const setModalMode = state.setModalMode

// Re-export state getters and setters
export const getCustomAttributes = state.getCustomAttributes
export const setCustomAttributes = attrs => {
    state.setCustomAttributes(attrs)
    renderCustomAttributes()
}
export const clearCustomAttributes = () => {
    state.clearCustomAttributes()
    renderCustomAttributes()
}

export const getNpcStats = state.getNpcStats
export const setNpcStats = stats => {
    state.setNpcStats(stats)
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}
export const clearNpcStats = () => {
    state.clearNpcStats()
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}
export const getAvailableStatNames = state.getAvailableStatNames

export const getNpcSkills = state.getNpcSkills
export const setNpcSkills = skills => {
    state.setNpcSkills(skills)
    renderNpcSkills()
}
export const clearNpcSkills = () => {
    state.clearNpcSkills()
    renderNpcSkills()
}

export const getNpcVitals = () => state.getNpcVitals(evaluateFormula)
export const setNpcVitals = vitals => {
    state.setNpcVitals(vitals)
    renderNpcVitals()
}
export const clearNpcVitals = () => {
    state.clearNpcVitals()
    renderNpcVitals()
}

export const getSelectedAvatarId = state.getCurrentAvatarId
export const setSelectedAvatarId = id => updateSelectedAvatarPreview(id)

export const getNpcTags = state.getNpcTags
export const setNpcTags = tags => {
    state.setNpcTags(tags)
    renderNpcTags()
}
export const clearNpcTags = () => {
    state.clearNpcTags()
    renderNpcTags()
}

export const getAppliedTemplates = state.getAppliedTemplates
export const setAppliedTemplates = templates => {
    state.setAppliedTemplates(templates)
    renderAppliedTemplates()
}
export const clearAppliedTemplates = () => {
    state.clearAppliedTemplates()
    renderAppliedTemplates()
}

/**
 * Toggles or explicitly sets the expansion state of the narrative description side drawer.
 * Automatically expands or restores modal window width so the character sheet doesn't get squeezed.
 *
 * @param {boolean} [forceState]
 */
export function toggleDescriptionDrawer(forceState) {
    const modal = state.getActiveModal() || document.getElementById('npc-create-modal')
    const drawer = document.getElementById('npc-description-drawer')
    const arrow = document.getElementById('npc-desc-toggle-arrow')
    const btnToggle = document.getElementById('btn-toggle-npc-description')

    if (!drawer) return

    let isOpen = false
    if (typeof forceState === 'boolean') {
        isOpen = forceState
    } else {
        isOpen = drawer.classList.contains('hidden')
    }

    state.setIsDrawerOpen(isOpen)

    if (isOpen) {
        drawer.classList.remove('hidden')
        if (arrow) arrow.textContent = '‹'
        if (btnToggle) {
            btnToggle.setAttribute('title', t('npc.collapse_narrative'))
        }

        if (modal) {
            const drawerWidth = drawer.offsetWidth || 380
            const currentWidth = parseInt(modal.style.width, 10) || modal.offsetWidth || 860
            modal.dataset.widthBeforeDrawer = String(currentWidth)

            const maxAllowedWidth =
                typeof window !== 'undefined' && window.innerWidth
                    ? Math.floor(window.innerWidth * 0.96)
                    : 1600
            const targetWidth = Math.min(currentWidth + drawerWidth, maxAllowedWidth)

            modal.style.width = `${targetWidth}px`

            // If expanding pushes window outside viewport on the right, shift it left
            const currentLeft = parseInt(modal.style.left, 10) || modal.offsetLeft || 0
            if (
                typeof window !== 'undefined' &&
                window.innerWidth &&
                currentLeft + targetWidth + 15 > window.innerWidth
            ) {
                const rightOverflow = currentLeft + targetWidth + 15 - window.innerWidth
                const newLeft = Math.max(10, currentLeft - rightOverflow)
                modal.style.left = `${newLeft}px`
            }

            clampModalPosition(modal)
        }
    } else {
        const wasOpen = !drawer.classList.contains('hidden')
        drawer.classList.add('hidden')
        if (arrow) arrow.textContent = '›'
        if (btnToggle) {
            btnToggle.setAttribute('title', t('npc.expand_narrative'))
        }

        if (modal && wasOpen) {
            const drawerWidth = 380
            if (modal.dataset.widthBeforeDrawer) {
                modal.style.width = `${modal.dataset.widthBeforeDrawer}px`
                delete modal.dataset.widthBeforeDrawer
            } else {
                const currentWidth = parseInt(modal.style.width, 10) || modal.offsetWidth || 1240
                const newWidth = Math.max(500, currentWidth - drawerWidth)
                modal.style.width = `${newWidth}px`
            }

            clampModalPosition(modal)
        }
    }
}

/**
 * Checks whether the description drawer is currently open.
 *
 * @returns {boolean}
 */
export function isDescriptionDrawerOpen() {
    const drawer = document.getElementById('npc-description-drawer')
    return drawer ? !drawer.classList.contains('hidden') : false
}

/**
 * Updates the modal UI elements (titles, badges, buttons, placeholders) based on mode and edit status.
 *
 * @param {'character' | 'template'} mode
 */
export function updateModalModeUI(mode = 'character') {
    state.setModalMode(mode)
    const isTemplate = mode === 'template'
    const isEditing = state.isEditingMode()

    // Header title and badge
    const headerTitle = document.getElementById('npc-create-modal-title')
    if (headerTitle) {
        const titleSpan = headerTitle.querySelector('span:first-child')
        const badgeSpan = headerTitle.querySelector('span:last-child')

        if (titleSpan) {
            if (isEditing) {
                titleSpan.textContent = isTemplate
                    ? typeof t === 'function'
                        ? t('npc.template_modal_edit_title')
                        : 'Edycja Szablonu NPC'
                    : typeof t === 'function'
                      ? t('npc.modal_edit_title')
                      : 'Edycja Postaci NPC'
            } else {
                titleSpan.textContent = isTemplate
                    ? typeof t === 'function'
                        ? t('npc.template_modal_title')
                        : 'Karta Szablonu NPC'
                    : typeof t === 'function'
                      ? t('npc.modal_title')
                      : 'Karta Postaci NPC'
            }
        }
        if (badgeSpan) {
            if (isEditing) {
                badgeSpan.textContent =
                    typeof t === 'function' ? t('npc.edit_badge') : 'Modyfikacja'
                badgeSpan.className =
                    'text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-normal'
            } else {
                badgeSpan.textContent = isTemplate
                    ? typeof t === 'function'
                        ? t('npc.template_badge')
                        : 'Szablon'
                    : typeof t === 'function'
                      ? t('npc.character_folio_badge')
                      : 'Folio'
                if (isTemplate) {
                    badgeSpan.className =
                        'text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-normal'
                } else {
                    badgeSpan.className =
                        'text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-normal'
                }
            }
        }
    }

    // Subtitle
    const subtitle = document.querySelector('#npc-create-modal-header p')
    if (subtitle) {
        if (isEditing) {
            subtitle.textContent = isTemplate
                ? typeof t === 'function'
                    ? t('npc.template_modal_edit_subtitle')
                    : 'Modyfikacja i personalizacja archetypu bohatera niezależnego'
                : typeof t === 'function'
                  ? t('npc.modal_edit_subtitle')
                  : 'Modyfikacja i personalizacja bohatera niezależnego'
        } else {
            subtitle.textContent = isTemplate
                ? typeof t === 'function'
                    ? t('npc.template_modal_subtitle')
                    : 'Tworzenie i personalizacja archetypu bohatera niezależnego'
                : typeof t === 'function'
                  ? t('npc.modal_subtitle')
                  : 'Tworzenie i personalizacja bohatera niezależnego'
        }
    }

    // Header icon box styling
    const headerIconBox = document.querySelector('#npc-create-modal-header .rounded-lg')
    if (headerIconBox) {
        if (isTemplate) {
            headerIconBox.className =
                'w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-sm'
        } else {
            headerIconBox.className =
                'w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-sm'
        }
    }

    // Header title attribute for drag hint
    const header = document.getElementById('npc-create-modal-header')
    if (header) {
        header.title = isTemplate
            ? typeof t === 'function'
                ? t('npc.drag_template_title')
                : 'Przeciągnij, aby przesunąć kartę szablonu'
            : typeof t === 'function'
              ? t('npc.drag_title')
              : 'Przeciągnij, aby przesunąć kartę postaci'
    }

    // Name input placeholder & label
    const nameInput = document.getElementById('npc-name-input')
    if (nameInput) {
        nameInput.placeholder = isTemplate
            ? typeof t === 'function'
                ? t('npc.template_name_placeholder')
                : 'np. Strażnik miejski, Bandyta leśny, Kultysta...'
            : typeof t === 'function'
              ? t('npc.name_placeholder')
              : 'np. Strażnik miejski, Mistrz Elion...'
    }

    const nameLabel = document.querySelector('label[for="npc-name-input"]')
    if (nameLabel) {
        nameLabel.textContent = isTemplate
            ? typeof t === 'function'
                ? t('npc.template_name_label')
                : 'Nazwa szablonu'
            : typeof t === 'function'
              ? t('npc.name_label')
              : 'Nazwa postaci'
    }

    // Summary input placeholder
    const summaryInput = document.getElementById('npc-summary-input')
    if (summaryInput) {
        summaryInput.placeholder = isTemplate
            ? typeof t === 'function'
                ? t('npc.template_summary_placeholder')
                : 'Krótkie streszczenie archetypu (np. przeznaczenie szablonu, typowe zachowanie)...'
            : typeof t === 'function'
              ? t('npc.summary_placeholder')
              : 'Krótkie streszczenie (np. kim jest postać, jej cel lub rola w fabule)...'
    }

    // Save button label & styling
    const saveBtn = document.getElementById('btn-save-npc-modal')
    if (saveBtn) {
        const span = saveBtn.querySelector('span')
        if (span) {
            if (isEditing) {
                span.textContent =
                    typeof t === 'function' ? t('npc.btn_save_changes') : 'Zapisz zmiany'
            } else {
                span.textContent = isTemplate
                    ? typeof t === 'function'
                        ? t('npc.btn_create_template')
                        : 'Zapisz szablon'
                    : typeof t === 'function'
                      ? t('npc.btn_create')
                      : 'Zapisz postać'
            }
        }
        if (isTemplate) {
            saveBtn.className =
                'flex items-center gap-1.5 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs text-white font-semibold transition-all cursor-pointer shadow-md shadow-purple-900/30 hover:shadow-purple-600/30 active:scale-[0.98]'
        } else {
            saveBtn.className =
                'flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold transition-all cursor-pointer shadow-md shadow-blue-900/30 hover:shadow-blue-600/30 active:scale-[0.98]'
        }
    }
}

/**
 * Opens the NPC creation floating window in character or template mode, or for editing existing entity.
 *
 * @param {object} [options]
 * @param {'character' | 'template'} [options.mode='character']
 * @param {any} [options.applyTemplate]
 * @param {any} [options.editEntity] Entity to modify
 * @param {any} [options.editingEntity] Alias for editEntity
 * @param {boolean} [options.preserveState=false]
 */
export function openNpcModal(options = {}) {
    const modal = state.getActiveModal() || document.getElementById('npc-create-modal')
    if (!modal) return

    const editEntity = options?.editEntity || options?.editingEntity

    if (editEntity) {
        const inferredMode =
            options?.mode ||
            (editEntity.constructor?.name === 'NPC_Template' || editEntity.type === 'template'
                ? 'template'
                : 'character')

        state.resetState()
        state.setEditingEntity(editEntity)
        state.setModalMode(inferredMode)

        const avatarId =
            (typeof editEntity.getAvatar === 'function'
                ? editEntity.getAvatar()
                : editEntity.avatar) || 'warrior'
        state.setCurrentAvatarId(avatarId)
        updateSelectedAvatarPreview(avatarId)

        const name =
            (typeof editEntity.getName === 'function' ? editEntity.getName() : editEntity.name) ||
            ''
        setNpcName(name)

        const desc =
            typeof editEntity.getDescription === 'function'
                ? editEntity.getDescription()
                : editEntity.description
        const summary =
            (typeof editEntity.getSummary === 'function'
                ? editEntity.getSummary()
                : desc && typeof desc.getSummary === 'function'
                  ? desc.getSummary()
                  : desc?.summary) || ''
        setNpcSummary(summary)

        const descText =
            (desc && typeof desc.getText === 'function' ? desc.getText() : desc?.text) || ''
        setNpcDescription(descText)

        // Stats
        const extractedStats = extractTemplateStats(editEntity)
        state.setNpcStats(
            extractedStats.map((s, i) => ({
                id: `stat_edit_${i}`,
                name: s.name,
                value: s.value,
                isEditing: false,
            }))
        )
        renderNpcStats()

        // Vitals
        const extractedVitals = extractTemplateVitals(editEntity)
        state.setNpcVitals(
            extractedVitals.map((v, i) => ({
                id: `vital_edit_${i}`,
                name: v.name,
                mode: v.mode,
                value: v.value,
                formula: v.formula,
                isEditing: false,
            }))
        )
        renderNpcVitals()

        // Skills
        const extractedSkills = extractTemplateSkills(editEntity)
        state.setNpcSkills(
            extractedSkills.map((sk, i) => ({
                id: `skill_edit_${i}`,
                name: sk.name,
                mode: sk.mode,
                value: sk.value,
                statName: sk.statName,
                modifier: sk.modifier,
                isEditing: false,
            }))
        )
        renderNpcSkills()

        // Custom attributes & features
        const extractedAttrs = extractTemplateAttributes(editEntity)
        state.setCustomAttributes(
            extractedAttrs.map((a, i) => ({
                id: `attr_edit_${i}`,
                name: a.name,
                value: a.value,
                isEditing: false,
            }))
        )
        renderCustomAttributes()

        // Tags
        const extractedTags = extractTemplateTags(editEntity)
        state.setNpcTags(extractedTags)
        renderNpcTags()

        state.clearAppliedTemplates()
        renderAppliedTemplates()
        closeTemplateDropdown()
        toggleDescriptionDrawer(false)
        updateTraitsCounterUI(state.getActiveCtx())
        updateModalModeUI(inferredMode)
    } else {
        if (!options?.preserveState) {
            state.setEditingEntity(null)
            resetNpcModalForm()
        }
        const mode = options?.mode || 'character'
        updateModalModeUI(mode)
    }

    modal.classList.remove('hidden')

    try {
        if (typeof applyTranslations === 'function') {
            applyTranslations()
        }
    } catch {
        // ignore
    }

    renderDynamicSuggestions(state.getActiveCtx())
    renderNpcTags()
    renderAppliedTemplates()

    if (options?.applyTemplate) {
        applyTemplate(options.applyTemplate, state.getActiveCtx())
    }

    if (!state.getHasBeenPositioned()) {
        const modalWidth = modal.offsetWidth || 860
        const modalHeight = modal.offsetHeight || 580
        const defaultLeft = Math.max(20, Math.floor((window.innerWidth - modalWidth) / 2))
        const defaultTop = Math.max(40, Math.floor((window.innerHeight - modalHeight) / 3))

        modal.style.left = `${defaultLeft}px`
        modal.style.top = `${defaultTop}px`
        modal.style.right = 'auto'
        modal.style.bottom = 'auto'
        state.setHasBeenPositioned(true)
    } else {
        clampModalPosition(modal)
    }

    const nameInput = document.getElementById('npc-name-input')
    if (nameInput && typeof nameInput.focus === 'function') {
        nameInput.focus()
    }
}

/**
 * Opens the NPC template creation floating window.
 *
 * @param {object} [options]
 */
export function openNpcTemplateModal(options = {}) {
    return openNpcModal({ ...options, mode: 'template' })
}

/**
 * Closes the NPC creation floating window and resets all fields to clean state.
 */
export function closeNpcModal() {
    const modal = state.getActiveModal() || document.getElementById('npc-create-modal')
    if (!modal) return

    const popover = document.getElementById('npc-avatar-picker-popover')
    if (popover) {
        popover.classList.add('hidden')
    }

    const tagPopover = document.getElementById('npc-tag-picker-popover')
    if (tagPopover) {
        tagPopover.classList.add('hidden')
    }

    closeTemplateDropdown()

    modal.classList.add('hidden')
    resetNpcModalForm()
}

/**
 * Returns NPC name from the input field.
 *
 * @returns {string}
 */
export function getNpcName() {
    const input = document.getElementById('npc-name-input')
    return input ? input.value.trim() : ''
}

/**
 * Sets NPC name in the input field.
 *
 * @param {string} name
 */
export function setNpcName(name) {
    const input = document.getElementById('npc-name-input')
    if (input) {
        input.value = name || ''
    }
}

/**
 * Returns narrative description text.
 *
 * @returns {string}
 */
export function getNpcDescription() {
    const textarea = document.getElementById('npc-description-textarea')
    return textarea ? textarea.value : ''
}

/**
 * Sets narrative description text.
 *
 * @param {string} text
 */
export function setNpcDescription(text) {
    const textarea = document.getElementById('npc-description-textarea')
    if (textarea) {
        textarea.value = text || ''
    }
}

/**
 * Returns NPC short summary text.
 *
 * @returns {string}
 */
export function getNpcSummary() {
    const textarea = document.getElementById('npc-summary-input')
    return textarea ? textarea.value.trim() : ''
}

/**
 * Sets NPC short summary text.
 *
 * @param {string} summary
 */
export function setNpcSummary(summary) {
    const textarea = document.getElementById('npc-summary-input')
    if (textarea) {
        textarea.value = summary || ''
    }
}

/**
 * Resets modal form fields and internal state to clean initial state.
 */
export function resetNpcModalForm() {
    const currentMode = state.getModalMode()
    state.resetState()
    state.setModalMode(currentMode)
    updateSelectedAvatarPreview('warrior')
    setNpcName('')
    setNpcSummary('')
    setNpcDescription('')
    renderCustomAttributes()
    renderNpcStats()
    renderNpcSkills()
    renderNpcVitals()
    renderNpcTags()
    renderAppliedTemplates()
    closeTemplateDropdown()
    toggleDescriptionDrawer(false)
    updateTraitsCounterUI(state.getActiveCtx())
    updateModalModeUI(currentMode)

    const errorBox = document.getElementById('npc-create-error-message')
    if (errorBox) errorBox.classList.add('hidden')

    const nameInput = document.getElementById('npc-name-input')
    if (nameInput) {
        nameInput.classList.remove('border-red-500', 'focus:border-red-500')
    }

    const popover = document.getElementById('npc-avatar-picker-popover')
    if (popover) popover.classList.add('hidden')

    const tagPopover = document.getElementById('npc-tag-picker-popover')
    if (tagPopover) tagPopover.classList.add('hidden')
}

/**
 * Validates and saves the NPC character, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @returns {object|null} Created character object or null if validation failed
 */
export function saveNpcCharacter(ctx) {
    syncActiveModalInputs()
    return saveNpcCharacterHelper(ctx, {
        getName: getNpcName,
        getSummary: getNpcSummary,
        getDescription: getNpcDescription,
        closeModal: closeNpcModal,
        resetForm: resetNpcModalForm,
    })
}

/**
 * Validates and saves the NPC template, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @returns {object|null} Created template object or null if validation failed
 */
export function saveNpcTemplate(ctx) {
    syncActiveModalInputs()
    return saveNpcTemplateHelper(ctx, {
        getName: getNpcName,
        getSummary: getNpcSummary,
        getDescription: getNpcDescription,
        closeModal: closeNpcModal,
        resetForm: resetNpcModalForm,
    })
}

/**
 * Initializes listeners for the NPC creation floating window.
 *
 * @param {object} [ctx] Optional application UI context
 */
export function setupNpcModal(ctx) {
    const modal = document.getElementById('npc-create-modal')
    state.setActiveModal(modal)
    state.setActiveCtx(ctx || null)

    if (!modal) return {}

    state.resetState()

    const header = document.getElementById('npc-create-modal-header')
    const btnAddCharacter = document.getElementById('btn-add-character')
    const btnAddTemplate = document.getElementById('btn-add-template')
    const btnCloseModal = document.getElementById('btn-close-npc-modal')
    const btnToggleDesc = document.getElementById('btn-toggle-npc-description')

    // Initialize dragging and resizing mechanisms
    initDraggable(modal, header)

    const resizer = document.getElementById('npc-modal-resizer')
    if (resizer) {
        initResizable(modal, resizer, { minWidth: 700, minHeight: 520 })
    }

    // Initialize fantasy avatar picker grid & preview
    initAvatarGrid()

    // Initialize character tags controller
    initNpcTagsController(ctx)

    // Initialize side drawer toggle
    if (btnToggleDesc) {
        btnToggleDesc.addEventListener('click', e => {
            e.preventDefault()
            toggleDescriptionDrawer()
        })
    }

    // Open when clicking "Postać" in left drawer
    if (btnAddCharacter) {
        btnAddCharacter.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            openNpcModal({ mode: 'character' })
        })
    }

    // Open when clicking "Szablon" in left drawer
    if (btnAddTemplate) {
        btnAddTemplate.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            openNpcTemplateModal()
        })
    }

    // Open when clicking any trigger with data-action="open-npc-modal"
    document.querySelectorAll('[data-action="open-npc-modal"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            const mode = btn.dataset.mode === 'template' ? 'template' : 'character'
            openNpcModal({ mode })
        })
    })

    // Open when clicking any trigger with data-action="open-npc-template-modal"
    document.querySelectorAll('[data-action="open-npc-template-modal"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            openNpcTemplateModal()
        })
    })

    // Close when clicking the close button
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', e => {
            e.preventDefault()
            closeNpcModal()
        })
    }

    // Safely attach single document click listener for outside popover clicks
    const prevOutsideHandler = state.getGlobalOutsideClickHandler()
    if (prevOutsideHandler) {
        document.removeEventListener('click', prevOutsideHandler)
    }
    const outsideClickHandler = e => {
        const popover = document.getElementById('npc-avatar-picker-popover')
        const triggerBtn = document.getElementById('btn-npc-avatar-trigger')
        if (popover && !popover.classList.contains('hidden')) {
            if (!popover.contains(e.target) && (!triggerBtn || !triggerBtn.contains(e.target))) {
                popover.classList.add('hidden')
            }
        }
        const tagPopover = document.getElementById('npc-tag-picker-popover')
        const tagTriggerBtn = document.getElementById('btn-add-npc-tag')
        if (tagPopover && !tagPopover.classList.contains('hidden')) {
            if (
                !tagPopover.contains(e.target) &&
                (!tagTriggerBtn || !tagTriggerBtn.contains(e.target))
            ) {
                tagPopover.classList.add('hidden')
            }
        }
        const templateMenu = document.getElementById('npc-template-dropdown-menu')
        const templateDropdownBtn = document.getElementById('btn-template-dropdown')
        if (templateMenu && !templateMenu.classList.contains('hidden')) {
            if (
                !templateMenu.contains(e.target) &&
                (!templateDropdownBtn || !templateDropdownBtn.contains(e.target))
            ) {
                closeTemplateDropdown()
            }
        }
    }
    state.setGlobalOutsideClickHandler(outsideClickHandler)
    document.addEventListener('click', outsideClickHandler)

    // Safely attach single Escape key listener (first closes dropdown/popovers if open, then modal)
    const prevKeydownHandler = state.getGlobalKeydownHandler()
    if (prevKeydownHandler) {
        document.removeEventListener('keydown', prevKeydownHandler)
    }
    const keydownHandler = e => {
        if (e.key === 'Escape') {
            if (isTemplateDropdownOpen()) {
                closeTemplateDropdown()
                return
            }
            const popover = document.getElementById('npc-avatar-picker-popover')
            if (popover && !popover.classList.contains('hidden')) {
                popover.classList.add('hidden')
                return
            }
            const tagPopover = document.getElementById('npc-tag-picker-popover')
            if (tagPopover && !tagPopover.classList.contains('hidden')) {
                tagPopover.classList.add('hidden')
                return
            }
            if (modal && !modal.classList.contains('hidden')) {
                closeNpcModal()
            }
        }
    }
    state.setGlobalKeydownHandler(keydownHandler)
    document.addEventListener('keydown', keydownHandler)

    // Populate dynamic suggestions
    renderDynamicSuggestions(ctx)

    // Initialize template dropdown controller & applied chips
    initTemplateDropdownController(ctx)
    renderAppliedTemplates()

    // Custom attributes setup
    const btnAddAttr = document.getElementById('btn-add-custom-attribute')
    if (btnAddAttr) {
        btnAddAttr.addEventListener('click', e => {
            e.preventDefault()
            addCustomAttribute('', '')
        })
    }

    renderCustomAttributes()

    // Stats setup
    const btnAddStat = document.getElementById('btn-add-npc-stat')
    if (btnAddStat) {
        btnAddStat.addEventListener('click', e => {
            e.preventDefault()
            addNpcStat('', '')
        })
    }

    renderNpcStats()

    // Skills setup
    const btnAddSkill = document.getElementById('btn-add-npc-skill')
    if (btnAddSkill) {
        btnAddSkill.addEventListener('click', e => {
            e.preventDefault()
            addNpcSkill('', 'direct', '')
        })
    }

    renderNpcSkills()

    // Vitals setup
    const btnAddVital = document.getElementById('btn-add-npc-vital')
    if (btnAddVital) {
        btnAddVital.addEventListener('click', e => {
            e.preventDefault()
            addNpcVital('', 'direct', '')
        })
    }

    renderNpcVitals()

    // Setup name input error clearing on user typing
    const nameInput = document.getElementById('npc-name-input')
    const errorBox = document.getElementById('npc-create-error-message')
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            if (errorBox) errorBox.classList.add('hidden')
            nameInput.classList.remove('border-red-500', 'focus:border-red-500')
        })
    }

    // Setup action buttons: Save & Cancel
    const btnCancel = document.getElementById('btn-cancel-npc-modal')
    if (btnCancel) {
        btnCancel.addEventListener('click', e => {
            e.preventDefault()
            closeNpcModal()
            resetNpcModalForm()
        })
    }

    const btnSave = document.getElementById('btn-save-npc-modal')
    const form = document.getElementById('npc-create-modal-form')
    const executeSave = () => {
        syncActiveModalInputs()
        if (state.getModalMode() === 'template') {
            saveNpcTemplate(ctx)
        } else {
            saveNpcCharacter(ctx)
        }
    }
    if (btnSave) {
        btnSave.addEventListener('click', e => {
            e.preventDefault()
            executeSave()
        })
    }
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault()
            executeSave()
        })
    }

    // Expose helpers on ctx and window for flexible access
    const methods = {
        open: openNpcModal,
        close: closeNpcModal,
        openNpcModal,
        closeNpcModal,
        getSelectedAvatarId,
        setSelectedAvatarId,
        getNpcName,
        setNpcName,
        getNpcSummary,
        setNpcSummary,
        getCustomAttributes,
        setCustomAttributes,
        addCustomAttribute,
        confirmCustomAttribute,
        editCustomAttribute,
        removeCustomAttribute,
        clearCustomAttributes,
        renderCustomAttributes,
        getNpcStats,
        setNpcStats,
        addNpcStat,
        confirmNpcStat,
        editNpcStat,
        removeNpcStat,
        clearNpcStats,
        renderNpcStats,
        getAvailableStatNames,
        updateSkillStatDropdowns,
        getNpcSkills,
        setNpcSkills,
        addNpcSkill,
        confirmNpcSkill,
        editNpcSkill,
        removeNpcSkill,
        clearNpcSkills,
        renderNpcSkills,
        getNpcVitals,
        setNpcVitals,
        addNpcVital,
        confirmNpcVital,
        editNpcVital,
        removeNpcVital,
        clearNpcVitals,
        renderNpcVitals,
        evaluateFormula,
        parseStatValueAsNumber,
        updateVitalFormulasPreview,
        saveNpcCharacter,
        saveNpcTemplate,
        openNpcTemplateModal,
        updateModalModeUI,
        getModalMode: state.getModalMode,
        setModalMode: state.setModalMode,
        getNpcDescription,
        setNpcDescription,
        isDescriptionDrawerOpen,
        toggleDescriptionDrawer,
        resetNpcModalForm,
        getTraitsCounts,
        updateTraitsCounterUI,
        applyTemplate,
        removeAppliedTemplate,
        renderAppliedTemplates,
        getAppliedTemplates,
        setAppliedTemplates,
        clearAppliedTemplates,
        openTemplateDropdown,
        closeTemplateDropdown,
        toggleTemplateDropdown,
        isTemplateDropdownOpen,
        getAvailableTemplates,
    }

    if (ctx) {
        Object.assign(ctx, methods)
    }
    if (typeof window !== 'undefined') {
        Object.assign(window, methods)
    }

    return methods
}
