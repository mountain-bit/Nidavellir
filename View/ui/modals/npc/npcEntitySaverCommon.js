/**
 * Common Entity Persistence Engine for NPC Characters and NPC Templates.
 * Provides unified validation, trait extraction, domain synchronization,
 * global pool registration, and UI refresh logic.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import { evaluateFormula } from './formulaEvaluator.js'
import { syncActiveModalInputs } from './npcSectionControllers.js'
import * as state from './npcState.js'

/**
 * Registers unique stats, parameters, skills, tags, and features into project-wide global pools.
 *
 * @param {object} effectiveCtx
 * @param {object} vm
 * @param {object} traits
 */
function registerGlobalProjectTraits(effectiveCtx, vm, traits) {
    const { stats, vitals, skills, selectedTags, customAttrs } = traits

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
                let globalParam = null
                if (vm?.createParameter) {
                    globalParam = vm.createParameter(pName, v.mode, v.value, v.formula)
                    if (typeof globalParam.setMode === 'function') globalParam.setMode(v.mode)
                    if (typeof globalParam.setValue === 'function') globalParam.setValue(v.value)
                    if (typeof globalParam.setFormula === 'function') {
                        globalParam.setFormula(v.formula)
                    }
                    if (typeof globalParam.setCalculatedValue === 'function') {
                        globalParam.setCalculatedValue(v.calculatedValue)
                    }
                } else {
                    globalParam = {
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
                let globalSkill = null
                if (vm?.createSkill) {
                    globalSkill = vm.createSkill(
                        skName,
                        sk.mode,
                        sk.value,
                        sk.statName,
                        sk.modifier
                    )
                    if (typeof globalSkill.setMode === 'function') globalSkill.setMode(sk.mode)
                    if (typeof globalSkill.setValue === 'function') globalSkill.setValue(sk.value)
                    if (typeof globalSkill.setStatName === 'function') {
                        globalSkill.setStatName(sk.statName)
                    }
                    if (typeof globalSkill.setModifier === 'function') {
                        globalSkill.setModifier(sk.modifier)
                    }
                } else {
                    globalSkill = {
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
}

/**
 * Creates fallback plain entity object when ViewModel is not available.
 *
 * @param {string} id
 * @param {string} name
 * @param {string} avatarId
 * @param {string} summary
 * @param {string} descriptionText
 * @param {object} traits
 * @returns {object}
 */
function createFallbackPlainEntity(id, name, avatarId, summary, descriptionText, traits) {
    const { stats, skills, vitals, customAttrs, selectedTags } = traits

    return {
        id,
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
        getSummary() {
            return this.description.summary
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
        getCustomAttributes() {
            return this.customAttributes
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
                customAttributes: this.customAttributes,
            }
        },
    }
}

/**
 * Refreshes UI lists in active application context.
 *
 * @param {object} effectiveCtx
 */
function refreshUiLists(effectiveCtx) {
    if (typeof effectiveCtx.renderCharactersList === 'function') {
        effectiveCtx.renderCharactersList(effectiveCtx)
    } else if (typeof effectiveCtx.refreshCharactersList === 'function') {
        effectiveCtx.refreshCharactersList(effectiveCtx)
    }
    if (typeof effectiveCtx.renderTraitsList === 'function') {
        effectiveCtx.renderTraitsList(effectiveCtx)
    } else if (typeof effectiveCtx.refreshTraitsList === 'function') {
        effectiveCtx.refreshTraitsList(effectiveCtx)
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
    if (typeof effectiveCtx.renderDetailsPanel === 'function') {
        effectiveCtx.renderDetailsPanel(effectiveCtx)
    }
}

/**
 * Core polymorphic entity saver for NPC Characters and NPC Templates.
 *
 * @param {object} config Configuration defining entity type, messages, and VM factories
 * @param {object} [ctx] Application UI context
 * @param {object} [options]
 * @returns {object|null}
 */
export function saveNpcEntity(config, ctx, options = {}) {
    syncActiveModalInputs()
    const effectiveCtx = ctx || state.getActiveCtx() || {}
    const name = (options.getName ? options.getName() : '').trim()
    const errorBox = document.getElementById('npc-create-error-message')
    const nameInput = document.getElementById('npc-name-input')

    if (!name) {
        if (errorBox) {
            errorBox.classList.remove('hidden')
            const textSpan = errorBox.querySelector('span')
            if (textSpan) {
                textSpan.textContent =
                    typeof t === 'function'
                        ? t(config.validationRequiredMsgKey)
                        : config.defaultValidationMsg
            }
        }
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

    const entityId = `${config.idPrefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const vm = effectiveCtx.vm
    const editingEntity = state.getEditingEntity()
    const isEdit = Boolean(editingEntity)

    let createdEntity = null

    if (isEdit) {
        createdEntity = editingEntity
        if (typeof createdEntity.setName === 'function') {
            createdEntity.setName(name)
        } else {
            createdEntity.name = name
        }

        createdEntity.avatar = avatarId
        if (typeof createdEntity.setAvatar === 'function') {
            createdEntity.setAvatar(avatarId)
        }

        if (typeof createdEntity.getDescription === 'function') {
            const desc = createdEntity.getDescription()
            if (desc) {
                if (typeof desc.setSummary === 'function') desc.setSummary(summary)
                if (typeof desc.setText === 'function') desc.setText(descriptionText)
            }
        } else if (createdEntity.description) {
            createdEntity.description.summary = summary
            createdEntity.description.text = descriptionText
        }

        // 1. Stats
        const newStats = stats
            .filter(s => (s.name || '').trim())
            .map((s, i) => {
                const statName = s.name.trim()
                const statObj =
                    vm && typeof vm.createStat === 'function' ? vm.createStat(statName) : null
                if (statObj) {
                    if (typeof statObj.setValue === 'function') statObj.setValue(s.value)
                    return statObj
                }
                return {
                    id: s.id || `stat_${Date.now()}_${i}`,
                    name: statName,
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
                    setValue(v) {
                        this.value = v
                    },
                }
            })
        if (typeof createdEntity.setStats === 'function') {
            createdEntity.setStats(newStats)
        } else {
            createdEntity.stats = newStats
        }

        // 2. Parameters / Vitals
        const newVitals = vitals
            .filter(v => (v.name || '').trim())
            .map((v, i) => {
                const paramName = v.name.trim()
                const paramObj =
                    vm && typeof vm.createParameter === 'function'
                        ? vm.createParameter(paramName, v.mode, v.value, v.formula)
                        : null
                if (paramObj) {
                    if (typeof paramObj.setMode === 'function') paramObj.setMode(v.mode)
                    if (typeof paramObj.setValue === 'function') paramObj.setValue(v.value)
                    if (typeof paramObj.setFormula === 'function') paramObj.setFormula(v.formula)
                    if (typeof paramObj.setCalculatedValue === 'function') {
                        paramObj.setCalculatedValue(v.calculatedValue)
                    }
                    return paramObj
                }
                return {
                    id: v.id || `vital_${Date.now()}_${i}`,
                    name: paramName,
                    mode: v.mode,
                    value: v.value,
                    formula: v.formula,
                    calculatedValue: v.calculatedValue,
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
                }
            })
        if (typeof createdEntity.setParameters === 'function') {
            createdEntity.setParameters(newVitals)
        } else {
            createdEntity.parameters = newVitals
        }

        // 3. Skills
        const newSkills = skills
            .filter(sk => (sk.name || '').trim())
            .map((sk, i) => {
                const skillName = sk.name.trim()
                const skillObj =
                    vm && typeof vm.createSkill === 'function'
                        ? vm.createSkill(skillName, sk.mode, sk.value, sk.statName, sk.modifier)
                        : null
                if (skillObj) {
                    if (typeof skillObj.setMode === 'function') skillObj.setMode(sk.mode)
                    if (typeof skillObj.setValue === 'function') skillObj.setValue(sk.value)
                    if (typeof skillObj.setStatName === 'function') {
                        skillObj.setStatName(sk.statName)
                    }
                    if (typeof skillObj.setModifier === 'function') {
                        skillObj.setModifier(sk.modifier)
                    }
                    return skillObj
                }
                return {
                    id: sk.id || `skill_${Date.now()}_${i}`,
                    name: skillName,
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
            })
        if (typeof createdEntity.setSkills === 'function') {
            createdEntity.setSkills(newSkills)
        } else {
            createdEntity.skills = newSkills
        }

        // 4. Features & Custom Attributes
        const newFeatures = customAttrs
            .filter(attr => (attr.name || '').trim())
            .map((attr, i) => {
                const attrName = attr.name.trim()
                const featObj =
                    vm && typeof vm.createFeature === 'function'
                        ? vm.createFeature(attrName, attr.value)
                        : null
                if (featObj) return featObj
                return {
                    id: `attr_${Date.now()}_${i}`,
                    name: attrName,
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
                }
            })
        if (typeof createdEntity.setFeatures === 'function') {
            createdEntity.setFeatures(newFeatures)
        } else {
            createdEntity.features = newFeatures
        }
        if (typeof createdEntity.setCustomAttributes === 'function') {
            createdEntity.setCustomAttributes(customAttrs)
        } else {
            createdEntity.customAttributes = customAttrs
        }

        // 5. Tags
        const newTags = selectedTags
            .filter(t => (t.name || '').trim())
            .map((t, i) => {
                const tagName = t.name.trim()
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
                if (!tagObj && vm && typeof vm.createTag === 'function') {
                    tagObj = vm.createTag(tagName, t.color || '#3b82f6')
                }
                if (!tagObj) {
                    tagObj = {
                        id: t.id || `tag_${Date.now()}_${i}`,
                        name: tagName,
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
                }
                return tagObj
            })
        if (typeof createdEntity.setTags === 'function') {
            createdEntity.setTags(newTags)
        } else {
            createdEntity.tags = newTags
        }

        createdEntity.customAttributes = customAttrs
        createdEntity.vitals = vitals
        createdEntity.skillsData = skills
    } else {
        const vmEntity =
            vm && typeof config.createVmEntity === 'function'
                ? config.createVmEntity(vm, name)
                : null

        if (vmEntity) {
            createdEntity = vmEntity
            if (createdEntity.setId) createdEntity.setId(entityId)
            createdEntity.avatar = avatarId
            if (typeof createdEntity.setAvatar === 'function') {
                createdEntity.setAvatar(avatarId)
            }

            if (createdEntity.getDescription) {
                const desc = createdEntity.getDescription()
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
                    createdEntity.addStat(statObj)
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
                    if (typeof paramObj.setMode === 'function') paramObj.setMode(v.mode)
                    if (typeof paramObj.setValue === 'function') paramObj.setValue(v.value)
                    if (typeof paramObj.setFormula === 'function') paramObj.setFormula(v.formula)
                    if (typeof paramObj.setCalculatedValue === 'function') {
                        paramObj.setCalculatedValue(v.calculatedValue)
                    }
                    if (typeof createdEntity.addParameter === 'function') {
                        createdEntity.addParameter(paramObj)
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
                    if (typeof skillObj.setMode === 'function') skillObj.setMode(sk.mode)
                    if (typeof skillObj.setValue === 'function') skillObj.setValue(sk.value)
                    if (typeof skillObj.setStatName === 'function') {
                        skillObj.setStatName(sk.statName)
                    }
                    if (typeof skillObj.setModifier === 'function') {
                        skillObj.setModifier(sk.modifier)
                    }
                    if (typeof createdEntity.addSkill === 'function') {
                        createdEntity.addSkill(skillObj)
                    }
                }
            })

            // 4. Features / Attributes
            customAttrs.forEach(attr => {
                const attrName = (attr.name || '').trim()
                if (!attrName) return
                const featObj = vm.createFeature ? vm.createFeature(attrName, attr.value) : null
                if (featObj) {
                    if (typeof createdEntity.addFeature === 'function') {
                        createdEntity.addFeature(featObj)
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
                if (tagObj && typeof createdEntity.addTag === 'function') {
                    createdEntity.addTag(tagObj)
                }
            })

            createdEntity.customAttributes = customAttrs
            createdEntity.vitals = vitals
            createdEntity.skillsData = skills
        } else {
            createdEntity = createFallbackPlainEntity(
                entityId,
                name,
                avatarId,
                summary,
                descriptionText,
                { stats, skills, vitals, customAttrs, selectedTags }
            )
        }
    }

    // Register globally
    registerGlobalProjectTraits(effectiveCtx, vm, {
        stats,
        vitals,
        skills,
        selectedTags,
        customAttrs,
    })

    // Project persistence
    if (!isEdit) {
        if (typeof config.addToProject === 'function') {
            config.addToProject(effectiveCtx, vm, createdEntity)
        }
    } else {
        if (
            vm?.getSelectedItem()?.id === createdEntity.getId?.() ||
            vm?.getSelectedItem()?.id === createdEntity.id
        ) {
            vm.selectedItem.name = name
        }
    }

    // Persist to disk via Electron IPC if available
    const projectPath =
        effectiveCtx.projectPath ||
        (typeof effectiveCtx.getProjectPath === 'function' ? effectiveCtx.getProjectPath() : '') ||
        ''
    if (
        config.ipcCategory &&
        projectPath &&
        typeof window !== 'undefined' &&
        window.electronAPI &&
        typeof window.electronAPI.createEntity === 'function'
    ) {
        const payloadData =
            typeof createdEntity.toJSON === 'function' ? createdEntity.toJSON() : createdEntity
        window.electronAPI
            .createEntity({
                projectPath,
                category: config.ipcCategory,
                entityData: payloadData,
                folderName: name,
            })
            .catch(err => {
                console.warn(`Could not persist ${config.entityType} to disk via IPC:`, err)
            })
    }

    // Refresh UI
    refreshUiLists(effectiveCtx)

    // Show toast notification
    if (toast && typeof toast.success === 'function') {
        const successMsg = isEdit
            ? typeof t === 'function'
                ? t(config.updatedSuccessMsgKey, { name })
                : config.defaultUpdatedMsg(name)
            : typeof t === 'function'
              ? t(config.createdSuccessMsgKey, { name })
              : config.defaultCreatedMsg(name)
        const successTitle = isEdit
            ? typeof t === 'function'
                ? t(config.updatedSuccessTitleKey)
                : config.defaultUpdatedTitle
            : typeof t === 'function'
              ? t(config.createdSuccessTitleKey)
              : config.defaultCreatedTitle
        toast.success(successMsg, successTitle)
    }

    state.setEditingEntity(null)

    if (typeof options.closeModal === 'function') {
        options.closeModal()
    }
    if (typeof options.resetForm === 'function') {
        options.resetForm()
    }

    return createdEntity
}
