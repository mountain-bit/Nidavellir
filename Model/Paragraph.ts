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
    private position: { x: number; y: number } | null = null

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

    public getName(): string {
        return this.title
    }

    public setName(name: string): void {
        this.title = name
    }

    public randomizeNumber(min: number = 1, max: number = 999): number {
        if (this.randomizedNumber === 0) {
            this.randomizedNumber = Math.floor(Math.random() * (max - min + 1)) + min
        }
        return this.randomizedNumber
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
        if (!choice.getFromParagraphId() && this.id) {
            choice.setFromParagraphId(this.id)
        }
        this.choices.push(choice)
    }

    public removeChoice(id: string): void {
        this.choices = this.choices.filter(p => p.getId() !== id && p.getToParagraphId() !== id)
    }

    public getChoice(id: string): Choice | undefined {
        return this.choices.find(p => p.getId() === id || p.getToParagraphId() === id)
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

    public getPosition(): { x: number; y: number } | null {
        return this.position
    }

    public setPosition(pos: { x: number; y: number } | null): void {
        this.position = pos
    }

    public static fromJSON(json: Record<string, unknown> | null | undefined): Paragraph {
        if (!json) return new Paragraph('')
        const rawTags = Array.isArray(json.tags) ? json.tags : []
        const tagsParsed = rawTags.map(t => Tag.fromJSON(t as Record<string, unknown>))
        const title =
            typeof json.title === 'string'
                ? json.title
                : typeof json.nazwa === 'string'
                  ? json.nazwa
                  : ''
        const content = (json.content || json.opis) as Record<string, unknown> | undefined
        const rawJumps = Array.isArray(json.jumps)
            ? json.jumps
            : Array.isArray(json.choices)
              ? json.choices
              : Array.isArray(json.przeskoki)
                ? json.przeskoki
                : []
        const paragraphId = typeof json.id === 'string' ? json.id : ''
        const jumps = rawJumps.map(przeskok => {
            const ch = Choice.fromJSON(przeskok as Record<string, unknown>)
            if (!ch.getFromParagraphId() && paragraphId) {
                ch.setFromParagraphId(paragraphId)
            }
            return ch
        })
        const hasCombat = typeof json.hasCombat === 'boolean' ? json.hasCombat : false
        const combatData = json.combat as Record<string, unknown> | undefined

        const p = new Paragraph(
            paragraphId,
            title,
            Description.fromJSON(content),
            jumps,
            hasCombat,
            combatData ? Combat.fromJSON(combatData) : new Combat('', ''),
            tagsParsed
        )
        if (typeof json.number === 'number') p.number = json.number
        if (typeof json.randomizedNumber === 'number') p.randomizedNumber = json.randomizedNumber
        if (typeof json.isNumberLocked === 'boolean') p.isNumberLocked = json.isNumberLocked

        if (json.position && typeof json.position === 'object') {
            const pos = json.position as Record<string, unknown>
            if (typeof pos.x === 'number' && typeof pos.y === 'number') {
                p.position = { x: pos.x, y: pos.y }
            }
        }

        return p
    }

    public toJSON(): Record<string, unknown> {
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
            position: this.position,
        }
    }
}
