import { Choice } from './Choice'
import { Combat } from './Combat'
import { Description } from './Description'
import { Tag } from './Tag'

export class Paragraph {
    private id: string = ''
    private tags: Tag[] = []
    private number: number = 0
    private randomizedNumber: number = 0
    private isNumberLocked: boolean = false
    private title: string = ''
    private content: Description = new Description()
    private choices: Choice[] = []
    private hasCombat: boolean = false
    private combat: Combat = new Combat('', '')

    constructor(
        id: string = '',
        title: string = '',
        content: Description = new Description(),
        choices: Choice[] = [],
        hasCombat: boolean = false,
        combat: Combat = new Combat('', ''),
        tags: Tag[] = []
    ) {
        this.id = id
        this.title = title
        this.content = content
        this.choices = choices
        this.hasCombat = hasCombat
        this.combat = combat
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

    public getTitle(): string {
        return this.title
    }

    public setTitle(title: string): void {
        this.title = title
    }

    public getContent(): Description {
        return this.content
    }

    public setContent(content: Description): void {
        this.content = content
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

    public getNumber(): number {
        return this.number
    }

    public setNumber(number: number): void {
        this.number = number
    }

    public getRandomizedNumber(): number {
        return this.randomizedNumber
    }

    public setRandomizedNumber(number: number): void {
        this.randomizedNumber = number
    }

    public getIsNumberLocked(): boolean {
        return this.isNumberLocked
    }

    public setIsNumberLocked(locked: boolean): void {
        this.isNumberLocked = locked
    }

    public getChoices(): Choice[] {
        return this.choices
    }

    public setChoices(choices: Choice[]): void {
        this.choices = choices
    }

    public hasChoice(id: string): boolean {
        return this.choices.some(p => p.getId() === id)
    }

    public addChoice(choice: Choice): void {
        this.choices.push(choice)
    }

    public removeChoice(id: string): void {
        this.choices = this.choices.filter(p => p.getId() !== id)
    }

    public getChoice(id: string): Choice | undefined {
        return this.choices.find(p => p.getId() === id)
    }

    public getHasCombat(): boolean {
        return this.hasCombat
    }

    public setHasCombat(hasCombat: boolean): void {
        this.hasCombat = hasCombat
    }

    public getCombat(): Combat {
        return this.combat
    }

    public setCombat(combat: Combat): void {
        this.combat = combat
    }

    public static fromJSON(json: any): Paragraph {
        if (!json) return new Paragraph('')
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const title = json.title ?? ''
        const content = json.content
        const jumps = json.jumps || []
        const hasCombat = json.hasCombat ?? false
        const combatData = json.combat

        const p = new Paragraph(
            json.id || '',
            title,
            Description.fromJSON(content),
            jumps.map((przeskok: any) => Choice.fromJSON(przeskok)),
            hasCombat,
            combatData ? Combat.fromJSON(combatData) : new Combat('', ''),
            tagsParsed
        )
        if (json.number !== undefined) p.number = json.number
        if (json.randomizedNumber !== undefined) p.randomizedNumber = json.randomizedNumber
        if (json.isNumberLocked !== undefined) p.isNumberLocked = json.isNumberLocked

        return p
    }

    public toJSON(): any {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            jumps: this.choices,
            hasCombat: this.hasCombat,
            combat: this.combat,
            tags: this.tags,
            number: this.number,
            randomizedNumber: this.randomizedNumber,
            isNumberLocked: this.isNumberLocked,
        }
    }
}
