/**
 * Template Merger Engine
 * Handles merging of one or multiple NPC templates into the current modal state,
 * performing deduplication to safely skip any colliding parameters, stats, skills, or attributes.
 */

import * as state from './npcState.js'

/**
 * Normalizes string for case-insensitive duplicate comparison.
 * @param {string} str
 * @returns {string}
 */
function normalizeName(str) {
    return (str || '').trim().toLowerCase()
}

/**
 * Extracts a normalized list of stats from a template instance or plain object.
 * @param {object} tpl
 * @returns {Array<{ name: string, value: string }>}
 */
export function extractTemplateStats(tpl) {
    if (!tpl) return []
    const raw = typeof tpl.getStats === 'function' ? tpl.getStats() : tpl.stats || []
    return raw
        .map(s => {
            const name = typeof s.getName === 'function' ? s.getName() : s.name || ''
            const val = typeof s.getValue === 'function' ? s.getValue() : s.value || ''
            return { name: String(name).trim(), value: String(val).trim() }
        })
        .filter(s => s.name.length > 0)
}

/**
 * Extracts a normalized list of skills from a template instance or plain object.
 * @param {object} tpl
 * @returns {Array<{ name: string, mode: string, value: string, statName: string, modifier: string }>}
 */
export function extractTemplateSkills(tpl) {
    if (!tpl) return []
    const raw = typeof tpl.getSkills === 'function' ? tpl.getSkills() : tpl.skills || []
    return raw
        .map(sk => {
            const name = typeof sk.getName === 'function' ? sk.getName() : sk.name || ''
            const mode = typeof sk.getMode === 'function' ? sk.getMode() : sk.mode || 'direct'
            const val = typeof sk.getValue === 'function' ? sk.getValue() : sk.value || ''
            const statName =
                typeof sk.getStatName === 'function' ? sk.getStatName() : sk.statName || ''
            const modifier =
                typeof sk.getModifier === 'function' ? sk.getModifier() : sk.modifier || ''
            return {
                name: String(name).trim(),
                mode: mode === 'stat_mod' ? 'stat_mod' : 'direct',
                value: String(val).trim(),
                statName: String(statName).trim(),
                modifier: String(modifier).trim(),
            }
        })
        .filter(sk => sk.name.length > 0)
}

/**
 * Extracts a normalized list of vitals/parameters from a template instance or plain object.
 * @param {object} tpl
 * @returns {Array<{ name: string, mode: string, value: string, formula: string }>}
 */
export function extractTemplateVitals(tpl) {
    if (!tpl) return []
    const raw =
        typeof tpl.getParameters === 'function'
            ? tpl.getParameters()
            : tpl.parameters || tpl.vitals || []
    return raw
        .map(v => {
            const name = typeof v.getName === 'function' ? v.getName() : v.name || ''
            const mode = typeof v.getMode === 'function' ? v.getMode() : v.mode || 'direct'
            let val = typeof v.getValue === 'function' ? v.getValue() : v.value || ''
            let formula = typeof v.getFormula === 'function' ? v.getFormula() : v.formula || ''
            if (mode === 'formula' && !formula && val) {
                formula = String(val)
                val = ''
            }
            return {
                name: String(name).trim(),
                mode: mode === 'formula' ? 'formula' : 'direct',
                value: String(val).trim(),
                formula: String(formula).trim(),
            }
        })
        .filter(v => v.name.length > 0)
}

/**
 * Extracts a normalized list of custom attributes / features from a template.
 * @param {object} tpl
 * @returns {Array<{ name: string, value: string }>}
 */
export function extractTemplateAttributes(tpl) {
    if (!tpl) return []
    const attrs =
        typeof tpl.getCustomAttributes === 'function'
            ? tpl.getCustomAttributes()
            : tpl.customAttributes || []

    const list = []
    if (Array.isArray(attrs)) {
        attrs.forEach(a => {
            const name = a.name || a.key || ''
            const val = a.value !== undefined ? a.value : ''
            if (String(name).trim()) {
                list.push({ name: String(name).trim(), value: String(val).trim() })
            }
        })
    }

    // Also check features if any
    const feats = typeof tpl.getFeatures === 'function' ? tpl.getFeatures() : tpl.features || []
    if (Array.isArray(feats)) {
        feats.forEach(f => {
            const name = typeof f.getName === 'function' ? f.getName() : f.name || ''
            let val = ''
            if (typeof f.getValue === 'function') {
                val = f.getValue()
            } else if (f.value !== undefined) {
                val = f.value
            } else if (typeof f.getDescription === 'function' && f.getDescription()?.getText) {
                val = f.getDescription().getText()
            }
            if (
                String(name).trim() &&
                !list.some(existing => normalizeName(existing.name) === normalizeName(name))
            ) {
                list.push({ name: String(name).trim(), value: String(val).trim() })
            }
        })
    }

    return list
}

/**
 * Extracts a normalized list of tags from a template instance or plain object.
 * @param {object} tpl
 * @returns {Array<{ name: string, color: string }>}
 */
export function extractTemplateTags(tpl) {
    if (!tpl) return []
    const raw = typeof tpl.getTags === 'function' ? tpl.getTags() : tpl.tags || []
    return raw
        .map(t => {
            const name = typeof t.getName === 'function' ? t.getName() : t.name || ''
            const color = typeof t.getColor === 'function' ? t.getColor() : t.color || '#3b82f6'
            return { name: String(name).trim(), color: String(color).trim() }
        })
        .filter(t => t.name.length > 0)
}

/**
 * Merges a template into current modal state with strict collision deduplication.
 * If any parameter, stat, skill, attribute, or tag already exists, the duplicate is skipped.
 *
 * @param {object} template Template instance or plain object
 * @param {object} [options]
 * @param {() => string} [options.getSummary] Function to get current summary
 * @param {(val: string) => void} [options.setSummary] Function to set summary
 * @param {() => string} [options.getDescription] Function to get current description
 * @param {(val: string) => void} [options.setDescription] Function to set description
 * @param {(id: string) => void} [options.setAvatar] Function to update avatar preview
 * @returns {object} Merge report
 */
export function mergeTemplateIntoModalState(template, options = {}) {
    if (!template) {
        throw new Error('mergeTemplateIntoModalState requires a valid template')
    }

    const tplId = template.id || (typeof template.getId === 'function' ? template.getId() : '')
    const tplName =
        template.name || (typeof template.getName === 'function' ? template.getName() : 'Szablon')
    const tplAvatar =
        template.avatar || (typeof template.getAvatar === 'function' ? template.getAvatar() : '')
    const tplSummary =
        typeof template.getSummary === 'function'
            ? template.getSummary()
            : template.description?.summary || ''
    const tplDescriptionText =
        typeof template.getDescription === 'function' && template.getDescription()?.getText
            ? template.getDescription().getText()
            : template.description?.text || ''

    const report = {
        templateId: tplId,
        templateName: tplName,
        addedStats: [],
        skippedStats: [],
        addedSkills: [],
        skippedSkills: [],
        addedVitals: [],
        skippedVitals: [],
        addedAttributes: [],
        skippedAttributes: [],
        addedTags: [],
        skippedTags: [],
        appliedAvatar: false,
        appliedSummary: false,
        appliedDescription: false,
        totalAdded: 0,
        totalSkipped: 0,
    }

    // 1. Stats deduplication & merge
    const tplStats = extractTemplateStats(template)
    const currentStats = state.getNpcStatsArray()
    tplStats.forEach(st => {
        const norm = normalizeName(st.name)
        const exists = currentStats.some(s => normalizeName(s.name) === norm)
        if (exists) {
            report.skippedStats.push(st.name)
        } else {
            state.addNpcStatState(st.name, st.value, false)
            report.addedStats.push(st.name)
        }
    })

    // 2. Skills deduplication & merge
    const tplSkills = extractTemplateSkills(template)
    const currentSkills = state.getNpcSkillsArray()
    tplSkills.forEach(sk => {
        const norm = normalizeName(sk.name)
        const exists = currentSkills.some(s => normalizeName(s.name) === norm)
        if (exists) {
            report.skippedSkills.push(sk.name)
        } else {
            state.addNpcSkillState(sk.name, sk.mode, sk.value, sk.statName, sk.modifier, false)
            report.addedSkills.push(sk.name)
        }
    })

    // 3. Vitals / Parameters deduplication & merge
    const tplVitals = extractTemplateVitals(template)
    const currentVitals = state.getNpcVitalsArray()
    tplVitals.forEach(vit => {
        const norm = normalizeName(vit.name)
        const exists = currentVitals.some(v => normalizeName(v.name) === norm)
        if (exists) {
            report.skippedVitals.push(vit.name)
        } else {
            state.addNpcVitalState(vit.name, vit.mode, vit.value, vit.formula, false)
            report.addedVitals.push(vit.name)
        }
    })

    // 4. Custom Attributes deduplication & merge
    const tplAttributes = extractTemplateAttributes(template)
    const currentAttributes = state.getCustomAttributesArray()
    tplAttributes.forEach(attr => {
        const norm = normalizeName(attr.name)
        const exists = currentAttributes.some(a => normalizeName(a.name) === norm)
        if (exists) {
            report.skippedAttributes.push(attr.name)
        } else {
            state.addCustomAttributeState(attr.name, attr.value, false)
            report.addedAttributes.push(attr.name)
        }
    })

    // 5. Tags deduplication & merge
    const tplTags = extractTemplateTags(template)
    const currentTags = state.getNpcTags()
    tplTags.forEach(tObj => {
        const norm = normalizeName(tObj.name)
        const exists = currentTags.some(t => normalizeName(t.name) === norm)
        if (exists) {
            report.skippedTags.push(tObj.name)
        } else {
            state.addNpcTagState(tObj.name, tObj.color)
            report.addedTags.push(tObj.name)
        }
    })

    // 6. Avatar - apply if current avatar is default and template has custom avatar
    if (tplAvatar && tplAvatar !== 'warrior' && state.getCurrentAvatarId() === 'warrior') {
        state.setCurrentAvatarId(tplAvatar)
        if (typeof options.setAvatar === 'function') {
            options.setAvatar(tplAvatar)
        }
        report.appliedAvatar = true
    }

    // 7. Summary & Description - fill if current is empty
    if (
        tplSummary &&
        typeof options.getSummary === 'function' &&
        typeof options.setSummary === 'function'
    ) {
        const curSum = options.getSummary()
        if (!curSum || curSum.trim() === '') {
            options.setSummary(tplSummary)
            report.appliedSummary = true
        }
    }

    if (
        tplDescriptionText &&
        typeof options.getDescription === 'function' &&
        typeof options.setDescription === 'function'
    ) {
        const curDesc = options.getDescription()
        if (!curDesc || curDesc.trim() === '') {
            options.setDescription(tplDescriptionText)
            report.appliedDescription = true
        }
    }

    // 8. Track applied template in state
    state.addAppliedTemplateState({
        id: tplId,
        name: tplName,
        avatar: tplAvatar || 'warrior',
    })

    report.totalAdded =
        report.addedStats.length +
        report.addedSkills.length +
        report.addedVitals.length +
        report.addedAttributes.length +
        report.addedTags.length

    report.totalSkipped =
        report.skippedStats.length +
        report.skippedSkills.length +
        report.skippedVitals.length +
        report.skippedAttributes.length +
        report.skippedTags.length

    return report
}
