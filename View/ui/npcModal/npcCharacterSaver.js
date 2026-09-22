/**
 * Handles validation, domain/ViewModel creation, and persistence of NPC characters.
 */

import { toast } from '../../../dist/Utils/toast.js'
import { t } from '../../../dist/Utils/translate.js'
import { evaluateFormula } from './formulaEvaluator.js'
import * as state from './npcState.js'

/**
 * Validates and saves the NPC character, adding it to project data and refreshing the UI.
 *
 * @param {object} [ctx] Application UI context
 * @param {object} [options] Callbacks and field getters
 * @param {() => string} options.getName
 * @param {() => string} options.getSummary
 * @param {() => string} options.getDescription
 * @param {() => void} options.closeModal
 * @param {() => void} options.resetForm
 * @returns {object|null} Created character object or null if validation failed
 */
export function saveNpcCharacter(ctx, options = {}) {
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const name = (options.getName ? options.getName() : '').trim()
    const errorBox = document.getElementById('npc-create-error-message')
    const nameInput = document.getElementById('npc-name-input')

    if (!name) {
        if (errorBox) errorBox.classList.remove('hidden')
        if (nameInput) {
            nameInput.classList.add('border-red-500', 'focus:border-red-500')
            if (typeof nameInput.focus === 'function') nameInput.focus()
        }
        return null
    }

    if (errorBox) errorBox.classList.add('hidden')
    if (nameInput) {
        nameInput.classList.remove('border-red-500', 'focus:border-red-500')
    }

    const summary = options.getSummary ? options.getSummary() : ''
    const descriptionText = options.getDescription ? options.getDescription() : ''
    const avatarId = state.getCurrentAvatarId()
    const customAttrs = state.getCustomAttributes()
    const stats = state.getNpcStats()
    const skills = state.getNpcSkills()
    const vitals = state.getNpcVitals(evaluateFormula)

    const charId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    let createdCharacter = null

    if (effectiveCtx.vm && typeof effectiveCtx.vm.createCharacter === 'function') {
        createdCharacter = effectiveCtx.vm.createCharacter(name)
        createdCharacter.avatar = avatarId
        if (createdCharacter.getDescription) {
            const desc = createdCharacter.getDescription()
            if (desc && typeof desc.setSummary === 'function') desc.setSummary(summary)
            if (desc && typeof desc.setText === 'function') desc.setText(descriptionText)
        }
        if (typeof createdCharacter.setStats === 'function') {
            stats.forEach(s => {
                if (effectiveCtx.vm.createStat) {
                    const statObj = effectiveCtx.vm.createStat(s.name)
                    if (statObj && statObj.setValue) statObj.setValue(s.value)
                    createdCharacter.addStat(statObj)
                }
            })
        }
        createdCharacter.customAttributes = customAttrs
        createdCharacter.vitals = vitals
        createdCharacter.skillsData = skills
    } else {
        createdCharacter = {
            id: charId,
            name,
            avatar: avatarId,
            description: {
                summary,
                text: descriptionText,
                getSummary() {
                    return this.summary
                },
                getText() {
                    return this.text
                },
            },
            stats: stats.map((s, i) => ({
                id: `stat_${Date.now()}_${i}`,
                name: s.name,
                value: s.value,
                getId() {
                    return this.id
                },
                getName() {
                    return this.name
                },
                getValue() {
                    return this.value
                },
            })),
            skills: skills.map((sk, i) => ({
                id: `skill_${Date.now()}_${i}`,
                name: sk.name,
                mode: sk.mode,
                value: sk.value,
                statName: sk.statName,
                modifier: sk.modifier,
                getId() {
                    return this.id
                },
                getName() {
                    return this.name
                },
            })),
            features: [
                ...customAttrs.map((attr, i) => ({
                    id: `attr_${Date.now()}_${i}`,
                    name: attr.name,
                    value: attr.value,
                    type: 'attribute',
                    getId() {
                        return this.id
                    },
                    getName() {
                        return this.name
                    },
                    getValue() {
                        return this.value
                    },
                })),
                ...vitals.map(vit => ({
                    id: `vital_${Date.now()}_${vit.name}`,
                    name: vit.name,
                    mode: vit.mode,
                    value: vit.value,
                    formula: vit.formula,
                    calculatedValue: vit.calculatedValue,
                    type: 'vital',
                    getId() {
                        return this.id
                    },
                    getName() {
                        return this.name
                    },
                    getValue() {
                        return vit.calculatedValue !== null ? vit.calculatedValue : vit.value
                    },
                })),
            ],
            tags: [],
            getId() {
                return this.id
            },
            getName() {
                return this.name
            },
            setName(n) {
                this.name = n
            },
            getDescription() {
                return this.description
            },
            getStats() {
                return this.stats
            },
            getSkills() {
                return this.skills
            },
            getFeatures() {
                return this.features
            },
            getTags() {
                return this.tags
            },
            toJSON() {
                return {
                    id: this.id,
                    name: this.name,
                    avatar: this.avatar,
                    description: {
                        summary: this.description.summary,
                        text: this.description.text,
                    },
                    stats: this.stats.map(s => ({ id: s.id, name: s.name, value: s.value })),
                    skills: this.skills,
                    features: this.features,
                    tags: this.tags,
                }
            },
        }
    }

    // Add to projectCharacters array
    if (Array.isArray(effectiveCtx.projectCharacters)) {
        effectiveCtx.projectCharacters.push(createdCharacter)
    }

    // Add to ViewModel project if available
    if (effectiveCtx.vm?.project && typeof effectiveCtx.vm.project.addCharacter === 'function') {
        effectiveCtx.vm.project.addCharacter(createdCharacter)
    }

    // Refresh drawer list
    if (typeof effectiveCtx.renderCharactersList === 'function') {
        effectiveCtx.renderCharactersList(effectiveCtx)
    }

    // Show success notification
    if (toast && typeof toast.success === 'function') {
        const successMsg =
            typeof t === 'function'
                ? t('npc.created_success_msg', { name })
                : `Pomyślnie utworzono postać ${name}`
        const successTitle =
            typeof t === 'function' ? t('npc.created_success_title') : 'Postać utworzona'
        toast.success(successMsg, successTitle)
    }

    if (typeof options.closeModal === 'function') {
        options.closeModal()
    }
    if (typeof options.resetForm === 'function') {
        options.resetForm()
    }

    return createdCharacter
}
