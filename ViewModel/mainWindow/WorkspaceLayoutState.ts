import type { ConnectionLineStyle, LeftTab, MainViewMode, RibbonTab } from './types'

export class WorkspaceLayoutState {
    private activeRibbonTab: RibbonTab = 'glowna'
    private activeLeftTab: LeftTab | null = 'paragraphs'
    private rightSidebarCollapsed = false
    private activeMainView: MainViewMode = 'graph'

    // Panel Resizing Widths
    private leftDrawerWidth: number = 260
    private rightSidebarWidth: number = 280

    // Graph Settings
    private connectionLineStyle: ConnectionLineStyle = 'curved'
    private zoomSensitivity: number = 0.2

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

    public setActiveLeftTab(tab: LeftTab | null): void {
        this.activeLeftTab = tab
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

    public getActiveMainView(): MainViewMode {
        return this.activeMainView
    }

    public setActiveMainView(view: MainViewMode): void {
        this.activeMainView = view
    }
}
