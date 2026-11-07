/**
 * Encapsulated state management for the NPC Creation Floating Window.
 * Stores attributes, stats, skills, vitals, active avatar, and window context.
 */

let customAttributes = []
let npcStats = []
let npcSkills = []
let npcVitals = []
let npcTags = []
let appliedTemplates = []
let currentAvatarId = 'warrior'
let isDrawerOpen = false
let hasBeenPositioned = false
let modalMode = 'character'
let activeModal = null
let activeCtx = null
let globalKeydownHandler = null
let globalOutsideClickHandler = null
let editingEntity = null

export function getEditingEntity() {
    return editingEntity
}

export function setEditingEntity(entity) {
    editingEntity = entity || null
}

export function isEditingMode() {
    return Boolean(editingEntity)
}

export function getModalMode() {
    return modalMode
}

export function setModalMode(mode) {
    modalMode = mode === 'template' ? 'template' : 'character'
}

// --- Custom Attributes ---

export function getCustomAttributes() {
    return customAttributes.map(a => ({
        name: a.name.trim(),
        value: a.value.trim(),
    }))
}

export function getCustomAttributesArray() {
    return customAttributes
}

export function setCustomAttributes(attributes) {
    if (!Array.isArray(attributes)) {
        customAttributes = []
    } else {
        customAttributes = attributes.map((a, i) => ({
            id: a.id || `attr_${Date.now()}_${i}`,
            name: a.name || '',
            value: a.value || '',
            isEditing: a.isEditing !== undefined ? a.isEditing : false,
        }))
    }
}

export function clearCustomAttributes() {
    customAttributes = []
}

export function addCustomAttributeState(
    name = '',
    value = '',
    isEditing = true,
    featureKind = null,
    options = []
) {
    const id = `attr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    customAttributes.push({ id, name, value, isEditing, featureKind, options })
    return id
}

export function removeCustomAttributeState(id) {
    customAttributes = customAttributes.filter(a => a.id !== id)
}

export function findCustomAttribute(id) {
    return customAttributes.find(a => a.id === id)
}

// --- Stats ---

export function getNpcStats() {
    return npcStats.map(s => ({
        name: s.name.trim(),
        value: s.value.trim(),
    }))
}

export function getNpcStatsArray() {
    return npcStats
}

export function setNpcStats(stats) {
    if (!Array.isArray(stats)) {
        npcStats = []
    } else {
        npcStats = stats.map((s, i) => ({
            id: s.id || `stat_${Date.now()}_${i}`,
            name: s.name || '',
            value: s.value || '',
            isEditing: s.isEditing !== undefined ? s.isEditing : false,
            statKind: s.statKind || 'numeric',
            min: s.min ?? null,
            max: s.max ?? null,
            options: Array.isArray(s.options) ? [...s.options] : [],
        }))
    }
}

export function clearNpcStats() {
    npcStats = []
}

export function addNpcStatState(
    name = '',
    value = '',
    isEditing = true,
    statKind = 'numeric',
    min = null,
    max = null,
    options = []
) {
    const id = `stat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcStats.push({
        id,
        name,
        value,
        isEditing,
        statKind,
        min,
        max,
        options: Array.isArray(options) ? [...options] : [],
    })
    return id
}

export function removeNpcStatState(id) {
    npcStats = npcStats.filter(s => s.id !== id)
}

export function findNpcStat(id) {
    return npcStats.find(s => s.id === id)
}

export function getAvailableStatNames() {
    const names = []
    npcStats.forEach(s => {
        const trimmed = (s.name || '').trim()
        if (trimmed && !names.includes(trimmed)) {
            names.push(trimmed)
        }
    })
    return names
}

export function getStatsMap() {
    const statsMap = {}
    npcStats.forEach(s => {
        const key = (s.name || '').trim()
        if (key) statsMap[key] = s.value
    })
    return statsMap
}

// --- Skills ---

export function getNpcSkills() {
    return npcSkills.map(s => ({
        name: s.name.trim(),
        mode: s.mode,
        value: (s.value || '').trim(),
        statName: (s.statName || '').trim(),
        modifier: (s.modifier || '').trim(),
    }))
}

export function getNpcSkillsArray() {
    return npcSkills
}

export function setNpcSkills(skills) {
    if (!Array.isArray(skills)) {
        npcSkills = []
    } else {
        npcSkills = skills.map((s, i) => ({
            id: s.id || `skill_${Date.now()}_${i}`,
            name: s.name || '',
            mode: s.mode || 'direct',
            value: s.value || '',
            statName: s.statName || '',
            modifier: s.modifier || '',
            isEditing: s.isEditing !== undefined ? s.isEditing : false,
        }))
    }
}

export function clearNpcSkills() {
    npcSkills = []
}

export function addNpcSkillState(
    name = '',
    mode = 'direct',
    value = '',
    statName = '',
    modifier = '',
    isEditing = true
) {
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcSkills.push({ id, name, mode, value, statName, modifier, isEditing })
    return id
}

export function removeNpcSkillState(id) {
    npcSkills = npcSkills.filter(s => s.id !== id)
}

export function findNpcSkill(id) {
    return npcSkills.find(s => s.id === id)
}

// --- Vitals ---

export function getNpcVitals(evaluateFormulaFn) {
    const statsMap = getStatsMap()

    return npcVitals.map(v => {
        const isFormula = v.mode === 'formula'
        const calc =
            isFormula && typeof evaluateFormulaFn === 'function'
                ? evaluateFormulaFn(v.formula, statsMap)
                : null
        return {
            name: v.name.trim(),
            mode: v.mode,
            value: (v.value || '').trim(),
            formula: (v.formula || '').trim(),
            calculatedValue: calc?.result ?? null,
        }
    })
}

export function getNpcVitalsArray() {
    return npcVitals
}

export function setNpcVitals(vitals) {
    if (!Array.isArray(vitals)) {
        npcVitals = []
    } else {
        npcVitals = vitals.map((v, i) => ({
            id: v.id || `vital_${Date.now()}_${i}`,
            name: v.name || '',
            mode: v.mode || 'direct',
            value: v.value || '',
            formula: v.formula || '',
            isEditing: v.isEditing !== undefined ? v.isEditing : false,
        }))
    }
}

export function clearNpcVitals() {
    npcVitals = []
}

export function addNpcVitalState(
    name = '',
    mode = 'direct',
    value = '',
    formula = '',
    isEditing = true
) {
    const id = `vital_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcVitals.push({ id, name, mode, value, formula, isEditing })
    return id
}

export function removeNpcVitalState(id) {
    npcVitals = npcVitals.filter(v => v.id !== id)
}

export function findNpcVital(id) {
    return npcVitals.find(v => v.id === id)
}

// --- Tags ---

export function getNpcTags() {
    return npcTags.map(t => ({
        id: t.id || t.name,
        name: (t.name || '').trim(),
        color: t.color || '#3b82f6',
    }))
}

export function getNpcTagsArray() {
    return npcTags
}

export function setNpcTags(tags) {
    if (!Array.isArray(tags)) {
        npcTags = []
    } else {
        npcTags = tags.map((t, i) => {
            if (typeof t === 'string') {
                return { id: `tag_${Date.now()}_${i}`, name: t, color: '#3b82f6' }
            }
            return {
                id: (typeof t.getId === 'function' ? t.getId() : t.id) || `tag_${Date.now()}_${i}`,
                name: (typeof t.getName === 'function' ? t.getName() : t.name) || '',
                color: (typeof t.getColor === 'function' ? t.getColor() : t.color) || '#3b82f6',
            }
        })
    }
}

export function clearNpcTags() {
    npcTags = []
}

export function addNpcTagState(tagOrName, color = '#3b82f6') {
    let name = ''
    let tagId = ''
    let tagColor = color

    if (typeof tagOrName === 'string') {
        name = tagOrName.trim()
        tagId = `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    } else if (tagOrName && typeof tagOrName === 'object') {
        name = (
            typeof tagOrName.getName === 'function' ? tagOrName.getName() : tagOrName.name || ''
        ).trim()
        tagId =
            (typeof tagOrName.getId === 'function' ? tagOrName.getId() : tagOrName.id) ||
            `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        tagColor =
            (typeof tagOrName.getColor === 'function' ? tagOrName.getColor() : tagOrName.color) ||
            color
    }

    if (!name) return null

    // Check if tag already exists in state by name (case-insensitive)
    const existing = npcTags.find(t => (t.name || '').toLowerCase() === name.toLowerCase())
    if (existing) {
        return existing.id
    }

    const newTag = { id: tagId, name, color: tagColor }
    npcTags.push(newTag)
    return tagId
}

export function removeNpcTagState(idOrName) {
    if (!idOrName) return
    const key = String(idOrName).trim().toLowerCase()
    npcTags = npcTags.filter(t => t.id !== idOrName && (t.name || '').toLowerCase() !== key)
}

export function findNpcTag(idOrName) {
    if (!idOrName) return undefined
    const key = String(idOrName).trim().toLowerCase()
    return npcTags.find(t => t.id === idOrName || (t.name || '').toLowerCase() === key)
}

// --- Window & Avatar States ---

export function getCurrentAvatarId() {
    return currentAvatarId
}

export function setCurrentAvatarId(id) {
    currentAvatarId = id
}

export function getIsDrawerOpen() {
    return isDrawerOpen
}

export function setIsDrawerOpen(open) {
    isDrawerOpen = open
}

export function getHasBeenPositioned() {
    return hasBeenPositioned
}

export function setHasBeenPositioned(positioned) {
    hasBeenPositioned = positioned
}

export function getActiveModal() {
    return activeModal
}

export function setActiveModal(modal) {
    activeModal = modal
}

export function getActiveCtx() {
    return activeCtx
}

export function setActiveCtx(ctx) {
    activeCtx = ctx
}

export function getGlobalKeydownHandler() {
    return globalKeydownHandler
}

export function setGlobalKeydownHandler(handler) {
    globalKeydownHandler = handler
}

export function getGlobalOutsideClickHandler() {
    return globalOutsideClickHandler
}

export function setGlobalOutsideClickHandler(handler) {
    globalOutsideClickHandler = handler
}

export function getAppliedTemplates() {
    return appliedTemplates
}

export function addAppliedTemplateState(tpl) {
    if (!tpl) return
    const id = tpl.id || (typeof tpl.getId === 'function' ? tpl.getId() : '')
    const name = tpl.name || (typeof tpl.getName === 'function' ? tpl.getName() : '')
    const avatar = tpl.avatar || (typeof tpl.getAvatar === 'function' ? tpl.getAvatar() : 'warrior')
    if (id && !appliedTemplates.some(t => t.id === id)) {
        appliedTemplates.push({ id, name, avatar })
    }
}

export function removeAppliedTemplateState(id) {
    appliedTemplates = appliedTemplates.filter(t => t.id !== id)
}

export function clearAppliedTemplates() {
    appliedTemplates = []
}

/**
 * Resets state arrays and default values.
 */
export function resetState() {
    customAttributes = []
    npcStats = []
    npcSkills = []
    npcVitals = []
    npcTags = []
    appliedTemplates = []
    currentAvatarId = 'warrior'
    isDrawerOpen = false
    editingEntity = null
}
