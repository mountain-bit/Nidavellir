export type ConditionType = 'text' | 'item' | 'stat' | 'skill' | 'variable' | 'custom'

export abstract class Condition {
    protected id: string = ''
    protected name: string = ''
    protected type: ConditionType = 'custom'

    constructor(id: string = '', name: string = '', type: ConditionType = 'custom') {
        this.id = id
        this.name = name
        this.type = type
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

    public getType(): ConditionType {
        return this.type
    }

    public setType(type: ConditionType): void {
        this.type = type
    }

    public abstract getSummary(): string

    public abstract toJSON(): Record<string, unknown>

    public static fromJSON(json: Record<string, unknown> | null | undefined): Condition {
        if (!json) {
            return new TextCondition('', '', '')
        }
        const type =
            typeof json.type === 'string'
                ? json.type
                : typeof json.text === 'string'
                  ? 'text'
                  : 'custom'
        if (type === 'text') {
            return TextCondition.fromJSON(json)
        }
        return TextCondition.fromJSON(json)
    }
}

export class TextCondition extends Condition {
    private text: string = ''

    constructor(id: string = '', name: string = '', text: string = '') {
        super(id, name, 'text')
        this.text = text
    }

    public getText(): string {
        return this.text
    }

    public setText(text: string): void {
        this.text = text
    }

    public override getSummary(): string {
        return this.text || this.name || ''
    }

    public override toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            text: this.text,
        }
    }

    public static override fromJSON(
        json: Record<string, unknown> | null | undefined
    ): TextCondition {
        if (!json) return new TextCondition('', '', '')
        const id = typeof json.id === 'string' ? json.id : ''
        const name = typeof json.name === 'string' ? json.name : ''
        const text =
            typeof json.text === 'string'
                ? json.text
                : typeof json.name === 'string'
                  ? json.name
                  : ''
        return new TextCondition(id, name, text)
    }
}
