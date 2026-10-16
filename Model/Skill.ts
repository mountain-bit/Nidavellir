import { Description } from './Description'

export type SkillMode = 'direct' | 'stat_mod'

export class Skill {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private mode: SkillMode = 'direct'
    private value: string = ''
    private statName: string = ''
    private modifier: string = ''

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        mode: SkillMode = 'direct',
        value: string = '',
        statName: string = '',
        modifier: string = ''
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.mode = mode
        this.value = value
        this.statName = statName
        this.modifier = modifier
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

    public getMode(): SkillMode {
        return this.mode
    }

    public setMode(mode: SkillMode): void {
        this.mode = mode
    }

    public getValue(): string {
        return this.value
    }

    public setValue(value: string | number): void {
        this.value = String(value)
    }

    public getStatName(): string {
        return this.statName
    }

    public setStatName(statName: string): void {
        this.statName = statName
    }

    public getModifier(): string {
        return this.modifier
    }

    public setModifier(modifier: string): void {
        this.modifier = modifier
    }

    public static fromJSON(json: any): Skill {
        if (!json) return new Skill()
        const name = json.name ?? ''
        const descData = json.description
        const mode: SkillMode = json.mode === 'stat_mod' ? 'stat_mod' : 'direct'
        const value = json.value ?? ''
        const statName = json.statName ?? ''
        const modifier = json.modifier ?? ''
        return new Skill(
            json.id || '',
            name,
            Description.fromJSON(descData),
            mode,
            value,
            statName,
            modifier
        )
    }

    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            mode: this.mode,
            value: this.value,
            statName: this.statName,
            modifier: this.modifier,
            type: 'skill',
        }
    }
}
