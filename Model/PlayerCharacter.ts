import { CharacterClass } from './CharacterClass'
import { Description } from './Description'
import { Feature } from './Feature'
import { Item } from './Item'
import { Parameter } from './Parameter'
import { Skill } from './Skill'
import { Stat } from './Stat'
import { Tag } from './Tag'

export class PlayerCharacter {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private avatar: string = 'warrior'
    private stats: Stat[] = []
    private skills: Skill[] = []
    private parameters: Parameter[] = []
    private features: Feature[] = []
    private tags: Tag[] = []
    private customAttributes: { name: string; value: string }[] = []
    private items: Item[] = []
    private characterClass: CharacterClass | null = null

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        stats: Stat[] = [],
        skills: Skill[] = [],
        features: Feature[] = [],
        items: Item[] = [],
        characterClass: CharacterClass | null = null,
        avatar: string = 'warrior',
        parameters: Parameter[] = [],
        tags: Tag[] = [],
        customAttributes: { name: string; value: string }[] = []
    ) {
        this.id = id
        this.name = name
        if (description instanceof Description) {
            this.description = description
        } else if (typeof description === 'string') {
            this.description = new Description(description, description)
        } else if (description && typeof description === 'object') {
            this.description = Description.fromJSON(description)
        } else {
            this.description = new Description()
        }
        this.stats = stats
        this.skills = skills
        this.features = features
        this.items = items
        this.characterClass = characterClass
        this.avatar = avatar
        this.parameters = parameters
        this.tags = tags
        this.customAttributes = customAttributes
    }

    public getId(): string | undefined {
        if (this.id !== '') return this.id
        return undefined
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

    public getSummary(): string {
        return this.description && typeof this.description.getSummary === 'function'
            ? this.description.getSummary()
            : ''
    }

    public setSummary(summary: string): void {
        if (!this.description || typeof this.description.setSummary !== 'function') {
            this.description = new Description('', summary)
        } else {
            this.description.setSummary(summary)
        }
    }

    public getAvatar(): string {
        return this.avatar
    }

    public setAvatar(avatar: string): void {
        this.avatar = avatar
    }

    public getStats(): Stat[] {
        return this.stats
    }

    public setStats(stats: Stat[]): void {
        this.stats = stats
    }

    public getStat(id: string): string | number | undefined {
        return this.stats.find(c => c.getId() === id || c.getName() === id)?.getValue()
    }

    public addStat(stat: Stat): void {
        this.stats.push(stat)
    }

    public removeStat(id: string): void {
        this.stats = this.stats.filter(c => c.getId() !== id && c.getName() !== id)
    }

    public hasStat(id: string): boolean {
        return this.stats.some(c => c.getId() === id || c.getName() === id)
    }

    public getSkills(): Skill[] {
        return this.skills
    }

    public setSkills(skills: Skill[]): void {
        this.skills = skills
    }

    public getSkill(id: string): Skill | undefined {
        return this.skills.find(u => u.getId() === id || u.getName() === id)
    }

    public addSkill(skill: Skill): void {
        this.skills.push(skill)
    }

    public removeSkill(id: string): void {
        this.skills = this.skills.filter(u => u.getId() !== id && u.getName() !== id)
    }

    public hasSkill(id: string): boolean {
        return this.skills.some(u => u.getId() === id || u.getName() === id)
    }

    public getParameters(): Parameter[] {
        return this.parameters
    }

    public setParameters(parameters: Parameter[]): void {
        this.parameters = parameters
    }

    public getParameter(id: string): Parameter | undefined {
        return this.parameters.find(p => p.getId() === id || p.getName() === id)
    }

    public addParameter(parameter: Parameter): void {
        this.parameters.push(parameter)
    }

    public removeParameter(id: string): void {
        this.parameters = this.parameters.filter(p => p.getId() !== id && p.getName() !== id)
    }

    public hasParameter(id: string): boolean {
        return this.parameters.some(p => p.getId() === id || p.getName() === id)
    }

    public getFeatures(): Feature[] {
        return this.features
    }

    public setFeatures(features: Feature[]): void {
        this.features = features
    }

    public getFeature(id: string): Feature | undefined {
        return this.features.find(p => p.getId() === id || p.getName() === id)
    }

    public addFeature(feature: Feature): void {
        this.features.push(feature)
    }

    public removeFeature(id: string): void {
        this.features = this.features.filter(p => p.getId() !== id && p.getName() !== id)
    }

    public hasFeature(id: string): boolean {
        return this.features.some(p => p.getId() === id || p.getName() === id)
    }

    public getTags(): Tag[] {
        return this.tags
    }

    public setTags(tags: Tag[]): void {
        this.tags = tags
    }

    public addTag(tag: Tag): void {
        if (!this.tags.some(t => t.getId() === tag.getId() || t.getName() === tag.getName())) {
            this.tags.push(tag)
        }
    }

    public removeTag(tagIdOrName: string): void {
        this.tags = this.tags.filter(t => t.getId() !== tagIdOrName && t.getName() !== tagIdOrName)
    }

    public hasTag(tagIdOrName: string): boolean {
        return this.tags.some(t => t.getId() === tagIdOrName || t.getName() === tagIdOrName)
    }

    public getCustomAttributes(): { name: string; value: string }[] {
        return this.customAttributes
    }

    public setCustomAttributes(attrs: { name: string; value: string }[]): void {
        this.customAttributes = attrs
    }

    public getItems(): Item[] {
        return this.items
    }

    public setItems(items: Item[]): void {
        this.items = items
    }

    public getItem(id: string): Item | undefined {
        return this.items.find(p => p.getId() === id || p.getName() === id)
    }

    public addItem(item: Item): void {
        this.items.push(item)
    }

    public removeItem(id: string): void {
        this.items = this.items.filter(p => p.getId() !== id && p.getName() !== id)
    }

    public hasItem(id: string): boolean {
        return this.items.some(p => p.getId() === id || p.getName() === id)
    }

    public getCharacterClass(): CharacterClass | undefined {
        return this.characterClass || undefined
    }

    public setCharacterClass(characterClass: CharacterClass | null): void {
        this.characterClass = characterClass
    }

    public static fromJSON(json: any): PlayerCharacter {
        if (!json) return new PlayerCharacter()
        const name = json.name ?? ''
        const descData = json.description
        const statsData = json.stats || json.traits || []
        const skillsData = json.skills || []
        const featuresData = json.features || json.qualities || []
        const paramsData = json.parameters || json.vitals || []
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const avatar = json.avatar ?? 'warrior'
        const customAttrs = (json.customAttributes || []).map((ca: any) => ({
            name: ca.name || ca.key || '',
            value: String(ca.value ?? ''),
        }))
        const itemsData = json.items || []
        const classData = json.characterClass
        return new PlayerCharacter(
            json.id || '',
            name,
            Description.fromJSON(descData),
            statsData.map((c: any) => Stat.fromJSON(c)),
            skillsData.map((u: any) => Skill.fromJSON(u)),
            featuresData.map((p: any) => Feature.fromJSON(p)),
            itemsData.map((p: any) => Item.fromJSON(p)),
            classData ? CharacterClass.fromJSON(classData) : null,
            avatar,
            paramsData.map((p: any) => Parameter.fromJSON(p)),
            tagsParsed,
            customAttrs
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            avatar: this.avatar,
            description: this.description,
            stats: this.stats,
            skills: this.skills,
            parameters: this.parameters,
            features: this.features,
            tags: this.tags,
            customAttributes: this.customAttributes,
            items: this.items,
            characterClass: this.characterClass,
        }
    }
}
