/**
 * Encapsulated state management for the NPC Creation Floating Window.
 * Stores attributes, stats, skills, vitals, active avatar, and window context.
 */

let customAttributes = []
let npcStats = []
let npcSkills = []
let npcVitals = []
let currentAvatarId = 'warrior'
let isDrawerOpen = false
let hasBeenPositioned = false
let activeModal = null
let activeCtx = null
let globalKeydownHandler = null
let globalOutsideClickHandler = null

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
        }))
    }
}

export function clearCustomAttributes() {
    customAttributes = []
}

export function addCustomAttributeState(name = '', value = '') {
    const id = `attr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    customAttributes.push({ id, name, value })
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
        }))
    }
}

export function clearNpcStats() {
    npcStats = []
}

export function addNpcStatState(name = '', value = '') {
    const id = `stat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcStats.push({ id, name, value })
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
    modifier = ''
) {
    const id = `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcSkills.push({ id, name, mode, value, statName, modifier })
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
        }))
    }
}

export function clearNpcVitals() {
    npcVitals = []
}

export function addNpcVitalState(name = '', mode = 'direct', value = '', formula = '') {
    const id = `vital_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    npcVitals.push({ id, name, mode, value, formula })
    return id
}

export function removeNpcVitalState(id) {
    npcVitals = npcVitals.filter(v => v.id !== id)
}

export function findNpcVital(id) {
    return npcVitals.find(v => v.id === id)
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

/**
 * Resets state arrays and default values.
 */
export function resetState() {
    customAttributes = []
    npcStats = []
    npcSkills = []
    npcVitals = []
    currentAvatarId = 'warrior'
    isDrawerOpen = false
}
