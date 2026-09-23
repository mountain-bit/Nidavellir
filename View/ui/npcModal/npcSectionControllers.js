/**
 * Section controllers for NPC Creation Window.
 * Manages DOM rendering, input bindings, and event handling for
 * Avatars, Custom Attributes, Stats, Skills, and Vitals.
 */

import { FANTASY_AVATARS, getAvatarById } from '../npcAvatars.js'
import { evaluateFormula } from './formulaEvaluator.js'
import * as state from './npcState.js'
import {
    renderAttributeRowHtml,
    renderAvatarGridItemHtml,
    renderSkillRowHtml,
    renderSkillStatOptionsHtml,
    renderStatRowHtml,
    renderVitalPreviewBadgeHtml,
    renderVitalRowHtml,
} from './npcTemplates.js'

// ==========================================
// 1. Avatar Picker Section
// ==========================================

/**
 * Updates the preview trigger icon with the given avatar.
 *
 * @param {string} avatarId
 */
export function updateSelectedAvatarPreview(avatarId) {
    const avatar = getAvatarById(avatarId)
    state.setCurrentAvatarId(avatar.id)

    const previewContainer = document.getElementById('npc-selected-avatar-preview')
    const triggerBtn = document.getElementById('btn-npc-avatar-trigger')

    if (previewContainer) {
        previewContainer.innerHTML = avatar.svg
        previewContainer.style.color = avatar.color
    }

    if (triggerBtn) {
        triggerBtn.style.backgroundColor = avatar.bgColor
        triggerBtn.style.borderColor = avatar.borderColor
        triggerBtn.setAttribute('title', `${avatar.name} (${avatar.category})`)
    }

    // Update active highlight in avatar picker grid if rendered
    const grid = document.getElementById('npc-avatar-grid')
    if (grid) {
        grid.querySelectorAll('[data-avatar-id]').forEach(card => {
            const isSelected = card.dataset.avatarId === avatar.id
            card.classList.toggle('ring-2', isSelected)
            card.classList.toggle('ring-blue-400', isSelected)
            card.classList.toggle('bg-[#27272a]', isSelected)
        })
    }
}

/**
 * Populates the avatar selection grid with fantasy class archetypes.
 */
export function initAvatarGrid() {
    const grid = document.getElementById('npc-avatar-grid')
    const popover = document.getElementById('npc-avatar-picker-popover')
    const triggerBtn = document.getElementById('btn-npc-avatar-trigger')

    if (!grid) return

    grid.innerHTML = FANTASY_AVATARS.map(avatar => renderAvatarGridItemHtml(avatar)).join('')

    grid.querySelectorAll('[data-avatar-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const avatarId = btn.dataset.avatarId
            if (avatarId) {
                updateSelectedAvatarPreview(avatarId)
            }
            if (popover) {
                popover.classList.add('hidden')
            }
        })
    })

    if (triggerBtn && popover) {
        triggerBtn.addEventListener('click', e => {
            e.stopPropagation()
            popover.classList.toggle('hidden')
        })
    }

    // Set initial preview
    updateSelectedAvatarPreview(state.getCurrentAvatarId())
}

// ==========================================
// ==========================================
// Helper: Focus field after entering edit mode
// ==========================================

function focusRowField(rowSelector, idAttr, idVal, primaryField, fallbackField) {
    const row = document.querySelector(`${rowSelector}[${idAttr}="${idVal}"]`)
    if (!row) return
    const fallbackInput = fallbackField
        ? row.querySelector(
              `[data-attr-field="${fallbackField}"], [data-stat-field="${fallbackField}"], [data-skill-field="${fallbackField}"], [data-vital-field="${fallbackField}"]`
          )
        : null
    const primaryInput = primaryField
        ? row.querySelector(
              `[data-attr-field="${primaryField}"], [data-stat-field="${primaryField}"], [data-skill-field="${primaryField}"], [data-vital-field="${primaryField}"]`
          )
        : null

    if (fallbackInput && !fallbackInput.value.trim()) {
        fallbackInput.focus()
    } else if (primaryInput && typeof primaryInput.focus === 'function') {
        primaryInput.focus()
        if (typeof primaryInput.select === 'function') primaryInput.select()
    } else if (fallbackInput && typeof fallbackInput.focus === 'function') {
        fallbackInput.focus()
    }
}

// ==========================================
// 2. Custom Attributes Section
// ==========================================

/**
 * Confirms edit mode for a custom attribute and renders read mode.
 *
 * @param {string} id
 */
export function confirmCustomAttribute(id) {
    const targetAttr = state.findCustomAttribute(id)
    if (targetAttr) {
        targetAttr.isEditing = false
        renderCustomAttributes()
    }
}

/**
 * Switches a custom attribute to edit mode.
 *
 * @param {string} id
 */
export function editCustomAttribute(id) {
    const targetAttr = state.findCustomAttribute(id)
    if (targetAttr) {
        targetAttr.isEditing = true
        renderCustomAttributes()
        focusRowField('.npc-attribute-row', 'data-attr-id', id, 'value', 'name')
    }
}

/**
 * Renders the custom attributes list.
 */
export function renderCustomAttributes() {
    const listContainer = document.getElementById('npc-custom-attributes-list')
    const emptyNotice = document.getElementById('npc-custom-attributes-empty')

    if (!listContainer) return

    const customAttributes = state.getCustomAttributesArray()

    if (customAttributes.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    listContainer.innerHTML = customAttributes.map(attr => renderAttributeRowHtml(attr)).join('')

    // Attach row listeners
    listContainer.querySelectorAll('.npc-attribute-row').forEach(row => {
        const attrId = row.dataset.attrId
        const nameInput = row.querySelector('[data-attr-field="name"]')
        const valInput = row.querySelector('[data-attr-field="value"]')
        const confirmBtn = row.querySelector('[data-action="confirm-attribute"]')
        const editBtn = row.querySelector('[data-action="edit-attribute"]')
        const removeBtn = row.querySelector('[data-action="remove-attribute"]')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                const targetAttr = state.findCustomAttribute(attrId)
                if (targetAttr) targetAttr.name = e.target.value
            })
            nameInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmCustomAttribute(attrId)
                }
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                const targetAttr = state.findCustomAttribute(attrId)
                if (targetAttr) targetAttr.value = e.target.value
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmCustomAttribute(attrId)
                }
            })
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', e => {
                e.preventDefault()
                confirmCustomAttribute(attrId)
            })
        }

        if (editBtn) {
            editBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                editCustomAttribute(attrId)
            })
        }

        // Clicking the read row enters edit mode
        if (row.dataset.state === 'read') {
            row.addEventListener('click', e => {
                if (!e.target.closest('button')) {
                    editCustomAttribute(attrId)
                }
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                removeCustomAttribute(attrId)
            })
        }
    })
}

/**
 * Adds a new custom attribute row.
 *
 * @param {string} [name='']
 * @param {string} [value='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string} ID of created attribute
 */
export function addCustomAttribute(name = '', value = '', shouldFocusValue = false) {
    const id = state.addCustomAttributeState(name, value, true)
    renderCustomAttributes()

    const newRow = document.querySelector(`.npc-attribute-row[data-attr-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const valInput = newRow.querySelector('[data-attr-field="value"]')
            if (valInput && typeof valInput.focus === 'function') valInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-attr-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes custom attribute by ID.
 *
 * @param {string} id
 */
export function removeCustomAttribute(id) {
    state.removeCustomAttributeState(id)
    renderCustomAttributes()
}

// ==========================================
// 3. Stats Section
// ==========================================

/**
 * Confirms edit mode for a stat row and switches to read mode.
 *
 * @param {string} id
 */
export function confirmNpcStat(id) {
    const targetStat = state.findNpcStat(id)
    if (targetStat) {
        targetStat.isEditing = false
        renderNpcStats()
        updateSkillStatDropdowns()
        updateVitalFormulasPreview()
    }
}

/**
 * Switches a stat row to edit mode.
 *
 * @param {string} id
 */
export function editNpcStat(id) {
    const targetStat = state.findNpcStat(id)
    if (targetStat) {
        targetStat.isEditing = true
        renderNpcStats()
        focusRowField('.npc-stat-row', 'data-stat-id', id, 'value', 'name')
    }
}

/**
 * Renders the stats list.
 */
export function renderNpcStats() {
    const listContainer = document.getElementById('npc-stats-list')
    const emptyNotice = document.getElementById('npc-stats-empty')

    if (!listContainer) return

    const npcStats = state.getNpcStatsArray()

    if (npcStats.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    listContainer.innerHTML = npcStats.map(stat => renderStatRowHtml(stat)).join('')

    listContainer.querySelectorAll('.npc-stat-row').forEach(row => {
        const statId = row.dataset.statId
        const nameInput = row.querySelector('[data-stat-field="name"]')
        const valInput = row.querySelector('[data-stat-field="value"]')
        const confirmBtn = row.querySelector('[data-action="confirm-stat"]')
        const editBtn = row.querySelector('[data-action="edit-stat"]')
        const removeBtn = row.querySelector('[data-action="remove-stat"]')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                const targetStat = state.findNpcStat(statId)
                if (targetStat) {
                    targetStat.name = e.target.value
                    updateSkillStatDropdowns()
                    updateVitalFormulasPreview()
                }
            })
            nameInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcStat(statId)
                }
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                const targetStat = state.findNpcStat(statId)
                if (targetStat) {
                    targetStat.value = e.target.value
                    updateVitalFormulasPreview()
                }
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcStat(statId)
                }
            })
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', e => {
                e.preventDefault()
                confirmNpcStat(statId)
            })
        }

        if (editBtn) {
            editBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                editNpcStat(statId)
            })
        }

        // Clicking the read row enters edit mode
        if (row.dataset.state === 'read') {
            row.addEventListener('click', e => {
                if (!e.target.closest('button')) {
                    editNpcStat(statId)
                }
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                removeNpcStat(statId)
            })
        }
    })
}

/**
 * Adds a new stat row.
 *
 * @param {string} [name='']
 * @param {string} [value='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string}
 */
export function addNpcStat(name = '', value = '', shouldFocusValue = false) {
    const id = state.addNpcStatState(name, value, true)
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()

    const newRow = document.querySelector(`.npc-stat-row[data-stat-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const valInput = newRow.querySelector('[data-stat-field="value"]')
            if (valInput && typeof valInput.focus === 'function') valInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-stat-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes stat row by ID.
 *
 * @param {string} id
 */
export function removeNpcStat(id) {
    state.removeNpcStatState(id)
    renderNpcStats()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
}

// ==========================================
// 4. Skills Section
// ==========================================

/**
 * Confirms edit mode for a skill row and switches to read mode.
 *
 * @param {string} id
 */
export function confirmNpcSkill(id) {
    const targetSkill = state.findNpcSkill(id)
    if (targetSkill) {
        targetSkill.isEditing = false
        renderNpcSkills()
    }
}

/**
 * Switches a skill row to edit mode.
 *
 * @param {string} id
 */
export function editNpcSkill(id) {
    const targetSkill = state.findNpcSkill(id)
    if (targetSkill) {
        targetSkill.isEditing = true
        renderNpcSkills()
        focusRowField(
            '.npc-skill-row',
            'data-skill-id',
            id,
            targetSkill.mode === 'stat_mod' ? 'modifier' : 'value',
            'name'
        )
    }
}

/**
 * Updates `<select data-skill-field="statName">` in all skill rows without destroying DOM focus.
 */
export function updateSkillStatDropdowns() {
    const availableStats = state.getAvailableStatNames()
    const npcSkills = state.getNpcSkillsArray()

    document.querySelectorAll('.npc-skill-row').forEach(row => {
        const select = row.querySelector('[data-skill-field="statName"]')
        if (!select) return
        const currentSelected = select.value
        const skillId = row.dataset.skillId
        const targetSkill = npcSkills.find(s => s.id === skillId)
        const selectedValue = targetSkill ? targetSkill.statName : currentSelected

        select.innerHTML = renderSkillStatOptionsHtml(availableStats, selectedValue)
        select.value = selectedValue
    })
}

/**
 * Renders the skills list.
 */
export function renderNpcSkills() {
    const listContainer = document.getElementById('npc-skills-list')
    const emptyNotice = document.getElementById('npc-skills-empty')

    if (!listContainer) return

    const npcSkills = state.getNpcSkillsArray()

    if (npcSkills.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    const availableStats = state.getAvailableStatNames()

    listContainer.innerHTML = npcSkills
        .map(skill => renderSkillRowHtml(skill, availableStats))
        .join('')

    // Attach row input listeners
    listContainer.querySelectorAll('.npc-skill-row').forEach(row => {
        const skillId = row.dataset.skillId
        const targetSkill = state.findNpcSkill(skillId)
        if (!targetSkill) return

        const nameInput = row.querySelector('[data-skill-field="name"]')
        const modeSelect = row.querySelector('[data-skill-field="mode"]')
        const valInput = row.querySelector('[data-skill-field="value"]')
        const statSelect = row.querySelector('[data-skill-field="statName"]')
        const modInput = row.querySelector('[data-skill-field="modifier"]')
        const confirmBtn = row.querySelector('[data-action="confirm-skill"]')
        const editBtn = row.querySelector('[data-action="edit-skill"]')
        const removeBtn = row.querySelector('[data-action="remove-skill"]')
        const directBox = row.querySelector('.skill-direct-mode-container')
        const statModBox = row.querySelector('.skill-stat-mod-container')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                targetSkill.name = e.target.value
            })
            nameInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcSkill(skillId)
                }
            })
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', e => {
                targetSkill.mode = e.target.value
                const isMod = targetSkill.mode === 'stat_mod'
                if (directBox) directBox.classList.toggle('hidden', isMod)
                if (statModBox) statModBox.classList.toggle('hidden', !isMod)
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                targetSkill.value = e.target.value
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcSkill(skillId)
                }
            })
        }

        if (statSelect) {
            if (targetSkill.statName) {
                statSelect.value = targetSkill.statName
            }
            statSelect.addEventListener('change', e => {
                targetSkill.statName = e.target.value
            })
        }

        if (modInput) {
            modInput.addEventListener('input', e => {
                targetSkill.modifier = e.target.value
            })
            modInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcSkill(skillId)
                }
            })
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', e => {
                e.preventDefault()
                confirmNpcSkill(skillId)
            })
        }

        if (editBtn) {
            editBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                editNpcSkill(skillId)
            })
        }

        // Clicking the read row enters edit mode
        if (row.dataset.state === 'read') {
            row.addEventListener('click', e => {
                if (!e.target.closest('button')) {
                    editNpcSkill(skillId)
                }
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                removeNpcSkill(skillId)
            })
        }
    })
}

/**
 * Adds a new skill row.
 *
 * @param {string} [name='']
 * @param {'direct'|'stat_mod'} [mode='direct']
 * @param {string} [value='']
 * @param {string} [statName='']
 * @param {string} [modifier='']
 * @returns {string}
 */
export function addNpcSkill(name = '', mode = 'direct', value = '', statName = '', modifier = '') {
    const id = state.addNpcSkillState(name, mode, value, statName, modifier, true)
    renderNpcSkills()

    const newRow = document.querySelector(`.npc-skill-row[data-skill-id="${id}"]`)
    if (newRow) {
        const nameInput = newRow.querySelector('[data-skill-field="name"]')
        if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
    }

    return id
}

/**
 * Removes skill row by ID.
 *
 * @param {string} id
 */
export function removeNpcSkill(id) {
    state.removeNpcSkillState(id)
    renderNpcSkills()
}

// ==========================================
// 5. Vitals Section
// ==========================================

/**
 * Confirms edit mode for a vital row and switches to read mode.
 *
 * @param {string} id
 */
export function confirmNpcVital(id) {
    const targetVital = state.findNpcVital(id)
    if (targetVital) {
        targetVital.isEditing = false
        renderNpcVitals()
    }
}

/**
 * Switches a vital row to edit mode.
 *
 * @param {string} id
 */
export function editNpcVital(id) {
    const targetVital = state.findNpcVital(id)
    if (targetVital) {
        targetVital.isEditing = true
        renderNpcVitals()
        focusRowField(
            '.npc-vital-row',
            'data-vital-id',
            id,
            targetVital.mode === 'formula' ? 'formula' : 'value',
            'name'
        )
    }
}

/**
 * Updates live preview badges for all vital rows in formula mode.
 */
export function updateVitalFormulasPreview() {
    const statsMap = state.getStatsMap()
    const npcVitals = state.getNpcVitalsArray()

    document.querySelectorAll('.npc-vital-row').forEach(row => {
        const vitalId = row.dataset.vitalId
        const targetVital = npcVitals.find(v => v.id === vitalId)
        if (!targetVital || targetVital.mode !== 'formula') return

        const previewSlot = row.querySelector('.vital-preview-slot')
        if (!previewSlot) return

        const formula = targetVital.formula || ''
        const calc = formula.trim() ? evaluateFormula(formula, statsMap) : null
        previewSlot.innerHTML = renderVitalPreviewBadgeHtml(calc, true, formula)
    })
}

/**
 * Renders the vitals list.
 */
export function renderNpcVitals() {
    const listContainer = document.getElementById('npc-vitals-list')
    const emptyNotice = document.getElementById('npc-vitals-empty')

    if (!listContainer) return

    const npcVitals = state.getNpcVitalsArray()

    if (npcVitals.length === 0) {
        listContainer.innerHTML = ''
        if (emptyNotice) emptyNotice.classList.remove('hidden')
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    const statsMap = state.getStatsMap()

    listContainer.innerHTML = npcVitals
        .map(vital => renderVitalRowHtml(vital, statsMap, evaluateFormula))
        .join('')

    // Attach listeners
    listContainer.querySelectorAll('.npc-vital-row').forEach(row => {
        const vitalId = row.dataset.vitalId
        const targetVital = state.findNpcVital(vitalId)
        if (!targetVital) return

        const nameInput = row.querySelector('[data-vital-field="name"]')
        const modeSelect = row.querySelector('[data-vital-field="mode"]')
        const valInput = row.querySelector('[data-vital-field="value"]')
        const formulaInput = row.querySelector('[data-vital-field="formula"]')
        const confirmBtn = row.querySelector('[data-action="confirm-vital"]')
        const editBtn = row.querySelector('[data-action="edit-vital"]')
        const removeBtn = row.querySelector('[data-action="remove-vital"]')
        const directBox = row.querySelector('.vital-direct-container')
        const formulaBox = row.querySelector('.vital-formula-container')

        if (nameInput) {
            nameInput.addEventListener('input', e => {
                targetVital.name = e.target.value
            })
            nameInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcVital(vitalId)
                }
            })
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', e => {
                targetVital.mode = e.target.value
                const isForm = targetVital.mode === 'formula'
                if (directBox) directBox.classList.toggle('hidden', isForm)
                if (formulaBox) formulaBox.classList.toggle('hidden', !isForm)
                updateVitalFormulasPreview()
            })
        }

        if (valInput) {
            valInput.addEventListener('input', e => {
                targetVital.value = e.target.value
            })
            valInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcVital(vitalId)
                }
            })
        }

        if (formulaInput) {
            formulaInput.addEventListener('input', e => {
                targetVital.formula = e.target.value
                updateVitalFormulasPreview()
            })
            formulaInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmNpcVital(vitalId)
                }
            })
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', e => {
                e.preventDefault()
                confirmNpcVital(vitalId)
            })
        }

        if (editBtn) {
            editBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                editNpcVital(vitalId)
            })
        }

        // Clicking the read row enters edit mode
        if (row.dataset.state === 'read') {
            row.addEventListener('click', e => {
                if (!e.target.closest('button')) {
                    editNpcVital(vitalId)
                }
            })
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', e => {
                e.preventDefault()
                e.stopPropagation()
                removeNpcVital(vitalId)
            })
        }
    })
}

/**
 * Adds a new vital row.
 *
 * @param {string} [name='']
 * @param {'direct'|'formula'} [mode='direct']
 * @param {string} [value='']
 * @param {string} [formula='']
 * @param {boolean} [shouldFocusValue=false]
 * @returns {string}
 */
export function addNpcVital(
    name = '',
    mode = 'direct',
    value = '',
    formula = '',
    shouldFocusValue = false
) {
    const id = state.addNpcVitalState(name, mode, value, formula, true)
    renderNpcVitals()

    const newRow = document.querySelector(`.npc-vital-row[data-vital-id="${id}"]`)
    if (newRow) {
        if (shouldFocusValue) {
            const targetInput =
                mode === 'formula'
                    ? newRow.querySelector('[data-vital-field="formula"]')
                    : newRow.querySelector('[data-vital-field="value"]')
            if (targetInput && typeof targetInput.focus === 'function') targetInput.focus()
        } else {
            const nameInput = newRow.querySelector('[data-vital-field="name"]')
            if (nameInput && typeof nameInput.focus === 'function') nameInput.focus()
        }
    }

    return id
}

/**
 * Removes vital row by ID.
 *
 * @param {string} id
 */
export function removeNpcVital(id) {
    state.removeNpcVitalState(id)
    renderNpcVitals()
}
