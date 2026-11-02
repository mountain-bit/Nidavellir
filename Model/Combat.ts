import { Description } from './Description'
import { NPC } from './NPC'

export interface ICombatOutcome {
    id: string
    name: string
    targetParagraphId: string
    description?: string
}
export type CombatOutcome = ICombatOutcome

export interface ICombatOpponent {
    id: string
    npcId: string
    name: string
    avatar: string
    overriddenStats: Record<string, string | number>
}
export type CombatOpponent = ICombatOpponent

export class Combat {
    private id: string = ''
    private name: string = ''
    private victoryDescription: Description = new Description()
    private defeatDescription: Description = new Description()
    private drawDescription: Description = new Description()
    private opponents: NPC[] = []
    private combatOpponents: ICombatOpponent[] = []
    private outcomes: ICombatOutcome[] = []
    private visibleStatIds: string[] = []

    constructor(
        id: string = '',
        name: string = '',
        victoryDescription: Description = new Description(),
        defeatDescription: Description = new Description(),
        drawDescription: Description = new Description(),
        opponents: NPC[] = [],
        combatOpponents: CombatOpponent[] = [],
        outcomes: CombatOutcome[] = [],
        visibleStatIds: string[] = []
    ) {
        this.id = id
        this.name = name
        this.victoryDescription = victoryDescription
        this.defeatDescription = defeatDescription
        this.drawDescription = drawDescription
        this.opponents = opponents
        this.combatOpponents = combatOpponents
        this.outcomes = outcomes
        this.visibleStatIds = visibleStatIds
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

    public getVictoryDescription(): Description {
        return this.victoryDescription
    }

    public setVictoryDescription(description: Description): void {
        this.victoryDescription = description
    }

    public getDefeatDescription(): Description {
        return this.defeatDescription
    }

    public setDefeatDescription(description: Description): void {
        this.defeatDescription = description
    }

    public getDrawDescription(): Description {
        return this.drawDescription
    }

    public setDrawDescription(description: Description): void {
        this.drawDescription = description
    }

    public getOpponents(): NPC[] {
        return this.opponents
    }

    public setOpponents(opponents: NPC[]): void {
        this.opponents = opponents
    }

    public addOpponent(opponent: NPC): void {
        this.opponents.push(opponent)
    }

    public removeOpponent(opponent: NPC): void {
        this.opponents = this.opponents.filter(p => p !== opponent)
    }

    public getCombatOpponents(): CombatOpponent[] {
        return this.combatOpponents
    }

    public setCombatOpponents(opponents: CombatOpponent[]): void {
        this.combatOpponents = opponents
    }

    public addCombatOpponent(opponent: CombatOpponent): void {
        this.combatOpponents.push(opponent)
    }

    public removeCombatOpponent(id: string): void {
        this.combatOpponents = this.combatOpponents.filter(o => o.id !== id)
    }

    public updateCombatOpponent(id: string, updates: Partial<CombatOpponent>): void {
        const index = this.combatOpponents.findIndex(o => o.id === id)
        if (index !== -1) {
            this.combatOpponents[index] = {
                ...this.combatOpponents[index],
                ...updates,
                overriddenStats: {
                    ...this.combatOpponents[index].overriddenStats,
                    ...(updates.overriddenStats || {}),
                },
            }
        }
    }

    public getOutcomes(): CombatOutcome[] {
        return this.outcomes
    }

    public setOutcomes(outcomes: CombatOutcome[]): void {
        this.outcomes = outcomes
    }

    public addOutcome(outcome: CombatOutcome): void {
        const existingIdx = this.outcomes.findIndex(
            o =>
                (outcome.id && o.id === outcome.id) ||
                (o.targetParagraphId === outcome.targetParagraphId && o.name === outcome.name)
        )
        if (existingIdx !== -1) {
            this.outcomes[existingIdx] = {
                ...this.outcomes[existingIdx],
                ...outcome,
            }
            return
        }
        this.outcomes.push(outcome)
    }

    public removeOutcome(id: string): void {
        this.outcomes = this.outcomes.filter(o => o.id !== id)
    }

    public updateOutcome(id: string, updates: Partial<CombatOutcome>): void {
        const index = this.outcomes.findIndex(o => o.id === id)
        if (index !== -1) {
            this.outcomes[index] = {
                ...this.outcomes[index],
                ...updates,
            }
        }
    }

    public getVisibleStatIds(): string[] {
        return this.visibleStatIds
    }

    public setVisibleStatIds(ids: string[]): void {
        this.visibleStatIds = ids
    }

    public toggleVisibleStatId(id: string): void {
        if (this.visibleStatIds.includes(id)) {
            this.visibleStatIds = this.visibleStatIds.filter(i => i !== id)
        } else {
            this.visibleStatIds.push(id)
        }
    }

    public static fromJSON(json: any): Combat {
        if (!json) return new Combat('', '')
        const name = json.name ?? ''
        const w = new Combat(json.id || '', name)
        if (json.victoryDescription) {
            w.setVictoryDescription(Description.fromJSON(json.victoryDescription))
        }
        if (json.defeatDescription) {
            w.setDefeatDescription(Description.fromJSON(json.defeatDescription))
        }
        if (json.drawDescription) {
            w.setDrawDescription(Description.fromJSON(json.drawDescription))
        }
        if (json.opponents && Array.isArray(json.opponents)) {
            json.opponents.forEach((p: any) => w.addOpponent(NPC.fromJSON(p)))
        }
        if (json.combatOpponents && Array.isArray(json.combatOpponents)) {
            w.setCombatOpponents(
                json.combatOpponents.map((o: any) => ({
                    id: String(o.id || ''),
                    npcId: String(o.npcId || ''),
                    name: String(o.name || ''),
                    avatar: String(o.avatar || 'warrior'),
                    overriddenStats:
                        typeof o.overriddenStats === 'object' && o.overriddenStats
                            ? { ...o.overriddenStats }
                            : {},
                }))
            )
        }
        if (json.outcomes && Array.isArray(json.outcomes)) {
            const seenOutcomeKeys = new Set<string>()
            const parsedOutcomes: CombatOutcome[] = []
            for (const o of json.outcomes) {
                const id = String(o.id || '')
                const name = String(o.name || '')
                const targetParagraphId = String(o.targetParagraphId || '')
                const key = id ? `id:${id}` : `target:${targetParagraphId}:${name}`
                if (seenOutcomeKeys.has(key)) continue
                seenOutcomeKeys.add(key)
                parsedOutcomes.push({
                    id,
                    name,
                    targetParagraphId,
                    description: typeof o.description === 'string' ? o.description : '',
                })
            }
            w.setOutcomes(parsedOutcomes)
        }
        if (json.visibleStatIds && Array.isArray(json.visibleStatIds)) {
            w.setVisibleStatIds(json.visibleStatIds.map((s: any) => String(s)))
        }
        return w
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            victoryDescription: this.victoryDescription,
            defeatDescription: this.defeatDescription,
            drawDescription: this.drawDescription,
            opponents: this.opponents,
            combatOpponents: this.combatOpponents,
            outcomes: this.outcomes,
            visibleStatIds: this.visibleStatIds,
        }
    }
}
