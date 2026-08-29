export class Tag {
    private id: string = ''
    private name: string = ''
    private color: string = '#3b82f6'

    constructor(id: string = '', name: string = '', color: string = '#3b82f6') {
        this.id = id
        this.name = name || id
        this.color = color
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

    public getColor(): string {
        return this.color
    }

    public setColor(color: string): void {
        this.color = color
    }

    public static fromJSON(json: any): Tag {
        if (!json) return new Tag()
        if (typeof json === 'string') return new Tag(json, json)
        return new Tag(
            json.id || json.name || '',
            json.name || json.id || '',
            json.color || '#3b82f6'
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
        }
    }
}
