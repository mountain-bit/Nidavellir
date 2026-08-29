export class Condition {
    private id: string = ''
    private name: string = ''

    constructor(id: string = '', name: string = '') {
        this.id = id
        this.name = name
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

    public static fromJSON(json: any): Condition {
        if (!json) return new Condition('')
        const name = json.name ?? ''
        return new Condition(json.id || '', name)
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
        }
    }
}
