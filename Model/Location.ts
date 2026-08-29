import { Description } from './Description'
import { Tag } from './Tag'

export class Location {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private tags: Tag[] = []

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        tags: Tag[] = []
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.tags = tags
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

    public getTags(): Tag[] {
        return this.tags
    }

    public setTags(tags: Tag[]): void {
        this.tags = tags
    }

    public addTag(tag: Tag): void {
        if (!this.tags.some(t => t.getId() === tag.getId())) {
            this.tags.push(tag)
        }
    }

    public removeTag(tagIdOrName: string): void {
        this.tags = this.tags.filter(t => t.getId() !== tagIdOrName && t.getName() !== tagIdOrName)
    }

    public hasTag(tagIdOrName: string): boolean {
        return this.tags.some(t => t.getId() === tagIdOrName || t.getName() === tagIdOrName)
    }

    public static fromJSON(json: any): Location {
        if (!json) return new Location()
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const name = json.name ?? ''
        const descData = json.description
        return new Location(json.id || '', name, Description.fromJSON(descData), tagsParsed)
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            tags: this.tags,
        }
    }
}
