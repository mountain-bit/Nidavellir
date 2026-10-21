/**
 * Hero Saver
 * Validates, registers global project mechanics, synchronizes PlayerCharacter domain model,
 * and persists protagonist data to project memory and disk via IPC.
 */

import { toast } from '../../../../dist/Utils/toast.js'
import { t } from '../../../../dist/Utils/translate.js'
import {
    Description,
    Inventory,
    Item,
    Parameter,
    PlayerCharacter,
    Skill,
    Stat,
    Tag,
} from '../../../../dist/ViewModel/MainWindowViewModel.js'
import { saveFullProject } from '../../project/projectSaver.js'
import { markProjectDirty } from '../../project/projectStateTracker.js'
import { evaluateFormula } from '../npc/formulaEvaluator.js'
import * as state from './heroState.js'

/**
 * Registers unique stats, parameters, and skills in the global project pool.
 *
 * @param {object} effectiveCtx
 * @param {object} vm
 * @param {object} traits
 * @returns {boolean} Whether any new trait was registered
 */
function registerGlobalProjectTraits(effectiveCtx, vm, traits) {
    const { stats, vitals, skills, selectedTags } = traits
    let anyAdded = false

    const projectStats = effectiveCtx.projectStats || effectiveCtx.projectData?.projectStats || null
    const projectParameters =
        effectiveCtx.projectParameters || effectiveCtx.projectData?.projectParameters || null
    const projectSkills =
        effectiveCtx.projectSkills || effectiveCtx.projectData?.projectSkills || null
    const projectTags = effectiveCtx.projectTags || effectiveCtx.projectData?.projectTags || null

    // 1. Global Stats
    if (Array.isArray(projectStats)) {
        stats.forEach(s => {
            const sName = (s.name || '').trim()
            if (!sName) return
            const exists = projectStats.some(
                ps =>
                    (typeof ps.getName === 'function'
                        ? ps.getName()
                        : ps.name || ''
                    ).toLowerCase() === sName.toLowerCase()
            )
            if (!exists) {
                const globalStat = vm?.createStat
                    ? vm.createStat(sName)
                    : new Stat(
                          `stat_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          sName,
                          new Description(),
                          s.value
                      )
                if (globalStat.setValue) globalStat.setValue(s.value)
                projectStats.push(globalStat)
                if (vm?.project && typeof vm.project.addGlobalStat === 'function') {
                    vm.project.addGlobalStat(globalStat)
                }
                anyAdded = true
            }
        })
    }

    // 2. Global Parameters
    if (Array.isArray(projectParameters)) {
        vitals.forEach(v => {
            const pName = (v.name || '').trim()
            if (!pName) return
            const exists = projectParameters.some(
                pp =>
                    (typeof pp.getName === 'function'
                        ? pp.getName()
                        : pp.name || ''
                    ).toLowerCase() === pName.toLowerCase()
            )
            if (!exists) {
                const globalParam = new Parameter(
                    `param_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    pName,
                    new Description(),
                    v.mode || 'direct',
                    v.value || 0,
                    v.formula || '',
                    v.calculatedValue || null
                )
                projectParameters.push(globalParam)
                if (vm?.project && typeof vm.project.addGlobalParameter === 'function') {
                    vm.project.addGlobalParameter(globalParam)
                }
                anyAdded = true
            }
        })
    }

    // 3. Global Skills
    if (Array.isArray(projectSkills)) {
        skills.forEach(sk => {
            const skName = (sk.name || '').trim()
            if (!skName) return
            const exists = projectSkills.some(
                psk =>
                    (typeof psk.getName === 'function'
                        ? psk.getName()
                        : psk.name || ''
                    ).toLowerCase() === skName.toLowerCase()
            )
            if (!exists) {
                const globalSkill = new Skill(
                    `skill_glob_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    skName,
                    new Description(),
                    sk.statName ? 'stat_mod' : 'direct',
                    sk.value || '+1',
                    sk.statName || ''
                )
                projectSkills.push(globalSkill)
                if (vm?.project && typeof vm.project.addGlobalSkill === 'function') {
                    vm.project.addGlobalSkill(globalSkill)
                }
                anyAdded = true
            }
        })
    }

    // 4. Global Tags
    if (Array.isArray(projectTags)) {
        selectedTags.forEach(tag => {
            const tName = (tag.getName ? tag.getName() : tag.name || '').trim()
            if (!tName) return
            const exists = projectTags.some(
                pt =>
                    (typeof pt.getName === 'function'
                        ? pt.getName()
                        : pt.name || ''
                    ).toLowerCase() === tName.toLowerCase()
            )
            if (!exists) {
                projectTags.push(tag)
                if (vm?.project && typeof vm.project.addTag === 'function') {
                    vm.project.addTag(tag)
                }
                anyAdded = true
            }
        })
    }

    return anyAdded
}

/**
 * Validates and persists the Player Character.
 *
 * @param {object} ctx UI context
 * @param {object} options Callbacks and input getters
 * @returns {PlayerCharacter|null}
 */
export function saveHeroCharacter(ctx, options = {}) {
    const nameInput = document.getElementById('hero-name-input')
    const summaryInput = document.getElementById('hero-summary-input')
    const errBox = document.getElementById('hero-create-error-message')
    const errText = document.getElementById('hero-create-error-text')

    const rawName = (nameInput?.value || options.getName?.() || '').trim()

    if (!rawName) {
        if (errBox) {
            errBox.classList.remove('hidden')
            if (errText) {
                errText.textContent =
                    typeof t === 'function'
                        ? t('hero.validation_name_required')
                        : 'Imię postaci gracza jest wymagane'
            }
        }
        if (nameInput) nameInput.focus()
        return null
    }

    if (errBox) errBox.classList.add('hidden')

    const effectiveCtx = ctx || (typeof window !== 'undefined' ? window.appContext : null) || {}
    const vm = effectiveCtx.vm

    const summary = (summaryInput?.value || options.getSummary?.() || '').trim()
    const narrativeDesc =
        typeof options.getDescription === 'function' ? options.getDescription() : ''
    const avatar = state.getCurrentAvatarId()
    const customAttrs = state.getCustomAttributes()
    const rawStats = state.getHeroStats()
    const rawVitals = state.getHeroVitals(evaluateFormula)
    const rawSkills = state.getHeroSkills()
    const selectedTags = state.getHeroTags()

    // Register into project traits pool
    const traitsAdded = registerGlobalProjectTraits(effectiveCtx, vm, {
        stats: rawStats,
        vitals: rawVitals,
        skills: rawSkills,
        selectedTags,
    })

    const domainStats = rawStats.map(
        s => new Stat(s.id || `stat_${Date.now()}`, s.name, new Description(), s.value ?? 10)
    )
    const domainVitals = rawVitals.map(
        v =>
            new Parameter(
                v.id || `param_${Date.now()}`,
                v.name,
                new Description(),
                v.mode || 'direct',
                v.value ?? 0,
                v.formula || '',
                v.calculatedValue ?? null
            )
    )
    const domainSkills = rawSkills.map(
        sk =>
            new Skill(
                sk.id || `skill_${Date.now()}`,
                sk.name,
                new Description(),
                sk.statName ? 'stat_mod' : 'direct',
                sk.value || '+1',
                sk.statName || ''
            )
    )
    const domainTags = selectedTags.map(tg =>
        tg instanceof Tag
            ? tg
            : new Tag(tg.id || `tag_${Date.now()}`, tg.name || '', tg.color || '#3b82f6')
    )

    const rawInventories = state.getHeroInventories()
    const domainInventories = rawInventories.map(inv => {
        const rawItems = Array.isArray(inv.items) ? inv.items : []
        const domainItems = rawItems
            .map(it => {
                const itName = (typeof it === 'string' ? it : it?.name || '').trim()
                if (!itName) return null
                return new Item(it.id || `item_${Date.now()}`, itName, new Description())
            })
            .filter(Boolean)
        return new Inventory(
            inv.id || `inv_${Date.now()}`,
            inv.name || 'Główny plecak',
            typeof inv.capacity === 'number' ? inv.capacity : 0,
            domainItems
        )
    })

    const allDomainItems = []
    domainInventories.forEach(inv => allDomainItems.push(...inv.getItems()))

    const isEdit = Boolean(state.getEditingHero())
    const heroId =
        isEdit && state.getEditingHero()?.getId?.()
            ? state.getEditingHero().getId()
            : `hero_${Date.now()}`

    const descObj = new Description(narrativeDesc, summary)
    const hero = new PlayerCharacter(
        heroId,
        rawName,
        descObj,
        domainStats,
        domainSkills,
        [],
        allDomainItems,
        null,
        avatar,
        domainVitals,
        domainTags,
        customAttrs,
        domainInventories
    )

    // Synchronize Project memory
    const targetProject =
        vm?.project ||
        effectiveCtx?.project ||
        (typeof window !== 'undefined' &&
            window?.ProjectManager?.getInstance?.()?.getProject?.()) ||
        (typeof globalThis !== 'undefined' &&
            globalThis?.ProjectManager?.getInstance?.()?.getProject?.())

    if (targetProject && typeof targetProject.setPlayerCharacter === 'function') {
        targetProject.setPlayerCharacter(hero)
    }

    if (effectiveCtx.projectData) {
        effectiveCtx.projectData.playerCharacter = hero
        if (!Array.isArray(effectiveCtx.projectData.playerCharacters)) {
            effectiveCtx.projectData.playerCharacters = []
        }
        const existingIdx = effectiveCtx.projectData.playerCharacters.findIndex(
            h => (typeof h.getId === 'function' ? h.getId() : h.id) === heroId
        )
        if (existingIdx >= 0) {
            effectiveCtx.projectData.playerCharacters[existingIdx] = hero
        } else {
            effectiveCtx.projectData.playerCharacters.push(hero)
        }
    }

    effectiveCtx.playerCharacter = hero
    if (Array.isArray(effectiveCtx.playerCharacters)) {
        const pIdx = effectiveCtx.playerCharacters.findIndex(
            h => (typeof h.getId === 'function' ? h.getId() : h.id) === heroId
        )
        if (pIdx >= 0) {
            effectiveCtx.playerCharacters[pIdx] = hero
        } else {
            effectiveCtx.playerCharacters.push(hero)
        }
    } else {
        effectiveCtx.playerCharacters = [hero]
    }

    // Persist to disk via Electron IPC if available
    const projectPath =
        effectiveCtx.projectPath ||
        (typeof effectiveCtx.getProjectPath === 'function' ? effectiveCtx.getProjectPath() : '') ||
        (typeof window !== 'undefined' ? window.currentProjectPath : '') ||
        (typeof window !== 'undefined' &&
            window?.ProjectManager?.getInstance?.()?.getProjectPath?.()) ||
        (typeof globalThis !== 'undefined' &&
            globalThis?.ProjectManager?.getInstance?.()?.getProjectPath?.()) ||
        ''

    if (typeof markProjectDirty === 'function') {
        markProjectDirty()
    }

    if (
        projectPath &&
        typeof window !== 'undefined' &&
        window.electronAPI &&
        typeof window.electronAPI.createEntity === 'function'
    ) {
        const payloadData = typeof hero.toJSON === 'function' ? hero.toJSON() : hero
        const cleanPayload = JSON.parse(JSON.stringify(payloadData))
        window.electronAPI
            .createEntity({
                projectPath,
                category: 'PlayerCharacter',
                entityData: cleanPayload,
                folderName: rawName,
            })
            .catch(err => {
                console.warn('Could not persist PlayerCharacter via IPC:', err)
            })
    }

    if (projectPath && typeof saveFullProject === 'function') {
        saveFullProject(effectiveCtx, { isAutoSave: true }).catch(err => {
            console.warn('Could not saveFullProject after hero save:', err)
        })
    }

    // Show toast
    const msg = isEdit
        ? t('hero.updated_success_msg', { name: rawName }) ||
          `Pomyślnie zaktualizowano bohatera: ${rawName}`
        : t('hero.created_success_msg', { name: rawName }) ||
          `Pomyślnie utworzono bohatera: ${rawName}`
    const title = isEdit
        ? t('hero.updated_success_title') || 'Karta bohatera zaktualizowana'
        : t('hero.created_success_title') || 'Bohater utworzony'

    toast.success(msg, title)

    state.setEditingHero(null)

    if (typeof options.closeModal === 'function') {
        options.closeModal()
    }
    if (typeof options.resetForm === 'function') {
        options.resetForm()
    }

    // Refresh views
    if (typeof effectiveCtx.renderMainCharacter === 'function') {
        effectiveCtx.renderMainCharacter()
    }
    if (typeof effectiveCtx.renderDetailsPanel === 'function') {
        effectiveCtx.renderDetailsPanel()
    }
    if (traitsAdded) {
        if (typeof effectiveCtx.renderTraitsList === 'function') {
            effectiveCtx.renderTraitsList()
        }
        if (typeof effectiveCtx.updateTraitsCounterUI === 'function') {
            effectiveCtx.updateTraitsCounterUI()
        }
    }

    return hero
}
