/**
 * Hero Modal State Store
 * Manages mutable UI and entity state for Player Character creation & editing.
 */

let isModalOpen = false
let activeModal = null
let isDrawerOpen = false
let editingHero = null

let currentAvatarId = ''
let customAttributes = []
let heroStats = []
let heroSkills = []
let heroVitals = []
let heroTags = []

let originalFormSnapshot = null

export function getIsModalOpen() {
    return isModalOpen
}

export function setIsModalOpen(val) {
    isModalOpen = Boolean(val)
}

export function getActiveModal() {
    return activeModal
}

export function setActiveModal(el) {
    activeModal = el
}

export function getIsDrawerOpen() {
    return isDrawerOpen
}

export function setIsDrawerOpen(val) {
    isDrawerOpen = Boolean(val)
}

export function getEditingHero() {
    return editingHero
}

export function setEditingHero(hero) {
    editingHero = hero
}

export function getCurrentAvatarId() {
    return currentAvatarId
}

export function setCurrentAvatarId(id) {
    currentAvatarId = id || ''
}

export function getCustomAttributes() {
    return customAttributes
}

export function setCustomAttributes(attrs) {
    customAttributes = Array.isArray(attrs) ? [...attrs] : []
}

export function clearCustomAttributes() {
    customAttributes = []
}

export function getHeroStats() {
    return heroStats
}

export function setHeroStats(stats) {
    heroStats = Array.isArray(stats) ? [...stats] : []
}

export function clearHeroStats() {
    heroStats = []
}

export function getHeroSkills() {
    return heroSkills
}

export function setHeroSkills(skills) {
    heroSkills = Array.isArray(skills) ? [...skills] : []
}

export function clearHeroSkills() {
    heroSkills = []
}

export function getHeroStatsMap() {
    const map = {}
    heroStats.forEach(s => {
        const name = (s.name || '').trim()
        if (name) {
            map[name] = s.value ?? 10
        }
    })
    return map
}

export function getHeroVitals(evaluateFormulaFn) {
    if (typeof evaluateFormulaFn !== 'function') return heroVitals
    const statsMap = getHeroStatsMap()
    return heroVitals.map(v => {
        if (v.mode === 'formula' && v.formula) {
            const calculated = evaluateFormulaFn(v.formula, statsMap)
            return {
                ...v,
                calculatedValue: calculated?.result ?? null,
            }
        }
        return v
    })
}

export function setHeroVitals(vitals) {
    heroVitals = Array.isArray(vitals) ? [...vitals] : []
}

export function clearHeroVitals() {
    heroVitals = []
}

export function getHeroTags() {
    return heroTags
}

export function setHeroTags(tags) {
    heroTags = Array.isArray(tags) ? [...tags] : []
}

export function clearHeroTags() {
    heroTags = []
}

let heroInventories = []

export function getHeroInventories() {
    return heroInventories
}

export function setHeroInventories(invs) {
    heroInventories = Array.isArray(invs) ? [...invs] : []
}

export function clearHeroInventories() {
    heroInventories = []
}

/**
 * Creates a comparable snapshot of the current form state to detect unsaved changes.
 */
export function captureFormSnapshot(nameInputVal = '', summaryInputVal = '', descVal = '') {
    return JSON.stringify({
        name: nameInputVal.trim(),
        summary: summaryInputVal.trim(),
        description: descVal.trim(),
        avatar: currentAvatarId,
        customAttributes,
        heroStats,
        heroSkills,
        heroVitals,
        heroTags,
        heroInventories,
    })
}

export function setInitialSnapshot(snapshot) {
    originalFormSnapshot = snapshot
}

export function hasUnsavedChanges(currentSnapshot) {
    if (!originalFormSnapshot) return false
    return originalFormSnapshot !== currentSnapshot
}

export function resetHeroState() {
    currentAvatarId = ''
    customAttributes = []
    heroStats = []
    heroSkills = []
    heroVitals = []
    heroTags = []
    heroInventories = []
    editingHero = null
    isDrawerOpen = false
    originalFormSnapshot = null
}
