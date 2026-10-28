import { Choice } from '../../Model/Choice'
import { Combat, type ICombatOutcome } from '../../Model/Combat'
import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
import { Paragraph } from '../../Model/Paragraph'
import { defaultIdGenerator } from '../../Utils/idGenerator'
import { EntityAccessor } from '../helpers/EntityAccessor'

export interface ITraitDefinition {
    id?: string
    name?: string
}
export type TraitDefinition = ITraitDefinition

export interface INpcTraitLike {
    getId?: () => string
    id?: string
    getName?: () => string
    name?: string
    getValue?: () => string | number
    value?: string | number
}

export interface INpcPlainLike {
    getStat?: (key: string) => string | number | undefined | null
    getStats?: () => unknown[] | undefined
    getParameter?: (key: string) => unknown | undefined | null
    getParameters?: () => unknown[] | undefined
    stats?: unknown[]
    parameters?: unknown[]
    [key: string]: unknown
}

export type INpcLike = NPC | NPC_Template | INpcPlainLike

export interface IChoiceLike {
    getId?: () => string
    id?: string
    getName?: () => string
    name?: string
    setName?: (name: string) => void
    getToParagraphId?: () => string
    toParagraphId?: string
    getIsCombatOutcome?: () => boolean
    isCombatOutcome?: boolean
    setIsCombatOutcome?: (isCombat: boolean) => void
}

export interface ICombatSyncViewModel {
    createChoice?: (
        sourceParagraph: Paragraph,
        targetParagraph: Paragraph,
        name: string,
        targetName?: string
    ) => Choice | IChoiceLike | null | undefined
    deleteChoice?: (choiceId: string, allParagraphs: Paragraph[]) => void
    idGenerator?: (prefix: string) => string
}

export type CombatSyncViewModelInput = ICombatSyncViewModel | object

/**
 * Service responsible for synchronizing combat outcomes with story graph choices
 * and resolving trait (stat/parameter) values from NPCs and templates.
 */
export class CombatSyncService {
    /**
     * Resolves the ID of a choice or choice-like entity.
     */
    private static getChoiceId(c: Choice | IChoiceLike | unknown): string {
        return EntityAccessor.getId(c)
    }

    /**
     * Resolves the name of a choice or choice-like entity.
     */
    private static getChoiceName(c: Choice | IChoiceLike | unknown): string {
        return EntityAccessor.getName(c)
    }

    /**
     * Resolves the destination paragraph ID of a choice or choice-like entity.
     */
    private static getChoiceTargetId(c: Choice | IChoiceLike | unknown): string {
        if (!c || typeof c !== 'object') return ''
        if (c instanceof Choice) {
            return c.getToParagraphId()
        }
        const rec = c as Record<string, unknown>
        if (typeof rec.getToParagraphId === 'function') {
            return String((rec.getToParagraphId as () => unknown)() ?? '')
        }
        return typeof rec.toParagraphId === 'string' ? rec.toParagraphId : ''
    }

    /**
     * Resolves whether a choice or choice-like entity is marked as a combat outcome choice.
     */
    private static isChoiceCombatOutcome(c: Choice | IChoiceLike | unknown): boolean {
        if (!c || typeof c !== 'object') return false
        if (c instanceof Choice) {
            return c.getIsCombatOutcome()
        }
        const rec = c as Record<string, unknown>
        if (typeof rec.getIsCombatOutcome === 'function') {
            return Boolean((rec.getIsCombatOutcome as () => unknown)())
        }
        return Boolean(rec.isCombatOutcome)
    }

    /**
     * Sets the combat outcome flag on a choice instance or plain object.
     */
    private static setChoiceCombatOutcome(c: Choice | IChoiceLike | unknown, value: boolean): void {
        if (!c || typeof c !== 'object') return
        if (c instanceof Choice) {
            c.setIsCombatOutcome(value)
            return
        }
        const rec = c as Record<string, unknown>
        if (typeof rec.setIsCombatOutcome === 'function') {
            ;(rec.setIsCombatOutcome as (v: boolean) => void)(value)
        }
        rec.isCombatOutcome = value
    }

    /**
     * Sets the choice name on a choice instance or plain object.
     */
    private static setChoiceName(c: Choice | IChoiceLike | unknown, name: string): void {
        if (!c || typeof c !== 'object') return
        if (c instanceof Choice) {
            c.setName(name)
            return
        }
        const rec = c as Record<string, unknown>
        if (typeof rec.setName === 'function') {
            ;(rec.setName as (n: string) => void)(name)
        }
        rec.name = name
    }

    /**
     * Searches an array of Stat/Parameter objects (or plain equivalents) for a matching key
     * and returns its non-empty value if found.
     */
    private static findTraitValueInList(
        list: unknown,
        candidateKeys: string[]
    ): string | number | undefined {
        if (!Array.isArray(list)) return undefined

        for (const item of list) {
            if (!item || typeof item !== 'object') continue
            const id = EntityAccessor.getId(item)
            const name = EntityAccessor.getName(item)
            if ((id && candidateKeys.includes(id)) || (name && candidateKeys.includes(name))) {
                const val = EntityAccessor.getValue(item)
                if (val !== undefined) {
                    return val
                }
            }
        }
        return undefined
    }

    /**
     * Resolves the base value of a trait (stat or parameter) from an NPC or NPC template.
     */
    public static resolveNpcTraitValue(
        npc: INpcLike | null | undefined,
        traitId: string,
        traitDef?: TraitDefinition
    ): string | number {
        if (!npc) return ''
        const candidateKeys = [traitId]
        if (traitDef?.name) candidateKeys.push(traitDef.name)
        if (traitDef?.id) candidateKeys.push(traitDef.id)

        const rawNpc = npc as Record<string, unknown>

        // 1. Direct getStat(key) lookup
        if (typeof rawNpc.getStat === 'function') {
            for (const key of candidateKeys) {
                const val = (rawNpc.getStat as (k: string) => unknown)(key)
                if (val !== undefined && val !== null && val !== '') {
                    return val as string | number
                }
            }
        }

        // 2. Direct getParameter(key) lookup
        if (typeof rawNpc.getParameter === 'function') {
            for (const key of candidateKeys) {
                const p = (rawNpc.getParameter as (k: string) => unknown)(key)
                const val = EntityAccessor.getValue(p)
                if (val !== undefined) {
                    return val
                }
            }
        }

        // 3. Collection lookups: getStats(), getParameters(), raw stats[], raw parameters[]
        const collections: unknown[] = [
            typeof rawNpc.getStats === 'function'
                ? (rawNpc.getStats as () => unknown)()
                : undefined,
            typeof rawNpc.getParameters === 'function'
                ? (rawNpc.getParameters as () => unknown)()
                : undefined,
            rawNpc.stats,
            rawNpc.parameters,
        ]

        for (const collection of collections) {
            const found = this.findTraitValueInList(collection, candidateKeys)
            if (found !== undefined) {
                return found
            }
        }

        return ''
    }

    /**
     * Finds an existing choice in a list that corresponds to the given combat outcome.
     */
    private static findMatchingOutcomeChoice(
        choices: Choice[],
        outcomeId: string,
        targetParagraphId: string,
        outcomeName?: string
    ): Choice | undefined {
        return choices.find(c => {
            const cId = this.getChoiceId(c)
            const isCombat = this.isChoiceCombatOutcome(c)
            const targetId = this.getChoiceTargetId(c)
            const name = this.getChoiceName(c)
            return (
                Boolean(outcomeId && cId && cId === outcomeId) ||
                (targetId === targetParagraphId && (name === outcomeName || isCombat))
            )
        })
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
        vm?: CombatSyncViewModelInput
    ): string {
        const choices = sourceParagraph.getChoices ? sourceParagraph.getChoices() : []
        const typedVm = vm as ICombatSyncViewModel | undefined

        // 1. Look for existing choice matching this outcome
        const existingChoice = this.findMatchingOutcomeChoice(
            choices,
            outcomeId,
            targetParagraphId,
            outcomeName
        )

        if (existingChoice) {
            if (outcomeName) {
                this.setChoiceName(existingChoice, outcomeName)
            }
            this.setChoiceCombatOutcome(existingChoice, true)
            return this.getChoiceId(existingChoice)
        }

        let choiceId = outcomeId

        if (targetParagraph && typedVm && typeof typedVm.createChoice === 'function') {
            const ch = typedVm.createChoice(
                sourceParagraph,
                targetParagraph,
                outcomeName,
                outcomeName
            )
            if (ch) {
                choiceId = this.getChoiceId(ch)
                this.setChoiceCombatOutcome(ch, true)
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
    public static syncParagraphCombatChoices(
        paragraph: Paragraph,
        vm?: CombatSyncViewModelInput
    ): void {
        const hasCombat =
            typeof paragraph.getHasCombat === 'function' ? paragraph.getHasCombat() : false
        if (!hasCombat) return

        const combat = typeof paragraph.getCombat === 'function' ? paragraph.getCombat() : null
        if (!combat) return

        const outcomes: ICombatOutcome[] =
            typeof combat.getOutcomes === 'function' ? combat.getOutcomes() : []

        // 1. Deduplicate outcomes inside combat
        const seenOutcomeKeys = new Set<string>()
        const uniqueOutcomes: ICombatOutcome[] = []
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
            const existingChoice = this.findMatchingOutcomeChoice(
                choices,
                outcomeId,
                outcome.targetParagraphId,
                outcome.name
            )

            if (existingChoice) {
                this.setChoiceCombatOutcome(existingChoice, true)
                if (outcome.name) {
                    this.setChoiceName(existingChoice, outcome.name)
                }
                const existingId = this.getChoiceId(existingChoice)
                if (outcome.id !== existingId) {
                    outcome.id = existingId
                }
            } else {
                const vmGen = vm ? (vm as Record<string, unknown>).idGenerator : undefined
                const choiceId =
                    outcome.id ||
                    (typeof vmGen === 'function'
                        ? (vmGen as (prefix: string) => string)('choice')
                        : defaultIdGenerator('choice'))
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
            const cId = this.getChoiceId(c)
            if (cId && seenChoiceIds.has(cId)) {
                return
            }
            const isCombat = this.isChoiceCombatOutcome(c)

            if (isCombat) {
                const targetId = this.getChoiceTargetId(c)
                const name = this.getChoiceName(c)
                const targetKey = `${targetId}_${name}`
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
            choices.find(c => this.getChoiceId(c) === outcomeId) ||
            (paragraph.getChoice ? paragraph.getChoice(outcomeId) : null)

        if (existingChoice && typeof existingChoice.setName === 'function') {
            existingChoice.setName(newName)
        }

        // Also update combat outcome name if combat is present
        if (paragraph.getHasCombat && paragraph.getHasCombat()) {
            const combat = paragraph.getCombat ? paragraph.getCombat() : null
            if (combat) {
                if (typeof combat.updateOutcome === 'function') {
                    combat.updateOutcome(outcomeId, { name: newName })
                } else {
                    const outcomes =
                        typeof combat.getOutcomes === 'function'
                            ? combat.getOutcomes()
                            : (combat as unknown as Record<string, unknown>).outcomes
                    if (Array.isArray(outcomes)) {
                        const outcome = outcomes.find(o => o && o.id === outcomeId)
                        if (outcome) {
                            outcome.name = newName
                        }
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
        vm?: CombatSyncViewModelInput
    ): void {
        const choices = paragraph.getChoices ? paragraph.getChoices() : []
        const targetChoice = choices.find(c => this.getChoiceId(c) === outcomeId)
        const effectiveId = targetChoice ? this.getChoiceId(targetChoice) : outcomeId
        const typedVm = vm as ICombatSyncViewModel | undefined

        if (typeof paragraph.removeChoice === 'function') {
            paragraph.removeChoice(effectiveId)
            if (effectiveId !== outcomeId) {
                paragraph.removeChoice(outcomeId)
            }
        }
        if (typedVm && typeof typedVm.deleteChoice === 'function') {
            typedVm.deleteChoice(effectiveId, allParagraphs)
        }
    }

    /**
     * Cleans up all choices associated with combat outcomes when combat is disabled.
     */
    public static cleanupCombatChoices(
        paragraph: Paragraph,
        combat: Combat,
        allParagraphs: Paragraph[] = [],
        vm?: CombatSyncViewModelInput
    ): void {
        const outcomesToClean = combat.getOutcomes ? combat.getOutcomes() : []
        outcomesToClean.forEach(o => {
            this.removeOutcomeChoice(paragraph, o.id, allParagraphs, vm)
        })
    }
}
