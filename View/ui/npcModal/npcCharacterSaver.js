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
    const avatarId = state.getCurrentAvatarId() || 'warrior'
    const customAttrs = state.getCustomAttributes()
    const stats = state.getNpcStats()
    const skills = state.getNpcSkills()
    const vitals = state.getNpcVitals(evaluateFormula)
    const selectedTags = state.getNpcTags()

    const charId = `char_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const vm = effectiveCtx.vm

    let createdCharacter = null

    if (vm && typeof vm.createCharacter === 'function') {
        createdCharacter = vm.createCharacter(name)
        if (createdCharacter.setId) createdCharacter.setId(charId)
        createdCharacter.avatar = avatarId
        if (typeof createdCharacter.setAvatar === 'function') {
            createdCharacter.setAvatar(avatarId)
        }

        if (createdCharacter.getDescription) {
            const desc = createdCharacter.getDescription()
            if (desc && typeof desc.setSummary === 'function') desc.setSummary(summary)
            if (desc && typeof desc.setText === 'function') desc.setText(descriptionText)
        }

        // 1. Stats
        stats.forEach(s => {
            const statName = (s.name || '').trim()
            if (!statName) return
            const statObj = vm.createStat ? vm.createStat(statName) : null
            if (statObj) {
                if (statObj.setValue) statObj.setValue(s.value)
                createdCharacter.addStat(statObj)
            }
        })

        // 2. Parameters / Vitals
        vitals.forEach(v => {
            const paramName = (v.name || '').trim()
            if (!paramName) return
            const paramObj = vm.createParameter
                ? vm.createParameter(paramName, v.mode, v.value, v.formula)
                : null
            if (paramObj) {
                if (paramObj.setCalculatedValue) paramObj.setCalculatedValue(v.calculatedValue)
                if (typeof createdCharacter.addParameter === 'function') {
                    createdCharacter.addParameter(paramObj)
                }
            }
        })

        // 3. Skills
        skills.forEach(sk => {
            const skillName = (sk.name || '').trim()
            if (!skillName) return
            const skillObj = vm.createSkill
                ? vm.createSkill(skillName, sk.mode, sk.value, sk.statName, sk.modifier)
                : null
            if (skillObj) {
                if (typeof createdCharacter.addSkill === 'function') {
                    createdCharacter.addSkill(skillObj)
                }
            }
        })

        // 4. Features / Attributes
        customAttrs.forEach(attr => {
            const attrName = (attr.name || '').trim()
            if (!attrName) return
            const featObj = vm.createFeature ? vm.createFeature(attrName, attr.value) : null
            if (featObj) {
                if (typeof createdCharacter.addFeature === 'function') {
                    createdCharacter.addFeature(featObj)
                }
            }
        })

        // 5. Tags
        selectedTags.forEach(t => {
            const tagName = (t.name || '').trim()
            if (!tagName) return
            let tagObj = null
            if (Array.isArray(effectiveCtx.projectTags)) {
                tagObj = effectiveCtx.projectTags.find(
                    pt =>
                        (typeof pt.getName === 'function'
                            ? pt.getName()
                            : pt.name || ''
                        ).toLowerCase() === tagName.toLowerCase()
                )
            }
            if (!tagObj && vm.createTag) {
                tagObj = vm.createTag(tagName, t.color || '#3b82f6')
            }
            if (tagObj && typeof createdCharacter.addTag === 'function') {
                createdCharacter.addTag(tagObj)
            }
        })

        // Preserve raw fields for backwards compatibility with tests / plain views
        createdCharacter.customAttributes = customAttrs
        createdCharacter.vitals = vitals
        createdCharacter.skillsData = skills
    } else {
        // Plain object fallback when ViewModel is not available
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
                getMode() {
                    return this.mode
                },
                getValue() {
                    return this.value
                },
                getStatName() {
                    return this.statName
                },
                getModifier() {
                    return this.modifier
                },
            })),
            parameters: vitals.map(vit => ({
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
                getMode() {
                    return this.mode
                },
                getValue() {
                    return this.value
                },
                getFormula() {
                    return this.formula
                },
                getCalculatedValue() {
                    return this.calculatedValue
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
                    getDescription() {
                        return { getText: () => this.value }
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
            tags: selectedTags.map(t => ({
                id: t.id || `tag_${Date.now()}_${t.name}`,
                name: t.name,
                color: t.color || '#3b82f6',
                getId() {
                    return this.id
                },
                getName() {
                    return this.name
                },
                getColor() {
                    return this.color
                },
            })),
            customAttributes: customAttrs,
            vitals,
            skillsData: skills,
            getId() {
                return this.id
            },
            getName() {
                return this.name
            },
            setName(n) {
                this.name = n
            },
            getAvatar() {
                return this.avatar
            },
            setAvatar(a) {
                this.avatar = a
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
            getParameters() {
                return this.parameters
            },
            getFeatures() {
                return this.features
            },
            getTags() {
                return this.tags
            },
            addStat(s) {
                this.stats.push(s)
            },
            addSkill(sk) {
                this.skills.push(sk)
            },
            addParameter(p) {
                this.parameters.push(p)
            },
            addFeature(f) {
                this.features.push(f)
            },
            addTag(t) {
                this.tags.push(t)
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
                    parameters: this.parameters,
                    features: this.features,
                    tags: this.tags,
                }
            },
        }
    }

    // ==========================================
    // Register unique items globally in application
    // ==========================================

    // 1. Global Stats
    if (Array.isArray(effectiveCtx.projectStats)) {
        stats.forEach(s => {
            const sName = (s.name || '').trim()
            if (!sName) return
            const exists = effectiveCtx.projectStats.some(
                ps =>
                    (typeof ps.getName === 'function'
                        ? ps.getName()
                        : ps.name || ''
                    ).toLowerCase() === sName.toLowerCase()
            )
            if (!exists) {
                const globalStat = vm?.createStat
                    ? vm.createStat(sName)
                    : {
                          id: `stat_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          name: sName,
                          value: s.value,
                          getId() {
                              return this.id
                          },
                          getName() {
                              return this.name
                          },
                      }
                if (globalStat.setValue) globalStat.setValue(s.value)
                effectiveCtx.projectStats.push(globalStat)
                if (vm?.project && typeof vm.project.addStat === 'function') {
                    vm.project.addStat(globalStat)
                }
            }
        })
    }

    // 2. Global Parameters
    if (Array.isArray(effectiveCtx.projectParameters)) {
        vitals.forEach(v => {
            const pName = (v.name || '').trim()
            if (!pName) return
            const exists = effectiveCtx.projectParameters.some(
                pp =>
                    (typeof pp.getName === 'function'
                        ? pp.getName()
                        : pp.name || ''
                    ).toLowerCase() === pName.toLowerCase()
            )
            if (!exists) {
                const globalParam = vm?.createParameter
                    ? vm.createParameter(pName, v.mode, v.value, v.formula)
                    : {
                          id: `param_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          name: pName,
                          mode: v.mode,
                          value: v.value,
                          formula: v.formula,
                          calculatedValue: v.calculatedValue,
                          getId() {
                              return this.id
                          },
                          getName() {
                              return this.name
                          },
                          getMode() {
                              return this.mode
                          },
                          getValue() {
                              return this.value
                          },
                          getFormula() {
                              return this.formula
                          },
                          getCalculatedValue() {
                              return this.calculatedValue
                          },
                      }
                effectiveCtx.projectParameters.push(globalParam)
                if (vm?.project && typeof vm.project.addGlobalParameter === 'function') {
                    vm.project.addGlobalParameter(globalParam)
                }
            }
        })
    }

    // 3. Global Skills
    if (Array.isArray(effectiveCtx.projectSkills)) {
        skills.forEach(sk => {
            const skName = (sk.name || '').trim()
            if (!skName) return
            const exists = effectiveCtx.projectSkills.some(
                ps =>
                    (typeof ps.getName === 'function'
                        ? ps.getName()
                        : ps.name || ''
                    ).toLowerCase() === skName.toLowerCase()
            )
            if (!exists) {
                const globalSkill = vm?.createSkill
                    ? vm.createSkill(skName, sk.mode, sk.value, sk.statName, sk.modifier)
                    : {
                          id: `skill_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          name: skName,
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
                          getMode() {
                              return this.mode
                          },
                          getValue() {
                              return this.value
                          },
                          getStatName() {
                              return this.statName
                          },
                          getModifier() {
                              return this.modifier
                          },
                      }
                effectiveCtx.projectSkills.push(globalSkill)
                if (vm?.project && typeof vm.project.addSkill === 'function') {
                    vm.project.addSkill(globalSkill)
                }
            }
        })
    }

    // 4. Global Tags
    if (Array.isArray(effectiveCtx.projectTags)) {
        selectedTags.forEach(t => {
            const tName = (t.name || '').trim()
            if (!tName) return
            const exists = effectiveCtx.projectTags.some(
                pt =>
                    (typeof pt.getName === 'function'
                        ? pt.getName()
                        : pt.name || ''
                    ).toLowerCase() === tName.toLowerCase()
            )
            if (!exists) {
                const globalTag = vm?.createTag
                    ? vm.createTag(tName, t.color || '#3b82f6')
                    : {
                          id: t.id || `tag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          name: tName,
                          color: t.color || '#3b82f6',
                          getId() {
                              return this.id
                          },
                          getName() {
                              return this.name
                          },
                          getColor() {
                              return this.color
                          },
                      }
                effectiveCtx.projectTags.push(globalTag)
                if (vm?.project && typeof vm.project.addTag === 'function') {
                    vm.project.addTag(globalTag)
                }
            }
        })
    }

    // 5. Global Features / Attributes
    if (Array.isArray(effectiveCtx.projectFeatures)) {
        customAttrs.forEach(attr => {
            const aName = (attr.name || '').trim()
            if (!aName) return
            const exists = effectiveCtx.projectFeatures.some(
                pf =>
                    (typeof pf.getName === 'function'
                        ? pf.getName()
                        : pf.name || ''
                    ).toLowerCase() === aName.toLowerCase()
            )
            if (!exists) {
                const globalFeat = vm?.createFeature
                    ? vm.createFeature(aName, attr.value)
                    : {
                          id: `feat_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          name: aName,
                          value: attr.value,
                          getId() {
                              return this.id
                          },
                          getName() {
                              return this.name
                          },
                          getValue() {
                              return this.value
                          },
                      }
                effectiveCtx.projectFeatures.push(globalFeat)
                if (vm?.project && typeof vm.project.addFeature === 'function') {
                    vm.project.addFeature(globalFeat)
                }
            }
        })
    }

    // Add to projectCharacters array
    if (Array.isArray(effectiveCtx.projectCharacters)) {
        effectiveCtx.projectCharacters.push(createdCharacter)
    }

    // Add to ViewModel project if available
    if (vm?.project && typeof vm.project.addCharacter === 'function') {
        vm.project.addCharacter(createdCharacter)
    }

    // Refresh UI lists
    if (typeof effectiveCtx.renderCharactersList === 'function') {
        effectiveCtx.renderCharactersList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderTraitsList === 'function') {
        effectiveCtx.renderTraitsList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderStatsList === 'function') {
        effectiveCtx.renderStatsList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderSkillsList === 'function') {
        effectiveCtx.renderSkillsList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderParametersList === 'function') {
        effectiveCtx.renderParametersList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderTagsList === 'function') {
        effectiveCtx.renderTagsList(effectiveCtx)
    }
    if (typeof effectiveCtx.refreshProjectLists === 'function') {
        effectiveCtx.refreshProjectLists(effectiveCtx)
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
