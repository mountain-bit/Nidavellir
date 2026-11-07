import { Description } from './Description'

export type FeatureKind = 'flag' | 'value' | 'list'

export class Feature {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private featureKind: FeatureKind = 'flag'
    private value: string = ''
    private options: string[] = []

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        featureKind: FeatureKind = 'flag',
        value: string = '',
        options: string[] = []
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.featureKind = featureKind === 'value' || featureKind === 'list' ? featureKind : 'flag'
        this.value = typeof value === 'string' ? value : String(value ?? '')
        this.options = Array.isArray(options) ? options.map(String) : []
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

    public getFeatureKind(): FeatureKind {
        return this.featureKind
    }

    public setFeatureKind(kind: FeatureKind): void {
        this.featureKind = kind === 'value' || kind === 'list' ? kind : 'flag'
    }

    public getValue(): string {
        return this.value
    }

    public setValue(value: string | number): void {
        this.value = typeof value === 'string' ? value : String(value ?? '')
    }

    public getOptions(): string[] {
        return this.options
    }

    public setOptions(options: string[]): void {
        this.options = Array.isArray(options) ? options.map(String) : []
    }

    public addOption(option: string): boolean {
        const trimmed = (option ?? '').trim()
        if (!trimmed) return false
        if (this.options.includes(trimmed)) return false
        this.options.push(trimmed)
        return true
    }

    public removeOption(option: string): boolean {
        const initialLength = this.options.length
        this.options = this.options.filter(o => o !== option)
        return this.options.length < initialLength
    }

    public validateValue(val: string): { isValid: boolean; message?: string } {
        if (this.featureKind === 'flag') {
            return { isValid: true }
        }
        if (this.featureKind === 'list' && this.options.length > 0) {
            if (!this.options.includes(val)) {
                return {
                    isValid: false,
                    message: `Wartość "${val}" nie znajduje się na liście dozwolonych opcji (${this.options.join(', ')})`,
                }
            }
        }
        return { isValid: true }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): Feature {
        if (!json) return new Feature('')
        const name = json.name ?? ''
        const descData = json.description
        const kind: FeatureKind =
            json.featureKind === 'value' || json.featureKind === 'list'
                ? json.featureKind
                : json.kind === 'value' || json.kind === 'list'
                  ? json.kind
                  : 'flag'
        const value = json.value ?? ''
        const options = Array.isArray(json.options) ? json.options : []
        return new Feature(
            json.id || '',
            name,
            Description.fromJSON(descData),
            kind,
            value,
            options
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            featureKind: this.featureKind,
            value: this.value,
            options: this.options,
            type: 'feature',
        }
    }
}
