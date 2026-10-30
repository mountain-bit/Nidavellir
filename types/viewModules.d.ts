declare module '*/View/mockData.js' {
    import type { Feature } from '../Model/Feature'
    import type { Location } from '../Model/Location'
    import type { NPC } from '../Model/NPC'
    import type { NPC_Template } from '../Model/NPC_Template'
    import type { Paragraph } from '../Model/Paragraph'
    import type { Parameter } from '../Model/Parameter'
    import type { PlayerCharacter } from '../Model/PlayerCharacter'
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
        playerCharacter?: PlayerCharacter | null
        playerCharacters?: PlayerCharacter[]
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

declare module '*/View/ui/modals/npc/npcModal.js' {
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

declare module '*/View/ui/modals/npc/npcState.js' {
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

declare module '*/View/ui/modals/npc/templateMerger.js' {
    export { ITemplateMergeReport } from '*/View/ui/modals/npc/npcTraitsCounter.js'

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
    ): import('*/View/ui/modals/npc/npcTraitsCounter.js').ITemplateMergeReport
}

declare module '*/View/ui/modals/npc/npcTraitsCounter.js' {
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

declare module '*/View/ui/workspace/contextMenu.js' {
    export function setupSectionControlsAndContextMenu(ctx?: unknown): void
}

declare module '*/View/ui/drawer/drawerLists.js' {
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
    export function renderItemsList(ctx?: unknown): void
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

declare module '*/View/ui/modals/hero/heroModal.js' {
    export function setupHeroModal(ctx?: unknown): {
        open: (options?: unknown) => void
        close: (options?: unknown) => void
    }
    export function openHeroModal(options?: unknown): void
    export function closeHeroModal(options?: unknown): void
    export function hasUnsavedHeroChanges(): boolean
}

declare module '*/View/ui/detailsPanel/detailsPanel.js' {
    export function renderDetailsPanel(ctx?: unknown): void
    export function renderHistoryBar(ctx?: unknown): void
    export function renderStartNodeDetails(
        container: unknown,
        entity: unknown,
        item: unknown,
        ctx?: unknown,
        onRefresh?: unknown
    ): void
    export function renderItemDetails(
        container: unknown,
        entity: unknown,
        item: unknown,
        ctx?: unknown,
        onRefreshDetails?: unknown
    ): void
    export function renderItemsModule(
        container: unknown,
        entity: unknown,
        type?: string,
        ctx?: unknown,
        onRefreshDetails?: unknown
    ): void
}

declare module '*/View/ui/detailsPanel/heroReadOnlyDetails.js' {
    export function renderHeroReadOnlyDetails(
        container: unknown,
        entity: unknown,
        item: unknown,
        type?: string,
        ctx?: unknown
    ): void
}

declare module '*/View/ui/detailsPanel/itemDetails.js' {
    export function renderItemDetails(
        container: unknown,
        entity: unknown,
        item: unknown,
        ctx?: unknown,
        onRefreshDetails?: unknown
    ): void
    export function syncPlayerCharacterStartingInventory(
        itemEntity: unknown,
        inStarting: boolean,
        targetInvId?: string,
        ctx?: unknown
    ): void
}

declare module '*/View/ui/detailsPanel/item/index.js' {
    export function createItemHeaderSection(...args: unknown[]): HTMLElement
    export function createItemNameSection(...args: unknown[]): HTMLElement
    export function createItemCategorySection(...args: unknown[]): HTMLElement
    export function createItemInventorySection(...args: unknown[]): HTMLElement
    export function createItemTagsSection(...args: unknown[]): HTMLElement
    export function createItemModifiersSection(...args: unknown[]): HTMLElement
    export function createItemDescriptionSection(...args: unknown[]): HTMLElement
    export function createItemUsagesSection(...args: unknown[]): HTMLElement
    export function createItemExportSection(...args: unknown[]): HTMLElement
    export function syncPlayerCharacterStartingInventory(
        itemEntity: unknown,
        inStarting: boolean,
        targetInvId?: string,
        ctx?: unknown
    ): void
}

declare module '*/View/ui/detailsPanel/modules/itemsModule.js' {
    export function renderItemsModule(
        container: unknown,
        entity: unknown,
        type?: string,
        ctx?: unknown,
        onRefreshDetails?: unknown
    ): void
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

declare module '*/View/ui/common/npcAvatars.js' {
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

    export const FANTASY_AVATARS: readonly IFantasyAvatar[]
    export function getAvatarName(avatar: Partial<IFantasyAvatar> | null | undefined): string
    export function getAvatarById(id: string): IFantasyAvatar
    export function isCustomAvatarPath(avatarId: string): boolean
}

declare module '*/View/ui/common/htmlTemplates.js' {
    export function escapeHtml(str: unknown): string
    export function getTypeIconSvg(type: string, extraClasses?: string): string
    export const PRESET_COLORS: readonly string[]
    export function getTypeBadgeColor(type: string): string
    export function renderEmptyPlaceholderHtml(iconText?: string, message?: string): string
    export function renderColorPresetButtonsHtml(
        presetColors?: readonly string[] | string[],
        currentColor?: string
    ): string
}

declare module '*/View/ui/common/index.js' {
    export * from '*/View/ui/common/graphValidator.js'
    export * from '*/View/ui/common/htmlTemplates.js'
    export * from '*/View/ui/common/npcAvatars.js'
}

declare module '*/View/ui/assets/imageEditorModal.js' {
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

declare module '*/View/ui/assets/editor/imageEditorState.js' {
    export function createImageEditorState(): {
        isOpen: boolean
        sourceImg: HTMLImageElement | null
        originalRelativePath: string
        onSaveCallback: ((res: unknown) => void) | null
        transform: { rotation: number; flipH: boolean; flipV: boolean }
        crop: { x: number; y: number; width: number; height: number }
        isCroppingActive: boolean
        aspectRatioMode: string
        adjustments: Record<string, number>
        resize: { width: number; height: number }
        lockAspect: boolean
    }
    export function getNumericAspectRatio(mode: string): number | null
    export function getImageTransformedBounds(
        sourceImg: HTMLImageElement | null,
        rotation?: number
    ): { width: number; height: number }
    export function calculateAspectCrop(
        crop: { x: number; y: number; width: number; height: number },
        boundW: number,
        boundH: number,
        targetRatio: number | null
    ): { x: number; y: number; width: number; height: number }
}

declare module '*/View/ui/assets/editor/imageEditorCrop.js' {
    export function calculateCropMove(
        origCrop: { x: number; y: number; width: number; height: number },
        deltaX: number,
        deltaY: number,
        boundW: number,
        boundH: number
    ): { x: number; y: number; width: number; height: number }
    export function calculateCropResize(
        origCrop: { x: number; y: number; width: number; height: number },
        handle: string,
        deltaX: number,
        deltaY: number,
        boundW: number,
        boundH: number,
        targetRatio: number | null
    ): { x: number; y: number; width: number; height: number }
    export function updateCropOverlayDOM(
        cropOverlay: HTMLElement,
        canvas: HTMLCanvasElement,
        boundW: number,
        boundH: number,
        crop: { x: number; y: number; width: number; height: number }
    ): void
    export function setupCropInteractions(options: unknown): { cleanup: () => void }
}

declare module '*/View/ui/assets/editor/imageEditorCanvas.js' {
    export function renderCanvasPreview(
        canvas: HTMLCanvasElement | null,
        sourceImg: HTMLImageElement | null,
        transform?: { rotation: number; flipH: boolean; flipV: boolean } | null,
        adjustments?: unknown
    ): { boundW: number; boundH: number } | null
}

declare module '*/View/ui/assets/editor/imageEditorSave.js' {
    export function detectMimeAndQuality(relativePath?: string): {
        mimeType: string
        quality: number
    }
    export function saveEditedImageFile(options: unknown): Promise<unknown>
}

declare module '*/View/ui/assets/editor/imageEditorModal.js' {
    export function setupImageEditorModal(ctx: unknown): {
        open: (options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }) => void
        close: () => void
        setContext?: (ctx: unknown) => void
    }
    export function getImageEditorModal(ctx: unknown): {
        open: (options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }) => void
        close: () => void
        setContext?: (ctx: unknown) => void
    }
    export function openImageEditor(
        ctx: unknown,
        options: {
            src: string
            onSave?: (res: { relativePath: string; assetUrl: string; fileName: string }) => void
        }
    ): void
}

declare module '*/View/ui/assets/editor/index.js' {
    export * from '*/View/ui/assets/editor/imageEditorCanvas.js'
    export * from '*/View/ui/assets/editor/imageEditorCrop.js'
    export * from '*/View/ui/assets/editor/imageEditorModal.js'
    export * from '*/View/ui/assets/editor/imageEditorSave.js'
    export * from '*/View/ui/assets/editor/imageEditorState.js'
}

declare module '*/dist/Modules/ImageEditor/index.js' {
    export * from '../Modules/ImageEditor/index'
}

declare module '*/View/ui/modals/confirm/confirmModal.js' {
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

declare module '*/View/ui/workspace/workspace.js' {
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

declare module '*/View/ui/modals/hero/heroSectionControllers.js' {
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

declare module '*/View/ui/project/projectStateTracker.js' {
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

declare module '*/View/ui/project/projectSaver.js' {
    export function saveFullProject(
        ctx: unknown,
        options?: { isAutoSave?: boolean }
    ): Promise<{ success: boolean; canceled?: boolean; skipped?: boolean; error?: string }>
}

declare module '*/View/ui/project/autoSaveService.js' {
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

declare module '*/View/ui/common/graphValidator.js' {
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

declare module '*/View/ui/workspace/topBar.js' {
    export function updateTopBarUI(ctx: unknown): void
    export function runGraphValidation(ctx: unknown): unknown
    export function openPlaytestSimulator(ctx: unknown): void
    export function openExportModal(ctx: unknown): void
    export function openGameRules(ctx: unknown): Promise<void>
    export function initTopBar(ctx: unknown): void
    export function openQuickSearch(ctx: unknown): void
    export function centerGraphView(ctx: unknown): void
    export function openSettingsView(ctx: unknown): void
}

declare module '*/View/ui/workspace/quickSearch.js' {
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
        modifiers?: string[]
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

declare module '*/View/ui/assets/assetManagerModal.js' {
    export function openAssetManager(ctx: unknown): Promise<void>
    export function closeAssetManager(): void
    export function refreshAssetList(): Promise<void>
    export function selectAsset(asset: unknown): void
    export function renderFilteredGrid(): void
}

declare module '*/View/ui/assets/manager/assetRenameDialog.js' {
    export function promptRenameAsset(
        asset: { fileName: string; extension?: string } | null
    ): Promise<string | null>
}

declare module '*/View/ui/assets/manager/assetDeleteDialog.js' {
    export function confirmDeleteAsset(
        asset: { fileName: string; [key: string]: unknown } | null,
        usages?: Array<{ name: string; field: string; type?: string }>
    ): Promise<boolean>
}

declare module '*/View/ui/assets/manager/assetDetailPanel.js' {
    export function getIconForUsageType(type: string): string
    export function renderDetailPanel(asset: unknown, activeCtx?: unknown): void
}

declare module '*/View/ui/assets/manager/assetManagerGrid.js' {
    export function filterAndSortAssets(
        assets: Array<{ fileName: string; extension?: string; modifiedAt?: number; size?: number }>,
        options?: { query?: string; filterType?: string; sortMode?: string }
    ): Array<{ fileName: string; extension?: string; modifiedAt?: number; size?: number }>
    export function calculateTotalSize(assets: Array<{ size?: number }>): number
    export function renderManagerGrid(options: {
        grid: HTMLElement
        emptyState?: HTMLElement | null
        countBadge?: HTMLElement | null
        assets: Array<{ fileName: string; relativePath: string; [key: string]: unknown }>
        query?: string
        filterType?: string
        sortMode?: string
        selectedAsset?: unknown
        activeCtx?: unknown
        onSelect?: (asset: unknown) => void
    }): Array<{ fileName: string; [key: string]: unknown }>
}

declare module '*/View/ui/assets/manager/assetManagerModal.js' {
    export function openAssetManager(ctx: unknown): Promise<void>
    export function closeAssetManager(): void
    export function refreshAssetList(): Promise<void>
    export function selectAsset(asset: unknown): void
    export function renderFilteredGrid(): void
}

declare module '*/View/ui/assets/manager/index.js' {
    export * from '*/View/ui/assets/manager/assetDeleteDialog.js'
    export * from '*/View/ui/assets/manager/assetDetailPanel.js'
    export * from '*/View/ui/assets/manager/assetManagerGrid.js'
    export * from '*/View/ui/assets/manager/assetManagerModal.js'
    export * from '*/View/ui/assets/manager/assetRenameDialog.js'
}

declare module '*/View/ui/assets/assetPicker.js' {
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

declare module '*/View/ui/assets/common/assetPathResolver.js' {
    export function getActiveProjectPath(ctx?: unknown): string
    export function ensureActiveProjectPath(ctx?: unknown): Promise<string>
}

declare module '*/View/ui/assets/common/assetDropZone.js' {
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

declare module '*/View/ui/assets/common/assetCardTemplate.js' {
    export function formatFileSize(bytes: number): string
    export function createAssetCardElement(options: {
        asset: {
            relativePath: string
            fileName: string
            size?: number
            modifiedAt?: number
            assetUrl?: string
        }
        isSelected?: boolean
        usagesCount?: number | null
        showSize?: boolean
        onClick?: (e: MouseEvent) => void
        onDblClick?: (e: MouseEvent) => void
    }): HTMLDivElement
}

declare module '*/View/ui/assets/common/index.js' {
    export * from '*/View/ui/assets/common/assetCardTemplate.js'
    export * from '*/View/ui/assets/common/assetDropZone.js'
    export * from '*/View/ui/assets/common/assetPathResolver.js'
}

declare module '*/View/ui/assets/picker/assetPickerGrid.js' {
    export function filterAssetsByQuery(
        assets: Array<{ fileName: string; relativePath: string }>,
        query?: string
    ): Array<{ fileName: string; relativePath: string }>
    export function renderPickerGrid(options: {
        grid: HTMLElement
        emptyState?: HTMLElement | null
        assets: Array<{ fileName: string; relativePath: string; [key: string]: unknown }>
        query?: string
        selectedAsset?: { fileName: string; relativePath: string } | null
        onSelect?: (asset: { fileName: string; relativePath: string }) => void
        onConfirm?: (asset: { fileName: string; relativePath: string }) => void
    }): Array<{ fileName: string; relativePath: string }>
}

declare module '*/View/ui/assets/picker/assetPickerModal.js' {
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
}

declare module '*/View/ui/assets/picker/index.js' {
    export * from '*/View/ui/assets/picker/assetPickerGrid.js'
    export * from '*/View/ui/assets/picker/assetPickerModal.js'
}

declare module '*/View/ui/modals/playtest/playtestModal.js' {
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

declare module '*/dist/Utils/toast.js' {
    export { showToast, toast } from '../Utils/ui/toast'
}

declare module '*/dist/Utils/translate.js' {
    export * from '../Utils/i18n/translate'
}

declare module '*/dist/ViewModel/MainWindowViewModel.js' {
    import type { ItemExportService as ItemExportServiceClass } from '../Services/export/ItemExportService'

    export const ItemExportService: typeof ItemExportServiceClass
    export type ItemExportService = ItemExportServiceClass
    export * from '../ViewModel/MainWindowViewModel'
}

declare module '*/View/ui/detailsPanel/combat/combatHeader.js' {
    import type { Combat } from '../Model/Combat'
    import type { Paragraph } from '../Model/Paragraph'

    export function renderCombatBadgeHtml(hasCombat: boolean): string
    export function renderCombatHeaderHtml(hasCombat: boolean): string
    export function renderCombatHeader(
        container?: HTMLElement | null,
        entity?: Paragraph | null,
        combat?: Combat | null,
        ctx?: unknown,
        onFullRefresh?: () => void,
        onModify?: () => void
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/combat/combatOpponentsSection.js' {
    import type { Combat } from '../Model/Combat'
    import type { Paragraph } from '../Model/Paragraph'

    export function generateOpponentId(): string
    export function populateNpcSelect(select: HTMLSelectElement, availableNpcs?: unknown[]): void
    export function resolveInitialOpponentStats(
        npc: unknown,
        availableTraits?: unknown[]
    ): Record<string, unknown>
    export function renderOpponentsHeaderHtml(count?: number): string
    export function renderEmptyOpponentsListHtml(): string
    export function createOpponentCard(
        opp: unknown,
        combat: unknown,
        ctx: unknown,
        safeModify: () => void,
        safeRefresh: () => void
    ): HTMLElement
    export function renderCombatOpponentsSection(
        container?: HTMLElement | null,
        entity?: Paragraph | null,
        combat?: Combat | null,
        ctx?: unknown,
        onModify?: () => void,
        onFullRefresh?: () => void
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/combat/combatTraitsSection.js' {
    import type { Combat } from '../Model/Combat'

    export function renderTraitsHeaderHtml(visibleCount?: number, totalCount?: number): string
    export function renderEmptyTraitsHtml(): string
    export function renderEmptyTraitsListHtml(): string
    export function renderTraitChipHtml(trait: unknown, isVisible: boolean): string
    export function renderTraitsChipsListHtml(
        traits?: unknown[],
        visibleTraitNames?: string[]
    ): string
    export function syncOpponentsBaseValuesForTrait(
        traitId: string,
        traitDef: unknown,
        opponents?: unknown[],
        allNpcs?: unknown[],
        combat?: unknown
    ): void
    export function renderCombatTraitsSection(
        container?: HTMLElement | null,
        combat?: Combat | null,
        availableTraits?: unknown[],
        allNpcs?: unknown[],
        onChange?: () => void
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/combat/combatOutcomesSection.js' {
    import type { Combat } from '../Model/Combat'
    import type { Paragraph } from '../Model/Paragraph'

    export function renderEmptyOutcomesListHtml(): string
    export function renderOutcomesHeaderHtml(count?: number): string
    export function populateTargetParagraphSelect(
        select: HTMLSelectElement,
        allParagraphs?: Paragraph[],
        currentTargetId?: string
    ): void
    export function calculateNewOutcomeNodePosition(
        sourceParagraph?: Paragraph | null,
        outcomeIndex?: number
    ): { x: number; y: number }
    export function renderCombatOutcomesSection(
        container?: HTMLElement | null,
        entity?: Paragraph | null,
        combat?: Combat | null,
        allParagraphs?: Paragraph[],
        ctx?: unknown,
        onModify?: (() => void) | null,
        onFullRefresh?: (() => void) | null
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/item/itemHeaderSection.js' {
    export function renderItemHeaderHtml(itemId?: string): string
    export function createItemHeaderSection(
        entity?: unknown,
        itemId?: string,
        item?: unknown,
        ctx?: unknown,
        onRefreshDetails?: (ctx?: unknown) => void
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/item/itemNameSection.js' {
    export function checkItemNameCollision(
        val: string,
        currentItemId: string,
        allItems?: unknown[]
    ): boolean
    export function renderItemNameHtml(itemName?: string): string
    export function createItemNameSection(
        entity?: unknown,
        itemId?: string,
        itemName?: string,
        item?: unknown,
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemCategorySection.js' {
    export interface IItemCategoryOption {
        id: string
        key: string
        fallback: string
        readonly label: string
    }
    export const ITEM_CATEGORIES: IItemCategoryOption[]
    export function getItemCategories(): Array<{ id: string; label: string }>
    export function renderItemCategoryHtml(config?: unknown): string
    export function createItemCategorySection(
        entity?: unknown,
        config?: unknown,
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemInventorySection.js' {
    export function formatSlotSummary(slotSize: number | string): string
    export function syncPlayerCharacterStartingInventory(
        itemEntity: unknown,
        inStarting: boolean,
        targetInvId?: string,
        ctx?: unknown
    ): void
    export function renderItemInventoryHtml(config?: unknown, heroInventories?: unknown[]): string
    export function createItemInventorySection(
        entity?: unknown,
        config?: unknown,
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemTagsSection.js' {
    export function renderItemTagsHtml(tagCount?: number): string
    export function renderTagChipHtml(name?: string, removeTitle?: string): string
    export function createTagChip(
        tObj: unknown,
        onRemove?: (tId: string, tName: string) => void
    ): HTMLSpanElement
    export function createItemTagsSection(
        entity?: unknown,
        currentTags?: unknown[],
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemModifiersSection.js' {
    export function renderItemModifiersHtml(modifiersCount?: number): string
    export function renderModifierCardHtml(mod?: unknown): string
    export function createModifierCard(
        mod: unknown,
        onRemove?: (id?: string) => void
    ): HTMLDivElement
    export function createItemModifiersSection(
        entity?: unknown,
        currentModifiers?: unknown[],
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemDescriptionSection.js' {
    export function renderItemDescriptionHtml(summary?: string): string
    export function createItemDescriptionSection(
        descObj?: unknown,
        summary?: string,
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemUsagesSection.js' {
    import type { Paragraph } from '../Model/Paragraph'

    export function findItemUsages(
        itemId?: string,
        itemName?: string,
        paragraphs?: unknown[]
    ): Array<{ paragraph: Paragraph | unknown; action: string; quantity: number }>
    export function getActionBadgeConfig(
        action?: string,
        quantity?: number
    ): { badgeClass: string; badgeLabel: string }
    export function renderItemUsagesHtml(usagesCount?: number): string
    export function renderUsageItemHtml(usage: unknown): string
    export function createUsageRow(
        usage: unknown,
        ctx?: unknown,
        onRefreshDetails?: (ctx?: unknown) => void
    ): HTMLDivElement
    export function createItemUsagesSection(
        entity?: unknown,
        itemId?: string,
        itemName?: string,
        ctx?: unknown,
        onRefreshDetails?: (ctx?: unknown) => void
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/itemExportSection.js' {
    export function getProjectName(ctx?: unknown): string
    export function renderItemExportHtml(): string
    export function createItemExportSection(
        entity?: unknown,
        itemName?: string,
        ctx?: unknown
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/item/index.js' {
    export * from '*/View/ui/detailsPanel/item/itemCategorySection.js'
    export * from '*/View/ui/detailsPanel/item/itemDescriptionSection.js'
    export * from '*/View/ui/detailsPanel/item/itemExportSection.js'
    export * from '*/View/ui/detailsPanel/item/itemHeaderSection.js'
    export * from '*/View/ui/detailsPanel/item/itemInventorySection.js'
    export * from '*/View/ui/detailsPanel/item/itemModifiersSection.js'
    export * from '*/View/ui/detailsPanel/item/itemNameSection.js'
    export * from '*/View/ui/detailsPanel/item/itemTagsSection.js'
    export * from '*/View/ui/detailsPanel/item/itemUsagesSection.js'
}

declare module '*/View/ui/detailsPanel/choice/choiceActionsSection.js' {
    import type { Choice } from '../Model/Choice'

    export interface IChoiceActionsSectionParams {
        choice?: Choice | unknown
        ctx?: unknown
        onRefreshDetails?: (ctx?: unknown) => void
        confirmFn?: (message?: string) => boolean
    }

    export function handleShowGraph(choice?: unknown, ctx?: unknown): void
    export function handleDeleteChoice(params?: IChoiceActionsSectionParams): boolean
    export function createChoiceActionsSection(params?: IChoiceActionsSectionParams): HTMLElement
}

declare module '*/View/ui/detailsPanel/choice/choiceAddDropdown.js' {
    export interface IChoiceFeatureOption {
        value: string
        labelKey: string
        defaultLabel: string
    }

    export interface IChoiceFeatureGroup {
        groupKey: string
        defaultGroupLabel: string
        options: readonly IChoiceFeatureOption[]
    }

    export const CHOICE_FEATURE_OPTIONS: readonly IChoiceFeatureGroup[]

    export function renderChoiceAddDropdownOptionsHtml(
        groups?: readonly IChoiceFeatureGroup[]
    ): string

    export function handleFeatureSelection(
        selectEl: HTMLSelectElement | null | undefined,
        onSelectFeature?: (action: string) => void
    ): void

    export function createChoiceAddDropdown(
        onSelectFeatureOrOptions?:
            ((action: string) => void) | { onSelectFeature?: (action: string) => void }
    ): HTMLElement
}

declare module '*/View/ui/detailsPanel/choice/choiceCombatSection.js' {
    import type { Choice } from '../Model/Choice'
    import type { Combat } from '../Model/Combat'
    import type { Paragraph } from '../Model/Paragraph'

    export interface IChoiceCombatData {
        fromP: Paragraph | unknown
        combat: Combat | unknown
        opponents: Array<unknown>
        combatName: string
        pTitle: string
    }

    export function resolveChoiceCombatData(
        choice?: Choice | unknown,
        ctx?: unknown
    ): IChoiceCombatData | null

    export function renderCombatOpponentsListHtml(opponents?: Array<unknown>): string

    export function handleGoToCombat(fromP?: unknown, ctx?: unknown): void

    export function createChoiceCombatSection(
        choice?: Choice | unknown,
        ctx?: unknown
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/choice/choiceConditionSection.js' {
    import type { Choice } from '../Model/Choice'
    import type { Condition } from '../Model/Condition'

    export type ChoiceConditionType = 'none' | 'item' | 'stat' | 'tag' | 'text'

    export interface IChoiceConditionSection {
        sectionEl: HTMLElement
        renderCondBody: () => void
        getConditionType: () => ChoiceConditionType
        setConditionType: (type: ChoiceConditionType) => void
        buildConditionObject: () => Condition | null
    }

    export interface IChoiceConditionSectionParams {
        choice?: Choice | unknown
        onSave?: () => void
        onRemove?: () => void
    }

    export function detectConditionType(condition?: unknown): ChoiceConditionType
    export function createDefaultConditionForType(
        type: ChoiceConditionType,
        existingCond?: unknown
    ): Condition | null
    export function buildConditionFromInputs(
        type: ChoiceConditionType,
        containerEl?: HTMLElement | null,
        existingCond?: unknown
    ): Condition | null
    export function renderItemConditionBodyHtml(cond?: unknown): string
    export function renderStatConditionBodyHtml(cond?: unknown): string
    export function renderTagConditionBodyHtml(cond?: unknown): string
    export function renderTextConditionBodyHtml(cond?: unknown): string
    export function createChoiceConditionSection(
        params?: IChoiceConditionSectionParams
    ): IChoiceConditionSection
}

declare module '*/View/ui/detailsPanel/choice/choiceCostsSection.js' {
    import type { Choice, IChoiceModifier } from '../Model/Choice'

    export interface IChoiceCostsSection {
        sectionEl: HTMLElement
        renderCosts: () => void
        promptAddCost: () => IChoiceModifier | null
    }

    export interface IChoiceCostsSectionParams {
        choice?: Choice | unknown
        onSave?: () => void
        onRemoveAll?: () => void
        promptFn?: (message: string, defaultValue?: string) => string | null
        confirmFn?: (message: string) => boolean
    }

    export function getChoiceCosts(choice?: unknown): IChoiceModifier[]
    export function setChoiceCosts(choice: unknown, costs: IChoiceModifier[]): void
    export function addChoiceCost(choice: unknown, cost: IChoiceModifier): void
    export function removeCostAtIndex(choice: unknown, index: number, onSave?: () => void): boolean
    export function renderCostItemHtml(cost: unknown, index: number): string
    export function renderCostsListHtml(costs?: unknown[]): string
    export function promptAddCost(params: {
        choice?: unknown
        onSave?: () => void
        renderCosts?: () => void
        sectionEl?: HTMLElement | null
        promptFn?: (message: string, defaultValue?: string) => string | null
        confirmFn?: (message: string) => boolean
    }): IChoiceModifier | null
    export function createChoiceCostsSection(
        params?: IChoiceCostsSectionParams
    ): IChoiceCostsSection
}

declare module '*/View/ui/detailsPanel/choice/choiceDatalists.js' {
    export function extractItemNames(ctx?: unknown): string[]
    export function extractStatNames(ctx?: unknown): string[]
    export function extractTagNames(ctx?: unknown): string[]
    export function renderDatalistHtml(id: string, options?: string[]): string
    export function renderChoiceDatalistsHtml(options?: {
        items?: string[]
        stats?: string[]
        tags?: string[]
    }): string
    export function ensureChoiceDatalists(
        container?: HTMLElement | null,
        ctx?: unknown,
        options?: { forceUpdate?: boolean }
    ): HTMLElement | null
}

declare module '*/View/ui/detailsPanel/choice/choiceDiceSection.js' {
    import type { Choice, ChoiceDiceCheck, DiceBranch } from '../Model/Choice'

    export interface IChoiceDiceSection {
        sectionEl: HTMLElement
        renderBranches: () => void
        syncDiceInputs: () => void
    }

    export interface IChoiceDiceSectionParams {
        choice?: Choice | unknown
        ctx?: unknown
        onSave?: () => void
        onRemove?: () => void
    }

    export function getChoiceDiceCheck(choice?: unknown): ChoiceDiceCheck | null
    export function setChoiceDiceCheck(choice: unknown, diceCheck: ChoiceDiceCheck | null): void
    export function getDiceCheckBranches(choice?: unknown): DiceBranch[]
    export function addDiceCheckBranch(choice: unknown, branch: DiceBranch): void
    export function removeDiceCheckBranch(
        choice: unknown,
        index: number,
        onSave?: () => void
    ): boolean
    export function updateDiceCheckBranch(
        choice: unknown,
        index: number,
        patch: Partial<DiceBranch>,
        onSave?: () => void
    ): boolean
    export function renderTargetOptionsHtml(
        paragraphs?: unknown[],
        selectedTargetId?: string
    ): string
    export function renderBranchItemHtml(
        branch: unknown,
        index: number,
        paragraphs?: unknown[]
    ): string
    export function renderBranchesListHtml(branches?: unknown[], paragraphs?: unknown[]): string
    export function syncDiceInputs(sectionEl?: HTMLElement | null, choice?: unknown): void
    export function createChoiceDiceSection(params?: IChoiceDiceSectionParams): IChoiceDiceSection
}

declare module '*/View/ui/detailsPanel/choice/choiceHeader.js' {
    import type { Choice } from '../Model/Choice'
    import type { Paragraph } from '../Model/Paragraph'

    export interface IChoiceEndpoints {
        fromId: string
        toId: string
        fromP: Paragraph | null
        toP: Paragraph | null
        fromTitle: string
        toTitle: string
        isCombat: boolean
    }

    export interface IChoiceHeaderResult {
        headerMod: HTMLElement
        nameMod: HTMLElement
        nodesMod: HTMLElement
        getNameInput: () => HTMLInputElement | null
    }

    export function resolveChoiceEndpoints(choice?: unknown, ctx?: unknown): IChoiceEndpoints
    export function renderChoiceTypeBadgeHtml(isCombat: boolean): string
    export function renderChoiceHeaderSectionHtml(item?: unknown, isCombat?: boolean): string
    export function renderChoiceNameSectionHtml(choiceName?: string): string
    export function renderChoiceNodesSectionHtml(
        fromTitle: string,
        toTitle: string,
        hasFromP?: boolean,
        hasToP?: boolean
    ): string
    export function handleSaveChoiceName(params: {
        choice?: unknown
        nameInput?: HTMLInputElement | null
        nameError?: HTMLElement | null
        fromP?: unknown
        isCombat?: boolean
        ctx?: unknown
        onRefreshDetails?: (ctx?: unknown) => void
    }): boolean
    export function handleSelectNode(node?: unknown, ctx?: unknown): void
    export function createChoiceHeader(
        choice?: Choice | unknown,
        item?: unknown,
        ctx?: unknown,
        onRefreshDetails?: (ctx?: unknown) => void
    ): IChoiceHeaderResult
}

declare module '*/View/ui/detailsPanel/choice/choiceRewardsSection.js' {
    import type { Choice, IChoiceModifier } from '../Model/Choice'

    export interface IChoiceRewardsSection {
        sectionEl: HTMLElement
        renderRewards: () => void
        promptAddReward: () => IChoiceModifier | null
    }

    export interface IChoiceRewardsSectionParams {
        choice?: Choice | unknown
        onSave?: () => void
        onRemoveAll?: () => void
        promptFn?: (message: string, defaultValue?: string) => string | null
        confirmFn?: (message: string) => boolean
    }

    export function getChoiceRewards(choice?: unknown): IChoiceModifier[]
    export function setChoiceRewards(choice: unknown, rewards: IChoiceModifier[]): void
    export function addChoiceReward(choice: unknown, reward: IChoiceModifier): void
    export function removeRewardAtIndex(
        choice: unknown,
        index: number,
        onSave?: () => void
    ): boolean
    export function renderRewardItemHtml(reward: unknown, index: number): string
    export function renderRewardsListHtml(rewards?: unknown[]): string
    export function promptAddReward(params: {
        choice?: unknown
        onSave?: () => void
        renderRewards?: () => void
        sectionEl?: HTMLElement | null
        promptFn?: (message: string, defaultValue?: string) => string | null
        confirmFn?: (message: string) => boolean
    }): IChoiceModifier | null
    export function createChoiceRewardsSection(
        params?: IChoiceRewardsSectionParams
    ): IChoiceRewardsSection
}

declare module '*/View/ui/graph/index.js' {
    export function getStoryGraphInstance(): unknown
    export function setStoryGraphInstance(instance: unknown): void
    export function centerStoryGraph(ctx?: unknown, animate?: boolean): void
    export function centerGraph(ctx?: unknown, animate?: boolean): void
    export function renderStoryGraph(forceRebuild?: boolean): void
    export function showStoryGraph(ctx: unknown, forceRebuild?: boolean): void
    export function showGraph(ctx: unknown, forceRebuild?: boolean): void
    export function setupGraphDropZone(
        canvasContainer: HTMLElement,
        ctx: unknown,
        getGraphInstance: () => unknown
    ): void
    export function setupGraphZoomControls(ctx: unknown, getGraphInstance: () => unknown): void
}

declare module '*/View/ui/graph/storyGraphController.js' {
    export * from '*/View/ui/graph/index.js'
}

declare module '*/View/ui/modals/npc/formulaEvaluator.js' {
    export function parseStatValueAsNumber(val: unknown): number | null
    export function evaluateFormula(
        formula: string,
        statsMap: Record<string, number>
    ): number | null
}

declare module '*/View/ui/modals/npc/npcDraggable.js' {
    export function initDraggable(modal: HTMLElement, handle?: HTMLElement): void
    export function initResizable(modal: HTMLElement): void
    export function clampModalPosition(modal: HTMLElement): void
}

declare module '*/View/ui/modals/npc/index.js' {
    export * from '*/View/ui/modals/npc/npcModal.js'
}

declare module '*/View/ui/modals/hero/index.js' {
    export * from '*/View/ui/modals/hero/heroModal.js'
}

declare module '*/View/ui/modals/confirm/index.js' {
    export * from '*/View/ui/modals/confirm/confirmModal.js'
}

declare module '*/View/ui/modals/playtest/index.js' {
    export * from '*/View/ui/modals/playtest/playtestModal.js'
}

declare module '*/View/ui/modals/export/exportModal.js' {
    export function openExportModal(ctx: unknown): void
}

declare module '*/View/ui/modals/export/exportStyleService.js' {
    export const BUILT_IN_STYLES: unknown[]
    export function getAllStyles(): unknown[]
    export function getStyleById(id: string): unknown
    export function saveCustomStyle(style: unknown): unknown
    export function deleteCustomStyle(id: string): boolean
}

declare module '*/View/ui/modals/export/gamebookCompiler.js' {
    export function extractText(entityOrDesc: unknown, ctx?: unknown): string
    export function compileGamebook(options: unknown): Promise<unknown>
}

declare module '*/View/ui/modals/export/index.js' {
    export * from '*/View/ui/modals/export/exportModal.js'
    export * from '*/View/ui/modals/export/exportStyleService.js'
    export * from '*/View/ui/modals/export/gamebookCompiler.js'
}

declare module '*/View/ui/modals/styleEditor/styleEditorModal.js' {
    export function openStyleEditorModal(
        initialStyleId?: string,
        onSaved?: (style: unknown) => void
    ): void
    export function closeStyleEditorModal(): void
}

declare module '*/View/ui/modals/styleEditor/index.js' {
    export * from '*/View/ui/modals/styleEditor/styleEditorModal.js'
}

declare module '*/View/ui/modals/index.js' {
    export * from '*/View/ui/modals/confirm/confirmModal.js'
    export * from '*/View/ui/modals/export/exportModal.js'
    export * from '*/View/ui/modals/hero/heroModal.js'
    export * from '*/View/ui/modals/npc/npcModal.js'
    export * from '*/View/ui/modals/playtest/playtestModal.js'
    export * from '*/View/ui/modals/styleEditor/styleEditorModal.js'
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare module '*/main/services/ExportService.js' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ExportService: any
    export default ExportService
}

declare module '*/View/ui/drawer/drawerSearch.js' {
    export function getActiveDrawerCategory(): string
    export function setActiveDrawerCategory(category: string): void
    export function renderDrawerSearchResults(ctx: unknown, query?: string | null): void
    export function setupDrawerSearch(ctx: unknown): void
    export function setupSectionSearchInputs(ctx: unknown): void
}

declare module '*/View/ui/detailsPanel/modules/entityConfigModules.js' {
    export function renderParagraphNumberModule(
        container: HTMLElement,
        entity: unknown,
        type: string,
        ctx: unknown
    ): void
    export function renderParagraphRoleModule(
        container: HTMLElement,
        entity: unknown,
        type: string,
        ctx: unknown,
        onRefresh?: () => void
    ): void
    export function renderHeaderModule(
        container: HTMLElement,
        item: unknown,
        type: string,
        ctx: unknown
    ): void
}
