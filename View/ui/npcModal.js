/**
 * NPC Creation Floating Window Controller (Facade)
 * Orchestrates window lifecycle, dragging interactions, avatar selection,
 * form inputs, and narrative drawer, delegating sub-responsibilities to specialized modules.
 */

import { applyTranslations } from '../../dist/Utils/translate.js'
import { evaluateFormula, parseStatValueAsNumber } from './npcModal/formulaEvaluator.js'
import { saveNpcCharacter as saveNpcCharacterHelper } from './npcModal/npcCharacterSaver.js'
import { clampModalPosition, initDraggable, initResizable } from './npcModal/npcDraggable.js'
import {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcTag,
    addNpcVital,
    confirmCustomAttribute,
    confirmNpcSkill,
    confirmNpcStat,
    confirmNpcVital,
    editCustomAttribute,
    editNpcSkill,
    editNpcStat,
    editNpcVital,
    initAvatarGrid,
    initNpcTagsController,
    removeCustomAttribute,
    removeNpcSkill,
    removeNpcStat,
    removeNpcTag,
    removeNpcVital,
    renderCustomAttributes,
    renderDynamicSuggestions,
    renderNpcSkills,
    renderNpcStats,
    renderNpcTags,
    renderNpcVitals,
    updateSelectedAvatarPreview,
    updateSkillStatDropdowns,
    updateVitalFormulasPreview,
} from './npcModal/npcSectionControllers.js'
import * as state from './npcModal/npcState.js'

// Re-export pure domain & section helpers for 100% public API compatibility
export {
    addCustomAttribute,
    addNpcSkill,
    addNpcStat,
    addNpcTag,
    addNpcVital,
    confirmCustomAttribute,
    confirmNpcSkill,
    confirmNpcStat,
    confirmNpcVital,
    editCustomAttribute,
    editNpcSkill,
    editNpcStat,
    editNpcVital,
    evaluateFormula,
    initNpcTagsController,
    parseStatValueAsNumber,
    removeCustomAttribute,
    removeNpcSkill,
    removeNpcStat,
    removeNpcTag,
    removeNpcVital,
    renderCustomAttributes,
    renderDynamicSuggestions,
    renderNpcSkills,
    renderNpcStats,
    renderNpcTags,
    renderNpcVitals,
    updateSelectedAvatarPreview,
    updateSkillStatDropdowns,
    updateVitalFormulasPreview,
}

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
            btnToggle.setAttribute('title', 'Zwiń panel opisu narracyjnego')
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
            btnToggle.setAttribute('title', 'Rozwiń panel opisu narracyjnego')
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
 * Opens the NPC creation floating window.
 */
export function openNpcModal() {
    const modal = state.getActiveModal() || document.getElementById('npc-create-modal')
    if (!modal) return

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
 * Closes the NPC creation floating window.
 */
export function closeNpcModal() {
    const modal = state.getActiveModal() || document.getElementById('npc-create-modal')
    if (!modal) return

    const popover = document.getElementById('npc-avatar-picker-popover')
    if (popover) {
        popover.classList.add('hidden')
    }

    modal.classList.add('hidden')
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
    state.resetState()
    updateSelectedAvatarPreview('warrior')
    setNpcName('')
    setNpcSummary('')
    setNpcDescription('')
    renderCustomAttributes()
    renderNpcStats()
    renderNpcSkills()
    renderNpcVitals()
    renderNpcTags()

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
    return saveNpcCharacterHelper(ctx, {
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

    // Open when clicking "Dodaj" in left drawer
    if (btnAddCharacter) {
        btnAddCharacter.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            openNpcModal()
        })
    }

    // Open when clicking any trigger with data-action="open-npc-modal"
    document.querySelectorAll('[data-action="open-npc-modal"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            openNpcModal()
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
    }
    state.setGlobalOutsideClickHandler(outsideClickHandler)
    document.addEventListener('click', outsideClickHandler)

    // Safely attach single Escape key listener (first closes popover if open, then modal)
    const prevKeydownHandler = state.getGlobalKeydownHandler()
    if (prevKeydownHandler) {
        document.removeEventListener('keydown', prevKeydownHandler)
    }
    const keydownHandler = e => {
        if (e.key === 'Escape') {
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
    if (btnSave) {
        btnSave.addEventListener('click', e => {
            e.preventDefault()
            saveNpcCharacter(ctx)
        })
    }
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault()
            saveNpcCharacter(ctx)
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
        getNpcDescription,
        setNpcDescription,
        isDescriptionDrawerOpen,
        toggleDescriptionDrawer,
        resetNpcModalForm,
    }

    if (ctx) {
        Object.assign(ctx, methods)
    }
    if (typeof window !== 'undefined') {
        Object.assign(window, methods)
    }

    return methods
}
