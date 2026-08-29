import { CharacterClass } from '../Model/CharacterClass'
import { DEFAULT_TAG_COLOR, ENTITY_CATEGORIES } from '../Model/constants'
import { Description } from '../Model/Description'
import { Item } from '../Model/Item'
import { Location } from '../Model/Location'
import { NPC } from '../Model/NPC'
import { Paragraph } from '../Model/Paragraph'
import { Scene } from '../Model/Scene'
import { Stat } from '../Model/Stat'
import { Tag } from '../Model/Tag'
import { defaultIdGenerator, type IdGenerator } from '../Utils/idGenerator'

export {
    CharacterClass,
    DEFAULT_TAG_COLOR,
    Description,
    ENTITY_CATEGORIES,
    Item,
    Location,
    NPC,
    Paragraph,
    Scene,
    Stat,
    Tag,
}

export type RibbonTab = 'glowna' | 'sceny' | 'widok'
export type LeftTab =
    | 'paragraphs'
    | 'scenes'
    | 'characters'
    | 'locations'
    | 'stats'
    | 'traits'
    | 'main-character'
    | 'tags'
    | 'search'
    | 'settings'
    | 'explorer'
export type MainViewMode = 'markdown' | 'graph'

export class MainWindowViewModel {
    private activeRibbonTab: RibbonTab = 'glowna'
    private activeLeftTab: LeftTab | null = 'paragraphs'
    private rightSidebarCollapsed = false
    private activeMainView: MainViewMode = 'markdown'
    private activeFile: string | null = null
    private openFiles: string[] = []

    // Section Search Queries
    private paragraphSearchQuery: string = ''
    private selectedFilterTag: string | null = null
    private selectedFilterCharacter: string | null = null
    private selectedFilterScene: string | null = null

    private characterSearchQuery: string = ''
    private locationSearchQuery: string = ''
    private statSearchQuery: string = ''
    private tagSearchQuery: string = ''

    private idGenerator: IdGenerator

    constructor(idGenerator: IdGenerator = defaultIdGenerator) {
        this.idGenerator = idGenerator
    }

    public getActiveRibbonTab(): RibbonTab {
        return this.activeRibbonTab
    }

    public setActiveRibbonTab(tab: RibbonTab): void {
        this.activeRibbonTab = tab
    }

    public getActiveLeftTab(): LeftTab | null {
        return this.activeLeftTab
    }

    public isLeftDrawerOpen(): boolean {
        return this.activeLeftTab !== null
    }

    public toggleLeftTab(tab: LeftTab): void {
        if (this.activeLeftTab === tab) {
            this.activeLeftTab = null
        } else {
            this.activeLeftTab = tab
        }
    }

    public closeLeftDrawer(): void {
        this.activeLeftTab = null
    }

    public isRightSidebarCollapsed(): boolean {
        return this.rightSidebarCollapsed
    }

    public toggleRightSidebar(): void {
        this.rightSidebarCollapsed = !this.rightSidebarCollapsed
    }

    public setRightSidebarCollapsed(collapsed: boolean): void {
        this.rightSidebarCollapsed = collapsed
    }

    public getActiveMainView(): MainViewMode {
        return this.activeMainView
    }

    public setActiveMainView(view: MainViewMode): void {
        this.activeMainView = view
    }

    public getActiveFile(): string | null {
        return this.activeFile
    }

    public setActiveFile(file: string | null): void {
        this.activeFile = file
        if (file) {
            this.activeMainView = 'markdown'
            if (!this.openFiles.includes(file)) {
                this.openFiles.push(file)
            }
        }
    }

    public getOpenFiles(): string[] {
        return [...this.openFiles]
    }

    public closeFile(file: string): void {
        this.openFiles = this.openFiles.filter(f => f !== file)
        if (this.activeFile === file) {
            this.activeFile =
                this.openFiles.length > 0 ? this.openFiles[this.openFiles.length - 1] : null
        }
    }

    // Paragraph Search & Filter Getters / Setters
    public getParagraphSearchQuery(): string {
        return this.paragraphSearchQuery
    }

    public setParagraphSearchQuery(query: string): void {
        this.paragraphSearchQuery = query
    }

    public getSelectedFilterTag(): string | null {
        return this.selectedFilterTag
    }

    public setSelectedFilterTag(tag: string | null): void {
        this.selectedFilterTag = tag
    }

    public getSelectedFilterCharacter(): string | null {
        return this.selectedFilterCharacter
    }

    public setSelectedFilterCharacter(charId: string | null): void {
        this.selectedFilterCharacter = charId
    }

    public getSelectedFilterScene(): string | null {
        return this.selectedFilterScene
    }

    public setSelectedFilterScene(sceneId: string | null): void {
        this.selectedFilterScene = sceneId
    }

    public clearParagraphFilters(): void {
        this.paragraphSearchQuery = ''
        this.selectedFilterTag = null
        this.selectedFilterCharacter = null
        this.selectedFilterScene = null
    }

    // Search Queries for Other Sections
    public getCharacterSearchQuery(): string {
        return this.characterSearchQuery
    }

    public setCharacterSearchQuery(query: string): void {
        this.characterSearchQuery = query
    }

    public getLocationSearchQuery(): string {
        return this.locationSearchQuery
    }

    public setLocationSearchQuery(query: string): void {
        this.locationSearchQuery = query
    }

    public getStatSearchQuery(): string {
        return this.statSearchQuery
    }

    public setStatSearchQuery(query: string): void {
        this.statSearchQuery = query
    }

    public getTagSearchQuery(): string {
        return this.tagSearchQuery
    }

    public setTagSearchQuery(query: string): void {
        this.tagSearchQuery = query
    }

    // Creation Factory Methods (English)
    public createParagraph(titleInput?: string, defaultTitle: string = 'New paragraph'): Paragraph {
        const title = (titleInput ?? '').trim() || defaultTitle
        const id = this.idGenerator('paragraph')
        return new Paragraph(id, title)
    }

    public createScene(nameInput?: string, defaultName: string = 'New scene'): Scene {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('scene')
        return new Scene(id, name)
    }

    public createItem(nameInput?: string, defaultName: string = 'New item'): Item {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('item')
        return new Item(id, name)
    }

    public createCharacterClass(
        nameInput?: string,
        defaultName: string = 'New class'
    ): CharacterClass {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('class')
        return new CharacterClass(id, name)
    }

    public createCharacter(nameInput?: string, defaultName: string = 'New character'): NPC {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('npc')
        return new NPC(id, name)
    }

    public createLocation(nameInput?: string, defaultName: string = 'New location'): Location {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('location')
        return new Location(id, name)
    }

    public createStat(nameInput?: string, defaultName: string = 'New stat'): Stat {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('stat')
        return new Stat(id, name, new Description(), '')
    }

    public createTag(
        nameInput?: string,
        colorInput: string = DEFAULT_TAG_COLOR,
        defaultName: string = 'New tag'
    ): Tag {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('tag')
        return new Tag(id, name, colorInput)
    }

    public searchAndFilterParagraphs(paragraphs: Paragraph[]): Paragraph[] {
        let result = [...paragraphs]

        if (this.selectedFilterTag) {
            const tagStr = this.selectedFilterTag.toLowerCase()
            result = result.filter(p =>
                p
                    .getTags()
                    .some(
                        t =>
                            t.getId().toLowerCase() === tagStr ||
                            t.getName().toLowerCase() === tagStr
                    )
            )
        }

        const query = this.paragraphSearchQuery.trim().toLowerCase()
        if (!query) {
            return result.sort((a, b) => {
                if (a.getIsNumberLocked() && !b.getIsNumberLocked()) return -1
                if (!a.getIsNumberLocked() && b.getIsNumberLocked()) return 1
                return 0
            })
        }

        result = result.filter(p => {
            const tytulMatch = p.getTitle().toLowerCase().includes(query)
            const trescMatch = p.getContent().getText().toLowerCase().includes(query)
            const numerMatch = p.getNumber().toString().includes(query)
            return tytulMatch || trescMatch || numerMatch
        })

        return result.sort((a, b) => {
            const aLocked = a.getIsNumberLocked()
            const bLocked = b.getIsNumberLocked()
            if (aLocked && !bLocked) return -1
            if (!aLocked && bLocked) return 1

            const aTitleMatch = a.getTitle().toLowerCase().includes(query)
            const bTitleMatch = b.getTitle().toLowerCase().includes(query)
            if (aTitleMatch && !bTitleMatch) return -1
            if (!aTitleMatch && bTitleMatch) return 1

            return 0
        })
    }

    public searchAndFilterCharacters(characters: NPC[]): NPC[] {
        const query = this.characterSearchQuery.trim().toLowerCase()
        if (!query) return characters
        return characters.filter(
            p =>
                p.getName().toLowerCase().includes(query) ||
                p.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterLocations(locations: Location[]): Location[] {
        const query = this.locationSearchQuery.trim().toLowerCase()
        if (!query) return locations
        return locations.filter(
            l =>
                l.getName().toLowerCase().includes(query) ||
                l.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
    }

    public searchAndFilterStats(stats: Stat[]): Stat[] {
        const query = this.statSearchQuery.trim().toLowerCase()
        if (!query) return stats
        return stats.filter(c => c.getName().toLowerCase().includes(query))
    }

    public searchAndFilterTags(tags: Tag[]): Tag[] {
        const query = this.tagSearchQuery.trim().toLowerCase()
        if (!query) return tags
        return tags.filter(t => t.getName().toLowerCase().includes(query))
    }
}
