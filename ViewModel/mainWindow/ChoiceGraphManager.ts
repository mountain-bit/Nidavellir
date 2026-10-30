import { Choice, type ChoiceDiceCheck, type ChoiceModifier } from '../../Model/Choice'
import { Condition, TextCondition } from '../../Model/Condition'
import type { Paragraph } from '../../Model/Paragraph'
import type { Scene } from '../../Model/Scene'
import { CombatSyncService } from '../../Services/combat/CombatSyncService'
import { defaultIdGenerator, type IdGenerator } from '../../Utils/common/idGenerator'
import type { IHistoryItem } from './types'

export interface IChoiceGraphManagerOptions {
    idGenerator?: IdGenerator
    onCloseHistoryItem?: (id: string) => void
    ensureStartParagraph?: (paragraphs: Paragraph[]) => Paragraph
    getSelectedItem?: () => IHistoryItem | null
    getVmReference?: () => object
}

export class ChoiceGraphManager {
    private idGenerator: IdGenerator
    private onCloseHistoryItem?: (id: string) => void
    private ensureStartParagraphFn?: (paragraphs: Paragraph[]) => Paragraph
    private getSelectedItem?: () => IHistoryItem | null
    private getVmReference?: () => object

    constructor(options: IChoiceGraphManagerOptions = {}) {
        this.idGenerator = options.idGenerator || defaultIdGenerator
        this.onCloseHistoryItem = options.onCloseHistoryItem
        this.ensureStartParagraphFn = options.ensureStartParagraph
        this.getSelectedItem = options.getSelectedItem
        this.getVmReference = options.getVmReference
    }

    public getAllChoices(paragraphs: Paragraph[]): Choice[] {
        const all: Choice[] = []
        const seenChoiceIds = new Set<string>()
        const vmRef = this.getVmReference ? this.getVmReference() : undefined

        paragraphs.forEach(p => {
            CombatSyncService.syncParagraphCombatChoices(p, vmRef)
            const choices = p.getChoices ? p.getChoices() : []
            choices.forEach(c => {
                const cId = c.getId()
                if (cId && seenChoiceIds.has(cId)) return
                if (cId) seenChoiceIds.add(cId)
                if (!c.getFromParagraphId()) {
                    c.setFromParagraphId(p.getId())
                }
                all.push(c)
            })
        })
        return all
    }

    public createChoice(
        fromParagraph: Paragraph,
        toParagraph: Paragraph,
        nameInput?: string,
        defaultName: string = 'New jump',
        conditionText?: string
    ): Choice {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('choice')
        const fromId = fromParagraph.getId()
        const toId = toParagraph.getId()

        let condition: TextCondition | null = null
        if (conditionText && conditionText.trim()) {
            condition = new TextCondition(
                this.idGenerator('condition'),
                'Requirement',
                conditionText.trim()
            )
        }

        const choice = new Choice(id, name, fromId, toId, condition)
        fromParagraph.addChoice(choice)
        return choice
    }

    public deleteChoice(choiceId: string, paragraphs: Paragraph[]): boolean {
        let removed = false
        for (const p of paragraphs) {
            if (p.hasChoice && p.hasChoice(choiceId)) {
                p.removeChoice(choiceId)
                removed = true
            }
            if (p.getHasCombat && p.getHasCombat()) {
                const combat = p.getCombat ? p.getCombat() : null
                if (combat && typeof combat.removeOutcome === 'function') {
                    const beforeLen = combat.getOutcomes().length
                    combat.removeOutcome(choiceId)
                    if (combat.getOutcomes().length < beforeLen) {
                        removed = true
                    }
                }
            }
            if (removed) break
        }

        const selectedItem = this.getSelectedItem ? this.getSelectedItem() : null
        if (selectedItem?.id === choiceId && selectedItem.type === 'choice') {
            this.onCloseHistoryItem?.(choiceId)
        }
        return removed
    }

    public deleteParagraph(
        paragraphId: string,
        paragraphs: Paragraph[],
        scenes?: Scene[]
    ): boolean {
        const index = paragraphs.findIndex(p => p && p.getId() === paragraphId)
        if (index === -1) return false
        const target = paragraphs[index]
        if (target.getIsStart && target.getIsStart()) {
            // Special START node CANNOT be deleted
            return false
        }
        paragraphs.splice(index, 1)

        // Remove choices pointing to this paragraph
        paragraphs.forEach(sourceP => {
            if (sourceP && sourceP.getChoices) {
                const remaining = sourceP
                    .getChoices()
                    .filter(c => c && c.getToParagraphId() !== paragraphId)
                sourceP.setChoices(remaining)
            }
        })

        // Remove from scenes
        if (scenes && Array.isArray(scenes)) {
            scenes.forEach(s => {
                if (s && typeof s.removeParagraph === 'function') {
                    s.removeParagraph(paragraphId)
                }
            })
        }

        const selectedItem = this.getSelectedItem ? this.getSelectedItem() : null
        if (selectedItem?.id === paragraphId && selectedItem.type === 'paragraph') {
            this.onCloseHistoryItem?.(paragraphId)
        }

        // Safeguard: Ensure START node is present in the remaining paragraphs
        if (this.ensureStartParagraphFn) {
            this.ensureStartParagraphFn(paragraphs)
        }

        return true
    }

    public reverseChoice(choice: Choice, paragraphs: Paragraph[]): boolean {
        const oldFromId = choice.getFromParagraphId()
        const oldToId = choice.getToParagraphId()
        if (!oldFromId || !oldToId) return false

        const oldSourceParagraph = paragraphs.find(p => p.getId() === oldFromId)
        const oldTargetParagraph = paragraphs.find(p => p.getId() === oldToId)
        if (!oldSourceParagraph || !oldTargetParagraph) return false

        oldSourceParagraph.removeChoice(choice.getId())
        choice.setFromParagraphId(oldToId)
        choice.setToParagraphId(oldFromId)
        oldTargetParagraph.addChoice(choice)

        return true
    }

    public updateChoiceDetails(
        choice: Choice,
        name: string,
        conditionOrText?: Condition | string | null,
        costs?: ChoiceModifier[],
        rewards?: ChoiceModifier[],
        diceCheck?: ChoiceDiceCheck | null
    ): boolean {
        const trimmedName = name.trim()
        if (!trimmedName) return false
        choice.setName(trimmedName)

        if (conditionOrText instanceof Condition) {
            choice.setCondition(conditionOrText)
        } else if (typeof conditionOrText === 'string') {
            const trimmedCondition = conditionOrText.trim()
            if (trimmedCondition) {
                const currentCond = choice.getCondition()
                if (currentCond instanceof TextCondition) {
                    currentCond.setText(trimmedCondition)
                } else {
                    choice.setCondition(
                        new TextCondition(
                            this.idGenerator('condition'),
                            'Requirement',
                            trimmedCondition
                        )
                    )
                }
            } else {
                choice.setCondition(null)
            }
        } else if (conditionOrText === null) {
            choice.setCondition(null)
        }

        if (Array.isArray(costs)) {
            choice.setCosts(costs)
        }
        if (Array.isArray(rewards)) {
            choice.setRewards(rewards)
        }
        if (diceCheck !== undefined) {
            choice.setDiceCheck(diceCheck)
        }

        const selectedItem = this.getSelectedItem ? this.getSelectedItem() : null
        if (selectedItem?.id === choice.getId()) {
            selectedItem.name = trimmedName
        }
        return true
    }

    public getOutgoingChoices(paragraph: Paragraph): Choice[] {
        if (!paragraph || !paragraph.getChoices) return []
        const choices = paragraph.getChoices() || []
        choices.forEach(c => {
            if (!c.getFromParagraphId()) {
                c.setFromParagraphId(paragraph.getId())
            }
        })
        return choices
    }

    public updateChoiceTarget(choice: Choice, newTargetParagraphId: string): boolean {
        const trimmedId = (newTargetParagraphId ?? '').trim()
        if (!trimmedId) return false
        choice.setToParagraphId(trimmedId)
        return true
    }

    public updateChoice(
        choice: Choice,
        name: string,
        toParagraphId: string,
        conditionText: string
    ): boolean {
        const nameUpdated = this.updateChoiceDetails(choice, name, conditionText)
        if (!nameUpdated) return false
        if (toParagraphId && toParagraphId.trim()) {
            choice.setToParagraphId(toParagraphId.trim())
        }
        return true
    }
}
