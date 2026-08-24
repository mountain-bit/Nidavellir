export type RibbonTab = 'glowna' | 'sceny' | 'widok'
export type LeftTab = 'explorer' | 'scenes' | 'search' | 'settings'
export type MainViewMode = 'markdown' | 'graph'

export class MainWindowViewModel {
    private activeRibbonTab: RibbonTab = 'glowna'
    private activeLeftTab: LeftTab | null = 'explorer'
    private rightSidebarCollapsed = false
    private activeMainView: MainViewMode = 'markdown'
    private activeFile: string | null = null
    private openFiles: string[] = []

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
}
