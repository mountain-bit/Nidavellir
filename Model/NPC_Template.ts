import { Description } from './Description'
import { Feature } from './Feature'
import { Skill } from './Skill'
import { Stat } from './Stat'

// eslint-disable-next-line @typescript-eslint/naming-convention
export class NPC_Template {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private stats: Stat[] = []
    private skills: Skill[] = []
    private features: Feature[] = []

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        stats: Stat[] = [],
        skills: Skill[] = [],
        features: Feature[] = []
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.stats = stats
        this.skills = skills
        this.features = features
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

    public static fromJSON(json: any): NPC_Template {
        if (!json) return new NPC_Template('')
        const name = json.name ?? ''
        const descData = json.description
        const statsData = json.stats || json.traits || []
        const skillsData = json.skills || []
        const featuresData = json.features || json.qualities || []
        return new NPC_Template(
            json.id || '',
            name,
            Description.fromJSON(descData),
            statsData.map((c: any) => Stat.fromJSON(c)),
            skillsData.map((u: any) => Skill.fromJSON(u)),
            featuresData.map((p: any) => Feature.fromJSON(p))
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
        }
    }
}
