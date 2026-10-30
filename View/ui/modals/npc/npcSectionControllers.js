/**
 * Section controllers for NPC Creation Window.
 * Manages DOM rendering, input bindings, and event handling for
 * Avatars, Custom Attributes, Stats, Skills, and Vitals.
 */

import { isCustomAvatarPath } from '../../../../dist/Utils/assetUtils.js'
import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    importDroppedImage,
    pickProjectImage,
    setupElementDropZone,
} from '../../assets/assetPicker.js'
import { openImageEditor } from '../../assets/imageEditorModal.js'
import { FANTASY_AVATARS, getAvatarById } from '../../common/npcAvatars.js'
import { getNpcEditorInstance, updateNpcEditorStats } from '../../editor/npcEditor.js'
import { evaluateFormula } from './formulaEvaluator.js'
import * as state from './npcState.js'
import {
    renderAppliedTemplateChipHtml,
    renderAttributeRowHtml,
    renderAvailableTagItemHtml,
    renderAvatarGridItemHtml,
    renderNpcTagChipHtml,
    renderSkillRowHtml,
    renderSkillStatOptionsHtml,
    renderStatRowHtml,
    renderSuggestedChipHtml,
    renderTemplateDropdownItemHtml,
    renderVitalPreviewBadgeHtml,
    renderVitalRowHtml,
} from './npcTemplates.js'
import { updateTraitsCounterUI } from './npcTraitsCounter.js'
import { mergeTemplateIntoModalState } from './templateMerger.js'

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
            card.classList.toggle('ring-[#5b738e]', isSelected)
            card.classList.toggle('bg-[#24262b]', isSelected)
        })
    }
}

/**
 * Populates the avatar selection grid with fantasy class archetypes and binds upload / drop interactions.
 *
 * @param {object} [ctx] Application UI Context
 */
export function initAvatarGrid(ctx) {
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

        triggerBtn.addEventListener('dblclick', e => {
            const currentId = state.getCurrentAvatarId()
            if (isCustomAvatarPath(currentId)) {
                e.preventDefault()
                e.stopPropagation()
                if (popover) popover.classList.add('hidden')
                openImageEditor(ctx, {
                    src: currentId,
                    onSave: ({ relativePath }) => {
                        updateSelectedAvatarPreview(relativePath)
                    },
                })
            }
        })

        // Drag & drop directly onto the portrait trigger frame
        setupElementDropZone(triggerBtn, {
            highlightClass: 'ring-2 ring-[#5b738e] bg-[#3d4e61]/25 scale-[1.02]',
            onFileDrop: async file => {
                const imported = await importDroppedImage(file, ctx, 'npc')
                if (imported && imported.relativePath) {
                    updateSelectedAvatarPreview(imported.relativePath)
                    if (popover) popover.classList.add('hidden')
                    toast.success(t('npc.avatar_updated') || 'Portret został zaktualizowany')
                }
            },
        })

        // Drag & drop onto the popover
        setupElementDropZone(popover, {
            highlightClass: 'ring-2 ring-[#5b738e] bg-[#3d4e61]/20',
            onFileDrop: async file => {
                const imported = await importDroppedImage(file, ctx, 'npc')
                if (imported && imported.relativePath) {
                    updateSelectedAvatarPreview(imported.relativePath)
                    popover.classList.add('hidden')
                    toast.success(t('npc.avatar_updated') || 'Portret został zaktualizowany')
                }
            },
        })
    }

    const uploadBtn = document.getElementById('btn-npc-upload-custom-avatar')
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async e => {
            e.stopPropagation()
            try {
                const res = await pickProjectImage(ctx, 'npc')
                if (res && res.relativePath) {
                    updateSelectedAvatarPreview(res.relativePath)
                    if (popover) {
                        popover.classList.add('hidden')
                    }
                    toast.success(t('npc.avatar_updated') || 'Portret został zaktualizowany')
                }
            } catch (err) {
                console.error('Error importing custom avatar:', err)
                toast.error(t('asset.error.import_failed'), t('asset.error.title'))
            }
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
        updateTraitsCounterUI()
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

    updateTraitsCounterUI()
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
        updateTraitsCounterUI()
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

    updateTraitsCounterUI()
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
        updateTraitsCounterUI()
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

    updateTraitsCounterUI()
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
        const row = document.querySelector(`.npc-vital-row[data-vital-id="${id}"]`)
        if (row) {
            const nameInput = row.querySelector('[data-vital-field="name"]')
            const modeSelect = row.querySelector('[data-vital-field="mode"]')
            const valInput = row.querySelector('[data-vital-field="value"]')
            const formulaInput = row.querySelector('[data-vital-field="formula"]')
            if (nameInput) targetVital.name = nameInput.value
            if (modeSelect) targetVital.mode = modeSelect.value
            if (valInput) targetVital.value = valInput.value
            if (formulaInput) targetVital.formula = formulaInput.value
        }
        targetVital.isEditing = false
        renderNpcVitals()
    }
}

/**
 * Synchronizes all currently active/open input fields from the DOM into the internal state.
 * Ensures that values being typed without blurring or pressing Enter are not lost when clicking Save.
 */
export function syncActiveModalInputs() {
    // 1. Sync vitals
    document.querySelectorAll('.npc-vital-row').forEach(row => {
        const vitalId = row.dataset.vitalId
        const vital = state.findNpcVital(vitalId)
        if (!vital) return

        const nameInput = row.querySelector('[data-vital-field="name"]')
        const modeSelect = row.querySelector('[data-vital-field="mode"]')
        const valInput = row.querySelector('[data-vital-field="value"]')
        const formulaInput = row.querySelector('[data-vital-field="formula"]')

        if (nameInput) vital.name = nameInput.value
        if (modeSelect) vital.mode = modeSelect.value
        if (valInput) vital.value = valInput.value
        if (formulaInput) vital.formula = formulaInput.value
    })

    // 2. Sync stats
    document.querySelectorAll('.npc-stat-row').forEach(row => {
        const statId = row.dataset.statId
        const stat = state.findNpcStat(statId)
        if (!stat) return

        const nameInput = row.querySelector('[data-stat-field="name"]')
        const valInput = row.querySelector('[data-stat-field="value"]')

        if (nameInput) stat.name = nameInput.value
        if (valInput) stat.value = valInput.value
    })

    // 3. Sync skills
    document.querySelectorAll('.npc-skill-row').forEach(row => {
        const skillId = row.dataset.skillId
        const skill = state.findNpcSkill(skillId)
        if (!skill) return

        const nameInput = row.querySelector('[data-skill-field="name"]')
        const modeSelect = row.querySelector('[data-skill-field="mode"]')
        const valInput = row.querySelector('[data-skill-field="value"]')
        const statSelect = row.querySelector('[data-skill-field="statName"]')
        const modInput = row.querySelector('[data-skill-field="modifier"]')

        if (nameInput) skill.name = nameInput.value
        if (modeSelect) skill.mode = modeSelect.value
        if (valInput) skill.value = valInput.value
        if (statSelect) skill.statName = statSelect.value
        if (modInput) skill.modifier = modInput.value
    })

    // 4. Sync custom attributes
    document.querySelectorAll('.npc-custom-attr-row').forEach(row => {
        const attrId = row.dataset.attrId
        const attr = state.findCustomAttribute(attrId)
        if (!attr) return

        const nameInput = row.querySelector('[data-attr-field="name"]')
        const valInput = row.querySelector('[data-attr-field="value"]')

        if (nameInput) attr.name = nameInput.value
        if (valInput) attr.value = valInput.value
    })
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
        updateTraitsCounterUI()
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
            nameInput.addEventListener('change', e => {
                targetVital.name = e.target.value
            })
            nameInput.addEventListener('blur', e => {
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
            valInput.addEventListener('change', e => {
                targetVital.value = e.target.value
            })
            valInput.addEventListener('blur', e => {
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
            formulaInput.addEventListener('change', e => {
                targetVital.formula = e.target.value
                updateVitalFormulasPreview()
            })
            formulaInput.addEventListener('blur', e => {
                targetVital.formula = e.target.value
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

    updateTraitsCounterUI()
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

// ==========================================
// 6. Tags Section Controller
// ==========================================

/**
 * Renders the assigned character tags list.
 */
export function renderNpcTags() {
    const list = document.getElementById('npc-tags-list')
    const empty = document.getElementById('npc-tags-empty')
    if (!list) return

    const tags = state.getNpcTags()
    if (tags.length === 0) {
        list.innerHTML = ''
        if (empty) empty.classList.remove('hidden')
        return
    }

    if (empty) empty.classList.add('hidden')
    list.innerHTML = tags.map(t => renderNpcTagChipHtml(t)).join('')

    list.querySelectorAll('[data-action="remove-npc-tag"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            const tagId = btn.dataset.tagId
            if (tagId) {
                removeNpcTag(tagId)
            }
        })
    })
}

/**
 * Adds a tag to the NPC state and refreshes UI.
 *
 * @param {string|object} tagOrName
 * @param {string} [color='#3b82f6']
 * @returns {string|null}
 */
export function addNpcTag(tagOrName, color = '#3b82f6') {
    const id = state.addNpcTagState(tagOrName, color)
    renderNpcTags()
    updateAvailableTagsList()
    return id
}

/**
 * Removes a tag by id or name and refreshes UI.
 *
 * @param {string} idOrName
 */
export function removeNpcTag(idOrName) {
    state.removeNpcTagState(idOrName)
    renderNpcTags()
    updateAvailableTagsList()
}

/**
 * Updates the popover list of available project tags.
 *
 * @param {string} [filterQuery='']
 */
export function updateAvailableTagsList(filterQuery = '') {
    const container = document.getElementById('npc-available-tags-list')
    if (!container) return

    const ctx = state.getActiveCtx() || {}
    let allTags = []
    if (Array.isArray(ctx.projectTags)) {
        allTags = ctx.projectTags
    } else if (ctx.vm?.project && typeof ctx.vm.project.getTags === 'function') {
        allTags = ctx.vm.project.getTags()
    }

    const query = (filterQuery || '').trim().toLowerCase()
    const currentTags = state.getNpcTags()
    const currentNames = new Set(currentTags.map(t => (t.name || '').toLowerCase()))

    const filtered = allTags.filter(t => {
        const name = (typeof t.getName === 'function' ? t.getName() : t.name || '').toLowerCase()
        return !query || name.includes(query)
    })

    if (filtered.length === 0) {
        container.innerHTML = `<span class="text-[10px] text-zinc-500 italic p-1">${t('npc.no_existing_tags')}</span>`
    } else {
        container.innerHTML = filtered
            .map(tag => {
                const tagObj = {
                    id: typeof tag.getId === 'function' ? tag.getId() : tag.id,
                    name: typeof tag.getName === 'function' ? tag.getName() : tag.name,
                    color: typeof tag.getColor === 'function' ? tag.getColor() : tag.color,
                }
                const isSelected = currentNames.has((tagObj.name || '').toLowerCase())
                return renderAvailableTagItemHtml(tagObj, isSelected)
            })
            .join('')

        container.querySelectorAll('[data-action="select-available-tag"]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault()
                const name = btn.dataset.tagName
                const color = btn.dataset.tagColor
                const id = btn.dataset.tagId
                if (name) {
                    addNpcTag({ id, name, color })
                }
            })
        })
    }

    // Update create new tag action inside popover
    const createAction = document.getElementById('npc-create-tag-action')
    const previewName = document.getElementById('npc-new-tag-preview-name')
    if (createAction && previewName) {
        const trimmed = (filterQuery || '').trim()
        if (
            trimmed &&
            !allTags.some(t => {
                const n = (
                    typeof t.getName === 'function' ? t.getName() : t.name || ''
                ).toLowerCase()
                return n === trimmed.toLowerCase()
            })
        ) {
            createAction.classList.remove('hidden')
            previewName.textContent = `"${trimmed}"`
        } else {
            createAction.classList.add('hidden')
        }
    }
}

/**
 * Initializes the NPC character tags controller and popover listeners.
 */
export function initNpcTagsController() {
    const btnAddTag = document.getElementById('btn-add-npc-tag')
    const popover = document.getElementById('npc-tag-picker-popover')
    const searchInput = document.getElementById('npc-tag-search-input')
    const btnCreateNew = document.getElementById('btn-create-new-npc-tag')

    if (btnAddTag && popover) {
        btnAddTag.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            const isHidden = popover.classList.contains('hidden')
            if (isHidden) {
                popover.classList.remove('hidden')
                updateAvailableTagsList(searchInput ? searchInput.value : '')
                if (searchInput && typeof searchInput.focus === 'function') {
                    searchInput.focus()
                }
            } else {
                popover.classList.add('hidden')
            }
        })
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateAvailableTagsList(searchInput.value)
        })
    }

    if (btnCreateNew && searchInput) {
        btnCreateNew.addEventListener('click', e => {
            e.preventDefault()
            const name = searchInput.value.trim()
            if (name) {
                addNpcTag(name)
                searchInput.value = ''
                updateAvailableTagsList('')
                if (popover) popover.classList.add('hidden')
            }
        })
    }

    renderNpcTags()
}

// ==========================================
// 7. Dynamic Suggestions Section
// ==========================================

/**
 * Renders dynamically fetched suggestions into the horizontal scrolling pillbars.
 *
 * @param {object} [ctx]
 */
export function renderDynamicSuggestions(ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const vm = effectiveCtx.vm

    // 1. Stats suggestions (ONLY existing in project "Cechy i atrybuty")
    const statsContainer = document.getElementById('npc-suggested-stats')
    if (statsContainer) {
        const existingStats =
            effectiveCtx.projectStats || (vm?.project?.getStats ? vm.project.getStats() : []) || []
        const characters =
            effectiveCtx.projectCharacters ||
            (vm?.project?.getCharacters ? vm.project.getCharacters() : []) ||
            []
        const suggestedStats = vm?.filter?.getSuggestedStats
            ? vm.filter.getSuggestedStats(existingStats, characters)
            : existingStats.map(s => (s.getName ? s.getName() : s.name)).filter(Boolean)

        if (suggestedStats.length === 0) {
            statsContainer.innerHTML = `<span class="text-[10px] text-zinc-500 italic py-0.5" data-i18n="npc.no_suggestions_hint">${t('npc.no_suggestions_hint', 'Brak w „Cechy i Atrybuty”')}</span>`
        } else {
            statsContainer.innerHTML = suggestedStats
                .map(name => renderSuggestedChipHtml({ type: 'stat', name }))
                .join('')

            statsContainer.querySelectorAll('.npc-stat-preset-chip').forEach(chip => {
                chip.addEventListener('click', e => {
                    e.preventDefault()
                    const name = chip.dataset.presetStat
                    if (name) {
                        const found = existingStats.find(
                            s => (s.getName ? s.getName() : s.name) === name
                        )
                        const val = found
                            ? found.getValue
                                ? found.getValue()
                                : found.value || ''
                            : ''
                        addNpcStat(name, String(val), true)
                    }
                })
            })
        }
    }

    // 2. Vitals suggestions (ONLY existing in project "Cechy i atrybuty")
    const vitalsContainer = document.getElementById('npc-suggested-vitals')
    if (vitalsContainer) {
        const existingParams =
            effectiveCtx.projectParameters ||
            (vm?.project?.getGlobalParameters ? vm.project.getGlobalParameters() : []) ||
            []
        const characters =
            effectiveCtx.projectCharacters ||
            (vm?.project?.getCharacters ? vm.project.getCharacters() : []) ||
            []
        const suggestedVitals = vm?.filter?.getSuggestedParameters
            ? vm.filter.getSuggestedParameters(existingParams, characters)
            : existingParams.map(p => (p.getName ? p.getName() : p.name)).filter(Boolean)

        if (suggestedVitals.length === 0) {
            vitalsContainer.innerHTML = `<span class="text-[10px] text-zinc-500 italic py-0.5" data-i18n="npc.no_suggestions_hint">${t('npc.no_suggestions_hint', 'Brak w „Cechy i Atrybuty”')}</span>`
        } else {
            vitalsContainer.innerHTML = suggestedVitals
                .map(name => renderSuggestedChipHtml({ type: 'vital', name }))
                .join('')

            vitalsContainer.querySelectorAll('.npc-vital-preset-chip').forEach(chip => {
                chip.addEventListener('click', e => {
                    e.preventDefault()
                    const name = chip.dataset.presetVital
                    if (!name) return
                    const foundParam = existingParams.find(
                        p => (p.getName ? p.getName() : p.name) === name
                    )
                    const mode = foundParam
                        ? foundParam.getMode
                            ? foundParam.getMode()
                            : foundParam.mode || 'direct'
                        : 'direct'
                    const val = foundParam
                        ? foundParam.getValue
                            ? foundParam.getValue()
                            : (foundParam.value ?? '')
                        : '10'
                    const formula = foundParam
                        ? foundParam.getFormula
                            ? foundParam.getFormula()
                            : foundParam.formula || ''
                        : ''
                    addNpcVital(name, mode, String(val), formula, true)
                })
            })
        }
    }

    // 3. Skills suggestions (ONLY existing in project "Cechy i atrybuty")
    const skillsContainer = document.getElementById('npc-suggested-skills')
    if (skillsContainer) {
        const existingSkills =
            effectiveCtx.projectSkills ||
            (vm?.project?.getSkills ? vm.project.getSkills() : []) ||
            []
        const characters =
            effectiveCtx.projectCharacters ||
            (vm?.project?.getCharacters ? vm.project.getCharacters() : []) ||
            []
        const suggestedSkills = vm?.filter?.getSuggestedSkills
            ? vm.filter.getSuggestedSkills(existingSkills, characters)
            : existingSkills.map(s => (s.getName ? s.getName() : s.name)).filter(Boolean)

        if (suggestedSkills.length === 0) {
            skillsContainer.innerHTML = `<span class="text-[10px] text-zinc-500 italic py-0.5" data-i18n="npc.no_suggestions_hint">${t('npc.no_suggestions_hint', 'Brak w „Cechy i Atrybuty”')}</span>`
        } else {
            skillsContainer.innerHTML = suggestedSkills
                .map(name => renderSuggestedChipHtml({ type: 'skill', name }))
                .join('')

            skillsContainer.querySelectorAll('.npc-skill-preset-chip').forEach(chip => {
                chip.addEventListener('click', e => {
                    e.preventDefault()
                    const name = chip.dataset.presetSkill
                    if (!name) return
                    const foundSkill = existingSkills.find(
                        s => (s.getName ? s.getName() : s.name) === name
                    )
                    const mode = foundSkill
                        ? foundSkill.getMode
                            ? foundSkill.getMode()
                            : foundSkill.mode || 'direct'
                        : 'direct'
                    const val = foundSkill
                        ? foundSkill.getValue
                            ? foundSkill.getValue()
                            : foundSkill.value || ''
                        : ''
                    const statName = foundSkill
                        ? foundSkill.getStatName
                            ? foundSkill.getStatName()
                            : foundSkill.statName || ''
                        : ''
                    const modifier = foundSkill
                        ? foundSkill.getModifier
                            ? foundSkill.getModifier()
                            : foundSkill.modifier || ''
                        : ''
                    addNpcSkill(name, mode, String(val), statName, modifier, true)
                })
            })
        }
    }

    // 4. Attributes / Identity suggestions (ONLY existing in project "Cechy i atrybuty")
    const attrsContainer = document.getElementById('npc-suggested-attributes')
    if (attrsContainer) {
        const existingFeatures =
            effectiveCtx.projectFeatures ||
            (vm?.project?.getFeatures ? vm.project.getFeatures() : []) ||
            []
        const characters =
            effectiveCtx.projectCharacters ||
            (vm?.project?.getCharacters ? vm.project.getCharacters() : []) ||
            []
        const suggestedAttrs = vm?.filter?.getSuggestedFeatures
            ? vm.filter.getSuggestedFeatures(existingFeatures, characters)
            : existingFeatures.map(f => (f.getName ? f.getName() : f.name)).filter(Boolean)

        if (suggestedAttrs.length === 0) {
            attrsContainer.innerHTML = `<span class="text-[10px] text-zinc-500 italic py-0.5" data-i18n="npc.no_suggestions_hint">${t('npc.no_suggestions_hint', 'Brak w „Cechy i Atrybuty”')}</span>`
        } else {
            attrsContainer.innerHTML = suggestedAttrs
                .map(name => renderSuggestedChipHtml({ type: 'attribute', name }))
                .join('')

            attrsContainer.querySelectorAll('.npc-preset-chip').forEach(chip => {
                chip.addEventListener('click', e => {
                    e.preventDefault()
                    const name = chip.dataset.presetName
                    if (!name) return
                    const foundFeat = existingFeatures.find(
                        f => (f.getName ? f.getName() : f.name) === name
                    )
                    const val = foundFeat
                        ? foundFeat.getValue
                            ? foundFeat.getValue()
                            : foundFeat.value || ''
                        : ''
                    addCustomAttribute(name, String(val), true)
                })
            })
        }
    }

    // 5. Tags suggestions
    const tagsContainer = document.getElementById('npc-suggested-tags')
    if (tagsContainer) {
        const existingTags =
            effectiveCtx.projectTags || (vm?.project?.getTags ? vm.project.getTags() : []) || []
        const characters =
            effectiveCtx.projectCharacters ||
            (vm?.project?.getCharacters ? vm.project.getCharacters() : []) ||
            []
        let suggestedTags = vm?.filter?.getSuggestedTags
            ? vm.filter.getSuggestedTags(existingTags, characters)
            : existingTags.map(tObj => (tObj.getName ? tObj.getName() : tObj.name)).filter(Boolean)

        if (suggestedTags.length === 0) {
            tagsContainer.innerHTML = `<span class="text-[10px] text-zinc-500 italic py-0.5" data-i18n="npc.no_existing_tags">${t('npc.no_existing_tags', 'Brak istniejących tagów')}</span>`
        } else {
            tagsContainer.innerHTML = suggestedTags
                .map(name => renderSuggestedChipHtml({ type: 'tag', name }))
                .join('')

            tagsContainer.querySelectorAll('.npc-tag-preset-chip').forEach(chip => {
                chip.addEventListener('click', e => {
                    e.preventDefault()
                    const name = chip.dataset.presetTag
                    if (name) addNpcTag(name)
                })
            })
        }
    }

    // Update dynamic counter module
    updateTraitsCounterUI(effectiveCtx)
}

// ==========================================
// 7. Applied Templates & Dropdown Section
// ==========================================

/**
 * Returns available templates from context or project.
 *
 * @param {object} [ctx]
 * @returns {any[]}
 */
export function getAvailableTemplates(ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const vm = effectiveCtx.vm

    let list = []
    if (Array.isArray(effectiveCtx.projectTemplates) && effectiveCtx.projectTemplates.length > 0) {
        list = effectiveCtx.projectTemplates
    } else if (vm?.project && typeof vm.project.getTemplates === 'function') {
        const tpls = vm.project.getTemplates()
        if (Array.isArray(tpls)) list = tpls
    } else if (typeof effectiveCtx.getTemplates === 'function') {
        const tpls = effectiveCtx.getTemplates()
        if (Array.isArray(tpls)) list = tpls
    }

    return Array.isArray(list) ? list : []
}

/**
 * Renders the chip list of currently applied templates and updates the counter badge.
 */
export function renderAppliedTemplates() {
    const listContainer = document.getElementById('npc-applied-templates-list')
    const countBadge = document.getElementById('npc-applied-templates-count')
    const applied = state.getAppliedTemplates()

    if (countBadge) {
        countBadge.textContent = String(applied.length)
        if (applied.length > 0) {
            countBadge.className =
                'text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30'
        } else {
            countBadge.className =
                'text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-[#3d4e61]/25 text-[#9bb7d4] border border-[#4a5e74]/40'
        }
    }

    if (!listContainer) return

    if (applied.length === 0) {
        listContainer.innerHTML = ''
        return
    }

    listContainer.innerHTML = applied.map(tpl => renderAppliedTemplateChipHtml(tpl)).join('')

    // Attach remove listeners
    listContainer.querySelectorAll('.btn-remove-applied-template').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            const tplId = btn.dataset.templateId
            if (tplId) {
                removeAppliedTemplate(tplId)
            }
        })
    })
}

/**
 * Removes an applied template from the character/template tracking.
 *
 * @param {string} templateId
 * @param {object} [ctx]
 */
export function removeAppliedTemplate(templateId, ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    state.removeAppliedTemplateState(templateId)
    renderAppliedTemplates()
    if (isTemplateDropdownOpen()) {
        renderTemplateDropdownList(effectiveCtx)
    }
}

/**
 * Checks whether the template dropdown menu is currently visible.
 *
 * @returns {boolean}
 */
export function isTemplateDropdownOpen() {
    const menu = document.getElementById('npc-template-dropdown-menu')
    return menu ? !menu.classList.contains('hidden') : false
}

/**
 * Renders the list of templates inside the dropdown menu, filtering if query is provided.
 *
 * @param {object} [ctx]
 * @param {string} [filterQuery='']
 */
export function renderTemplateDropdownList(ctx, filterQuery = '') {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const itemsContainer = document.getElementById('npc-template-dropdown-items')
    const emptyNotice = document.getElementById('npc-template-dropdown-empty')

    if (!itemsContainer) return

    const templates = getAvailableTemplates(effectiveCtx)
    const appliedTemplates = state.getAppliedTemplates()
    const appliedIds = new Set(appliedTemplates.map(a => a.id))

    const query = (filterQuery || '').trim().toLowerCase()
    const filtered = query
        ? templates.filter(tpl => {
              const name = (
                  typeof tpl.getName === 'function' ? tpl.getName() : tpl.name || ''
              ).toLowerCase()
              const summary = (
                  typeof tpl.getSummary === 'function'
                      ? tpl.getSummary()
                      : tpl.description?.summary || ''
              ).toLowerCase()
              return name.includes(query) || summary.includes(query)
          })
        : templates

    if (filtered.length === 0) {
        itemsContainer.innerHTML = ''
        if (emptyNotice) {
            emptyNotice.classList.remove('hidden')
            emptyNotice.textContent =
                templates.length === 0
                    ? t('npc.no_templates_in_project', 'Brak dostępnych szablonów w projekcie.')
                    : t('left_panel.no_characters_in_section', 'Brak pasujących szablonów.')
        }
        return
    }

    if (emptyNotice) emptyNotice.classList.add('hidden')

    itemsContainer.innerHTML = filtered
        .map(tpl => {
            const id = typeof tpl.getId === 'function' ? tpl.getId() : tpl.id
            const isApplied = appliedIds.has(id)
            return renderTemplateDropdownItemHtml(tpl, isApplied)
        })
        .join('')

    // Attach click listeners to dropdown items
    itemsContainer.querySelectorAll('.template-dropdown-item').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            const tplId = btn.dataset.templateId
            if (tplId) {
                applyTemplate(tplId, effectiveCtx)
                closeTemplateDropdown()
            }
        })
    })
}

/**
 * Opens the template dropdown menu and focuses the search input.
 *
 * @param {object} [ctx]
 */
export function openTemplateDropdown(ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const menu = document.getElementById('npc-template-dropdown-menu')
    const btn = document.getElementById('btn-template-dropdown')
    const arrow = document.getElementById('npc-template-dropdown-arrow')
    const searchInput = document.getElementById('npc-template-dropdown-search')

    if (!menu) return

    menu.classList.remove('hidden')
    if (btn) btn.setAttribute('aria-expanded', 'true')
    if (arrow) arrow.style.transform = 'rotate(180deg)'

    if (searchInput) {
        searchInput.value = ''
        setTimeout(() => {
            if (typeof searchInput.focus === 'function') searchInput.focus()
        }, 50)
    }

    renderTemplateDropdownList(effectiveCtx)
}

/**
 * Closes the template dropdown menu and resets arrow rotation.
 */
export function closeTemplateDropdown() {
    const menu = document.getElementById('npc-template-dropdown-menu')
    const btn = document.getElementById('btn-template-dropdown')
    const arrow = document.getElementById('npc-template-dropdown-arrow')

    if (!menu) return

    menu.classList.add('hidden')
    if (btn) btn.setAttribute('aria-expanded', 'false')
    if (arrow) arrow.style.transform = ''
}

/**
 * Toggles template dropdown menu open/closed state.
 *
 * @param {object} [ctx]
 */
export function toggleTemplateDropdown(ctx) {
    if (isTemplateDropdownOpen()) {
        closeTemplateDropdown()
    } else {
        openTemplateDropdown(ctx)
    }
}

/**
 * Initializes listeners for the template dropdown button and search input.
 *
 * @param {object} [ctx]
 */
export function initTemplateDropdownController(ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const btnDropdown = document.getElementById('btn-template-dropdown')
    const searchInput = document.getElementById('npc-template-dropdown-search')

    if (btnDropdown) {
        btnDropdown.addEventListener('click', e => {
            e.preventDefault()
            e.stopPropagation()
            toggleTemplateDropdown(effectiveCtx)
        })
    }

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            renderTemplateDropdownList(effectiveCtx, e.target.value)
        })
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                e.stopPropagation()
                closeTemplateDropdown()
            }
        })
    }
}

/**
 * Applies a template to the current modal state (character or template).
 * Resolves template by ID or instance, merges data with collision deduplication,
 * updates form inputs and all trait sections, and provides user feedback.
 *
 * @param {string | object} templateIdOrInstance
 * @param {object} [ctx]
 * @returns {object|null} Merge report or null if failed
 */
export function applyTemplate(templateIdOrInstance, ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    let template = null

    if (templateIdOrInstance && typeof templateIdOrInstance === 'object') {
        template = templateIdOrInstance
    } else {
        const tpls = getAvailableTemplates(effectiveCtx)
        template = tpls.find(
            tObj =>
                (typeof tObj.getId === 'function' ? tObj.getId() : tObj.id) ===
                    templateIdOrInstance ||
                (typeof tObj.getName === 'function' ? tObj.getName() : tObj.name) ===
                    templateIdOrInstance
        )
    }

    if (!template) {
        console.warn('[applyTemplate] Template not found:', templateIdOrInstance)
        return null
    }

    const tplId = template.id || (typeof template.getId === 'function' ? template.getId() : '')
    const tplName =
        template.name || (typeof template.getName === 'function' ? template.getName() : 'Szablon')

    // Check if already applied
    const applied = state.getAppliedTemplates()
    if (tplId && applied.some(a => a.id === tplId)) {
        if (typeof toast?.info === 'function') {
            let alreadyMsg = t('npc.template_already_applied', { name: tplName })
            if (alreadyMsg.includes('{name}')) {
                alreadyMsg = alreadyMsg.replace(/\{name\}/g, tplName)
            }
            if (alreadyMsg.includes('{{name}}')) {
                alreadyMsg = alreadyMsg.replace(/\{\{name\}\}/g, tplName)
            }
            toast.info(alreadyMsg)
        }
        return null
    }

    // Perform merge with collision deduplication
    const report = mergeTemplateIntoModalState(template)

    // Re-render all sections
    renderCustomAttributes()
    renderNpcStats()
    renderNpcSkills()
    renderNpcVitals()
    renderNpcTags()
    renderAppliedTemplates()
    updateSkillStatDropdowns()
    updateVitalFormulasPreview()
    updateTraitsCounterUI(effectiveCtx)

    // Apply avatar if changed by merger
    const currentAvatarId = state.getCurrentAvatarId()
    if (report.appliedAvatar && currentAvatarId) {
        updateSelectedAvatarPreview(currentAvatarId)
    }

    // Apply summary if input field is empty
    const summaryInput = document.getElementById('npc-summary-input')
    if (summaryInput && !summaryInput.value.trim() && report.appliedSummary) {
        const tplSummary =
            typeof template.getSummary === 'function'
                ? template.getSummary()
                : template.description?.summary || ''
        summaryInput.value = tplSummary
    }

    // Apply description if textarea is empty
    const descTextarea = document.getElementById('npc-description-textarea')
    if (descTextarea && !descTextarea.value.trim() && report.appliedDescription) {
        const tplDesc =
            typeof template.getDescription === 'function' && template.getDescription()?.getText
                ? template.getDescription().getText()
                : template.description?.text || ''
        descTextarea.value = tplDesc
        const editor = getNpcEditorInstance()
        if (editor && typeof editor.setMarkdown === 'function') {
            editor.setMarkdown(tplDesc)
            updateNpcEditorStats(editor)
        }
    }

    // Show feedback toast
    if (typeof toast?.success === 'function') {
        let msg = t('npc.template_applied_toast', { name: tplName })
        if (msg.includes('{name}')) {
            msg = msg.replace(/\{name\}/g, tplName)
        }
        if (msg.includes('{{name}}')) {
            msg = msg.replace(/\{\{name\}\}/g, tplName)
        }
        if (report.totalSkipped > 0) {
            msg += ` (${report.totalAdded} dodanych, ${report.totalSkipped} pominiętych duplikatów)`
        }
        toast.success(msg)
    }

    return report
}
