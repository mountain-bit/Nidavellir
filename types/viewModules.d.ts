declare module '*/View/mockData.js' {
    import type { Feature } from '../Model/Feature'
    import type { Location } from '../Model/Location'
    import type { NPC } from '../Model/NPC'
    import type { NPC_Template } from '../Model/NPC_Template'
    import type { Paragraph } from '../Model/Paragraph'
    import type { Parameter } from '../Model/Parameter'
    import type { Project } from '../Model/Project'
    import type { Scene } from '../Model/Scene'
    import type { Skill } from '../Model/Skill'
    import type { Stat } from '../Model/Stat'
    import type { Tag } from '../Model/Tag'
    import type { MainWindowViewModel } from '../ViewModel/MainWindowViewModel'

    export interface IProjectDataState {
        files: Record<string, string>
        projectTags: Tag[]
        projectCharacters: NPC[]
        projectLocations: Location[]
        projectStats: Stat[]
        projectSkills: Skill[]
        projectParameters: Parameter[]
        projectFeatures: Feature[]
        projectParagraphs: Paragraph[]
        projectScenes: Scene[]
        projectTemplates: NPC_Template[]
        playerCharacter?: unknown
    }

    export const mockFiles: Record<string, string>
    export const USE_MOCK: boolean

    export function createMockProjectData(vm: MainWindowViewModel): IProjectDataState

    export function extractProjectData(
        project: Project | null | undefined,
        files?: Record<string, string>
    ): IProjectDataState

    export function loadRealProjectData(
        vm: MainWindowViewModel,
        options?: { project?: Project; projectPath?: string; files?: Record<string, string> }
    ): Promise<IProjectDataState>

    export function loadProjectData(
        vm: MainWindowViewModel,
        options?: {
            useMock?: boolean
            project?: Project
            projectPath?: string
            files?: Record<string, string>
        }
    ): IProjectDataState
}

declare module '*/View/projectData.js' {
    export {
        createMockProjectData,
        extractProjectData,
        IProjectDataState,
        loadProjectData,
        loadRealProjectData,
        mockFiles,
        USE_MOCK,
    } from '*/View/mockData.js'
}

declare module '*/View/ui/npcModal.js' {
    import type { NPC } from '../Model/NPC'
    import type { NPC_Template } from '../Model/NPC_Template'

    export function openNpcModal(options?: {
        mode?: 'character' | 'template'
        applyTemplate?: NPC_Template | boolean | unknown
        preserveState?: boolean
        editEntity?: NPC | NPC_Template | unknown
        editingEntity?: NPC | NPC_Template | unknown
    }): void
    export function openNpcTemplateModal(options?: {
        applyTemplate?: NPC_Template | boolean | unknown
        preserveState?: boolean
        editEntity?: NPC | NPC_Template | unknown
        editingEntity?: NPC | NPC_Template | unknown
    }): void
    export function getModalMode(): 'character' | 'template'
    export function setModalMode(mode: 'character' | 'template'): void
    export function closeNpcModal(): void
    export function hasUnsavedNpcChanges(): boolean
    export function requestCloseNpcModal(): Promise<boolean>
    export function executeNpcModalSave(ctx?: unknown): object | null
    export function getNpcSnapshot(): string
    export function captureNpcInitialSnapshot(): void
    export function setupNpcModal(ctx?: unknown): Record<string, unknown>
    export function updateSelectedAvatarPreview(avatarId: string): void
    export function toggleDescriptionDrawer(forceState?: boolean): void
    export function getSelectedAvatarId(): string
    export function setSelectedAvatarId(id: string): void
    export function getNpcName(): string
    export function setNpcName(name: string): void
    export function getNpcSummary(): string
    export function setNpcSummary(summary: string): void
    export function addCustomAttribute(
        name?: string,
        value?: string,
        shouldFocusValue?: boolean
    ): string
    export function confirmCustomAttribute(id: string): void
    export function editCustomAttribute(id: string): void
    export function removeCustomAttribute(id: string): void
    export function getCustomAttributes(): Array<{ name: string; value: string }>
    export function setCustomAttributes(
        attributes: Array<{ id?: string; name?: string; value?: string; isEditing?: boolean }>
    ): void
    export function clearCustomAttributes(): void
    export function renderCustomAttributes(): void
    export function addNpcStat(name?: string, value?: string, shouldFocusValue?: boolean): string
    export function confirmNpcStat(id: string): void
    export function editNpcStat(id: string): void
    export function removeNpcStat(id: string): void
    export function getNpcStats(): Array<{ name: string; value: string }>
    export function setNpcStats(
        stats: Array<{ id?: string; name?: string; value?: string; isEditing?: boolean }>
    ): void
    export function clearNpcStats(): void
    export function renderNpcStats(): void
    export function getAvailableStatNames(): string[]
    export function updateSkillStatDropdowns(): void
    export function addNpcSkill(
        name?: string,
        mode?: 'direct' | 'stat_mod',
        value?: string,
        statName?: string,
        modifier?: string
    ): string
    export function confirmNpcSkill(id: string): void
    export function editNpcSkill(id: string): void
    export function removeNpcSkill(id: string): void
    export function getNpcSkills(): Array<{
        name: string
        mode: 'direct' | 'stat_mod'
        value: string
        statName: string
        modifier: string
    }>
    export function setNpcSkills(
        skills: Array<{
            id?: string
            name?: string
            mode?: 'direct' | 'stat_mod'
            value?: string
            statName?: string
            modifier?: string
            isEditing?: boolean
        }>
    ): void
    export function clearNpcSkills(): void
    export function renderNpcSkills(): void
    export function addNpcVital(
        name?: string,
        mode?: 'direct' | 'formula',
        value?: string,
        formula?: string,
        shouldFocusValue?: boolean
    ): string
    export function confirmNpcVital(id: string): void
    export function editNpcVital(id: string): void
    export function removeNpcVital(id: string): void
    export function getNpcVitals(): Array<{
        name: string
        mode: 'direct' | 'formula'
        value: string
        formula: string
        calculatedValue: number | null
    }>
    export function setNpcVitals(
        vitals: Array<{
            id?: string
            name?: string
            mode?: 'direct' | 'formula'
            value?: string
            formula?: string
            isEditing?: boolean
        }>
    ): void
    export function clearNpcVitals(): void
    export function renderNpcVitals(): void
    export function evaluateFormula(
        formula: string,
        statsMap?: Record<string, number | string>
    ): { result: number | null; error?: string }
    export function parseStatValueAsNumber(val: unknown): number | null
    export function updateVitalFormulasPreview(): void
    export function saveNpcCharacter(ctx?: Record<string, unknown>): NPC | null
    export function saveNpcTemplate(ctx?: Record<string, unknown>): NPC_Template | null
    export function getNpcDescription(): string
    export function setNpcDescription(text: string): void
    export function isDescriptionDrawerOpen(): boolean
    export function resetNpcModalForm(): void
    export function addNpcTag(
        tagOrName?: string | { id?: string; name?: string; color?: string },
        color?: string
    ): string | null
    export function removeNpcTag(idOrName: string): void
    export function getNpcTags(): Array<{ id: string; name: string; color: string }>
    export function setNpcTags(
        tags: Array<{ id?: string; name?: string; color?: string } | string>
    ): void
    export function clearNpcTags(): void
    export function renderNpcTags(): void
    export function initNpcTagsController(ctx?: unknown): void
    export interface ITraitsCounts {
        project: {
            stats: number
            parameters: number
            skills: number
            features: number
            tags: number
            total: number
        }
        npc: {
            stats: number
            parameters: number
            skills: number
            features: number
            tags: number
            total: number
        }
    }
    export function getTraitsCounts(ctx?: unknown): ITraitsCounts
    export function updateTraitsCounterUI(ctx?: unknown): ITraitsCounts
    export function renderDynamicSuggestions(ctx?: unknown): void
    export interface ITemplateMergeReport {
        templateId: string
        templateName: string
        addedStats: string[]
        skippedStats: string[]
        addedSkills: string[]
        skippedSkills: string[]
        addedVitals: string[]
        skippedVitals: string[]
        addedAttributes: string[]
        skippedAttributes: string[]
        addedTags: string[]
        skippedTags: string[]
        appliedAvatar: boolean
        appliedSummary: boolean
        appliedDescription: boolean
        totalAdded: number
        totalSkipped: number
    }

    export function applyTemplate(
        templateIdOrInstance: unknown,
        ctx?: unknown
    ): ITemplateMergeReport
    export function removeAppliedTemplate(templateId: string, ctx?: unknown): void
    export function renderAppliedTemplates(): void
    export function getAppliedTemplates(): Array<{ id: string; name: string; avatar?: string }>
    export function setAppliedTemplates(
        templates: Array<{ id: string; name: string; avatar?: string }>
    ): void
    export function clearAppliedTemplates(): void
    export function openTemplateDropdown(ctx?: unknown): void
    export function closeTemplateDropdown(): void
    export function toggleTemplateDropdown(ctx?: unknown): void
    export function isTemplateDropdownOpen(): boolean
    export function getAvailableTemplates(ctx?: unknown): unknown[]
    export function renderTemplateDropdownList(ctx?: unknown, filterQuery?: string): void
}

declare module '*/View/ui/npcModal/npcState.js' {
    export interface INpcStateStat {
        name: string
        value: string
        isEditing?: boolean
    }
    export interface INpcStateSkill {
        name: string
        mode: string
        value: string
        statName?: string
        modifier?: string
        isEditing?: boolean
    }
    export interface INpcStateVital {
        name: string
        mode: string
        value: string | number
        formula?: string
        isEditing?: boolean
    }
    export interface INpcStateAttribute {
        name: string
        value: string
        isEditing?: boolean
    }
    export interface INpcStateTag {
        id?: string
        name: string
        color?: string
    }

    export function getModalMode(): 'character' | 'template'
    export function setModalMode(mode: 'character' | 'template'): void
    export function resetState(): void
    export function getAppliedTemplates(): Array<{ id: string; name: string; avatar?: string }>
    export function setAppliedTemplates(
        templates: Array<{ id: string; name: string; avatar?: string }>
    ): void
    export function addAppliedTemplateState(tpl: {
        id?: string
        name?: string
        avatar?: string
    }): void
    export function removeAppliedTemplateState(id: string): void
    export function clearAppliedTemplates(): void
    export function getNpcStats(): Array<{ name: string; value: string }>
    export function getNpcStatsArray(): INpcStateStat[]
    export function getNpcSkillsArray(): INpcStateSkill[]
    export function getNpcVitalsArray(): INpcStateVital[]
    export function getCustomAttributesArray(): INpcStateAttribute[]
    export function getNpcTagsArray(): INpcStateTag[]
    export function addNpcStatState(
        name?: string,
        value?: string | number,
        isEditing?: boolean
    ): unknown
    export function addNpcSkillState(
        name?: string,
        mode?: string,
        value?: string,
        statName?: string,
        modifier?: string,
        isEditing?: boolean
    ): unknown
    export function addNpcVitalState(
        name?: string,
        mode?: string,
        value?: string | number,
        formula?: string,
        isEditing?: boolean
    ): unknown
    export function addCustomAttributeState(
        name?: string,
        value?: string,
        isEditing?: boolean
    ): unknown
    export function addNpcTagState(tagOrName: unknown, color?: string): unknown
    export function getCurrentAvatarId(): string
    export function setCurrentAvatarId(id: string): void
    export function getActiveModal(): HTMLElement | null
    export function setActiveModal(el: HTMLElement | null): void
    export function getActiveCtx(): unknown
    export function setActiveCtx(ctx: unknown): void
}

declare module '*/View/ui/npcModal/templateMerger.js' {
    export { ITemplateMergeReport } from '*/View/ui/npcModal/npcTraitsCounter.js'

    export function extractTemplateStats(tpl: unknown): Array<{ name: string; value: string }>
    export function extractTemplateSkills(tpl: unknown): Array<{
        name: string
        mode: 'direct' | 'stat_mod'
        value: string
        statName: string
        modifier: string
    }>
    export function extractTemplateVitals(
        tpl: unknown
    ): Array<{ name: string; mode: 'direct' | 'formula'; value: string; formula: string }>
    export function extractTemplateAttributes(tpl: unknown): Array<{ name: string; value: string }>
    export function extractTemplateTags(
        tpl: unknown
    ): Array<{ id: string; name: string; color: string }>
    export function mergeTemplateIntoModalState(
        tpl: unknown,
        options?: unknown
    ): import('*/View/ui/npcModal/npcTraitsCounter.js').ITemplateMergeReport
}

declare module '*/View/ui/npcModal/npcTraitsCounter.js' {
    export interface ITraitsCounts {
        project: {
            stats: number
            parameters: number
            skills: number
            features: number
            tags: number
            total: number
        }
        npc: {
            stats: number
            parameters: number
            skills: number
            features: number
            tags: number
            total: number
        }
    }
    export function getTraitsCounts(ctx?: unknown): ITraitsCounts
    export function updateTraitsCounterUI(ctx?: unknown): ITraitsCounts
}

declare module '*/View/ui/contextMenu.js' {
    export function setupSectionControlsAndContextMenu(ctx?: unknown): void
}

declare module '*/View/ui/drawerLists.js' {
    export function renderTraitsList(ctx?: unknown): void
    export function renderParagraphsList(ctx?: unknown): void
    export function renderScenesList(ctx?: unknown): void
    export function renderConnectionsList(ctx?: unknown): void
    export function renderCharactersList(ctx?: unknown): void
    export function renderMainCharacter(ctx?: unknown): void
    export function getCharactersSectionCollapsed(): boolean
    export function setCharactersSectionCollapsed(collapsed: boolean): void
    export function getTemplatesSectionCollapsed(): boolean
    export function setTemplatesSectionCollapsed(collapsed: boolean): void
    export function renderLocationsList(ctx?: unknown): void
    export function renderTagsList(ctx?: unknown): void
    export function attachItemSelectionListeners(
        container: HTMLElement,
        type: string,
        sourceArray: unknown[],
        ctx: unknown
    ): void
    export function attachContextMenuListeners(
        container: HTMLElement,
        type: string,
        sourceArray: unknown[],
        ctx: unknown
    ): void
    export function attachColorPickerListeners(container: HTMLElement, ctx: unknown): void
    export function attachDrawerDropListeners(
        container: HTMLElement,
        targetType: string,
        targetArray: unknown[],
        ctx: unknown
    ): void
}

declare module '*/View/ui/heroModal.js' {
    export function setupHeroModal(ctx?: unknown): {
        open: (options?: unknown) => void
        close: (options?: unknown) => void
    }
    export function openHeroModal(options?: unknown): void
    export function closeHeroModal(options?: unknown): void
    export function hasUnsavedHeroChanges(): boolean
}

declare module '*/View/ui/detailsPanel.js' {
    export function renderDetailsPanel(ctx?: unknown): void
    export function renderHistoryBar(ctx?: unknown): void
}

declare module '*/View/ui/editor/editorToolbar.js' {
    export const TOOLBAR_BUTTON_STATE_MAP: Array<{ id: string; key: string }>
    export function updateToolbarActiveStates(
        activeStates: Record<string, unknown>,
        ctx: unknown,
        options?: { prefix?: string; buttonMap?: Array<{ id: string; key: string }> }
    ): void
    export function setupToolbarButtons(
        editor: unknown,
        ctx: unknown,
        options?: { prefix?: string; toolbarEl?: HTMLElement | null }
    ): void
}

declare module '*/View/ui/editor/customStylesMenu.js' {
    export function setupCustomStylesUI(
        editor: unknown,
        ctx: unknown,
        onSelectionUpdate?: (activeStates: Record<string, unknown>, ctx: unknown) => void,
        options?: {
            prefix?: string
            dropdownBtn?: HTMLElement | null
            dropdownMenu?: HTMLElement | null
            container?: HTMLElement | null
            clearBtn?: HTMLElement | null
            openModalBtn?: HTMLElement | null
        }
    ): { renderList: () => void; openModal: (style?: unknown) => void }
}

declare module '*/View/ui/editor/customStyleModal.js' {
    export function setupCustomStyleModal(
        ctx: unknown,
        options?: { onStyleSaved?: () => void; onStyleDeleted?: () => void }
    ): { openModal: (styleToEdit?: unknown) => void; closeModal: () => void }
}

declare module '*/View/ui/editor/fontBrowserModal.js' {
    export function setupFontBrowserUI(
        ctx: unknown,
        options?: { onFontSelected?: (fontName: string) => void }
    ): { open: () => void; close: () => void } | null
}

declare module '*/View/ui/editor/entityLinkModal.js' {
    export function extractAvailableProjectEntities(
        projectData?: unknown
    ): Array<{ id: string; name: string; type: string; description?: string }>
    export function positionPopover(targetRectOrPoint?: unknown): void
    export function openEntityLinkModal(
        editor: unknown,
        ctx: unknown,
        options?: {
            initialLabel?: string
            initialEntityId?: string
            initialType?: string
            badgePos?: number | null
            targetRect?: unknown
            point?: { x: number; y: number }
        }
    ): void
    export function closeEntityLinkModal(): void
}

declare module '*/View/ui/editor/descriptionEmbedModal.js' {
    export function extractEmbeddableEntities(source?: unknown): Array<{
        id: string
        name: string
        type: 'item' | 'character' | 'location'
        descriptionText: string
        summaryText: string
    }>
    export function positionDescriptionEmbedPopover(targetRectOrPoint?: unknown): void
    export function openDescriptionEmbedModal(
        editor: unknown,
        ctx: unknown,
        options?: {
            initialEntityId?: string
            initialType?: string
            initialVariant?: 'text' | 'summary'
            embedPos?: number | null
            targetRect?: unknown
            point?: { x: number; y: number }
        }
    ): void
    export function closeDescriptionEmbedModal(): void
    export function setupDescriptionEmbedModalEvents(ctx?: unknown): void
}

declare module '*/View/ui/editor/mainEditor.js' {
    export function getMainEditorInstance(): unknown
    export function updateEditorStats(editor: unknown): void
    export function syncEntitiesWithActiveObject(ctx: unknown, entities: unknown[]): void
    export function openEditorContextMenu(x: number, y: number, data: unknown): void
    export function hideEditorContextMenu(): void
    export function setupEditorContextMenu(editor: unknown, ctx: unknown): void
    export function setEditorActiveState(isActive: boolean, editor?: unknown): void
    export function getOrCreateMainEditor(
        ctx: unknown,
        container?: HTMLElement,
        options?: Record<string, unknown>
    ): unknown
}

declare module '*/View/ui/editor/npcEditor.js' {
    export function getNpcEditorInstance(): unknown
    export function updateNpcEditorStats(editor?: unknown): void
    export function getOrCreateNpcEditor(ctx: unknown): unknown
    export function destroyNpcEditor(): void
}

declare module '*/View/ui/editor/index.js' {
    export * from '*/View/ui/editor/customStyleModal.js'
    export * from '*/View/ui/editor/customStylesMenu.js'
    export * from '*/View/ui/editor/editorToolbar.js'
    export * from '*/View/ui/editor/entityLinkModal.js'
    export * from '*/View/ui/editor/fontBrowserModal.js'
    export * from '*/View/ui/editor/mainEditor.js'
    export * from '*/View/ui/editor/npcEditor.js'
}

declare module '*/View/ui/npcAvatars.js' {
    export interface IFantasyAvatar {
        id: string
        nameKey?: string
        name?: string
        category?: string
        color?: string
        bgColor?: string
        borderColor?: string
        svg: string
        isCustom?: boolean
        src?: string
    }

    export const FANTASY_AVATARS: IFantasyAvatar[]
    export function getAvatarName(avatar: IFantasyAvatar): string
    export function getAvatarById(id: string): IFantasyAvatar
    export function isCustomAvatarPath(avatarId: string): boolean
}

declare module '*/View/ui/imageEditorModal.js' {
    export function setupImageEditorModal(ctx: unknown): {
        open: (options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }) => void
        close: () => void
    }
    export function getImageEditorModal(ctx: unknown): {
        open: (options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }) => void
        close: () => void
    }
    export function openImageEditor(
        ctx: unknown,
        options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }
    ): void
}

declare module '*/dist/Modules/ImageEditor/index.js' {
    export * from '../Modules/ImageEditor/index'
}

declare module '*/View/ui/confirmModal.js' {
    export function markFileDirty(fileName: string): void
    export function markFileClean(fileName: string): void
    export function hasUnsavedFileChanges(): boolean
    export function getUnsavedFiles(): string[]
    export function clearDirtyFiles(): void
    export function showUnsavedChangesModal(options?: {
        title?: string
        subtitle?: string
        message?: string
        saveLabel?: string
        dontSaveLabel?: string
        cancelLabel?: string
    }): Promise<'save' | 'dont_save' | 'cancel'>
    export function confirmApplicationClose(
        target?: 'app' | 'project',
        ctx?: unknown,
        helpers?: {
            hasUnsavedNpc?: () => boolean
            saveNpc?: () => Promise<void> | void
            saveFiles?: (ctx: unknown) => Promise<void> | void
            isProjectDirty?: () => boolean
            saveFullProject?: (ctx: unknown) => Promise<unknown> | unknown
            markProjectClean?: () => void
        }
    ): Promise<boolean>
}

declare module '*/View/ui/workspace.js' {
    export function renderEditorTabs(ctx?: unknown): void
    export function saveActiveFile(ctx?: unknown): void
    export function saveAllUnsavedFiles(ctx?: unknown): Promise<void>
    export function setupResizers(leftDrawer?: unknown, rightSidebar?: unknown, vm?: unknown): void
    export function updateMainWorkspaceUI(ctx?: unknown): void
    export function updateRightSidebarUI(
        vm?: unknown,
        rightSidebar?: unknown,
        toggleBtn?: unknown,
        reopenBtn?: unknown
    ): void
    export function updateZoomToolbarUI(storyGraphInstance?: unknown, zoomLevel?: number): void
}

declare module '*/View/ui/heroModal/heroSectionControllers.js' {
    export function initHeroAvatarGrid(): void
    export function updateHeroSelectedAvatarPreview(avatarId?: string): void
    export function openHeroAvatarPopover(): void
    export function closeHeroAvatarPopover(): void
    export function toggleHeroAvatarPopover(): void
    export function renderHeroCustomAttributes(): void
    export function addHeroCustomAttribute(name?: string, value?: string): void
    export function renderHeroTags(): void
    export function addHeroTag(tag: unknown): void
    export function initHeroTagsController(ctx?: unknown): void
    export function renderHeroStats(): void
    export function addHeroStat(name?: string, value?: number): void
    export function renderHeroVitals(): void
    export function updateHeroVitalFormulasPreview(): void
    export function addHeroVital(
        name?: string,
        mode?: string,
        value?: number,
        formula?: string
    ): void
    export function renderHeroSkills(): void
    export function updateHeroSkillStatDropdowns(): void
    export function addHeroSkill(name?: string, statName?: string, value?: string): void
}

declare module '*/View/ui/projectStateTracker.js' {
    export function isProjectDirty(): boolean
    export function markProjectDirty(): void
    export function markProjectClean(): void
    export function setProjectSaving(): void
    export function setProjectSaved(): void
    export function updateProjectSaveIndicatorUI(
        state: 'dirty' | 'saving' | 'saved' | 'clean',
        customProjectName?: string
    ): void
    export function updateProjectNameUI(name?: string): void
}

declare module '*/View/ui/projectSaver.js' {
    export function saveFullProject(
        ctx: unknown,
        options?: { isAutoSave?: boolean }
    ): Promise<{ success: boolean; canceled?: boolean; skipped?: boolean; error?: string }>
}

declare module '*/View/ui/autoSaveService.js' {
    export const DEFAULT_AUTOSAVE_INTERVAL_MS: number
    export function isAutoSaveEnabled(): boolean
    export function setAutoSaveEnabled(enabled: boolean, ctx?: unknown): void
    export function triggerAutoSaveCycle(
        ctx: unknown
    ): Promise<{ success: boolean; skipped?: boolean; error?: string }>
    export function startAutoSave(ctx: unknown, intervalMs?: number): void
    export function stopAutoSave(): void
    export function isAutoSaveRunningStatus(): boolean
}

declare module '*/View/ui/graphValidator.js' {
    export interface IGraphValidationIssue {
        id?: string
        type: 'error' | 'warning' | 'info'
        title: string
        description: string
        paragraphId?: string
        targetId?: string
        cycleIds?: string[]
    }

    export interface IGraphValidationReport {
        isValid: boolean
        errorCount: number
        warningCount: number
        infoCount?: number
        issuesCount: number
        issues: IGraphValidationIssue[]
    }

    export function validateStoryGraph(ctx: unknown): IGraphValidationReport
}

declare module '*/View/ui/topBar.js' {
    export function updateTopBarUI(ctx: unknown): void
    export function runGraphValidation(ctx: unknown): unknown
    export function openPlaytestSimulator(ctx: unknown): void
    export function openExportModal(ctx: unknown): void
    export function initTopBar(ctx: unknown): void
    export function openQuickSearch(ctx: unknown): void
    export function centerGraphView(ctx: unknown): void
    export function openSettingsView(ctx: unknown): void
}

declare module '*/View/ui/quickSearch.js' {
    export interface ISearchCandidate {
        id: string
        title: string
        description?: string
        category: string
        type: string
        typeLabel: string
        icon: string
        badgeColor: string
        actionText: string
        tags?: string[]
        locationName?: string
        charNames?: string[]
        entity: unknown
        number?: number
    }

    export function getEntityText(desc: unknown): string
    export function highlightMatch(text: string, query: string): string
    export function getAllProjectObjects(ctx: unknown): ISearchCandidate[]
    export function scoreCandidate(
        candidate: ISearchCandidate,
        query: string
    ): { matched: boolean; tier: number; score: number }
    export function searchProjectObjects(
        ctx: unknown,
        query: string,
        categoryFilter?: string
    ): ISearchCandidate[]
    export function executeQuickSearchAction(item: ISearchCandidate, ctx: unknown): void
    export function renderQuickSearchResults(ctx: unknown, query: string): void
    export function openQuickSearch(ctx: unknown): void
    export function closeQuickSearch(): void
    export function initQuickSearch(ctx: unknown): void
}

declare module '*/View/ui/assetManagerModal.js' {
    export function openAssetManager(ctx: unknown): Promise<void>
    export function closeAssetManager(): void
    export function refreshAssetList(): Promise<void>
}

declare module '*/View/ui/assetPicker.js' {
    export function getActiveProjectPath(ctx?: unknown): string
    export function ensureActiveProjectPath(ctx?: unknown): Promise<string>
    export function importImageNative(
        ctx?: unknown,
        prefix?: string
    ): Promise<{ relativePath: string; fileName: string; assetUrl: string } | null>
    export function openAssetPickerModal(
        ctx?: unknown,
        options?: { prefix?: string; title?: string; currentRelativePath?: string }
    ): Promise<{ relativePath: string; fileName: string; assetUrl: string } | null>
    export function pickProjectImage(
        ctx?: unknown,
        prefix?: string,
        options?: { directNativeDialog?: boolean; title?: string; currentRelativePath?: string }
    ): Promise<{ relativePath: string; fileName: string; assetUrl: string } | null>
    export function importDroppedImage(
        file: File | unknown,
        ctx?: unknown,
        prefix?: string
    ): Promise<{ relativePath: string; fileName: string; assetUrl: string } | null>
    export function setupElementDropZone(
        element: HTMLElement | null,
        options?: {
            highlightClass?: string
            onFileDrop?: (file: File, event: DragEvent) => Promise<void> | void
            onFilesDrop?: (files: File[], event: DragEvent) => Promise<void> | void
            overlayElement?: HTMLElement | null
        }
    ): void
}

declare module '*/View/ui/playtestModal.js' {
    export class PlaytestEngine {
        godMode: boolean
        constructor(ctx: unknown)
        start(startParagraphId?: string): unknown
        goTo(targetParagraphId: string, choiceTitle?: string): unknown
        teleportTo(sceneId?: string, targetParagraphId?: string, resetHistory?: boolean): unknown
        stepBack(): unknown
        stepToIndex(index: number): unknown
        canStepBack(): boolean
        getCurrentParagraph(): unknown
        getCurrentEntry(): {
            paragraphId: string
            paragraphNumber: number
            paragraphTitle: string
            sceneId?: string
            sceneName?: string
            choiceTakenTitle?: string
            isTeleport: boolean
            timestamp: number
        } | null
        getHistoryTrail(): Array<{
            paragraphId: string
            paragraphNumber: number
            paragraphTitle: string
            sceneId?: string
            sceneName?: string
            choiceTakenTitle?: string
            isTeleport: boolean
            timestamp: number
        }>
        getVisitedCount(): number
        getStepCount(): number
        toggleGodMode(): boolean
        getCharacters(): Array<{
            getId?: () => string
            getName?: () => string
            id?: string
            name?: string
        }>
        getTemplates(): Array<{
            getId?: () => string
            getName?: () => string
            id?: string
            name?: string
        }>
        getNpcs(): Array<{
            getId?: () => string
            getName?: () => string
            id?: string
            name?: string
        }>
        getStats(): unknown[]
        getParameters(): unknown[]
        getTraits(): Array<{ id: string; name: string; kind: 'stat' | 'parameter' }>
    }

    export function formatMarkdown(text: string): string
    export function formatInlineMarkdown(text: string): string
    export function openPlaytestSimulator(ctx: unknown, startParagraphId?: string): void
    export function closePlaytestSimulator(): void
    export function renderPlaytestView(): void
}

declare module '*/Services/ParagraphNumberingService.js' {
    import type { Paragraph } from '../Model/Paragraph'

    export interface INumberingOptions {
        minNumber?: number
        maxNumber?: number
        startNodeAsOne?: boolean
    }

    export class ParagraphNumberingService {
        public static getLockedNumbers(paragraphs: Paragraph[]): Set<number>
        public static getDisplayNumber(p: Paragraph | null | undefined): number
        public static ensureUniqueNumbers(
            paragraphs: Paragraph[],
            options?: INumberingOptions
        ): void
        public static reshuffleAllNumbers(
            paragraphs: Paragraph[],
            options?: INumberingOptions
        ): void
        public static rerollSingleParagraph(
            paragraph: Paragraph,
            allParagraphs: Paragraph[]
        ): number
    }
}

declare module '*/View/ui/detailsPanel/combatModule.js' {
    import type { Paragraph } from '../Model/Paragraph'

    export function generateCombatMarkdown(entity: Paragraph, ctx: unknown): string
    export function syncCombatToParagraphDescription(entity: Paragraph, ctx: unknown): void
    export function renderCombatModule(
        container: HTMLElement,
        entity: unknown,
        type: string,
        ctx: unknown,
        onRefreshDetails?: (ctx: unknown) => void
    ): void
}
