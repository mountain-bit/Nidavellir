export type ConditionType = 'text' | 'item' | 'stat' | 'skill' | 'variable' | 'custom'

export abstract class Condition {
    protected id: string = ''
    protected name: string = ''
    protected type: ConditionType = 'custom'

    constructor(id: string = '', name: string = '', type: ConditionType = 'custom') {
        this.id = id
        this.name = name
        this.type = type
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

    public getType(): ConditionType {
        return this.type
    }

    public setType(type: ConditionType): void {
        this.type = type
    }

    public abstract getSummary(): string

    public abstract toJSON(): Record<string, unknown>

    public static fromJSON(json: Record<string, unknown> | null | undefined): Condition {
        if (!json) {
            return new TextCondition('', '', '')
        }
        const type =
            typeof json.type === 'string'
                ? json.type
                : typeof json.text === 'string'
                  ? 'text'
                  : 'custom'
        if (type === 'item') {
            return ItemCondition.fromJSON(json)
        }
        if (type === 'stat' || type === 'skill' || type === 'parameter') {
            return StatCondition.fromJSON(json)
        }
        return TextCondition.fromJSON(json)
    }
}

export class TextCondition extends Condition {
    private text: string = ''

    constructor(id: string = '', name: string = '', text: string = '') {
        super(id, name, 'text')
        this.text = text
    }

    public getText(): string {
        return this.text
    }

    public setText(text: string): void {
        this.text = text
    }

    public override getSummary(): string {
        return this.text || this.name || ''
    }

    public override toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            text: this.text,
        }
    }

    public static override fromJSON(
        json: Record<string, unknown> | null | undefined
    ): TextCondition {
        if (!json) return new TextCondition('', '', '')
        const id = typeof json.id === 'string' ? json.id : ''
        const name = typeof json.name === 'string' ? json.name : ''
        const text =
            typeof json.text === 'string'
                ? json.text
                : typeof json.name === 'string'
                  ? json.name
                  : ''
        return new TextCondition(id, name, text)
    }
}

export class ItemCondition extends Condition {
    private itemName: string = ''
    private quantity: number = 1

    constructor(id: string = '', name: string = '', itemName: string = '', quantity: number = 1) {
        super(id, name, 'item')
        this.itemName = itemName
        this.quantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1
    }

    public getItemName(): string {
        return this.itemName
    }

    public setItemName(itemName: string): void {
        this.itemName = itemName
    }

    public getQuantity(): number {
        return this.quantity
    }

    public setQuantity(quantity: number): void {
        this.quantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1
    }

    public override getSummary(): string {
        const itemStr = this.itemName || this.name || 'Przedmiot'
        return this.quantity > 1 ? `Posiada: ${itemStr} (x${this.quantity})` : `Posiada: ${itemStr}`
    }

    public override toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            itemName: this.itemName,
            quantity: this.quantity,
        }
    }

    public static override fromJSON(
        json: Record<string, unknown> | null | undefined
    ): ItemCondition {
        if (!json) return new ItemCondition('', '', '', 1)
        const id = typeof json.id === 'string' ? json.id : ''
        const name = typeof json.name === 'string' ? json.name : ''
        const itemName =
            typeof json.itemName === 'string'
                ? json.itemName
                : typeof json.item === 'string'
                  ? json.item
                  : name
        const quantity = typeof json.quantity === 'number' ? json.quantity : 1
        return new ItemCondition(id, name, itemName, quantity)
    }
}

export type StatComparisonOperator = '>=' | '<=' | '==' | '>' | '<' | '!='

export class StatCondition extends Condition {
    private statName: string = ''
    private operator: StatComparisonOperator = '>='
    private value: number = 0

    constructor(
        id: string = '',
        name: string = '',
        statName: string = '',
        operator: StatComparisonOperator = '>=',
        value: number = 0
    ) {
        super(id, name, 'stat')
        this.statName = statName
        this.operator = operator
        this.value = typeof value === 'number' ? value : 0
    }

    public getStatName(): string {
        return this.statName
    }

    public setStatName(statName: string): void {
        this.statName = statName
    }

    public getOperator(): StatComparisonOperator {
        return this.operator
    }

    public setOperator(operator: StatComparisonOperator): void {
        this.operator = operator
    }

    public getValue(): number {
        return this.value
    }

    public setValue(value: number): void {
        this.value = typeof value === 'number' ? value : 0
    }

    public override getSummary(): string {
        const nameStr = this.statName || this.name || 'Cecha'
        return `${nameStr} ${this.operator} ${this.value}`
    }

    public override toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            statName: this.statName,
            operator: this.operator,
            value: this.value,
        }
    }

    public static override fromJSON(
        json: Record<string, unknown> | null | undefined
    ): StatCondition {
        if (!json) return new StatCondition('', '', '', '>=', 0)
        const id = typeof json.id === 'string' ? json.id : ''
        const name = typeof json.name === 'string' ? json.name : ''
        const statName =
            typeof json.statName === 'string'
                ? json.statName
                : typeof json.stat === 'string'
                  ? json.stat
                  : name
        const operator =
            typeof json.operator === 'string' &&
            ['>=', '<=', '==', '>', '<', '!='].includes(json.operator)
                ? (json.operator as StatComparisonOperator)
                : '>='
        const value = typeof json.value === 'number' ? json.value : 0
        return new StatCondition(id, name, statName, operator, value)
    }
}
