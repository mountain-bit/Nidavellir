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
        applyTemplate?: any
        preserveState?: boolean
        editEntity?: NPC | NPC_Template | any
        editingEntity?: NPC | NPC_Template | any
    }): void
    export function openNpcTemplateModal(options?: {
        applyTemplate?: any
        preserveState?: boolean
        editEntity?: NPC | NPC_Template | any
        editingEntity?: NPC | NPC_Template | any
    }): void
    export function getModalMode(): 'character' | 'template'
    export function setModalMode(mode: 'character' | 'template'): void
    export function closeNpcModal(): void
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
    export function applyTemplate(templateIdOrInstance: any, ctx?: any): any
    export function removeAppliedTemplate(templateId: string, ctx?: any): void
    export function renderAppliedTemplates(): void
    export function getAppliedTemplates(): Array<{ id: string; name: string; avatar?: string }>
    export function setAppliedTemplates(
        templates: Array<{ id: string; name: string; avatar?: string }>
    ): void
    export function clearAppliedTemplates(): void
    export function openTemplateDropdown(ctx?: any): void
    export function closeTemplateDropdown(): void
    export function toggleTemplateDropdown(ctx?: any): void
    export function isTemplateDropdownOpen(): boolean
    export function getAvailableTemplates(ctx?: any): any[]
    export function renderTemplateDropdownList(ctx?: any, filterQuery?: string): void
}

declare module '*/View/ui/npcModal/npcState.js' {
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
    export function getNpcStatsArray(): any[]
    export function getNpcSkillsArray(): any[]
    export function getNpcVitalsArray(): any[]
    export function getCustomAttributesArray(): any[]
    export function getNpcTagsArray(): any[]
    export function addNpcStatState(
        name?: string,
        value?: string | number,
        isEditing?: boolean
    ): any
    export function addNpcSkillState(
        name?: string,
        mode?: string,
        value?: string,
        statName?: string,
        modifier?: string,
        isEditing?: boolean
    ): any
    export function addNpcVitalState(
        name?: string,
        mode?: string,
        value?: string | number,
        formula?: string,
        isEditing?: boolean
    ): any
    export function addCustomAttributeState(name?: string, value?: string, isEditing?: boolean): any
    export function addNpcTagState(tagOrName: any, color?: string): any
    export function getCurrentAvatarId(): string
    export function setCurrentAvatarId(id: string): void
    export function getActiveModal(): HTMLElement | null
    export function setActiveModal(el: HTMLElement | null): void
    export function getActiveCtx(): any
    export function setActiveCtx(ctx: any): void
}

declare module '*/View/ui/npcModal/templateMerger.js' {
    export function extractTemplateStats(tpl: any): Array<{ name: string; value: string }>
    export function extractTemplateSkills(tpl: any): Array<{
        name: string
        mode: 'direct' | 'stat_mod'
        value: string
        statName: string
        modifier: string
    }>
    export function extractTemplateVitals(
        tpl: any
    ): Array<{ name: string; mode: 'direct' | 'formula'; value: string; formula: string }>
    export function extractTemplateAttributes(tpl: any): Array<{ name: string; value: string }>
    export function extractTemplateTags(
        tpl: any
    ): Array<{ id: string; name: string; color: string }>
    export function mergeTemplateIntoModalState(
        tpl: any,
        options?: any
    ): {
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

declare module '*/View/ui/detailsPanel.js' {
    export function renderDetailsPanel(ctx?: unknown): void
    export function renderHistoryBar(ctx?: unknown): void
}

declare module '*/View/ui/editor/editorToolbar.js' {
    export const TOOLBAR_BUTTON_STATE_MAP: Array<{ id: string; key: string }>
    export function updateToolbarActiveStates(
        activeStates: Record<string, unknown>,
        ctx: unknown
    ): void
    export function setupToolbarButtons(editor: unknown, ctx: unknown): void
}

declare module '*/View/ui/editor/customStylesMenu.js' {
    export function setupCustomStylesUI(
        editor: unknown,
        ctx: unknown,
        onSelectionUpdate?: (activeStates: Record<string, unknown>, ctx: unknown) => void
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

declare module '*/View/ui/editor/index.js' {
    export * from '*/View/ui/editor/customStyleModal.js'
    export * from '*/View/ui/editor/customStylesMenu.js'
    export * from '*/View/ui/editor/editorToolbar.js'
    export * from '*/View/ui/editor/entityLinkModal.js'
    export * from '*/View/ui/editor/fontBrowserModal.js'
    export * from '*/View/ui/editor/mainEditor.js'
}
