import { t } from '../../../dist/Utils/translate.js'
import * as state from './npcState.js'

/**
 * @typedef {object} TraitsCountBreakdown
 * @property {number} stats
 * @property {number} parameters
 * @property {number} skills
 * @property {number} features
 * @property {number} [tags]
 * @property {number} total
 */

/**
 * @typedef {object} DynamicTraitsCounts
 * @property {TraitsCountBreakdown} project
 * @property {TraitsCountBreakdown} npc
 */

/**
 * Dynamically counts how many traits, attributes, parameters, and skills exist
 * in the active project ("Cechy i atrybuty") as well as on the NPC card.
 *
 * @param {object} [ctx]
 * @returns {DynamicTraitsCounts}
 */
export function getTraitsCounts(ctx) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const vm = effectiveCtx.vm

    // 1. Project traits from "Cechy i atrybuty"
    const projectStats =
        effectiveCtx.projectStats || (vm?.project?.getStats ? vm.project.getStats() : []) || []
    const projectParameters =
        effectiveCtx.projectParameters ||
        (vm?.project?.getGlobalParameters ? vm.project.getGlobalParameters() : []) ||
        []
    const projectSkills =
        effectiveCtx.projectSkills || (vm?.project?.getSkills ? vm.project.getSkills() : []) || []
    const projectFeatures =
        effectiveCtx.projectFeatures ||
        (vm?.project?.getFeatures ? vm.project.getFeatures() : []) ||
        []
    const projectTags =
        effectiveCtx.projectTags || (vm?.project?.getTags ? vm.project.getTags() : []) || []

    const statsCount = Array.isArray(projectStats) ? projectStats.length : 0
    const parametersCount = Array.isArray(projectParameters) ? projectParameters.length : 0
    const skillsCount = Array.isArray(projectSkills) ? projectSkills.length : 0
    const featuresCount = Array.isArray(projectFeatures) ? projectFeatures.length : 0
    const tagsCount = Array.isArray(projectTags) ? projectTags.length : 0

    // 2. Active NPC form counts
    const npcStats = state.getNpcStats() || []
    const npcVitals = state.getNpcVitals() || []
    const npcSkills = state.getNpcSkills() || []
    const npcFeatures = state.getCustomAttributes() || []
    const npcTags = state.getNpcTags() || []

    const npcStatsCount = Array.isArray(npcStats) ? npcStats.length : 0
    const npcVitalsCount = Array.isArray(npcVitals) ? npcVitals.length : 0
    const npcSkillsCount = Array.isArray(npcSkills) ? npcSkills.length : 0
    const npcFeaturesCount = Array.isArray(npcFeatures) ? npcFeatures.length : 0
    const npcTagsCount = Array.isArray(npcTags) ? npcTags.length : 0

    return {
        project: {
            stats: statsCount,
            parameters: parametersCount,
            skills: skillsCount,
            features: featuresCount,
            tags: tagsCount,
            total: statsCount + parametersCount + skillsCount + featuresCount,
        },
        npc: {
            stats: npcStatsCount,
            parameters: npcVitalsCount,
            skills: npcSkillsCount,
            features: npcFeaturesCount,
            tags: npcTagsCount,
            total: npcStatsCount + npcVitalsCount + npcSkillsCount + npcFeaturesCount,
        },
    }
}

/**
 * Updates the dynamic counter module in the NPC creation panel.
 *
 * @param {object} [ctx]
 * @returns {DynamicTraitsCounts}
 */
export function updateTraitsCounterUI(ctx) {
    const counts = getTraitsCounts(ctx)

    // Total project traits badge
    const totalBadge = document.getElementById('npc-traits-total-badge')
    if (totalBadge) {
        totalBadge.textContent = String(counts.project.total)
        totalBadge.title = `${counts.project.total} ${t('npc.traits_in_project', 'elementów w projekcie')}`
    }

    // Individual category count values
    const statVal = document.getElementById('npc-counter-stats-val')
    if (statVal) {
        statVal.textContent = String(counts.project.stats)
    }
    const statContainer = document.getElementById('npc-counter-stat')
    if (statContainer) {
        statContainer.title = `${t('left_panel.stats_section', 'Cechy')}: ${counts.project.stats} ${t('npc.in_project', 'w projekcie')} · ${counts.npc.stats} ${t('npc.on_card', 'na karcie')}`
    }

    const paramVal = document.getElementById('npc-counter-vitals-val')
    if (paramVal) {
        paramVal.textContent = String(counts.project.parameters)
    }
    const paramContainer = document.getElementById('npc-counter-vital')
    if (paramContainer) {
        paramContainer.title = `${t('left_panel.parameters_section', 'Parametry')}: ${counts.project.parameters} ${t('npc.in_project', 'w projekcie')} · ${counts.npc.parameters} ${t('npc.on_card', 'na karcie')}`
    }

    const skillVal = document.getElementById('npc-counter-skills-val')
    if (skillVal) {
        skillVal.textContent = String(counts.project.skills)
    }
    const skillContainer = document.getElementById('npc-counter-skill')
    if (skillContainer) {
        skillContainer.title = `${t('left_panel.skills_section', 'Umiejętności')}: ${counts.project.skills} ${t('npc.in_project', 'w projekcie')} · ${counts.npc.skills} ${t('npc.on_card', 'na karcie')}`
    }

    const attrVal = document.getElementById('npc-counter-attributes-val')
    if (attrVal) {
        attrVal.textContent = String(counts.project.features)
    }
    const attrContainer = document.getElementById('npc-counter-attribute')
    if (attrContainer) {
        attrContainer.title = `${t('left_panel.features_section', 'Atrybuty')}: ${counts.project.features} ${t('npc.in_project', 'w projekcie')} · ${counts.npc.features} ${t('npc.on_card', 'na karcie')}`
    }

    return counts
}
