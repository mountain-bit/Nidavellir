import { Description } from './Description'
import { NPC } from './NPC'

export class Combat {
    private id: string = ''
    private name: string = ''
    private victoryDescription: Description = new Description()
    private defeatDescription: Description = new Description()
    private drawDescription: Description = new Description()
    private opponents: NPC[] = []

    constructor(
        id: string = '',
        name: string = '',
        victoryDescription: Description = new Description(),
        defeatDescription: Description = new Description(),
        drawDescription: Description = new Description(),
        opponents: NPC[] = []
    ) {
        this.id = id
        this.name = name
        this.victoryDescription = victoryDescription
        this.defeatDescription = defeatDescription
        this.drawDescription = drawDescription
        this.opponents = opponents
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
        }
    }
}
