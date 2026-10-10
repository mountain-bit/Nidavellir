import { Condition } from './Condition'
import { Description } from './Description'

export class Choice {
    private id: string = ''
    private name: string = ''
    private fromParagraphId: string = ''
    private toParagraphId: string = ''
    private condition: Condition | null = null
    private description: Description = new Description()

    constructor(
        id: string = '',
        name: string = '',
        fromParagraphId: string = '',
        toParagraphId: string = '',
        condition: Condition | null = null,
        description: Description = new Description()
    ) {
        this.id = id
        this.name = name
        this.fromParagraphId = fromParagraphId
        this.toParagraphId = toParagraphId || (id && !fromParagraphId ? id : '')
        this.condition = condition
        this.description = description
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
        }
    }
}
