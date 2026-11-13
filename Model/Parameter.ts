import { Description } from './Description'

export type ParameterMode = 'direct' | 'formula'

export class Parameter {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private mode: ParameterMode = 'direct'
    private value: string | number = ''
    private formula: string = ''
    private calculatedValue: number | null = null
    private min: number | null = null
    private max: number | null = null

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        mode: ParameterMode = 'direct',
        value: string | number = '',
        formula: string = '',
        calculatedValue: number | null = null,
        min: number | null = null,
        max: number | null = null
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.mode = mode
        this.value = value
        this.formula = formula
        this.calculatedValue = calculatedValue
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

    public getMode(): ParameterMode {
        return this.mode
    }

    public setMode(mode: ParameterMode): void {
        this.mode = mode
    }

    public getValue(): string | number {
        return this.value
    }

    public setValue(value: string | number): void {
        this.value = value
    }

    public getFormula(): string {
        return this.formula
    }

    public setFormula(formula: string): void {
        this.formula = formula
    }

    public getCalculatedValue(): number | null {
        return this.calculatedValue
    }

    public setCalculatedValue(val: number | null): void {
        this.calculatedValue = val
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
    public static fromJSON(json: any): Parameter {
        if (!json) return new Parameter('', '', new Description(), 'direct', '', '', null)
        const name = json.name ?? ''
        const descData = json.description
        const mode: ParameterMode = json.mode === 'formula' ? 'formula' : 'direct'
        const val = json.value ?? ''
        const formula = json.formula ?? ''
        const calcVal = typeof json.calculatedValue === 'number' ? json.calculatedValue : null
        const min = typeof json.min === 'number' && !Number.isNaN(json.min) ? json.min : null
        const max = typeof json.max === 'number' && !Number.isNaN(json.max) ? json.max : null
        return new Parameter(
            json.id || '',
            name,
            Description.fromJSON(descData),
            mode,
            val,
            formula,
            calcVal,
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
            formula: this.formula,
            calculatedValue: this.calculatedValue,
            min: this.min,
            max: this.max,
            type: 'parameter',
        }
    }
}
