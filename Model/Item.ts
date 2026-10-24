import { Description } from './Description'
import { Tag } from './Tag'

export interface IItemModifier {
    id: string
    targetType: 'stat' | 'parameter' | 'skill' | 'custom'
    targetName: string
    value: number | string
    operator?: '+' | '-' | '='
    description?: string
}
export type ItemModifier = IItemModifier

export interface IItemInventoryConfig {
    category: 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc' | string
    slotSize: number
    weight: number
    isConsumable: boolean
    inStartingInventory: boolean
    targetInventoryId?: string
}
export type ItemInventoryConfig = IItemInventoryConfig

export const DEFAULT_ITEM_INVENTORY_CONFIG: IItemInventoryConfig = {
    category: 'misc',
    slotSize: 1,
    weight: 1,
    isConsumable: false,
    inStartingInventory: false,
    targetInventoryId: '',
}

export class Item {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private tags: Tag[] = []
    private modifiers: IItemModifier[] = []
    private inventoryConfig: IItemInventoryConfig = { ...DEFAULT_ITEM_INVENTORY_CONFIG }

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        tags: Tag[] = [],
        modifiers: IItemModifier[] = [],
        inventoryConfig: Partial<IItemInventoryConfig> = {}
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.tags = Array.isArray(tags) ? tags : []
        this.modifiers = Array.isArray(modifiers) ? modifiers : []
        this.inventoryConfig = {
            ...DEFAULT_ITEM_INVENTORY_CONFIG,
            ...(inventoryConfig || {}),
        }
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

    // --- TAGS ---
    public getTags(): Tag[] {
        return this.tags
    }

    public setTags(tags: Tag[]): void {
        this.tags = Array.isArray(tags) ? tags : []
    }

    public addTag(tag: Tag): void {
        if (!tag) return
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

    // --- MODIFIERS ---
    public getModifiers(): IItemModifier[] {
        return this.modifiers
    }

    public setModifiers(modifiers: IItemModifier[]): void {
        this.modifiers = Array.isArray(modifiers) ? modifiers : []
    }

    public addModifier(mod: IItemModifier): void {
        if (!mod) return
        const existingIdx = this.modifiers.findIndex(m => m.id === mod.id)
        if (existingIdx >= 0) {
            this.modifiers[existingIdx] = mod
        } else {
            this.modifiers.push(mod)
        }
    }

    public removeModifier(id: string): void {
        this.modifiers = this.modifiers.filter(m => m.id !== id)
    }

    public hasModifier(idOrTargetName: string): boolean {
        return this.modifiers.some(m => m.id === idOrTargetName || m.targetName === idOrTargetName)
    }

    // --- INVENTORY CONFIG ---
    public getInventoryConfig(): IItemInventoryConfig {
        return { ...this.inventoryConfig }
    }

    public setInventoryConfig(config: Partial<IItemInventoryConfig>): void {
        this.inventoryConfig = {
            ...this.inventoryConfig,
            ...(config || {}),
        }
    }

    public getCategory(): string {
        return this.inventoryConfig.category
    }

    public setCategory(category: string): void {
        this.inventoryConfig.category = category || 'misc'
    }

    public getSlotSize(): number {
        return typeof this.inventoryConfig.slotSize === 'number' &&
            this.inventoryConfig.slotSize >= 0
            ? this.inventoryConfig.slotSize
            : 1
    }

    public setSlotSize(size: number): void {
        this.inventoryConfig.slotSize = typeof size === 'number' && size >= 0 ? size : 1
    }

    public getWeight(): number {
        return typeof this.inventoryConfig.weight === 'number' && this.inventoryConfig.weight >= 0
            ? this.inventoryConfig.weight
            : 1
    }

    public setWeight(weight: number): void {
        this.inventoryConfig.weight = typeof weight === 'number' && weight >= 0 ? weight : 1
    }

    public isConsumable(): boolean {
        return Boolean(this.inventoryConfig.isConsumable)
    }

    public setIsConsumable(val: boolean): void {
        this.inventoryConfig.isConsumable = Boolean(val)
    }

    public isInStartingInventory(): boolean {
        return Boolean(this.inventoryConfig.inStartingInventory)
    }

    public setInStartingInventory(val: boolean): void {
        this.inventoryConfig.inStartingInventory = Boolean(val)
    }

    public getTargetInventoryId(): string {
        return this.inventoryConfig.targetInventoryId || ''
    }

    public setTargetInventoryId(id: string): void {
        this.inventoryConfig.targetInventoryId = id || ''
    }

    // --- SERIALIZATION ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): Item {
        if (!json) return new Item('')
        const id = json.id || ''
        const name = json.name ?? json.nazwa ?? ''
        const descData = json.description ?? json.opis
        const description = Description.fromJSON(descData)

        const rawTags = json.tags ?? json.tagi ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tags = Array.isArray(rawTags) ? rawTags.map((t: any) => Tag.fromJSON(t)) : []

        const rawModifiers = json.modifiers ?? json.modyfikatory ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modifiers: IItemModifier[] = Array.isArray(rawModifiers)
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rawModifiers.map((m: any, idx: number) => ({
                  id: m.id || `mod_${idx}_${Date.now()}`,
                  targetType: m.targetType || m.type || 'stat',
                  targetName: m.targetName || m.name || m.stat || '',
                  value: m.value !== undefined ? m.value : 0,
                  operator: m.operator || '+',
                  description: m.description || m.desc || '',
              }))
            : []

        const rawConfig = json.inventoryConfig ?? json.inventory ?? {}
        const inventoryConfig: Partial<IItemInventoryConfig> = {
            category: rawConfig.category || json.category || json.kategoria || 'misc',
            slotSize:
                typeof rawConfig.slotSize === 'number'
                    ? rawConfig.slotSize
                    : typeof json.slotSize === 'number'
                      ? json.slotSize
                      : 1,
            weight:
                typeof rawConfig.weight === 'number'
                    ? rawConfig.weight
                    : typeof json.weight === 'number'
                      ? json.weight
                      : 1,
            isConsumable:
                typeof rawConfig.isConsumable === 'boolean'
                    ? rawConfig.isConsumable
                    : typeof json.isConsumable === 'boolean'
                      ? json.isConsumable
                      : false,
            inStartingInventory:
                typeof rawConfig.inStartingInventory === 'boolean'
                    ? rawConfig.inStartingInventory
                    : typeof json.inStartingInventory === 'boolean'
                      ? json.inStartingInventory
                      : false,
            targetInventoryId: rawConfig.targetInventoryId || json.targetInventoryId || '',
        }

        return new Item(id, name, description, tags, modifiers, inventoryConfig)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            description: this.description ? this.description.toJSON() : null,
            tags: this.tags.map(t => (typeof t.toJSON === 'function' ? t.toJSON() : t)),
            modifiers: this.modifiers,
            inventoryConfig: this.inventoryConfig,
            category: this.inventoryConfig.category,
            slotSize: this.inventoryConfig.slotSize,
            weight: this.inventoryConfig.weight,
            isConsumable: this.inventoryConfig.isConsumable,
            inStartingInventory: this.inventoryConfig.inStartingInventory,
            targetInventoryId: this.inventoryConfig.targetInventoryId,
        }
    }
}
