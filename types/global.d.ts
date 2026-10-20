import type {
    CreateEntityOptions,
    CreateEntityResult,
    EntityData,
    OpenProjectResult,
    ReadMarkdownResult,
    SaveEntityResult,
    SaveFullProjectPayload,
    SaveFullProjectResult,
    SaveMarkdownResult,
} from './ipc'

declare global {
    interface IRecentProject {
        name: string
        path: string
        lastOpened: string
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        currentProjectPath?: string
        electronAPI: {
            closeApp: () => void
            forceCloseApp?: () => Promise<void>
            onAppCloseRequested?: (callback: () => void) => () => void
            loadMainWindow: () => void
            loadStartWindow: () => void
            chooseFolder: () => Promise<{ canceled: boolean; path?: string }>
            createProject: (details: {
                id: string
                name?: string
                author?: string
                projectPath: string
            }) => Promise<{ success: boolean; path?: string; error?: string }>
            openProject: (path?: string) => Promise<OpenProjectResult>
            saveProject: (
                projectPath: string,
                projectData: Record<string, unknown>
            ) => Promise<{ success: boolean; path?: string; error?: string }>
            saveFullProject: (
                projectPath: string,
                data: SaveFullProjectPayload
            ) => Promise<SaveFullProjectResult>
            createEntity: (options: CreateEntityOptions) => Promise<CreateEntityResult>
            saveEntity: (
                projectPath: string,
                category: string,
                entityFolder: string,
                entityData: EntityData
            ) => Promise<SaveEntityResult>
            readMarkdownFile: (
                projectPath: string,
                relativePath: string
            ) => Promise<ReadMarkdownResult>
            saveMarkdownFile: (
                projectPath: string,
                relativePath: string,
                content: string
            ) => Promise<SaveMarkdownResult>
            getRecentProjects: () => Promise<IRecentProject[]>
            getTranslations: () => Promise<Record<string, unknown>>
            getLocale: () => Promise<string>
            setLocale: (locale: string) => Promise<boolean>
            getSystemUsername: () => Promise<string>
            getCurrentProject: () => Promise<string | null>
            getPathForFile: (file: unknown) => string
            importImage: (
                projectPath?: string | null,
                prefix?: string
            ) => Promise<{
                success: boolean
                canceled?: boolean
                relativePath?: string
                assetUrl?: string
                fileName?: string
                error?: string
            }>
            importImageFile: (
                projectPath?: string | null,
                filePath?: string,
                prefix?: string
            ) => Promise<{
                success: boolean
                canceled?: boolean
                relativePath?: string
                assetUrl?: string
                fileName?: string
                error?: string
            }>
            listImages: (projectPath?: string | null) => Promise<{
                success: boolean
                assets?: Array<{
                    relativePath: string
                    fileName: string
                    assetUrl: string
                    size?: number
                    modifiedAt?: number
                    extension?: string
                }>
                error?: string
                errorCode?: string
            }>
            saveEditedImage: (payload: {
                projectPath?: string | null
                dataUrl: string
                originalRelativePath?: string
                overwrite?: boolean
                prefix?: string
            }) => Promise<{
                success: boolean
                relativePath?: string
                assetUrl?: string
                fileName?: string
                error?: string
                errorCode?: string
            }>
            deleteAsset: (
                relativePath: string,
                projectPath?: string | null
            ) => Promise<{
                success: boolean
                relativePath?: string
                error?: string
                errorCode?: string
            }>
            renameAsset: (
                oldRelativePath: string,
                newName: string,
                projectPath?: string | null
            ) => Promise<{
                success: boolean
                oldRelativePath?: string
                newRelativePath?: string
                newFileName?: string
                assetUrl?: string
                error?: string
                errorCode?: string
            }>
            openAssetInFolder: (
                relativePath?: string,
                projectPath?: string | null
            ) => Promise<{
                success: boolean
                error?: string
                errorCode?: string
            }>
            exportProjectZip?: (payload?: {
                projectPath?: string
                includeImages?: boolean
                defaultName?: string
            }) => Promise<{
                success: boolean
                canceled?: boolean
                filePath?: string
                bytes?: number
                error?: string
            }>
            restoreProjectZip?: (payload?: {
                zipPath?: string
                targetDir?: string
            }) => Promise<OpenProjectResult>
        }
    }
}

export {}
