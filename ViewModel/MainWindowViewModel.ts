import { CharacterClass } from '../Model/CharacterClass'
import { Choice } from '../Model/Choice'
import { Condition, TextCondition } from '../Model/Condition'
import { DEFAULT_SCENE_COLOR, DEFAULT_TAG_COLOR, ENTITY_CATEGORIES } from '../Model/constants'
import { Description } from '../Model/Description'
import { Item } from '../Model/Item'
import { Location } from '../Model/Location'
import { NPC } from '../Model/NPC'
import { Paragraph } from '../Model/Paragraph'
import { Scene } from '../Model/Scene'
import { Stat } from '../Model/Stat'
import { Tag } from '../Model/Tag'
import { ConnectionLineStyle } from '../Modules/Graph/StoryGraphStyles'
import { defaultIdGenerator, type IdGenerator } from '../Utils/idGenerator'
import { t } from '../Utils/translate'

export {
    CharacterClass,
    Choice,
    Condition,
    DEFAULT_SCENE_COLOR,
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
    TextCondition,
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
    | 'connections'
    | 'search'
    | 'settings'
    | 'explorer'
export type MainViewMode = 'markdown' | 'graph'

export interface IIdentifiableEntity {
    getId?: () => string
    getName?: () => string
    setName?: (name: string) => void
    getTitle?: () => string
    setTitle?: (title: string) => void
    getContent?: () => Description
    getColor?: () => string
    setColor?: (color: string) => void
    getIsNumberLocked?: () => boolean
    setIsNumberLocked?: (locked: boolean) => void
    getNumber?: () => number
    setNumber?: (num: number) => void
    getTags?: () => Tag[]
    addTag?: (tag: Tag) => void
    removeTag?: (tagId: string) => void
    getStats?: () => Stat[]
    addStat?: (stat: Stat) => void
    removeStat?: (statId: string) => void
    getFromParagraphId?: () => string
    setFromParagraphId?: (id: string) => void
    getToParagraphId?: () => string
    setToParagraphId?: (id: string) => void
    getCondition?: () => Condition | null
    setCondition?: (cond: Condition | null) => void
    getChoices?: () => Choice[]
    addChoice?: (choice: Choice) => void
    removeChoice?: (id: string) => void
    getCharacters?: () => NPC[]
    setCharacters?: (characters: NPC[]) => void
    addCharacter?: (character: NPC) => void
    removeCharacter?: (id: string) => void
    getLocations?: () => Location[]
    setLocations?: (locations: Location[]) => void
    addLocation?: (location: Location) => void
    removeLocation?: (id: string) => void
    hasLocation?: (id: string) => boolean
    getLocation?: () => Location | null
    setLocation?: (location: Location | null) => void
}

export interface IHistoryItem {
    id: string
    name: string
    type:
        | 'paragraph'
        | 'scene'
        | 'character'
        | 'location'
        | 'item'
        | 'stat'
        | 'tag'
        | 'class'
        | 'document'
        | 'choice'
    entity: IIdentifiableEntity
    parent?: unknown
}

export class MainWindowViewModel {
    private activeRibbonTab: RibbonTab = 'glowna'
    private activeLeftTab: LeftTab | null = 'paragraphs'
    private rightSidebarCollapsed = false
    private activeMainView: MainViewMode = 'graph'
    private activeFile: string | null = null
    private openFiles: string[] = []

    // Panel Resizing Widths
    private leftDrawerWidth: number = 260
    private rightSidebarWidth: number = 280

    // Selection & History State
    private selectedItem: IHistoryItem | null = null
    private history: IHistoryItem[] = []

    // Section Search Queries
    private paragraphSearchQuery: string = ''
    private selectedFilterTag: string | null = null
    private selectedFilterCharacter: string | null = null
    private selectedFilterScene: string | null = null

    private characterSearchQuery: string = ''
    private sceneSearchQuery: string = ''
    private locationSearchQuery: string = ''
    private statSearchQuery: string = ''
    private tagSearchQuery: string = ''
    private connectionSearchQuery: string = ''

    // Graph Settings
    private connectionLineStyle: ConnectionLineStyle = 'curved'
    private zoomSensitivity: number = 0.2

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

    public getLeftDrawerWidth(): number {
        return this.leftDrawerWidth
    }

    public setLeftDrawerWidth(width: number): void {
        this.leftDrawerWidth = Math.max(180, Math.min(600, width))
    }

    public getRightSidebarWidth(): number {
        return this.rightSidebarWidth
    }

    public setRightSidebarWidth(width: number): void {
        this.rightSidebarWidth = Math.max(220, Math.min(700, width))
    }

    public getConnectionLineStyle(): ConnectionLineStyle {
        return this.connectionLineStyle
    }

    public setConnectionLineStyle(style: ConnectionLineStyle): void {
        this.connectionLineStyle = style
    }

    public getZoomSensitivity(): number {
        return this.zoomSensitivity
    }

    public setZoomSensitivity(val: number): void {
        this.zoomSensitivity = Math.max(0.01, Math.min(1.0, val))
    }

    // --- SELECTION & HISTORY MANAGEMENT ---

    public getSelectedItem(): IHistoryItem | null {
        return this.selectedItem
    }

    public getHistory(): IHistoryItem[] {
        return [...this.history]
    }

    public selectElement(
        entity: IIdentifiableEntity,
        type: IHistoryItem['type'],
        parent?: unknown
    ): IHistoryItem {
        const id = entity.getId ? entity.getId() : `id_${Date.now()}`
        const name = entity.getName ? entity.getName() : entity.getTitle ? entity.getTitle() : id

        const item: IHistoryItem = {
            id,
            name,
            type,
            entity,
            parent,
        }

        this.selectedItem = item
        this.rightSidebarCollapsed = false

        this.history = this.history.filter(h => h.id !== id || h.type !== type)
        this.history.unshift(item)

        if (this.history.length > 30) {
            this.history.pop()
        }

        return item
    }

    public selectHistoryItem(id: string): IHistoryItem | null {
        const found = this.history.find(h => h.id === id)
        if (found) {
            this.selectedItem = found
            this.rightSidebarCollapsed = false
            return found
        }
        return null
    }

    public closeHistoryItem(id: string): void {
        const index = this.history.findIndex(h => h.id === id)
        if (index >= 0) {
            this.history.splice(index, 1)
            if (this.selectedItem?.id === id) {
                this.selectedItem = this.history.length > 0 ? this.history[0] : null
            }
        }
    }

    public closeAllHistory(): void {
        this.history = []
        this.selectedItem = null
    }

    // --- VALIDATION & PROPERTY UPDATES ---

    public validateName(
        newName: string,
        item: IHistoryItem,
        allEntities?: IIdentifiableEntity[]
    ): { valid: boolean; message?: string } {
        const trimmed = newName.trim()
        if (!trimmed) {
            return { valid: false, message: 'Name cannot be empty.' }
        }

        if (allEntities && allEntities.length > 0) {
            const hasCollision = allEntities.some(
                e =>
                    e &&
                    (e.getId ? e.getId() : '') !== item.id &&
                    (e.getName ? e.getName() : e.getTitle ? e.getTitle() : '').toLowerCase() ===
                        trimmed.toLowerCase()
            )
            if (hasCollision) {
                return {
                    valid: false,
                    message: `An item named "${trimmed}" already exists in this scope.`,
                }
            }
        }

        return { valid: true }
    }

    public updateName(newName: string, allEntities?: IIdentifiableEntity[]): boolean {
        if (!this.selectedItem?.entity) return false
        const validation = this.validateName(newName, this.selectedItem, allEntities)
        if (!validation.valid) return false

        const trimmed = newName.trim()
        if (this.selectedItem.entity.setName) {
            this.selectedItem.entity.setName(trimmed)
        } else if (this.selectedItem.entity.setTitle) {
            this.selectedItem.entity.setTitle(trimmed)
        }

        this.selectedItem.name = trimmed
        const hist = this.history.find(h => h.id === this.selectedItem!.id)
        if (hist) {
            hist.name = trimmed
        }

        return true
    }

    public updateSummary(summary: string): void {
        if (!this.selectedItem?.entity) return
        const entity = this.selectedItem.entity
        if (entity.getContent && entity.getContent()) {
            entity.getContent().setSummary(summary)
        }
    }

    public toggleNumberLock(locked: boolean): void {
        if (
            this.selectedItem?.type === 'paragraph' &&
            this.selectedItem.entity &&
            this.selectedItem.entity.setIsNumberLocked
        ) {
            this.selectedItem.entity.setIsNumberLocked(locked)
        }
    }

    public updateCustomNumber(numberVal: number): void {
        if (
            this.selectedItem?.type === 'paragraph' &&
            this.selectedItem.entity &&
            this.selectedItem.entity.setNumber
        ) {
            this.selectedItem.entity.setNumber(numberVal)
        }
    }

    public validateParagraphNumber(
        numVal: number,
        paragraphId: string,
        allParagraphs?: Paragraph[]
    ): { valid: boolean; message?: string } {
        if (!numVal || numVal <= 0 || isNaN(numVal)) {
            return { valid: true }
        }

        if (allParagraphs && allParagraphs.length > 0) {
            const hasCollision = allParagraphs.some(
                p => p && p.getId() !== paragraphId && p.getNumber() === numVal
            )
            if (hasCollision) {
                return {
                    valid: false,
                    message: t('details.number_taken'),
                }
            }
        }

        return { valid: true }
    }

    public updateColor(color: string): boolean {
        if (!this.selectedItem?.entity) return false
        const entity = this.selectedItem.entity
        if (typeof entity.setColor === 'function') {
            entity.setColor(color)
            return true
        }
        return false
    }

    public validateColor(color: string): { valid: boolean; message?: string } {
        const trimmed = (color || '').trim()
        const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
        if (/^#[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{3}$/.test(hex)) {
            return { valid: true }
        }
        return { valid: false, message: 'Invalid HEX color' }
    }

    public addTagToSelected(tag: Tag): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addTag) {
            this.selectedItem.entity.addTag(tag)
        }
    }

    public removeTagFromSelected(tagIdOrName: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeTag) {
            this.selectedItem.entity.removeTag(tagIdOrName)
        }
    }

    public addStatToSelected(stat: Stat): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addStat) {
            this.selectedItem.entity.addStat(stat)
        }
    }

    public removeStatFromSelected(statId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeStat) {
            this.selectedItem.entity.removeStat(statId)
        }
    }

    public addCharacterToSelected(character: NPC): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addCharacter) {
            this.selectedItem.entity.addCharacter(character)
        }
    }

    public removeCharacterFromSelected(characterId: string): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.removeCharacter) {
            this.selectedItem.entity.removeCharacter(characterId)
        }
    }

    public addLocationToSelected(location: Location): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.addLocation) {
            this.selectedItem.entity.addLocation(location)
        } else if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(location)
        }
    }

    public removeLocationFromSelected(locationIdOrName?: string): void {
        if (!this.selectedItem?.entity) return
        if (locationIdOrName && this.selectedItem.entity.removeLocation) {
            this.selectedItem.entity.removeLocation(locationIdOrName)
        } else if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(null)
        }
    }

    public setLocationToSelected(location: Location | null): void {
        if (!this.selectedItem?.entity) return
        if (this.selectedItem.entity.setLocation) {
            this.selectedItem.entity.setLocation(location)
        }
    }

    public openOrCreateDescriptionFile(fileType: 'text' | 'author'): {
        fileName: string
        content: string
    } {
        if (!this.selectedItem?.entity) {
            return { fileName: '', content: '' }
        }

        const entity = this.selectedItem.entity
        const desc: Description = entity.getContent ? entity.getContent() : new Description()
        const safeName = this.selectedItem.name.replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `${safeName}_${fileType === 'text' ? 'text' : 'author'}.md`

        let content = ''
        if (fileType === 'text') {
            if (!desc.getText()) {
                desc.setText(`# ${this.selectedItem.name}\n\nNarrative text for players.`)
            }
            content = desc.getText()
        } else {
            if (!desc.getAuthorNotes()) {
                desc.setAuthorNotes(`# Author Notes: ${this.selectedItem.name}\n\nNotes and ideas.`)
            }
            content = desc.getAuthorNotes()
        }

        this.setActiveFile(fileName)
        return { fileName, content }
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

    public getSceneSearchQuery(): string {
        return this.sceneSearchQuery
    }

    public setSceneSearchQuery(query: string): void {
        this.sceneSearchQuery = query
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

    public getConnectionSearchQuery(): string {
        return this.connectionSearchQuery
    }

    public setConnectionSearchQuery(query: string): void {
        this.connectionSearchQuery = query
    }

    // Creation Factory Methods
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

    // --- CONNECTION / CHOICE MANAGEMENT METHODS ---

    public getAllChoices(paragraphs: Paragraph[]): Choice[] {
        const all: Choice[] = []
        paragraphs.forEach(p => {
            const choices = p.getChoices ? p.getChoices() : []
            choices.forEach(c => {
                if (!c.getFromParagraphId()) {
                    c.setFromParagraphId(p.getId())
                }
                all.push(c)
            })
        })
        return all
    }

    public createChoice(
        fromParagraph: Paragraph,
        toParagraph: Paragraph,
        nameInput?: string,
        defaultName: string = 'New jump',
        conditionText?: string
    ): Choice {
        const name = (nameInput ?? '').trim() || defaultName
        const id = this.idGenerator('choice')
        const fromId = fromParagraph.getId()
        const toId = toParagraph.getId()

        let condition: TextCondition | null = null
        if (conditionText && conditionText.trim()) {
            condition = new TextCondition(
                this.idGenerator('condition'),
                'Requirement',
                conditionText.trim()
            )
        }

        const choice = new Choice(id, name, fromId, toId, condition)
        fromParagraph.addChoice(choice)
        return choice
    }

    public deleteChoice(choiceId: string, paragraphs: Paragraph[]): boolean {
        let removed = false
        for (const p of paragraphs) {
            if (p.hasChoice && p.hasChoice(choiceId)) {
                p.removeChoice(choiceId)
                removed = true
                break
            }
        }
        if (this.selectedItem?.id === choiceId && this.selectedItem.type === 'choice') {
            this.closeHistoryItem(choiceId)
        }
        return removed
    }

    public reverseChoice(choice: Choice, paragraphs: Paragraph[]): boolean {
        const oldFromId = choice.getFromParagraphId()
        const oldToId = choice.getToParagraphId()
        if (!oldFromId || !oldToId) return false

        const oldSourceParagraph = paragraphs.find(p => p.getId() === oldFromId)
        const oldTargetParagraph = paragraphs.find(p => p.getId() === oldToId)
        if (!oldSourceParagraph || !oldTargetParagraph) return false

        oldSourceParagraph.removeChoice(choice.getId())
        choice.setFromParagraphId(oldToId)
        choice.setToParagraphId(oldFromId)
        oldTargetParagraph.addChoice(choice)

        return true
    }

    public updateChoiceDetails(choice: Choice, name: string, conditionText: string): boolean {
        const trimmedName = name.trim()
        if (!trimmedName) return false
        choice.setName(trimmedName)

        const trimmedCondition = conditionText.trim()
        if (trimmedCondition) {
            const currentCond = choice.getCondition()
            if (currentCond instanceof TextCondition) {
                currentCond.setText(trimmedCondition)
            } else {
                choice.setCondition(
                    new TextCondition(
                        this.idGenerator('condition'),
                        'Requirement',
                        trimmedCondition
                    )
                )
            }
        } else {
            choice.setCondition(null)
        }

        if (this.selectedItem?.id === choice.getId()) {
            this.selectedItem.name = trimmedName
        }
        return true
    }

    public getOutgoingChoices(paragraph: Paragraph): Choice[] {
        if (!paragraph || !paragraph.getChoices) return []
        const choices = paragraph.getChoices() || []
        choices.forEach(c => {
            if (!c.getFromParagraphId()) {
                c.setFromParagraphId(paragraph.getId())
            }
        })
        return choices
    }

    public updateChoiceTarget(choice: Choice, newTargetParagraphId: string): boolean {
        const trimmedId = (newTargetParagraphId ?? '').trim()
        if (!trimmedId) return false
        choice.setToParagraphId(trimmedId)
        return true
    }

    public updateChoice(
        choice: Choice,
        name: string,
        toParagraphId: string,
        conditionText: string
    ): boolean {
        const nameUpdated = this.updateChoiceDetails(choice, name, conditionText)
        if (!nameUpdated) return false
        if (toParagraphId && toParagraphId.trim()) {
            choice.setToParagraphId(toParagraphId.trim())
        }
        return true
    }

    public searchAndFilterChoices(choices: Choice[], paragraphs: Paragraph[]): Choice[] {
        const query = this.connectionSearchQuery.trim().toLowerCase()
        if (!query) return choices

        return choices.filter(c => {
            const nameMatch = c.getName().toLowerCase().includes(query)
            const condSummary = c.getCondition()?.getSummary().toLowerCase() || ''
            const condMatch = condSummary.includes(query)

            const fromP = paragraphs.find(p => p.getId() === c.getFromParagraphId())
            const toP = paragraphs.find(p => p.getId() === c.getToParagraphId())
            const fromMatch = fromP ? fromP.getTitle().toLowerCase().includes(query) : false
            const toMatch = toP ? toP.getTitle().toLowerCase().includes(query) : false

            return nameMatch || condMatch || fromMatch || toMatch
        })
    }

    public searchAndFilterParagraphs(
        paragraphs: Paragraph[],
        scenes?: Scene[],
        characters?: NPC[]
    ): Paragraph[] {
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

        if (this.selectedFilterScene && scenes && scenes.length > 0) {
            const sceneId = this.selectedFilterScene
            const scene = scenes.find(s => s.getId() === sceneId)
            if (scene) {
                result = result.filter(p => scene.hasParagraph(p.getId()))
            }
        }

        if (this.selectedFilterCharacter && characters && characters.length > 0) {
            const charId = this.selectedFilterCharacter
            // Paragraph can be linked to character via tags or characters list if applicable
            result = result.filter(p =>
                p.getTags().some(t => t.getId() === charId || t.getName() === charId)
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
            const titleMatch = p.getTitle().toLowerCase().includes(query)
            const contentMatch = p.getContent().getText().toLowerCase().includes(query)
            const numberMatch = p.getNumber().toString().includes(query)
            return titleMatch || contentMatch || numberMatch
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

    public searchAndFilterScenes(scenes: Scene[]): Scene[] {
        const query = this.sceneSearchQuery.trim().toLowerCase()
        if (!query) return scenes
        return scenes.filter(
            s =>
                s.getName().toLowerCase().includes(query) ||
                s.getTags().some(t => t.getName().toLowerCase().includes(query))
        )
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
