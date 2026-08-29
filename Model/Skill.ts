import { Description } from './Description'

export class Skill {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()

    constructor(id: string = '', name: string = '', description: Description = new Description()) {
        this.id = id
        this.name = name
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

    public getDescription(): Description {
        return this.description
    }

    public setDescription(description: Description): void {
        this.description = description
    }

    public static fromJSON(json: any): Skill {
        if (!json) return new Skill()
        const name = json.name ?? ''
        const descData = json.description
        return new Skill(json.id || '', name, Description.fromJSON(descData))
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
        }
    }
}
