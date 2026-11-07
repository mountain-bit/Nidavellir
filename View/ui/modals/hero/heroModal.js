/**
 * Hero Creation & Editing Floating Window Controller (Facade)
 * Orchestrates window lifecycle, dragging interactions, avatar selection,
 * RPG mechanics, and narrative description drawer for the Player Character.
 */

import { t } from '../../../../dist/Utils/translate.js'
import { getHeroEditorInstance, getOrCreateHeroEditor } from '../../editor/index.js'
import { showUnsavedChangesModal } from '../confirm/confirmModal.js'
import { clampModalPosition, initDraggable, initResizable } from '../npc/npcDraggable.js'
import { saveHeroCharacter as saveHeroCharacterHelper } from './heroSaver.js'
import {
    addHeroCustomAttribute,
    addHeroInventory,
    addHeroSkill,
    addHeroStat,
    addHeroVital,
    initHeroAvatarGrid,
    initHeroTagsController,
    renderHeroCustomAttributes,
    renderHeroInventories,
    renderHeroSkills,
    renderHeroStats,
    renderHeroTags,
    renderHeroVitals,
    updateHeroSelectedAvatarPreview,
    updateHeroSkillStatDropdowns,
    updateHeroVitalFormulasPreview,
} from './heroSectionControllers.js'
import * as state from './heroState.js'

let activeCtx = null
let heroDocumentListenerBound = false
let heroKeydownListenerBound = false

export function getActiveHeroModal() {
    return state.getActiveModal() || document.getElementById('hero-create-modal')
}

export function isHeroModalOpen() {
    return state.getIsModalOpen()
}

/**
 * Toggles or explicitly sets expansion of the narrative description drawer.
 *
 * @param {boolean} [forceState]
 */
export function toggleHeroDescriptionDrawer(forceState) {
    const modal = getActiveHeroModal()
    const drawer = document.getElementById('hero-description-drawer')
    const arrow = document.getElementById('hero-desc-toggle-arrow')
    const btnToggle = document.getElementById('btn-toggle-hero-description')

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
            btnToggle.setAttribute('title', t('hero.collapse_narrative') || 'Zwiń panel narracyjny')
        }

        if (modal) {
            const drawerWidth = parseInt(drawer.style.width, 10) || drawer.offsetWidth || 460
            const currentWidth = parseInt(modal.style.width, 10) || modal.offsetWidth || 860
            modal.dataset.widthBeforeDrawer = String(currentWidth)

            const maxAllowedWidth =
                typeof window !== 'undefined' && window.innerWidth
                    ? Math.floor(window.innerWidth * 0.96)
                    : 1600
            const targetWidth = Math.min(currentWidth + drawerWidth, maxAllowedWidth)

            modal.style.width = `${targetWidth}px`

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
        drawer.classList.add('hidden')
        if (arrow) arrow.textContent = '›'
        if (btnToggle) {
            btnToggle.setAttribute('title', t('hero.expand_narrative') || 'Rozwiń panel narracyjny')
        }

        if (modal && modal.dataset.widthBeforeDrawer) {
            modal.style.width = `${modal.dataset.widthBeforeDrawer}px`
            delete modal.dataset.widthBeforeDrawer
            clampModalPosition(modal)
        }
    }
}

/**
 * Checks whether the hero form has unsaved modifications.
 *
 * @returns {boolean}
 */
export function hasUnsavedHeroChanges() {
    const nameInput = document.getElementById('hero-name-input')
    const summaryInput = document.getElementById('hero-summary-input')
    const editor = getHeroEditorInstance()
    const descTextarea = document.getElementById('hero-description-textarea')

    const currentDesc = editor ? editor.getMarkdown() : descTextarea ? descTextarea.value : ''

    const currentSnapshot = state.captureFormSnapshot(
        nameInput?.value || '',
        summaryInput?.value || '',
        currentDesc
    )

    return state.hasUnsavedChanges(currentSnapshot)
}

/**
 * Sets narrative description text in Hero rich editor and textarea.
 *
 * @param {string} text
 */
export function setHeroDescription(text = '') {
    const editor = getHeroEditorInstance()
    if (editor && typeof editor.setMarkdown === 'function') {
        editor.setMarkdown(text || '')
    } else if (editor && typeof editor.setContent === 'function') {
        editor.setContent(text || '')
    }
    const textarea = document.getElementById('hero-description-textarea')
    if (textarea) {
        textarea.value = text || ''
    }
}

/**
 * Opens and populates the Hero modal.
 *
 * @param {object} [options={}]
 */
export function openHeroModal(options = {}) {
    const modal = getActiveHeroModal()
    if (!modal) return

    const ctx =
        options.ctx || activeCtx || (typeof window !== 'undefined' ? window.appContext : null)

    const nameInput = document.getElementById('hero-name-input')
    const summaryInput = document.getElementById('hero-summary-input')
    const descTextarea = document.getElementById('hero-description-textarea')
    const errBox = document.getElementById('hero-create-error-message')

    if (errBox) errBox.classList.add('hidden')

    // Determine target entity: explicitly passed, or current project PlayerCharacter, or null
    let targetHero = options.editEntity || null
    if (!targetHero) {
        const potentialHero =
            ctx?.playerCharacter ||
            ctx?.projectData?.playerCharacter ||
            (ctx?.vm?.project?.getPlayerCharacter ? ctx.vm.project.getPlayerCharacter() : null) ||
            (Array.isArray(ctx?.playerCharacters) ? ctx.playerCharacters[0] : null) ||
            (Array.isArray(ctx?.projectData?.playerCharacters)
                ? ctx.projectData.playerCharacters[0]
                : null) ||
            (Array.isArray(ctx?.projectPlayerCharacters) ? ctx.projectPlayerCharacters[0] : null) ||
            (Array.isArray(ctx?.vm?.project?.getPlayerCharacters?.())
                ? ctx.vm.project.getPlayerCharacters()[0]
                : null)
        const potentialHeroName = potentialHero
            ? typeof potentialHero.getName === 'function'
                ? potentialHero.getName()
                : potentialHero.name || potentialHero.imie || ''
            : ''
        if (potentialHero && String(potentialHeroName).trim() !== '') {
            targetHero = potentialHero
        }
    }

    state.resetHeroState()

    const titleSpan = modal.querySelector('#hero-create-modal-title > span:first-child')
    const saveBtnSpan = document.getElementById('btn-save-hero-modal')?.querySelector('span')

    const tr = (key, fallback) => {
        const val = t(key)
        return val && val !== key ? val : fallback
    }

    if (targetHero) {
        state.setEditingHero(targetHero)

        if (titleSpan) titleSpan.textContent = tr('hero.edit_modal_title', 'Edycja Postaci Gracza')
        if (saveBtnSpan) saveBtnSpan.textContent = tr('hero.save_changes', 'Zapisz zmiany')

        const name = targetHero.getName ? targetHero.getName() : targetHero.name || ''
        const summary = targetHero.getSummary
            ? targetHero.getSummary()
            : targetHero.description?.summary || ''
        const avatar = targetHero.getAvatar ? targetHero.getAvatar() : targetHero.avatar || ''
        const narrativeText = targetHero.getDescription
            ? targetHero.getDescription().getText()
            : targetHero.description?.text || ''

        if (nameInput) nameInput.value = name
        if (summaryInput) summaryInput.value = summary
        if (descTextarea) descTextarea.value = narrativeText

        updateHeroSelectedAvatarPreview(avatar)

        // Custom attributes
        const customAttrs = targetHero.getCustomAttributes
            ? targetHero.getCustomAttributes()
            : targetHero.customAttributes || []
        state.setCustomAttributes(customAttrs)

        // Stats
        const stats = targetHero.getStats ? targetHero.getStats() : targetHero.stats || []
        state.setHeroStats(
            stats.map(s => {
                const sId = s.getId ? s.getId() : s.id || `stat_${Date.now()}`
                const sName = s.getName ? s.getName() : s.name || ''
                const matchingDef = (ctx?.projectStats || []).find(
                    p =>
                        (p.getId && p.getId() === sId) ||
                        (p.getName && p.getName().toLowerCase() === sName.toLowerCase())
                )
                return {
                    id: sId,
                    name: sName,
                    value: s.getValue ? s.getValue() : (s.value ?? 10),
                    statKind: s.getStatKind
                        ? s.getStatKind()
                        : matchingDef?.getStatKind
                          ? matchingDef.getStatKind()
                          : s.statKind || matchingDef?.statKind || 'numeric',
                    min: s.getMin
                        ? s.getMin()
                        : matchingDef?.getMin
                          ? matchingDef.getMin()
                          : (s.min ?? matchingDef?.min ?? null),
                    max: s.getMax
                        ? s.getMax()
                        : matchingDef?.getMax
                          ? matchingDef.getMax()
                          : (s.max ?? matchingDef?.max ?? null),
                    options: s.getOptions
                        ? s.getOptions()
                        : matchingDef?.getOptions
                          ? matchingDef.getOptions()
                          : s.options || matchingDef?.options || [],
                }
            })
        )

        // Vitals
        const vitals = targetHero.getParameters
            ? targetHero.getParameters()
            : targetHero.parameters || []
        state.setHeroVitals(
            vitals.map(v => ({
                id: v.getId ? v.getId() : v.id || `param_${Date.now()}`,
                name: v.getName ? v.getName() : v.name || '',
                mode: v.getMode ? v.getMode() : v.mode || 'direct',
                value: v.getValue ? v.getValue() : (v.value ?? 20),
                formula: v.getFormula ? v.getFormula() : v.formula || '',
                calculatedValue: v.getCalculatedValue
                    ? v.getCalculatedValue()
                    : (v.calculatedValue ?? null),
            }))
        )

        // Skills
        const skills = targetHero.getSkills ? targetHero.getSkills() : targetHero.skills || []
        state.setHeroSkills(
            skills.map(sk => ({
                id: sk.getId ? sk.getId() : sk.id || `skill_${Date.now()}`,
                name: sk.getName ? sk.getName() : sk.name || '',
                statName: sk.getStatName ? sk.getStatName() : sk.statName || '',
                value: sk.getValue ? sk.getValue() : sk.value || '+2',
            }))
        )

        // Tags
        const tags = targetHero.getTags ? targetHero.getTags() : targetHero.tags || []
        state.setHeroTags(tags)

        // Inventories
        const rawInvs = targetHero.getInventories
            ? targetHero.getInventories()
            : targetHero.inventories || []
        if (rawInvs.length > 0) {
            state.setHeroInventories(
                rawInvs.map(inv => ({
                    id: inv.getId ? inv.getId() : inv.id || `inv_${Date.now()}`,
                    name: inv.getName ? inv.getName() : inv.name || 'Główny plecak',
                    capacity:
                        typeof inv.getCapacity === 'function'
                            ? inv.getCapacity()
                            : (inv.capacity ?? 0),
                    items: (inv.getItems ? inv.getItems() : inv.items || []).map(it => ({
                        id: it.getId ? it.getId() : it.id || `item_${Date.now()}`,
                        name: it.getName ? it.getName() : it.name || String(it),
                    })),
                }))
            )
        } else {
            const legacyItems = targetHero.getItems ? targetHero.getItems() : targetHero.items || []
            if (legacyItems.length > 0) {
                state.setHeroInventories([
                    {
                        id: 'inv_default',
                        name: 'Główny plecak',
                        capacity: 0,
                        items: legacyItems.map(it => ({
                            id: it.getId ? it.getId() : it.id || `item_${Date.now()}`,
                            name: it.getName ? it.getName() : it.name || String(it),
                        })),
                    },
                ])
            } else {
                state.setHeroInventories([])
            }
        }

        // Set rich editor content
        getOrCreateHeroEditor(ctx)
        setHeroDescription(narrativeText)
    } else {
        // New Hero defaults
        state.setEditingHero(null)

        if (titleSpan) titleSpan.textContent = tr('hero.modal_title', 'Karta Postaci Gracza')
        if (saveBtnSpan) saveBtnSpan.textContent = tr('hero.btn_save', 'Zapisz bohatera')

        if (nameInput) nameInput.value = ''
        if (summaryInput) summaryInput.value = ''
        if (descTextarea) descTextarea.value = ''
        updateHeroSelectedAvatarPreview('')

        state.clearCustomAttributes()
        state.clearHeroTags()

        // Clean empty defaults for a new hero (no mocked or preset data)
        state.setHeroStats([])
        state.setHeroVitals([])
        state.setHeroSkills([])
        state.setHeroInventories([
            {
                id: 'inv_default',
                name: 'Główny plecak',
                capacity: 10,
                items: [],
            },
        ])

        getOrCreateHeroEditor(ctx)
        setHeroDescription('')
    }

    renderHeroCustomAttributes()
    renderHeroStats()
    renderHeroVitals()
    renderHeroSkills()
    renderHeroTags()
    renderHeroInventories()
    updateHeroVitalFormulasPreview()
    updateHeroSkillStatDropdowns()

    // Capture initial state snapshot
    const initialDesc = getHeroEditorInstance()
        ? getHeroEditorInstance().getMarkdown()
        : descTextarea?.value || ''
    state.setInitialSnapshot(
        state.captureFormSnapshot(nameInput?.value || '', summaryInput?.value || '', initialDesc)
    )

    // Show modal
    modal.classList.remove('hidden')
    state.setIsModalOpen(true)

    // Position modal centrally if not placed
    if (!modal.style.top || modal.style.top === '0px') {
        const top = Math.max(30, Math.floor((window.innerHeight - 620) / 2))
        const left = Math.max(40, Math.floor((window.innerWidth - 860) / 2))
        modal.style.top = `${top}px`
        modal.style.left = `${left}px`
    }
    clampModalPosition(modal)

    if (nameInput) {
        setTimeout(() => nameInput.focus(), 50)
    }
}

/**
 * Closes the Hero modal with unsaved changes verification.
 *
 * @param {boolean} [force=false]
 */
export async function closeHeroModal(force = false) {
    const modal = getActiveHeroModal()
    if (!modal) return

    if (!force && hasUnsavedHeroChanges()) {
        const choice = await showUnsavedChangesModal({
            title: typeof t === 'function' ? t('unsaved_changes.title') : 'Niezapisane zmiany',
            message:
                typeof t === 'function'
                    ? t('unsaved_changes.default_message')
                    : 'Czy na pewno chcesz wyjść? Masz niezapisane zmiany, które zostaną bezpowrotnie utracone.',
        })

        if (choice === 'save') {
            executeHeroModalSave()
            return
        } else if (choice === 'dont_save') {
            closeHeroModal(true)
            return
        } else {
            return
        }
    }

    modal.classList.add('hidden')
    state.setIsModalOpen(false)
    toggleHeroDescriptionDrawer(false)
    state.resetHeroState()
}

export function executeHeroModalSave() {
    const editor = getHeroEditorInstance()
    const descTextarea = document.getElementById('hero-description-textarea')
    const markdownDesc = editor ? editor.getMarkdown() : descTextarea?.value || ''

    return saveHeroCharacterHelper(activeCtx, {
        getDescription: () => markdownDesc,
        closeModal: () => closeHeroModal(true),
        resetForm: () => state.resetHeroState(),
    })
}

/**
 * Sets up the Hero creation floating window and its listeners.
 *
 * @param {object} [ctx] UI Context
 */
export function setupHeroModal(ctx) {
    activeCtx = ctx || null
    const modal = document.getElementById('hero-create-modal')
    if (!modal) return {}

    state.setActiveModal(modal)
    state.resetHeroState()

    const header = document.getElementById('hero-create-modal-header')
    const btnClose = document.getElementById('btn-close-hero-modal')
    const btnCancel = document.getElementById('btn-cancel-hero-modal')
    const btnSave = document.getElementById('btn-save-hero-modal')
    const form = document.getElementById('hero-create-modal-form')
    const resizer = document.getElementById('hero-modal-resizer')
    const btnToggleDesc = document.getElementById('btn-toggle-hero-description')

    // Drag and resize
    initDraggable(modal, header)
    if (resizer) {
        initResizable(modal, resizer, { minWidth: 700, minHeight: 520 })
    }

    // Avatar
    initHeroAvatarGrid()

    // Buttons in sections
    const btnAddAttr = document.getElementById('btn-add-hero-custom-attribute')
    if (btnAddAttr) {
        btnAddAttr.onclick = () => addHeroCustomAttribute('', '')
    }

    const btnAddStat = document.getElementById('btn-add-hero-stat')
    if (btnAddStat) {
        btnAddStat.onclick = () => addHeroStat('', 10)
    }

    const btnAddVital = document.getElementById('btn-add-hero-vital')
    if (btnAddVital) {
        btnAddVital.onclick = () => addHeroVital('', 'direct', 10, '')
    }

    const btnAddSkill = document.getElementById('btn-add-hero-skill')
    if (btnAddSkill) {
        btnAddSkill.onclick = () => addHeroSkill('', '', '')
    }

    const btnAddInventory = document.getElementById('btn-add-hero-inventory')
    if (btnAddInventory) {
        btnAddInventory.onclick = () => addHeroInventory()
    }

    // Tags
    initHeroTagsController(ctx)

    // Rich Editor
    getOrCreateHeroEditor(ctx)

    // Drawer toggle
    if (btnToggleDesc) {
        btnToggleDesc.onclick = e => {
            e.preventDefault()
            toggleHeroDescriptionDrawer()
        }
    }

    // Close actions
    if (btnClose) {
        btnClose.onclick = () => closeHeroModal()
    }
    if (btnCancel) {
        btnCancel.onclick = () => closeHeroModal()
    }

    // Save action
    if (form) {
        form.onsubmit = e => {
            e.preventDefault()
            executeHeroModalSave()
        }
    }
    if (btnSave) {
        btnSave.onclick = e => {
            e.preventDefault()
            executeHeroModalSave()
        }
    }

    // ESC key support (single binding guard)
    if (!heroKeydownListenerBound && typeof document !== 'undefined') {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && state.getIsModalOpen()) {
                const tagPopover = document.getElementById('hero-tag-picker-popover')
                if (tagPopover && !tagPopover.classList.contains('hidden')) {
                    tagPopover.classList.add('hidden')
                    return
                }
                closeHeroModal()
            }
        })
        heroKeydownListenerBound = true
    }

    // Triggers with [data-action="open-hero-modal"] (both direct and delegated)
    if (!heroDocumentListenerBound && typeof document !== 'undefined') {
        document.addEventListener('click', e => {
            const btn = e.target?.closest?.('[data-action="open-hero-modal"]')
            if (btn) {
                e.preventDefault()
                openHeroModal({ ctx: activeCtx })
            }
        })
        heroDocumentListenerBound = true
    }

    return {
        open: openHeroModal,
        close: closeHeroModal,
    }
}
