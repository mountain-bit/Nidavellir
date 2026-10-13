import { Description } from './Description'

export class Stat {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private value: string | number

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        value: string | number = ''
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.value = value
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

    public getDescription(): Description {
        return this.description
    }

    public setDescription(description: Description): void {
        this.description = description
    }

    public getValue(): string | number {
        return this.value
    }

    public setValue(value: string | number): void {
        this.value = value
    }

    public static fromJSON(json: any): Stat {
        if (!json) return new Stat('', '', new Description(), '')
        const name = json.name ?? ''
        const descData = json.description
        const val = json.value ?? ''
        return new Stat(json.id || '', name, Description.fromJSON(descData), val)
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            value: this.value,
            type: 'stat',
        }
    }
}
