declare module '*/View/mockData.js' {
    import type { Location } from '../Model/Location'
    import type { NPC } from '../Model/NPC'
    import type { Paragraph } from '../Model/Paragraph'
    import type { Project } from '../Model/Project'
    import type { Scene } from '../Model/Scene'
    import type { Stat } from '../Model/Stat'
    import type { Tag } from '../Model/Tag'
    import type { MainWindowViewModel } from '../ViewModel/MainWindowViewModel'

    export interface IProjectDataState {
        files: Record<string, string>
        projectTags: Tag[]
        projectCharacters: NPC[]
        projectLocations: Location[]
        projectStats: Stat[]
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
