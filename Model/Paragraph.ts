import { Choice } from './Choice'
import { Combat } from './Combat'
import { Description } from './Description'
import { Location } from './Location'
import { NPC } from './NPC'
import { Tag } from './Tag'

export class Paragraph {
    private id: string = ''
    private tags: Tag[] = []
    private characters: NPC[] = []
    private locations: Location[] = []
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
        tags: Tag[] = [],
        characters: NPC[] = [],
        locations: Location[] | Location | null = []
    ) {
        this.id = id
        this.title = title
        this.content = content
        this.choices = choices
        this.hasCombat = hasCombat
        this.combat = combat
        this.tags = tags
        this.characters = characters
        if (Array.isArray(locations)) {
            this.locations = locations
        } else if (locations) {
            this.locations = [locations]
        } else {
            this.locations = []
        }
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

    public getCharacters(): NPC[] {
        return this.characters
    }

    public setCharacters(characters: NPC[]): void {
        this.characters = characters
    }

    public addCharacter(character: NPC): void {
        if (!this.characters.some(c => c.getId() === character.getId())) {
            this.characters.push(character)
        }
    }

    public removeCharacter(idOrName: string): void {
        this.characters = this.characters.filter(
            c => c.getId() !== idOrName && c.getName() !== idOrName
        )
    }

    public getCharacter(idOrName: string): NPC | undefined {
        return this.characters.find(c => c.getId() === idOrName || c.getName() === idOrName)
    }

    public hasCharacter(idOrName: string): boolean {
        return this.characters.some(c => c.getId() === idOrName || c.getName() === idOrName)
    }

    public getLocations(): Location[] {
        return this.locations
    }

    public setLocations(locations: Location[]): void {
        this.locations = locations
    }

    public addLocation(location: Location): void {
        if (!this.locations.some(l => l.getId() === location.getId())) {
            this.locations.push(location)
        }
    }

    public removeLocation(idOrName: string): void {
        this.locations = this.locations.filter(
            l => l.getId() !== idOrName && l.getName() !== idOrName
        )
    }

    public hasLocation(idOrName: string): boolean {
        return this.locations.some(l => l.getId() === idOrName || l.getName() === idOrName)
    }

    public getLocation(): Location | null {
        return this.locations.length > 0 ? this.locations[0] : null
    }

    public setLocation(location: Location | null): void {
        if (!location) {
            this.locations = []
        } else {
            this.locations = [location]
        }
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
                : typeof json.name === 'string'
                  ? json.name
                  : ''
        const content = json.content as Record<string, unknown> | undefined
        const rawChoices = Array.isArray(json.choices) ? json.choices : []
        const paragraphId = typeof json.id === 'string' ? json.id : ''
        const choices = rawChoices.map(rawChoice => {
            const ch = Choice.fromJSON(rawChoice as Record<string, unknown>)
            if (!ch.getFromParagraphId() && paragraphId) {
                ch.setFromParagraphId(paragraphId)
            }
            return ch
        })
        const hasCombat = typeof json.hasCombat === 'boolean' ? json.hasCombat : false
        const combatData = json.combat as Record<string, unknown> | undefined

        const rawCharacters = Array.isArray(json.characters) ? json.characters : []
        const charactersParsed = rawCharacters.map(c => NPC.fromJSON(c as Record<string, unknown>))
        const rawLocations = Array.isArray(json.locations) ? json.locations : []
        let locationsParsed: Location[] = rawLocations.map(l =>
            Location.fromJSON(l as Record<string, unknown>)
        )
        if (locationsParsed.length === 0) {
            const locationData = json.location as Record<string, unknown> | undefined
            if (locationData) {
                locationsParsed = [Location.fromJSON(locationData)]
            }
        }

        const p = new Paragraph(
            paragraphId,
            title,
            Description.fromJSON(content),
            choices,
            hasCombat,
            combatData ? Combat.fromJSON(combatData) : new Combat('', ''),
            tagsParsed,
            charactersParsed,
            locationsParsed
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
            content: this.content ? this.content.toJSON() : null,
            choices: this.choices.map(c => c.toJSON()),
            hasCombat: this.hasCombat,
            combat: this.combat ? this.combat.toJSON() : null,
            tags: this.tags.map(t => t.toJSON()),
            characters: this.characters.map(c => c.toJSON()),
            locations: this.locations.map(l => l.toJSON()),
            location: this.locations.length > 0 ? this.locations[0].toJSON() : null,
            number: this.number,
            randomizedNumber: this.randomizedNumber,
            isNumberLocked: this.isNumberLocked,
            position: this.position,
        }
    }
}
