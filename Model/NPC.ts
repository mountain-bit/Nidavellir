import { Description } from './Description'
import { Feature } from './Feature'
import { Parameter } from './Parameter'
import { Skill } from './Skill'
import { Stat } from './Stat'
import { Tag } from './Tag'

export class NPC {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private stats: Stat[] = []
    private skills: Skill[] = []
    private features: Feature[] = []
    private tags: Tag[] = []
    private avatar: string = 'warrior'
    private parameters: Parameter[] = []

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        stats: Stat[] = [],
        skills: Skill[] = [],
        features: Feature[] = [],
        tags: Tag[] = [],
        avatar: string = 'warrior',
        parameters: Parameter[] = []
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.stats = stats
        this.skills = skills
        this.features = features
        this.tags = tags
        this.avatar = avatar
        this.parameters = parameters
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
        if (!this.stats.some(c => c.getId() === stat.getId() || c.getName() === stat.getName())) {
            this.stats.push(stat)
        }
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
        if (
            !this.skills.some(u => u.getId() === skill.getId() || u.getName() === skill.getName())
        ) {
            this.skills.push(skill)
        }
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
        if (
            !this.parameters.some(
                p => p.getId() === parameter.getId() || p.getName() === parameter.getName()
            )
        ) {
            this.parameters.push(parameter)
        }
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
        if (
            !this.features.some(
                p => p.getId() === feature.getId() || p.getName() === feature.getName()
            )
        ) {
            this.features.push(feature)
        }
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

    public static fromJSON(json: any): NPC {
        if (!json) return new NPC('')
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const name = json.name ?? ''
        const descData = json.description
        const statsData = json.stats || json.traits || []
        const skillsData = json.skills || []
        const featuresData = json.features || json.qualities || []
        const paramsData = json.parameters || json.vitals || []
        const avatar = json.avatar ?? 'warrior'
        return new NPC(
            json.id || '',
            name,
            Description.fromJSON(descData),
            statsData.map((c: any) => Stat.fromJSON(c)),
            skillsData.map((u: any) => Skill.fromJSON(u)),
            featuresData.map((p: any) => Feature.fromJSON(p)),
            tagsParsed,
            avatar,
            paramsData.map((p: any) => Parameter.fromJSON(p))
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
        }
    }
}
