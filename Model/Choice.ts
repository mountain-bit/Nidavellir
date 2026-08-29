import { Condition } from './Condition'
import { Description } from './Description'

export class Choice {
    private id: string = ''
    private name: string = ''
    private condition: Condition = new Condition('', '')
    private description: Description = new Description()

    constructor(id: string = '', name: string = '') {
        this.id = id
        this.name = name
        this.condition = new Condition('', '')
        this.description = new Description()
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

    public getCondition(): Condition {
        return this.condition
    }

    public setCondition(condition: Condition): void {
        this.condition = condition
    }

    public getDescription(): Description {
        return this.description
    }

    public setDescription(description: Description): void {
        this.description = description
    }

    public static fromJSON(json: any): Choice {
        if (!json) return new Choice('')
        const name = json.name ?? ''
        const p = new Choice(json.id || '', name)
        if (json.condition) p.setCondition(Condition.fromJSON(json.condition))
        if (json.description) p.setDescription(Description.fromJSON(json.description))
        return p
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            condition: this.condition,
            description: this.description,
        }
    }
}
