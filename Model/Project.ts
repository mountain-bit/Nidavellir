import { IFontDefinition } from '../Modules/Editor/CustomFontsService'
import { ICustomTextStyle } from '../Modules/Editor/types'
import type { EntitiesData, ProjectData } from '../types/ipc'
import { CharacterClass } from './CharacterClass'
import { Description } from './Description'
import { Feature } from './Feature'
import { Item } from './Item'
import { Location } from './Location'
import { NPC } from './NPC'
import { NPC_Template } from './NPC_Template'
import { Paragraph } from './Paragraph'
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
    private paragraphs: Paragraph[] = []
    private locations: Location[] = []
    private characters: NPC[] = []
    private templates: NPC_Template[] = []
    private items: Item[] = []
    private characterClasses: CharacterClass[] = []
    private playerCharacter: PlayerCharacter = new PlayerCharacter()
    private tagList: Tag[] = []

    private globalStats: Stat[] = []
    private globalSkills: Skill[] = []
    private globalFeatures: Feature[] = []
    private globalParameters: Parameter[] = []

    private customStyles: ICustomTextStyle[] = []
    private customFonts: Array<string | IFontDefinition> = []

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
        globalParameters: Parameter[] = [],
        templates: NPC_Template[] = [],
        paragraphs: Paragraph[] = []
    ) {
        this.id = id
        this.name = name
        this.author = author
        this.version = version
        this.description = description
        this.scenes = scenes
        this.paragraphs = paragraphs
        this.locations = locations
        this.characters = characters
        this.items = items
        this.characterClasses = characterClasses
        this.playerCharacter = playerCharacter
        this.globalStats = globalStats
        this.globalSkills = globalSkills
        this.globalFeatures = globalFeatures
        this.globalParameters = globalParameters
        this.templates = templates
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

    public getParagraphs(): Paragraph[] {
        return this.paragraphs
    }

    public setParagraphs(paragraphs: Paragraph[]): void {
        this.paragraphs = paragraphs
    }

    public addParagraph(paragraph: Paragraph): void {
        if (!this.paragraphs.some(p => p.getId() === paragraph.getId())) {
            this.paragraphs.push(paragraph)
        }
    }

    public removeParagraph(id: string): void {
        this.paragraphs = this.paragraphs.filter(p => p.getId() !== id)
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

    public getTemplates(): NPC_Template[] {
        return this.templates
    }

    public setTemplates(templates: NPC_Template[]): void {
        this.templates = templates
    }

    public addTemplate(template: NPC_Template): void {
        this.templates.push(template)
    }

    public removeTemplate(idOrName: string): void {
        this.templates = this.templates.filter(
            p => p.getId() !== idOrName && p.getName() !== idOrName
        )
    }

    public getTemplate(idOrName: string): NPC_Template | undefined {
        return this.templates.find(p => p.getId() === idOrName || p.getName() === idOrName)
    }

    public hasTemplate(idOrName: string): boolean {
        return this.templates.some(p => p.getId() === idOrName || p.getName() === idOrName)
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

    public getStats(): Stat[] {
        return this.getGlobalStats()
    }

    public addStat(stat: Stat): void {
        this.addGlobalStat(stat)
    }

    public removeStat(idOrName: string): void {
        this.removeGlobalStat(idOrName)
    }

    public removeGlobalStat(idOrName: string): void {
        this.globalStats = this.globalStats.filter(
            s => s.getId() !== idOrName && s.getName() !== idOrName
        )
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

    public getSkills(): Skill[] {
        return this.getGlobalSkills()
    }

    public addSkill(skill: Skill): void {
        this.addGlobalSkill(skill)
    }

    public removeSkill(idOrName: string): void {
        this.removeGlobalSkill(idOrName)
    }

    public removeGlobalSkill(idOrName: string): void {
        this.globalSkills = this.globalSkills.filter(
            s => s.getId() !== idOrName && s.getName() !== idOrName
        )
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

    public getFeatures(): Feature[] {
        return this.getGlobalFeatures()
    }

    public addFeature(feature: Feature): void {
        this.addGlobalFeature(feature)
    }

    public removeFeature(idOrName: string): void {
        this.removeGlobalFeature(idOrName)
    }

    public removeGlobalFeature(idOrName: string): void {
        this.globalFeatures = this.globalFeatures.filter(
            f => f.getId() !== idOrName && f.getName() !== idOrName
        )
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

    public getParameters(): Parameter[] {
        return this.getGlobalParameters()
    }

    public addParameter(parameter: Parameter): void {
        this.addGlobalParameter(parameter)
    }

    public removeParameter(idOrName: string): void {
        this.removeGlobalParameter(idOrName)
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

    public getCustomStyles(): ICustomTextStyle[] {
        return this.customStyles
    }

    public setCustomStyles(styles: ICustomTextStyle[]): void {
        this.customStyles = styles || []
    }

    public getCustomFonts(): Array<string | IFontDefinition> {
        return this.customFonts
    }

    public setCustomFonts(fonts: Array<string | IFontDefinition>): void {
        this.customFonts = fonts || []
    }

    public static fromJSON(projectData: ProjectData, entities: EntitiesData = {}): Project {
        const locations = (entities.Locations ?? entities.Lokacje ?? []).map(l =>
            Location.fromJSON(l)
        )
        const characters = (entities.NPC ?? entities.Postacie ?? []).map(n => NPC.fromJSON(n))
        const templates = (entities.Templates ?? entities.Szablony ?? []).map(t =>
            NPC_Template.fromJSON(t)
        )
        const items = (entities.Items ?? entities.Przedmioty ?? []).map(p => Item.fromJSON(p))
        const characterClasses = (entities.CharacterClasses ?? entities.KlasyPostaci ?? []).map(k =>
            CharacterClass.fromJSON(k)
        )

        const rawParagraphEntities = entities.Paragraphs ?? entities.Paragrafy ?? []
        const parsedParagraphs: Paragraph[] = []
        const parsedScenes: Scene[] = []

        // 1. Check if graph.scenes exists in projectData
        const graphData = (projectData as { graph?: { scenes?: unknown[] } })?.graph
        const scenesFromGraph = Array.isArray(graphData?.scenes) ? graphData.scenes : []
        if (scenesFromGraph.length > 0) {
            scenesFromGraph.forEach(s => {
                parsedScenes.push(Scene.fromJSON(s as Record<string, unknown>))
            })
        }

        // 2. Parse Paragraphs entity items (detect whether legacy Scene or direct Paragraph)
        rawParagraphEntities.forEach(item => {
            const isLegacyScene = Array.isArray((item as { paragraphs?: unknown[] }).paragraphs)
            if (isLegacyScene) {
                parsedScenes.push(Scene.fromJSON(item as Record<string, unknown>))
            } else {
                parsedParagraphs.push(Paragraph.fromJSON(item as Record<string, unknown>))
            }
        })

        // 3. Extract any paragraphs defined inside scenes into parsedParagraphs if missing
        parsedScenes.forEach(s => {
            s.getParagraphs().forEach(p => {
                if (!parsedParagraphs.some(existing => existing.getId() === p.getId())) {
                    parsedParagraphs.push(p)
                }
            })
        })

        // 4. Assign matching paragraphs to scenes if not already attached
        parsedScenes.forEach(s => {
            parsedParagraphs.forEach(p => {
                if (s.intersectsParagraph(p) && !s.hasParagraph(p.getId())) {
                    s.addParagraph(p)
                }
            })
        })

        const playerCharacterData = (entities.PlayerCharacter ?? entities.PostacGracza ?? [])[0]
        const playerCharacter = playerCharacterData
            ? PlayerCharacter.fromJSON(playerCharacterData)
            : new PlayerCharacter()

        const rules = entities.Rules ?? entities.Zasady ?? []

        const isStat = (z: any): boolean => {
            const t = String(z?.type || z?.typ || '').toLowerCase()
            if (t === 'stat' || t === 'trait' || t === 'cecha') return true
            if (t) return false
            // Fallback inference if type is missing:
            if (
                z?.formula !== undefined ||
                z?.calculatedValue !== undefined ||
                z?.mode === 'formula'
            ) {
                return false
            }
            if (z?.statName !== undefined || z?.modifier !== undefined || z?.mode === 'stat_mod') {
                return false
            }
            return z?.value !== undefined && z?.value !== null
        }

        const isSkill = (z: any): boolean => {
            const t = String(z?.type || z?.typ || '').toLowerCase()
            if (t === 'skill' || t === 'umiejetnosc') return true
            if (t) return false
            return z?.statName !== undefined || z?.modifier !== undefined || z?.mode === 'stat_mod'
        }

        const isParameter = (z: any): boolean => {
            const t = String(z?.type || z?.typ || '').toLowerCase()
            if (t === 'parameter' || t === 'vital' || t === 'parametr') return true
            if (t) return false
            return (
                z?.formula !== undefined ||
                z?.calculatedValue !== undefined ||
                z?.mode === 'formula'
            )
        }

        const isFeature = (z: any): boolean => {
            const t = String(z?.type || z?.typ || '').toLowerCase()
            if (t === 'feature' || t === 'quality' || t === 'przymiot') return true
            if (t) return false
            return !isParameter(z) && !isSkill(z) && !isStat(z)
        }

        const dedupeRules = <T extends { getId(): string; getName(): string }>(items: T[]): T[] => {
            const seenIds = new Set<string>()
            const seenNames = new Set<string>()
            return items.filter(item => {
                const id = (item.getId() || '').trim()
                const name = (item.getName() || '').trim().toLowerCase()
                if (id && seenIds.has(id)) return false
                if (name && seenNames.has(name)) return false
                if (id) seenIds.add(id)
                if (name) seenNames.add(name)
                return true
            })
        }

        const globalStats = dedupeRules(rules.filter(isStat).map(z => Stat.fromJSON(z)))
        const globalSkills = dedupeRules(rules.filter(isSkill).map(z => Skill.fromJSON(z)))
        const globalFeatures = dedupeRules(rules.filter(isFeature).map(z => Feature.fromJSON(z)))
        const globalParameters = dedupeRules(
            rules.filter(isParameter).map(z => Parameter.fromJSON(z))
        )

        const name = projectData.name ?? ''
        const author = projectData.author ?? ''
        const version = projectData.version ?? '1.0.0'

        const project = new Project(
            projectData.id ?? '',
            name,
            author,
            version,
            new Description(),
            parsedScenes,
            locations,
            characters,
            items,
            characterClasses,
            playerCharacter,
            globalStats,
            globalSkills,
            globalFeatures,
            globalParameters,
            templates,
            parsedParagraphs
        )

        const editorData = projectData.editor || {}
        const customStyles = (projectData.customStyles ||
            editorData.customStyles ||
            []) as ICustomTextStyle[]
        const customFonts = (projectData.customFonts || editorData.customFonts || []) as Array<
            string | IFontDefinition
        >

        project.setCustomStyles(customStyles)
        project.setCustomFonts(customFonts)

        return project
    }

    public toJSON(): ProjectData {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
            version: this.version,
            descriptionPaths: [],
            dataPaths: [],
            editor: {
                customStyles: this.customStyles,
                customFonts: this.customFonts,
            },
            customStyles: this.customStyles,
            customFonts: this.customFonts,
        }
    }
}
