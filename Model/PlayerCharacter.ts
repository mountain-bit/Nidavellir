import { CharacterClass } from './CharacterClass'
import { Description } from './Description'
import { Feature } from './Feature'
import { Inventory } from './Inventory'
import { Item } from './Item'
import { Parameter } from './Parameter'
import { Skill } from './Skill'
import { Stat } from './Stat'
import { Tag } from './Tag'

export class PlayerCharacter {
    private id: string = ''
    private name: string = ''
    private description: Description = new Description()
    private avatar: string = 'warrior'
    private stats: Stat[] = []
    private skills: Skill[] = []
    private parameters: Parameter[] = []
    private features: Feature[] = []
    private tags: Tag[] = []
    private customAttributes: { name: string; value: string }[] = []
    private items: Item[] = []
    private inventories: Inventory[] = []
    private characterClass: CharacterClass | null = null

    constructor(
        id: string = '',
        name: string = '',
        description: Description = new Description(),
        stats: Stat[] = [],
        skills: Skill[] = [],
        features: Feature[] = [],
        items: Item[] = [],
        characterClass: CharacterClass | null = null,
        avatar: string = 'warrior',
        parameters: Parameter[] = [],
        tags: Tag[] = [],
        customAttributes: { name: string; value: string }[] = [],
        inventories: Inventory[] = []
    ) {
        this.id = id
        this.name = name
        if (description instanceof Description) {
            this.description = description
        } else if (typeof description === 'string') {
            this.description = new Description(description, description)
        } else if (description && typeof description === 'object') {
            this.description = Description.fromJSON(description)
        } else {
            this.description = new Description()
        }
        this.stats = stats
        this.skills = skills
        this.features = features
        this.items = items
        this.characterClass = characterClass
        this.avatar = avatar
        this.parameters = parameters
        this.tags = tags
        this.customAttributes = customAttributes
        this.inventories = inventories
    }

    public getId(): string | undefined {
        if (this.id !== '') return this.id
        return undefined
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

    public getSummary(): string {
        return this.description && typeof this.description.getSummary === 'function'
            ? this.description.getSummary()
            : ''
    }

    public setSummary(summary: string): void {
        if (!this.description || typeof this.description.setSummary !== 'function') {
            this.description = new Description('', summary)
        } else {
            this.description.setSummary(summary)
        }
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
        this.stats.push(stat)
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
        this.skills.push(skill)
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
        this.parameters.push(parameter)
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
        this.features.push(feature)
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

    public getCustomAttributes(): { name: string; value: string }[] {
        return this.customAttributes
    }

    public setCustomAttributes(attrs: { name: string; value: string }[]): void {
        this.customAttributes = attrs
    }

    public getInventories(): Inventory[] {
        return this.inventories
    }

    public setInventories(inventories: Inventory[]): void {
        this.inventories = Array.isArray(inventories) ? inventories : []
    }

    public addInventory(inventory: Inventory): void {
        this.inventories.push(inventory)
    }

    public removeInventory(id: string): void {
        this.inventories = this.inventories.filter(
            inv => inv.getId() !== id && inv.getName() !== id
        )
    }

    public getInventory(id: string): Inventory | undefined {
        return this.inventories.find(inv => inv.getId() === id || inv.getName() === id)
    }

    public getItems(): Item[] {
        if (this.inventories.length > 0) {
            const allItems: Item[] = []
            this.inventories.forEach(inv => {
                if (inv && typeof inv.getItems === 'function') {
                    allItems.push(...inv.getItems())
                }
            })
            return allItems
        }
        return this.items
    }

    public setItems(items: Item[]): void {
        this.items = items
        if (this.inventories.length === 0 && items.length > 0) {
            this.inventories = [new Inventory('inv_default', 'Główny ekwipunek', 0, items)]
        } else if (this.inventories.length > 0) {
            this.inventories[0].setItems(items)
        }
    }

    public getItem(id: string): Item | undefined {
        return this.getItems().find(p => p.getId() === id || p.getName() === id)
    }

    public addItem(item: Item, inventoryId?: string): void {
        if (this.inventories.length > 0) {
            const targetInv = inventoryId
                ? this.getInventory(inventoryId) || this.inventories[0]
                : this.inventories[0]
            targetInv.addItem(item)
        } else {
            this.items.push(item)
            this.inventories.push(new Inventory('inv_default', 'Główny ekwipunek', 0, [item]))
        }
    }

    public removeItem(id: string): void {
        this.items = this.items.filter(p => p.getId() !== id && p.getName() !== id)
        this.inventories.forEach(inv => inv.removeItem(id))
    }

    public hasItem(id: string): boolean {
        return this.getItems().some(p => p.getId() === id || p.getName() === id)
    }

    public getCharacterClass(): CharacterClass | undefined {
        return this.characterClass || undefined
    }

    public setCharacterClass(characterClass: CharacterClass | null): void {
        this.characterClass = characterClass
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static fromJSON(json: any): PlayerCharacter {
        if (!json) return new PlayerCharacter()
        const name = json.name ?? ''
        const descData = json.description
        const statsData = json.stats || json.traits || []
        const skillsData = json.skills || []
        const featuresData = json.features || json.qualities || []
        const paramsData = json.parameters || json.vitals || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tagsParsed = (json.tags || []).map((t: any) => Tag.fromJSON(t))
        const avatar = json.avatar ?? 'warrior'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customAttrs = (json.customAttributes || []).map((ca: any) => ({
            name: ca.name || ca.key || '',
            value: String(ca.value ?? ''),
        }))
        const itemsData = json.items || []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedItems = itemsData.map((p: any) => Item.fromJSON(p))

        let inventories: Inventory[] = []
        if (Array.isArray(json.inventories) && json.inventories.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inventories = json.inventories.map((inv: any) => Inventory.fromJSON(inv))
        } else if (parsedItems.length > 0) {
            inventories = [new Inventory('inv_default', 'Główny ekwipunek', 0, parsedItems)]
        }

        const classData = json.characterClass
        return new PlayerCharacter(
            json.id || '',
            name,
            Description.fromJSON(descData),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            statsData.map((c: any) => Stat.fromJSON(c)),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            skillsData.map((u: any) => Skill.fromJSON(u)),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            featuresData.map((p: any) => Feature.fromJSON(p)),
            parsedItems,
            classData ? CharacterClass.fromJSON(classData) : null,
            avatar,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            paramsData.map((p: any) => Parameter.fromJSON(p)),
            tagsParsed,
            customAttrs,
            inventories
        )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            customAttributes: this.customAttributes,
            items: this.getItems(),
            inventories: this.inventories.map(inv =>
                typeof inv.toJSON === 'function' ? inv.toJSON() : inv
            ),
            characterClass: this.characterClass,
        }
    }
}
