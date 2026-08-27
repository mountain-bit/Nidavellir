import { Cecha } from '../Model/Cecha'
import { Lokacja } from '../Model/Lokacja'
import { NPC } from '../Model/NPC'
import { Opis } from '../Model/Opis'
import { Paragraf } from '../Model/Paragraf'
import { Scena } from '../Model/Scena'
import { Tag } from '../Model/Tag'

export { Cecha, Lokacja, NPC, Opis, Paragraf, Scena, Tag }

export type RibbonTab = 'glowna' | 'sceny' | 'widok'
export type LeftTab =
    | 'paragraphs'
    | 'scenes'
    | 'characters'
    | 'locations'
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
    private traitSearchQuery: string = ''
    private tagSearchQuery: string = ''

    constructor() {}

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

    public getTraitSearchQuery(): string {
        return this.traitSearchQuery
    }

    public setTraitSearchQuery(query: string): void {
        this.traitSearchQuery = query
    }

    public getTagSearchQuery(): string {
        return this.tagSearchQuery
    }

    public setTagSearchQuery(query: string): void {
        this.tagSearchQuery = query
    }

    // Factory Helpers with Fallback Default Names
    public stworzPostac(nazwaInput?: string, domyslnaNazwa: string = 'Nowa postać'): NPC {
        const nazwa = (nazwaInput ?? '').trim() || domyslnaNazwa
        const id = 'npc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        return new NPC(id, nazwa)
    }

    public stworzLokacje(nazwaInput?: string, domyslnaNazwa: string = 'Nowa lokacja'): Lokacja {
        const nazwa = (nazwaInput ?? '').trim() || domyslnaNazwa
        const id = 'lokacja_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        return new Lokacja(id, nazwa)
    }

    public stworzCeche(nazwaInput?: string, domyslnaNazwa: string = 'Nowa cecha'): Cecha {
        const nazwa = (nazwaInput ?? '').trim() || domyslnaNazwa
        const id = 'cecha_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        return new Cecha(id, nazwa, new Opis(), '')
    }

    public stworzTag(
        nazwaInput?: string,
        kolorInput: string = '#3b82f6',
        domyslnaNazwa: string = 'Nowy tag'
    ): Tag {
        const nazwa = (nazwaInput ?? '').trim() || domyslnaNazwa
        const id = 'tag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
        return new Tag(id, nazwa, kolorInput)
    }

    /**
     * Search and filter methods
     */
    public searchAndFilterParagraphs(paragraphs: Paragraf[]): Paragraf[] {
        let result = [...paragraphs]

        if (this.selectedFilterTag) {
            const tagStr = this.selectedFilterTag.toLowerCase()
            result = result.filter(p =>
                p
                    .pobierzTagi()
                    .some(
                        t =>
                            t.pobierzID().toLowerCase() === tagStr ||
                            t.pobierzNazwe().toLowerCase() === tagStr
                    )
            )
        }

        const query = this.paragraphSearchQuery.trim().toLowerCase()
        if (!query) {
            return result.sort((a, b) => {
                if (a.pobierzBlokadaNumeru() && !b.pobierzBlokadaNumeru()) return -1
                if (!a.pobierzBlokadaNumeru() && b.pobierzBlokadaNumeru()) return 1
                return 0
            })
        }

        result = result.filter(p => {
            const tytulMatch = p.pobierzTytul().toLowerCase().includes(query)
            const trescMatch = p.pobierzTresc().pobierzTekst().toLowerCase().includes(query)
            const numerMatch = p.pobierzNumer().toString().includes(query)
            return tytulMatch || trescMatch || numerMatch
        })

        return result.sort((a, b) => {
            const aLocked = a.pobierzBlokadaNumeru()
            const bLocked = b.pobierzBlokadaNumeru()
            if (aLocked && !bLocked) return -1
            if (!aLocked && bLocked) return 1

            const aTitleMatch = a.pobierzTytul().toLowerCase().includes(query)
            const bTitleMatch = b.pobierzTytul().toLowerCase().includes(query)
            if (aTitleMatch && !bTitleMatch) return -1
            if (!aTitleMatch && bTitleMatch) return 1

            return 0
        })
    }

    public searchAndFilterCharacters(postacie: NPC[]): NPC[] {
        const query = this.characterSearchQuery.trim().toLowerCase()
        if (!query) return postacie
        return postacie.filter(
            p =>
                p.pobierzNazwe().toLowerCase().includes(query) ||
                p.pobierzTagi().some(t => t.pobierzNazwe().toLowerCase().includes(query))
        )
    }

    public searchAndFilterLocations(lokacje: Lokacja[]): Lokacja[] {
        const query = this.locationSearchQuery.trim().toLowerCase()
        if (!query) return lokacje
        return lokacje.filter(
            l =>
                l.pobierzNazwe().toLowerCase().includes(query) ||
                l.pobierzTagi().some(t => t.pobierzNazwe().toLowerCase().includes(query))
        )
    }

    public searchAndFilterTraits(cechy: Cecha[]): Cecha[] {
        const query = this.traitSearchQuery.trim().toLowerCase()
        if (!query) return cechy
        return cechy.filter(c => c.pobierzNazwe().toLowerCase().includes(query))
    }

    public searchAndFilterTags(tagi: Tag[]): Tag[] {
        const query = this.tagSearchQuery.trim().toLowerCase()
        if (!query) return tagi
        return tagi.filter(t => t.pobierzNazwe().toLowerCase().includes(query))
    }
}
