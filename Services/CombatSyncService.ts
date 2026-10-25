import { Choice } from '../Model/Choice'
import { Combat } from '../Model/Combat'
import { Paragraph } from '../Model/Paragraph'

export interface ITraitDefinition {
    id?: string
    name?: string
}
export type TraitDefinition = ITraitDefinition

/**
 * Service responsible for synchronizing combat outcomes with story graph choices
 * and resolving trait (stat/parameter) values from NPCs and templates.
 */
export class CombatSyncService {
    /**
     * Resolves the base value of a trait (stat or parameter) from an NPC or NPC template.
     */
    public static resolveNpcTraitValue(
        npc: any,
        traitId: string,
        traitDef?: TraitDefinition
    ): string | number {
        if (!npc) return ''
        const candidateKeys = [traitId]
        if (traitDef?.name) candidateKeys.push(traitDef.name)
        if (traitDef?.id) candidateKeys.push(traitDef.id)

        // 1. Check getStat
        if (typeof npc.getStat === 'function') {
            for (const key of candidateKeys) {
                const val = npc.getStat(key)
                if (val !== undefined && val !== null && val !== '') return val
            }
        }

        // 2. Check getStats collection
        if (typeof npc.getStats === 'function') {
            const statsList = npc.getStats()
            if (Array.isArray(statsList)) {
                for (const s of statsList) {
                    const sId = typeof s.getId === 'function' ? s.getId() : s.id
                    const sName = typeof s.getName === 'function' ? s.getName() : s.name
                    if (candidateKeys.includes(sId) || candidateKeys.includes(sName)) {
                        const val = typeof s.getValue === 'function' ? s.getValue() : s.value
                        if (val !== undefined && val !== null && val !== '') return val
                    }
                }
            }
        }

        // 3. Check getParameter
        if (typeof npc.getParameter === 'function') {
            for (const key of candidateKeys) {
                const p = npc.getParameter(key)
                if (p) {
                    const val = typeof p.getValue === 'function' ? p.getValue() : p.value
                    if (val !== undefined && val !== null && val !== '') return val
                }
            }
        }

        // 4. Check getParameters collection
        if (typeof npc.getParameters === 'function') {
            const paramList = npc.getParameters()
            if (Array.isArray(paramList)) {
                for (const p of paramList) {
                    const pId = typeof p.getId === 'function' ? p.getId() : p.id
                    const pName = typeof p.getName === 'function' ? p.getName() : p.name
                    if (candidateKeys.includes(pId) || candidateKeys.includes(pName)) {
                        const val = typeof p.getValue === 'function' ? p.getValue() : p.value
                        if (val !== undefined && val !== null && val !== '') return val
                    }
                }
            }
        }

        // 5. Raw stats/parameters arrays (plain objects)
        if (Array.isArray(npc.stats)) {
            for (const s of npc.stats) {
                if (candidateKeys.includes(s.id) || candidateKeys.includes(s.name)) {
                    if (s.value !== undefined && s.value !== null && s.value !== '') return s.value
                }
            }
        }
        if (Array.isArray(npc.parameters)) {
            for (const p of npc.parameters) {
                if (candidateKeys.includes(p.id) || candidateKeys.includes(p.name)) {
                    if (p.value !== undefined && p.value !== null && p.value !== '') return p.value
                }
            }
        }

        return ''
    }

    /**
     * Creates or associates a Choice in the source paragraph for a CombatOutcome.
     * Returns the finalized choiceId.
     */
    public static createOutcomeChoice(
        sourceParagraph: Paragraph,
        targetParagraph: Paragraph | undefined,
        outcomeId: string,
        outcomeName: string,
        targetParagraphId: string,
        vm?: any
    ): string {
        const choices = sourceParagraph.getChoices ? sourceParagraph.getChoices() : []

        // 1. Look for existing choice matching this outcome
        const existingChoice = choices.find(c => {
            const cId = typeof c.getId === 'function' ? c.getId() : (c as any).id
            const isCombat =
                typeof c.getIsCombatOutcome === 'function'
                    ? c.getIsCombatOutcome()
                    : (c as any).isCombatOutcome
            return (
                (outcomeId && cId === outcomeId) ||
                (c.getToParagraphId() === targetParagraphId &&
                    (c.getName() === outcomeName || isCombat))
            )
        })

        if (existingChoice) {
            if (outcomeName && typeof existingChoice.setName === 'function') {
                existingChoice.setName(outcomeName)
            }
            if (typeof existingChoice.setIsCombatOutcome === 'function') {
                existingChoice.setIsCombatOutcome(true)
            }
            ;(existingChoice as any).isCombatOutcome = true
            return existingChoice.getId()
        }

        let choiceId = outcomeId

        if (targetParagraph && vm && typeof vm.createChoice === 'function') {
            const ch = vm.createChoice(sourceParagraph, targetParagraph, outcomeName, outcomeName)
            if (ch && typeof ch.getId === 'function') {
                choiceId = ch.getId()
                if (typeof ch.setIsCombatOutcome === 'function') {
                    ch.setIsCombatOutcome(true)
                }
                ;(ch as any).isCombatOutcome = true
            }
        } else {
            const newChoice = new Choice(
                choiceId,
                outcomeName,
                sourceParagraph.getId(),
                targetParagraphId,
                null,
                undefined,
                [],
                [],
                null,
                true
            )
            sourceParagraph.addChoice(newChoice)
        }

        return choiceId
    }

    /**
     * Ensures all combat outcomes from paragraph's combat are represented as choices in the paragraph.
     */
    public static syncParagraphCombatChoices(paragraph: Paragraph, vm?: any): void {
        const hasCombat =
            typeof paragraph.getHasCombat === 'function' ? paragraph.getHasCombat() : false
        if (!hasCombat) return

        const combat = typeof paragraph.getCombat === 'function' ? paragraph.getCombat() : null
        if (!combat) return

        const outcomes =
            combat && typeof combat.getOutcomes === 'function' ? combat.getOutcomes() : []

        // 1. Deduplicate outcomes inside combat
        const seenOutcomeKeys = new Set<string>()
        const uniqueOutcomes: any[] = []
        outcomes.forEach(o => {
            if (!o || !o.targetParagraphId) return
            const key = o.id ? `id:${o.id}` : `target:${o.targetParagraphId}:${o.name || ''}`
            if (seenOutcomeKeys.has(key)) return
            seenOutcomeKeys.add(key)
            uniqueOutcomes.push(o)
        })
        if (typeof combat.setOutcomes === 'function') {
            combat.setOutcomes(uniqueOutcomes)
        }

        const choices = paragraph.getChoices ? paragraph.getChoices() : []

        // 2. Ensure each outcome has a corresponding choice
        uniqueOutcomes.forEach(outcome => {
            if (!outcome || !outcome.targetParagraphId) return
            const outcomeId = outcome.id || ''
            const existingChoice = choices.find(c => {
                const cId = typeof c.getId === 'function' ? c.getId() : (c as any).id
                const isCombat =
                    typeof c.getIsCombatOutcome === 'function'
                        ? c.getIsCombatOutcome()
                        : (c as any).isCombatOutcome
                return (
                    (cId && outcomeId && cId === outcomeId) ||
                    (c.getToParagraphId() === outcome.targetParagraphId &&
                        (c.getName() === outcome.name || isCombat))
                )
            })

            if (existingChoice) {
                if (typeof existingChoice.setIsCombatOutcome === 'function') {
                    existingChoice.setIsCombatOutcome(true)
                }
                ;(existingChoice as any).isCombatOutcome = true
                if (outcome.name && typeof existingChoice.setName === 'function') {
                    existingChoice.setName(outcome.name)
                }
                if (outcome.id && outcome.id !== existingChoice.getId()) {
                    outcome.id = existingChoice.getId()
                } else if (!outcome.id) {
                    outcome.id = existingChoice.getId()
                }
            } else {
                const choiceId =
                    outcome.id ||
                    (vm && typeof vm.idGenerator === 'function'
                        ? vm.idGenerator('choice')
                        : `choice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`)
                outcome.id = choiceId
                const newChoice = new Choice(
                    choiceId,
                    outcome.name || 'Wynik walki',
                    paragraph.getId(),
                    outcome.targetParagraphId,
                    null,
                    undefined,
                    [],
                    [],
                    null,
                    true
                )
                paragraph.addChoice(newChoice)
            }
        })

        // 3. Deduplicate choices in paragraph
        const seenChoiceIds = new Set<string>()
        const seenCombatTargets = new Set<string>()
        const deduplicatedChoices: Choice[] = []

        const currentChoices = paragraph.getChoices ? paragraph.getChoices() : []
        currentChoices.forEach(c => {
            const cId = c.getId()
            if (cId && seenChoiceIds.has(cId)) {
                return
            }
            const isCombat =
                typeof c.getIsCombatOutcome === 'function'
                    ? c.getIsCombatOutcome()
                    : Boolean((c as any).isCombatOutcome)

            if (isCombat) {
                const targetKey = `${c.getToParagraphId()}_${c.getName()}`
                if (seenCombatTargets.has(targetKey)) {
                    return
                }
                seenCombatTargets.add(targetKey)
            }

            if (cId) seenChoiceIds.add(cId)
            deduplicatedChoices.push(c)
        })

        if (typeof paragraph.setChoices === 'function') {
            paragraph.setChoices(deduplicatedChoices)
        }
    }

    /**
     * Updates choice name when an outcome name changes.
     */
    public static updateOutcomeChoiceName(
        paragraph: Paragraph,
        outcomeId: string,
        newName: string
    ): void {
        const choices = paragraph.getChoices ? paragraph.getChoices() : []
        const existingChoice =
            choices.find(c => {
                const cId = typeof c.getId === 'function' ? c.getId() : (c as any).id
                return cId === outcomeId
            }) || (paragraph.getChoice ? paragraph.getChoice(outcomeId) : null)

        if (existingChoice && typeof existingChoice.setName === 'function') {
            existingChoice.setName(newName)
        }

        // Also update combat outcome name if combat is present
        if (paragraph.getHasCombat && paragraph.getHasCombat()) {
            const combat = paragraph.getCombat ? paragraph.getCombat() : null
            if (combat) {
                if (typeof combat.updateOutcome === 'function') {
                    combat.updateOutcome(outcomeId, { name: newName })
                } else if (Array.isArray((combat as any).outcomes)) {
                    const outcome = (combat as any).outcomes.find((o: any) => o.id === outcomeId)
                    if (outcome) {
                        outcome.name = newName
                    }
                }
            }
        }
    }

    /**
     * Removes associated choice when an outcome is deleted.
     */
    public static removeOutcomeChoice(
        paragraph: Paragraph,
        outcomeId: string,
        allParagraphs: Paragraph[] = [],
        vm?: any
    ): void {
        const choices = paragraph.getChoices ? paragraph.getChoices() : []
        const targetChoice = choices.find(
            c => c.getId() === outcomeId || (outcomeId && (c as any).id === outcomeId)
        )
        const effectiveId = targetChoice ? targetChoice.getId() : outcomeId

        if (typeof paragraph.removeChoice === 'function') {
            paragraph.removeChoice(effectiveId)
            if (effectiveId !== outcomeId) {
                paragraph.removeChoice(outcomeId)
            }
        }
        if (vm && typeof vm.deleteChoice === 'function') {
            vm.deleteChoice(effectiveId, allParagraphs)
        }
    }

    /**
     * Cleans up all choices associated with combat outcomes when combat is disabled.
     */
    public static cleanupCombatChoices(
        paragraph: Paragraph,
        combat: Combat,
        allParagraphs: Paragraph[] = [],
        vm?: any
    ): void {
        const outcomesToClean = combat.getOutcomes ? combat.getOutcomes() : []
        outcomesToClean.forEach(o => {
            this.removeOutcomeChoice(paragraph, o.id, allParagraphs, vm)
        })
    }
}
