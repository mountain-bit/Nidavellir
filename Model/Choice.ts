import { Condition } from './Condition'
import { Description } from './Description'

export interface IChoiceModifier {
    id?: string
    type: 'item' | 'stat' | 'parameter' | 'custom'
    name: string
    value: number
    description?: string
}
export type ChoiceModifier = IChoiceModifier

export interface IDiceBranch {
    id?: string
    min: number
    max: number
    targetParagraphId: string
    description?: string
}
export type DiceBranch = IDiceBranch

export interface IChoiceDiceCheck {
    dice: string // e.g. '1k6', '2k6', '1k20', '1k100'
    stat?: string // optional stat modifier, e.g. 'Zręczność'
    description?: string
    branches: IDiceBranch[]
}
export type ChoiceDiceCheck = IChoiceDiceCheck

export class Choice {
    private id: string = ''
    private name: string = ''
    private fromParagraphId: string = ''
    private toParagraphId: string = ''
    private condition: Condition | null = null
    private description: Description = new Description()
    private costs: ChoiceModifier[] = []
    private rewards: ChoiceModifier[] = []
    private diceCheck: ChoiceDiceCheck | null = null

    constructor(
        id: string = '',
        name: string = '',
        fromParagraphId: string = '',
        toParagraphId: string = '',
        condition: Condition | null = null,
        description: Description = new Description(),
        costs: ChoiceModifier[] = [],
        rewards: ChoiceModifier[] = [],
        diceCheck: ChoiceDiceCheck | null = null
    ) {
        this.id = id
        this.name = name
        this.fromParagraphId = fromParagraphId
        this.toParagraphId = toParagraphId || (id && !fromParagraphId ? id : '')
        this.condition = condition
        this.description = description
        this.costs = Array.isArray(costs) ? costs : []
        this.rewards = Array.isArray(rewards) ? rewards : []
        this.diceCheck = diceCheck || null
    }

    public getId(): string {
        return this.id
    }

    public setId(id: string): void {
        this.id = id
    }

    public hasId(): boolean {
        return this.id !== ''
    }

    public getName(): string {
        return this.name
    }

    public setName(name: string): void {
        this.name = name
    }

    public getFromParagraphId(): string {
        return this.fromParagraphId
    }

    public setFromParagraphId(id: string): void {
        this.fromParagraphId = id
    }

    public getToParagraphId(): string {
        return this.toParagraphId
    }

    public getTargetId(): string {
        return this.toParagraphId
    }

    public getTargetParagraphId(): string {
        return this.toParagraphId
    }

    public getTitle(): string {
        return this.name
    }

    public setToParagraphId(id: string): void {
        this.toParagraphId = id
    }

    public getCondition(): Condition | null {
        return this.condition
    }

    public setCondition(condition: Condition | null): void {
        this.condition = condition
    }

    public getDescription(): Description {
        return this.description
    }

    public setDescription(description: Description): void {
        this.description = description
    }

    public getCosts(): ChoiceModifier[] {
        return this.costs
    }

    public setCosts(costs: ChoiceModifier[]): void {
        this.costs = Array.isArray(costs) ? costs : []
    }

    public addCost(cost: ChoiceModifier): void {
        this.costs.push(cost)
    }

    public removeCost(idOrName: string): void {
        this.costs = this.costs.filter(c => c.id !== idOrName && c.name !== idOrName)
    }

    public hasCosts(): boolean {
        return this.costs.length > 0
    }

    public getRewards(): ChoiceModifier[] {
        return this.rewards
    }

    public setRewards(rewards: ChoiceModifier[]): void {
        this.rewards = Array.isArray(rewards) ? rewards : []
    }

    public addReward(reward: ChoiceModifier): void {
        this.rewards.push(reward)
    }

    public removeReward(idOrName: string): void {
        this.rewards = this.rewards.filter(r => r.id !== idOrName && r.name !== idOrName)
    }

    public hasRewards(): boolean {
        return this.rewards.length > 0
    }

    public getDiceCheck(): ChoiceDiceCheck | null {
        return this.diceCheck
    }

    public setDiceCheck(diceCheck: ChoiceDiceCheck | null): void {
        this.diceCheck = diceCheck
    }

    public hasDiceCheck(): boolean {
        return Boolean(
            this.diceCheck && this.diceCheck.branches && this.diceCheck.branches.length > 0
        )
    }

    public static fromJSON(json: Record<string, unknown> | null | undefined): Choice {
        if (!json) return new Choice('')
        const id = typeof json.id === 'string' ? json.id : ''
        const name = typeof json.name === 'string' ? json.name : ''
        const fromParagraphId =
            typeof json.fromParagraphId === 'string'
                ? json.fromParagraphId
                : typeof json.sourceParagraphId === 'string'
                  ? json.sourceParagraphId
                  : ''
        const toParagraphId =
            typeof json.toParagraphId === 'string'
                ? json.toParagraphId
                : typeof json.targetParagraphId === 'string'
                  ? json.targetParagraphId
                  : typeof json.targetId === 'string'
                    ? json.targetId
                    : id

        const choice = new Choice(id, name, fromParagraphId, toParagraphId)
        if (json.condition && typeof json.condition === 'object') {
            choice.setCondition(Condition.fromJSON(json.condition as Record<string, unknown>))
        }
        if (json.description && typeof json.description === 'object') {
            choice.setDescription(Description.fromJSON(json.description as Record<string, unknown>))
        }
        if (Array.isArray(json.costs)) {
            choice.setCosts(
                json.costs.map((rawC: unknown) => {
                    const c = (rawC && typeof rawC === 'object' ? rawC : {}) as Record<
                        string,
                        unknown
                    >
                    return {
                        id: typeof c.id === 'string' ? c.id : undefined,
                        type: (c.type as 'item' | 'stat' | 'parameter' | 'custom') || 'item',
                        name: typeof c.name === 'string' ? c.name : 'Koszt',
                        value: typeof c.value === 'number' ? c.value : 1,
                        description: typeof c.description === 'string' ? c.description : undefined,
                    }
                })
            )
        }
        if (Array.isArray(json.rewards)) {
            choice.setRewards(
                json.rewards.map((rawR: unknown) => {
                    const r = (rawR && typeof rawR === 'object' ? rawR : {}) as Record<
                        string,
                        unknown
                    >
                    return {
                        id: typeof r.id === 'string' ? r.id : undefined,
                        type: (r.type as 'item' | 'stat' | 'parameter' | 'custom') || 'item',
                        name: typeof r.name === 'string' ? r.name : 'Nagroda',
                        value: typeof r.value === 'number' ? r.value : 1,
                        description: typeof r.description === 'string' ? r.description : undefined,
                    }
                })
            )
        }
        if (json.diceCheck && typeof json.diceCheck === 'object') {
            const rawDc = json.diceCheck as Record<string, unknown>
            const branches: DiceBranch[] = Array.isArray(rawDc.branches)
                ? rawDc.branches.map((rawB: unknown) => {
                      const b = (rawB && typeof rawB === 'object' ? rawB : {}) as Record<
                          string,
                          unknown
                      >
                      return {
                          id: typeof b.id === 'string' ? b.id : undefined,
                          min: typeof b.min === 'number' ? b.min : 1,
                          max: typeof b.max === 'number' ? b.max : 6,
                          targetParagraphId:
                              typeof b.targetParagraphId === 'string'
                                  ? b.targetParagraphId
                                  : typeof b.targetId === 'string'
                                    ? b.targetId
                                    : '',
                          description:
                              typeof b.description === 'string' ? b.description : undefined,
                      }
                  })
                : []
            choice.setDiceCheck({
                dice: typeof rawDc.dice === 'string' ? rawDc.dice : '1k6',
                stat: typeof rawDc.stat === 'string' ? rawDc.stat : undefined,
                description: typeof rawDc.description === 'string' ? rawDc.description : undefined,
                branches,
            })
        }
        return choice
    }

    public toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            fromParagraphId: this.fromParagraphId,
            toParagraphId: this.toParagraphId,
            condition: this.condition ? this.condition.toJSON() : null,
            description: this.description ? this.description.toJSON() : null,
            costs: this.costs,
            rewards: this.rewards,
            diceCheck: this.diceCheck,
        }
    }
}
