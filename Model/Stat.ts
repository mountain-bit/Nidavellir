import { Description } from './Description'

export type StatKind = 'numeric' | 'list'

export interface IStatValidationResult {
    valid: boolean
    error?: string
}
export type StatValidationResult = IStatValidationResult

export class Stat {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private value: string | number
    private statKind: StatKind = 'numeric'
    private min: number | null = null
    private max: number | null = null
    private options: string[] = []

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        value: string | number = '',
        statKind: StatKind = 'numeric',
        min: number | null = null,
        max: number | null = null,
        options: string[] = []
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.value = value
        this.statKind = statKind
        this.min = min
        this.max = max
        this.options = Array.isArray(options) ? [...options] : []
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

    public getValue(): string | number {
        return this.value
    }

    public setValue(value: string | number): void {
        this.value = value
    }

    public getStatKind(): StatKind {
        return this.statKind
    }

    public setStatKind(kind: StatKind): void {
        this.statKind = kind
    }

    public getMin(): number | null {
        return this.min
    }

    public setMin(min: number | null): void {
        this.min = min !== null && min !== undefined && !isNaN(Number(min)) ? Number(min) : null
    }

    public getMax(): number | null {
        return this.max
    }

    public setMax(max: number | null): void {
        this.max = max !== null && max !== undefined && !isNaN(Number(max)) ? Number(max) : null
    }

    public getOptions(): string[] {
        return [...this.options]
    }

    public setOptions(options: string[]): void {
        this.options = Array.isArray(options)
            ? options.map(o => String(o).trim()).filter(Boolean)
            : []
    }

    public addOption(option: string): void {
        const trimmed = String(option ?? '').trim()
        if (trimmed && !this.options.includes(trimmed)) {
            this.options.push(trimmed)
        }
    }

    public removeOption(option: string): void {
        const trimmed = String(option ?? '').trim()
        this.options = this.options.filter(o => o !== trimmed)
    }

    public validateValue(val: string | number): IStatValidationResult {
        if (this.statKind === 'numeric') {
            if (val === '' || val === null || val === undefined) {
                return { valid: true }
            }
            const num = Number(val)
            if (isNaN(num)) {
                return { valid: false, error: 'Wartość musi być liczbą.' }
            }
            if (this.min !== null && num < this.min) {
                return { valid: false, error: `Wartość nie może być mniejsza niż ${this.min}.` }
            }
            if (this.max !== null && num > this.max) {
                return { valid: false, error: `Wartość nie może być większa niż ${this.max}.` }
            }
            return { valid: true }
        }

        if (this.statKind === 'list') {
            const strVal = String(val ?? '').trim()
            if (!strVal) {
                return { valid: true }
            }
            if (this.options.length > 0 && !this.options.includes(strVal)) {
                return { valid: false, error: 'Wartość musi być jedną z dozwolonych opcji.' }
            }
            return { valid: true }
        }

        return { valid: true }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): Stat {
        if (!json) return new Stat('', '', new Description(), '')
        const name = json.name ?? ''
        const descData = json.description
        const val = json.value ?? ''

        let statKind: StatKind = json.statKind ?? json.kind ?? 'numeric'
        const rawMin =
            json.min !== undefined && json.min !== null && json.min !== '' ? Number(json.min) : null
        const min = rawMin !== null && !isNaN(rawMin) ? rawMin : null
        const rawMax =
            json.max !== undefined && json.max !== null && json.max !== '' ? Number(json.max) : null
        const max = rawMax !== null && !isNaN(rawMax) ? rawMax : null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: string[] = Array.isArray(json.options)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              json.options.map((o: any) => String(o).trim()).filter(Boolean)
            : []

        if (!json.statKind && options.length > 0) {
            statKind = 'list'
        }

        return new Stat(
            json.id || '',
            name,
            Description.fromJSON(descData),
            val,
            statKind,
            min,
            max,
            options
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            value: this.value,
            type: 'stat',
            statKind: this.statKind,
            min: this.min,
            max: this.max,
            options: this.options,
        }
    }
}
