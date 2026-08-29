import { CharacterClass } from './CharacterClass'
import { Description } from './Description'
import { Feature } from './Feature'
import { Item } from './Item'
import { Skill } from './Skill'
import { Stat } from './Stat'

export class PlayerCharacter {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private stats: Stat[] = []
    private skills: Skill[] = []
    private features: Feature[] = []
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
        characterClass: CharacterClass | null = null
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.stats = stats
        this.skills = skills
        this.features = features
        this.items = items
        this.characterClass = characterClass
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

    public getStats(): Stat[] {
        return this.stats
    }

    public setStats(stats: Stat[]): void {
        this.stats = stats
    }

    public getStat(id: string): string | number | undefined {
        return this.stats.find(c => c.getId() === id)?.getValue()
    }

    public addStat(stat: Stat): void {
        this.stats.push(stat)
    }

    public removeStat(id: string): void {
        this.stats = this.stats.filter(c => c.getId() !== id)
    }

    public hasStat(id: string): boolean {
        return this.stats.some(c => c.getId() === id)
    }

    public getSkills(): Skill[] {
        return this.skills
    }

    public setSkills(skills: Skill[]): void {
        this.skills = skills
    }

    public getSkill(id: string): Skill | undefined {
        return this.skills.find(u => u.getId() === id)
    }

    public addSkill(skill: Skill): void {
        this.skills.push(skill)
    }

    public removeSkill(id: string): void {
        this.skills = this.skills.filter(u => u.getId() !== id)
    }

    public hasSkill(id: string): boolean {
        return this.skills.some(u => u.getId() === id)
    }

    public getFeatures(): Feature[] {
        return this.features
    }

    public setFeatures(features: Feature[]): void {
        this.features = features
    }

    public getFeature(id: string): Feature | undefined {
        return this.features.find(p => p.getId() === id)
    }

    public addFeature(feature: Feature): void {
        this.features.push(feature)
    }

    public removeFeature(id: string): void {
        this.features = this.features.filter(p => p.getId() !== id)
    }

    public hasFeature(id: string): boolean {
        return this.features.some(p => p.getId() === id)
    }

    public getItems(): Item[] {
        return this.items
    }

    public setItems(items: Item[]): void {
        this.items = items
    }

    public getItem(id: string): Item | undefined {
        return this.items.find(p => p.getId() === id)
    }

    public addItem(item: Item): void {
        this.items.push(item)
    }

    public removeItem(id: string): void {
        this.items = this.items.filter(p => p.getId() !== id)
    }

    public hasItem(id: string): boolean {
        return this.items.some(p => p.getId() === id)
    }

    public getCharacterClass(): CharacterClass | undefined {
        return this.characterClass || undefined
    }

    public setCharacterClass(characterClass: CharacterClass): void {
        this.characterClass = characterClass
    }

    public static fromJSON(json: any): PlayerCharacter {
        if (!json) return new PlayerCharacter()
        const name = json.name ?? ''
        const descData = json.description
        const statsData = json.stats || json.traits || []
        const skillsData = json.skills || []
        const featuresData = json.features || json.qualities || []
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
            classData ? CharacterClass.fromJSON(classData) : null
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            stats: this.stats,
            skills: this.skills,
            features: this.features,
            items: this.items,
            characterClass: this.characterClass,
        }
    }
}
