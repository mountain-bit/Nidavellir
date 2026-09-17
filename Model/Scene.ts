import { DEFAULT_SCENE_COLOR } from './constants'
import { Description } from './Description'
import { Location } from './Location'
import { NPC } from './NPC'
import { Paragraph } from './Paragraph'
import { Tag } from './Tag'

export const SCENE_MIN_WIDTH = 160
export const SCENE_MIN_HEIGHT = 110
export const SCENE_DEFAULT_WIDTH = 400
export const SCENE_DEFAULT_HEIGHT = 280

export class Scene {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private paragraphs: Paragraph[] = []
    private characters: NPC[] = []
    private locations: Location[] = []
    private tags: Tag[] = []
    private initialParagraphId: string = ''
    private position: { x: number; y: number } | null = null
    private width: number = SCENE_DEFAULT_WIDTH
    private height: number = SCENE_DEFAULT_HEIGHT
    private color: string = DEFAULT_SCENE_COLOR
    private isMovementLocked: boolean = true

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        paragraphs: Paragraph[] = [],
        characters: NPC[] = [],
        locations: Location[] | Location | null = [],
        tags: Tag[] = [],
        initialParagraphId: string = '',
        position: { x: number; y: number } | null = null,
        width: number = SCENE_DEFAULT_WIDTH,
        height: number = SCENE_DEFAULT_HEIGHT,
        color: string = DEFAULT_SCENE_COLOR,
        isMovementLocked: boolean = true
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.paragraphs = paragraphs
        this.characters = characters
        if (Array.isArray(locations)) {
            this.locations = locations
        } else if (locations) {
            this.locations = [locations]
        } else {
            this.locations = []
        }
        this.tags = tags
        this.initialParagraphId = initialParagraphId
        this.position = position
        this.width = width
        this.height = height
        this.color = color
        this.isMovementLocked = isMovementLocked
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
        if (!this.paragraphs.some(p => p.getId() === paragraph.getId())) {
            this.paragraphs.push(paragraph)
        }
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

    public getPosition(): { x: number; y: number } | null {
        return this.position
    }

    public setPosition(pos: { x: number; y: number } | null): void {
        this.position = pos
    }

    public getWidth(): number {
        return this.width
    }

    public setWidth(width: number): void {
        this.width = Math.max(SCENE_MIN_WIDTH, width)
    }

    public getHeight(): number {
        return this.height
    }

    public setHeight(height: number): void {
        this.height = Math.max(SCENE_MIN_HEIGHT, height)
    }

    public getColor(): string {
        return this.color
    }

    public setColor(color: string): void {
        this.color = color || DEFAULT_SCENE_COLOR
    }

    public getIsMovementLocked(): boolean {
        return this.isMovementLocked
    }

    public setIsMovementLocked(locked: boolean): void {
        this.isMovementLocked = Boolean(locked)
    }

    public containsPoint(pointX: number, pointY: number): boolean {
        if (!this.position) return false
        const sx = this.position.x
        const sy = this.position.y
        return (
            pointX >= sx && pointX <= sx + this.width && pointY >= sy && pointY <= sy + this.height
        )
    }

    public getArea(): number {
        return this.width * this.height
    }

    /**
     * Checks if this scene bounding box overlaps with another scene bounding box (AABB test).
     */
    public intersectsScene(otherScene: Scene): boolean {
        if (!this.position || !otherScene.getPosition()) return false
        if (this.id === otherScene.getId()) return false

        const otherPos = otherScene.getPosition()!
        const aLeft = this.position.x
        const aRight = this.position.x + this.width
        const aTop = this.position.y
        const aBottom = this.position.y + this.height

        const bLeft = otherPos.x
        const bRight = otherPos.x + otherScene.getWidth()
        const bTop = otherPos.y
        const bBottom = otherPos.y + otherScene.getHeight()

        const noOverlap = aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom
        return !noOverlap
    }

    /**
     * Checks if another scene is geometrically contained within this scene.
     * A scene is contained if it intersects this scene, this scene has a larger area,
     * and the center point of otherScene is inside this scene.
     */
    public containsScene(otherScene: Scene): boolean {
        if (!this.position || !otherScene.getPosition()) return false
        if (this.id === otherScene.getId()) return false

        if (this.getArea() <= otherScene.getArea()) return false

        const otherPos = otherScene.getPosition()!
        const otherCenterX = otherPos.x + otherScene.getWidth() / 2
        const otherCenterY = otherPos.y + otherScene.getHeight() / 2

        return this.containsPoint(otherCenterX, otherCenterY)
    }

    /**
     * Checks if a paragraph node overlaps with this scene box.
     * Paragraph position in StoryGraph is centered (translate(-50%, -50%)).
     */
    public intersectsParagraph(
        paragraph: Paragraph,
        nodeWidth: number = 220,
        nodeHeight: number = 80
    ): boolean {
        if (!this.position) return false
        const pPos = paragraph.getPosition()
        if (!pPos) return false

        const pLeft = pPos.x - nodeWidth / 2
        const pRight = pPos.x + nodeWidth / 2
        const pTop = pPos.y - nodeHeight / 2
        const pBottom = pPos.y + nodeHeight / 2

        const sLeft = this.position.x
        const sRight = this.position.x + this.width
        const sTop = this.position.y
        const sBottom = this.position.y + this.height

        // Overlap bounding box test (AABB)
        const noOverlap = pRight < sLeft || pLeft > sRight || pBottom < sTop || pTop > sBottom
        return !noOverlap
    }

    public static fromJSON(json: Record<string, unknown> | null | undefined): Scene {
        if (!json) return new Scene()

        const rawTags = Array.isArray(json.tags) ? json.tags : []
        const tagsParsed = rawTags.map((t: unknown) => Tag.fromJSON(t as Record<string, unknown>))

        const name = typeof json.name === 'string' ? json.name : ''
        const descData = json.description as Record<string, unknown> | undefined
        const rawParagraphs = Array.isArray(json.paragraphs) ? json.paragraphs : []
        const rawCharacters = Array.isArray(json.characters) ? json.characters : []
        const rawLocations = Array.isArray(json.locations) ? json.locations : []
        let locationsParsed: Location[] = rawLocations.map((l: unknown) =>
            Location.fromJSON(l as Record<string, unknown>)
        )
        if (locationsParsed.length === 0) {
            const locationData = json.location as Record<string, unknown> | undefined
            if (locationData) {
                locationsParsed = [Location.fromJSON(locationData)]
            }
        }
        const initialParagraphId =
            typeof json.initialParagraphId === 'string' ? json.initialParagraphId : ''

        let position: { x: number; y: number } | null = null
        const rawPos = json.position as Record<string, unknown> | undefined
        if (rawPos && typeof rawPos === 'object') {
            if (typeof rawPos.x === 'number' && typeof rawPos.y === 'number') {
                position = { x: rawPos.x, y: rawPos.y }
            }
        }

        const rawWidth = json.width
        const width = typeof rawWidth === 'number' ? rawWidth : SCENE_DEFAULT_WIDTH
        const rawHeight = json.height
        const height = typeof rawHeight === 'number' ? rawHeight : SCENE_DEFAULT_HEIGHT
        const rawColor = json.color
        const color = typeof rawColor === 'string' && rawColor ? rawColor : DEFAULT_SCENE_COLOR
        const rawLocked = json.isMovementLocked
        const isMovementLocked = typeof rawLocked === 'boolean' ? rawLocked : true

        return new Scene(
            typeof json.id === 'string' ? json.id : '',
            name,
            Description.fromJSON(descData),
            rawParagraphs.map((p: unknown) => Paragraph.fromJSON(p as Record<string, unknown>)),
            rawCharacters.map((c: unknown) => NPC.fromJSON(c as Record<string, unknown>)),
            locationsParsed,
            tagsParsed,
            initialParagraphId,
            position,
            width,
            height,
            color,
            isMovementLocked
        )
    }

    public toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description ? this.description.toJSON() : null,
            paragraphs: this.paragraphs.map(p => p.toJSON()),
            characters: this.characters.map(c => c.toJSON()),
            locations: this.locations.map(l => l.toJSON()),
            location: this.locations.length > 0 ? this.locations[0].toJSON() : null,
            tags: this.tags.map(t => t.toJSON()),
            initialParagraphId: this.initialParagraphId,
            position: this.position,
            width: this.width,
            height: this.height,
            color: this.color,
            isMovementLocked: this.isMovementLocked,
        }
    }
}
