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
    private min: number | null = null
    private max: number | null = null

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        mode: SkillMode = 'direct',
        value: string = '',
        statName: string = '',
        modifier: string = '',
        min: number | null = null,
        max: number | null = null
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.mode = mode
        this.value = value
        this.statName = statName
        this.modifier = modifier
        this.min = typeof min === 'number' && !Number.isNaN(min) ? min : null
        this.max = typeof max === 'number' && !Number.isNaN(max) ? max : null
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

    public getMin(): number | null {
        return this.min
    }

    public setMin(min: number | null): void {
        this.min = typeof min === 'number' && !Number.isNaN(min) ? min : null
    }

    public getMax(): number | null {
        return this.max
    }

    public setMax(max: number | null): void {
        this.max = typeof max === 'number' && !Number.isNaN(max) ? max : null
    }

    public validateValue(val: string | number): { isValid: boolean; message?: string } {
        const num = typeof val === 'number' ? val : parseFloat(String(val))
        if (isNaN(num)) {
            return { isValid: false, message: 'Wartość musi być liczbą' }
        }
        if (this.min !== null && num < this.min) {
            return { isValid: false, message: `Wartość nie może być mniejsza niż ${this.min}` }
        }
        if (this.max !== null && num > this.max) {
            return { isValid: false, message: `Wartość nie może być większa niż ${this.max}` }
        }
        return { isValid: true }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): Skill {
        if (!json) return new Skill()
        const name = json.name ?? ''
        const descData = json.description
        const mode: SkillMode = json.mode === 'stat_mod' ? 'stat_mod' : 'direct'
        const value = json.value ?? ''
        const statName = json.statName ?? ''
        const modifier = json.modifier ?? ''
        const min = typeof json.min === 'number' && !Number.isNaN(json.min) ? json.min : null
        const max = typeof json.max === 'number' && !Number.isNaN(json.max) ? json.max : null
        return new Skill(
            json.id || '',
            name,
            Description.fromJSON(descData),
            mode,
            value,
            statName,
            modifier,
            min,
            max
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            mode: this.mode,
            value: this.value,
            statName: this.statName,
            modifier: this.modifier,
            min: this.min,
            max: this.max,
            type: 'skill',
        }
    }
}
