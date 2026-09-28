import type { EntitiesData, ProjectData } from '../types/ipc'
import { CharacterClass } from './CharacterClass'
import { Description } from './Description'
import { Feature } from './Feature'
import { Item } from './Item'
import { Location } from './Location'
import { NPC } from './NPC'
import { Parameter } from './Parameter'
import { PlayerCharacter } from './PlayerCharacter'
import { Scene } from './Scene'
import { Skill } from './Skill'
import { Stat } from './Stat'
import { Tag } from './Tag'

export class Project {
    private id: string = ''
    private name: string = ''
    private author: string = ''
    private version: string = '1.0.0'
    private description: Description = new Description()

    private scenes: Scene[] = []
    private locations: Location[] = []
    private characters: NPC[] = []
    private items: Item[] = []
    private characterClasses: CharacterClass[] = []
    private playerCharacter: PlayerCharacter = new PlayerCharacter()
    private tagList: Tag[] = []

    private globalStats: Stat[] = []
    private globalSkills: Skill[] = []
    private globalFeatures: Feature[] = []
    private globalParameters: Parameter[] = []

    constructor(
        id: string = '',
        name: string = '',
        author: string = '',
        version: string = '1.0.0',
        description: Description = new Description(),
        scenes: Scene[] = [],
        locations: Location[] = [],
        characters: NPC[] = [],
        items: Item[] = [],
        characterClasses: CharacterClass[] = [],
        playerCharacter: PlayerCharacter = new PlayerCharacter(),
        globalStats: Stat[] = [],
        globalSkills: Skill[] = [],
        globalFeatures: Feature[] = [],
        globalParameters: Parameter[] = []
    ) {
        this.id = id
        this.name = name
        this.author = author
        this.version = version
        this.description = description
        this.scenes = scenes
        this.locations = locations
        this.characters = characters
        this.items = items
        this.characterClasses = characterClasses
        this.playerCharacter = playerCharacter
        this.globalStats = globalStats
        this.globalSkills = globalSkills
        this.globalFeatures = globalFeatures
        this.globalParameters = globalParameters
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

    public getAuthor(): string {
        return this.author
    }

    public setAuthor(author: string): void {
        this.author = author
    }

    public getVersion(): string {
        return this.version
    }

    public setVersion(version: string): void {
        this.version = version
    }

    public getDescription(): Description {
        return this.description
    }

    public setDescription(description: Description): void {
        this.description = description
    }

    public getScenes(): Scene[] {
        return this.scenes
    }

    public setScenes(scenes: Scene[]): void {
        this.scenes = scenes
    }

    public addScene(scene: Scene): void {
        this.scenes.push(scene)
    }

    public removeScene(id: string): void {
        this.scenes = this.scenes.filter(s => s.getId() !== id)
    }

    public getScene(id: string): Scene | undefined {
        return this.scenes.find(s => s.getId() === id)
    }

    public hasScene(id: string): boolean {
        return this.scenes.some(s => s.getId() === id)
    }

    public getLocations(): Location[] {
        return this.locations
    }

    public setLocations(locations: Location[]): void {
        this.locations = locations
    }

    public addLocation(location: Location): void {
        this.locations.push(location)
    }

    public removeLocation(id: string): void {
        this.locations = this.locations.filter(l => l.getId() !== id)
    }

    public getLocation(id: string): Location | undefined {
        return this.locations.find(l => l.getId() === id)
    }

    public hasLocation(id: string): boolean {
        return this.locations.some(l => l.getId() === id)
    }

    public getCharacters(): NPC[] {
        return this.characters
    }

    public setCharacters(characters: NPC[]): void {
        this.characters = characters
    }

    public addCharacter(character: NPC): void {
        this.characters.push(character)
    }

    public removeCharacter(id: string): void {
        this.characters = this.characters.filter(p => p.getId() !== id)
    }

    public getCharacter(id: string): NPC | undefined {
        return this.characters.find(p => p.getId() === id)
    }

    public hasCharacter(id: string): boolean {
        return this.characters.some(p => p.getId() === id)
    }

    public getItems(): Item[] {
        return this.items
    }

    public setItems(items: Item[]): void {
        this.items = items
    }

    public addItem(item: Item): void {
        this.items.push(item)
    }

    public removeItem(id: string): void {
        this.items = this.items.filter(p => p.getId() !== id)
    }

    public getItem(id: string): Item | undefined {
        return this.items.find(p => p.getId() === id)
    }

    public hasItem(id: string): boolean {
        return this.items.some(p => p.getId() === id)
    }

    public getCharacterClasses(): CharacterClass[] {
        return this.characterClasses
    }

    public setCharacterClasses(characterClasses: CharacterClass[]): void {
        this.characterClasses = characterClasses
    }

    public addCharacterClass(characterClass: CharacterClass): void {
        this.characterClasses.push(characterClass)
    }

    public removeCharacterClass(id: string): void {
        this.characterClasses = this.characterClasses.filter(k => k.getId() !== id)
    }

    public getCharacterClass(id: string): CharacterClass | undefined {
        return this.characterClasses.find(k => k.getId() === id)
    }

    public hasCharacterClass(id: string): boolean {
        return this.characterClasses.some(k => k.getId() === id)
    }

    public getPlayerCharacter(): PlayerCharacter {
        return this.playerCharacter
    }

    public setPlayerCharacter(playerCharacter: PlayerCharacter): void {
        this.playerCharacter = playerCharacter
    }

    public getGlobalStats(): Stat[] {
        return this.globalStats
    }

    public setGlobalStats(stats: Stat[]): void {
        this.globalStats = stats
    }

    public addGlobalStat(stat: Stat): void {
        this.globalStats.push(stat)
    }

    public getGlobalSkills(): Skill[] {
        return this.globalSkills
    }

    public setGlobalSkills(skills: Skill[]): void {
        this.globalSkills = skills
    }

    public addGlobalSkill(skill: Skill): void {
        this.globalSkills.push(skill)
    }

    public getGlobalFeatures(): Feature[] {
        return this.globalFeatures
    }

    public setGlobalFeatures(features: Feature[]): void {
        this.globalFeatures = features
    }

    public addGlobalFeature(feature: Feature): void {
        this.globalFeatures.push(feature)
    }

    public getGlobalParameters(): Parameter[] {
        return this.globalParameters
    }

    public setGlobalParameters(parameters: Parameter[]): void {
        this.globalParameters = parameters
    }

    public addGlobalParameter(parameter: Parameter): void {
        if (
            !this.globalParameters.some(
                p => p.getId() === parameter.getId() || p.getName() === parameter.getName()
            )
        ) {
            this.globalParameters.push(parameter)
        }
    }

    public removeGlobalParameter(idOrName: string): void {
        this.globalParameters = this.globalParameters.filter(
            p => p.getId() !== idOrName && p.getName() !== idOrName
        )
    }

    public getAllTags(): Tag[] {
        const tagMap = new Map<string, Tag>()

        this.tagList.forEach(t => tagMap.set(t.getId() || t.getName(), t))

        this.scenes.forEach(s => {
            s.getTags().forEach(t => tagMap.set(t.getId() || t.getName(), t))
            s.getParagraphs().forEach(p => {
                p.getTags().forEach(t => tagMap.set(t.getId() || t.getName(), t))
            })
        })

        this.locations.forEach(l => {
            l.getTags().forEach(t => tagMap.set(t.getId() || t.getName(), t))
        })

        return Array.from(tagMap.values())
    }

    public addTag(tag: Tag): void {
        if (!this.tagList.some(t => t.getId() === tag.getId())) {
            this.tagList.push(tag)
        }
    }

    public removeTag(tagIdOrName: string): void {
        this.tagList = this.tagList.filter(
            t => t.getId() !== tagIdOrName && t.getName() !== tagIdOrName
        )
    }

    public static fromJSON(projectData: ProjectData, entities: EntitiesData = {}): Project {
        const locations = (entities.Locations ?? []).map(l => Location.fromJSON(l))
        const characters = (entities.NPC ?? []).map(n => NPC.fromJSON(n))
        const items = (entities.Items ?? []).map(p => Item.fromJSON(p))
        const characterClasses = (entities.CharacterClasses ?? []).map(k =>
            CharacterClass.fromJSON(k)
        )

        const scenes = (entities.Paragraphs ?? []).map(s => Scene.fromJSON(s))

        const playerCharacterData = (entities.PlayerCharacter ?? [])[0]
        const playerCharacter = playerCharacterData
            ? PlayerCharacter.fromJSON(playerCharacterData)
            : new PlayerCharacter()

        const rules = entities.Rules ?? []
        const globalStats = rules
            .filter(z => z.type === 'stat' || z.type === 'trait' || z.typ === 'cecha')
            .map(z => Stat.fromJSON(z))
        const globalSkills = rules
            .filter(z => z.type === 'skill' || z.typ === 'umiejetnosc')
            .map(z => Skill.fromJSON(z))
        const globalFeatures = rules
            .filter(z => z.type === 'feature' || z.type === 'quality' || z.typ === 'przymiot')
            .map(z => Feature.fromJSON(z))
        const globalParameters = rules
            .filter(z => z.type === 'parameter' || z.type === 'vital' || z.typ === 'parametr')
            .map(z => Parameter.fromJSON(z))

        const name = projectData.name ?? ''
        const author = projectData.author ?? ''
        const version = projectData.version ?? '1.0.0'

        return new Project(
            projectData.id ?? '',
            name,
            author,
            version,
            new Description(),
            scenes,
            locations,
            characters,
            items,
            characterClasses,
            playerCharacter,
            globalStats,
            globalSkills,
            globalFeatures,
            globalParameters
        )
    }

    public toJSON(): ProjectData {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
            version: this.version,
            descriptionPaths: [],
            dataPaths: [],
        }
    }
}
