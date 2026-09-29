declare module '*/View/mockData.js' {
    import type { Feature } from '../Model/Feature'
    import type { Location } from '../Model/Location'
    import type { NPC } from '../Model/NPC'
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

    export function openNpcModal(): void
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
