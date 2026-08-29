import { Description } from './Description'
import { Location } from './Location'
import { NPC } from './NPC'
import { Paragraph } from './Paragraph'
import { Tag } from './Tag'

export class Scene {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private paragraphs: Paragraph[] = []
    private characters: NPC[] = []
    private location: Location | null = null
    private tags: Tag[] = []
    private initialParagraphId: string = ''

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        paragraphs: Paragraph[] = [],
        characters: NPC[] = [],
        location: Location | null = null,
        tags: Tag[] = [],
        initialParagraphId: string = ''
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.paragraphs = paragraphs
        this.characters = characters
        this.location = location
        this.tags = tags
        this.initialParagraphId = initialParagraphId
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

    public getParagraphs(): Paragraph[] {
        return this.paragraphs
    }

    public setParagraphs(paragraphs: Paragraph[]): void {
        this.paragraphs = paragraphs
    }

    public addParagraph(paragraph: Paragraph): void {
        this.paragraphs.push(paragraph)
    }

    public removeParagraph(id: string): void {
        this.paragraphs = this.paragraphs.filter(p => p.getId() !== id)
    }

    public getParagraph(id: string): Paragraph | undefined {
        return this.paragraphs.find(p => p.getId() === id)
    }

    public hasParagraph(id: string): boolean {
        return this.paragraphs.some(p => p.getId() === id)
    }

    public getCharacters(): NPC[] {
        return this.characters
    }

    public setCharacters(characters: NPC[]): void {
        this.characters = characters
    }

    public addCharacter(character: NPC): void {
        this.characters.push(character)
    }

    public removeCharacter(id: string): void {
        this.characters = this.characters.filter(p => p.getId() !== id)
    }

    public getCharacter(id: string): NPC | undefined {
        return this.characters.find(p => p.getId() === id)
    }

    public hasCharacter(id: string): boolean {
        return this.characters.some(p => p.getId() === id)
    }

    public getLocation(): Location | null {
        return this.location
    }

    public setLocation(location: Location | null): void {
        this.location = location
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

    public getInitialParagraphId(): string {
        return this.initialParagraphId
    }

    public setInitialParagraphId(id: string): void {
        this.initialParagraphId = id
    }

    public static fromJSON(json: any): Scene {
        if (!json) return new Scene()
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const name = json.name ?? ''
        const descData = json.description
        const paragraphs = json.paragraphs || []
        const characters = json.characters || []
        const locationData = json.location
        const initialParagraphId = json.initialParagraphId ?? ''

        return new Scene(
            json.id || '',
            name,
            Description.fromJSON(descData),
            paragraphs.map((p: any) => Paragraph.fromJSON(p)),
            characters.map((p: any) => NPC.fromJSON(p)),
            locationData ? Location.fromJSON(locationData) : null,
            tagsParsed,
            initialParagraphId
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            paragraphs: this.paragraphs,
            characters: this.characters,
            location: this.location,
            tags: this.tags,
            initialParagraphId: this.initialParagraphId,
        }
    }
}
