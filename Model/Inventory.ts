import { Item } from './Item'

export class Inventory {
    private id: string = ''
    private name: string = ''
    private capacity: number = 0 // 0 means unlimited slots
    private items: Item[] = []

    constructor(
        id: string = '',
        name: string = 'Główny ekwipunek',
        capacity: number = 0,
        items: Item[] = []
    ) {
        this.id = id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        this.name = name || 'Główny ekwipunek'
        this.capacity = typeof capacity === 'number' && capacity >= 0 ? capacity : 0
        this.items = Array.isArray(items) ? items : []
    }

    public getId(): string {
        return this.id
    }

    public setId(id: string): void {
        this.id = id
    }

    public hasId(): boolean {
        return Boolean(this.id)
    }

    public getName(): string {
        return this.name
    }

    public setName(name: string): void {
        this.name = name
    }

    public getCapacity(): number {
        return this.capacity
    }

    public setCapacity(capacity: number): void {
        this.capacity = typeof capacity === 'number' && capacity >= 0 ? capacity : 0
    }

    public isUnlimited(): boolean {
        return this.capacity === 0
    }

    public getItems(): Item[] {
        return this.items
    }

    public setItems(items: Item[]): void {
        this.items = Array.isArray(items) ? items : []
    }

    public getUsedSlots(): number {
        return this.items.reduce((acc, it) => {
            const size =
                typeof it.getSlotSize === 'function'
                    ? it.getSlotSize()
                    : typeof (it as { slotSize?: number }).slotSize === 'number'
                      ? (it as { slotSize?: number }).slotSize!
                      : 1
            return acc + (typeof size === 'number' && size >= 0 ? size : 1)
        }, 0)
    }

    public canAddItem(item: Item): boolean {
        if (this.isUnlimited()) return true
        const size =
            typeof item.getSlotSize === 'function'
                ? item.getSlotSize()
                : typeof (item as { slotSize?: number }).slotSize === 'number'
                  ? (item as { slotSize?: number }).slotSize!
                  : 1
        const needed = typeof size === 'number' && size >= 0 ? size : 1
        return this.getUsedSlots() + needed <= this.capacity
    }

    public addItem(item: Item): boolean {
        if (!this.canAddItem(item)) {
            return false
        }
        this.items.push(item)
        return true
    }

    public removeItem(id: string): void {
        this.items = this.items.filter(it => it.getId() !== id && it.getName() !== id)
    }

    public hasItem(id: string): boolean {
        return this.items.some(it => it.getId() === id || it.getName() === id)
    }

    public getFreeSlots(): number {
        if (this.isUnlimited()) return Infinity
        return Math.max(0, this.capacity - this.getUsedSlots())
    }

    public isFull(): boolean {
        if (this.isUnlimited()) return false
        return this.getUsedSlots() >= this.capacity
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            capacity: this.capacity,
            items: this.items.map(it => (typeof it.toJSON === 'function' ? it.toJSON() : it)),
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): Inventory {
        if (!json) return new Inventory()
        const id = json.id || ''
        const name = json.name || json.nazwa || 'Główny ekwipunek'
        const capacity =
            typeof json.capacity === 'number'
                ? json.capacity
                : typeof json.pojemnosc === 'number'
                  ? json.pojemnosc
                  : typeof json.maxSlots === 'number'
                    ? json.maxSlots
                    : 0
        const rawItems = json.items || json.przedmioty || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = Array.isArray(rawItems) ? rawItems.map((it: any) => Item.fromJSON(it)) : []
        return new Inventory(id, name, capacity, items)
    }
}
