export interface IProjectEditorData {
    customStyles?: unknown[]
    customFonts?: unknown[]
}

export interface IProjectData {
    id: string
    name?: string
    author?: string
    version?: string
    descriptionPaths?: string[]
    dataPaths?: string[]
    editor?: IProjectEditorData
    customStyles?: unknown[]
    customFonts?: unknown[]
}
export type ProjectData = IProjectData

export type EntityData = Record<string, unknown>

export interface IEntitiesData {
    Locations?: EntityData[]
    NPC?: EntityData[]
    Items?: EntityData[]
    Paragraphs?: EntityData[]
    Templates?: EntityData[]
    CharacterClasses?: EntityData[]
    Rules?: EntityData[]
    PlayerCharacter?: EntityData[]
    [folder: string]: EntityData[] | undefined
}
export type EntitiesData = IEntitiesData

export interface ISerializedProject {
    project: IProjectData
    entities: IEntitiesData
}
export type SerializedProject = ISerializedProject

export interface IOpenProjectResult {
    success: boolean
    canceled?: boolean
    path?: string
    project?: IProjectData
    entities?: IEntitiesData
    error?: string
}
export type OpenProjectResult = IOpenProjectResult

export interface ICreateEntityOptions {
    projectPath: string
    category: string
    entityData: EntityData
    folderName?: string
    createDescriptionPaths?: boolean
}
export type CreateEntityOptions = ICreateEntityOptions

export interface ICreateEntityResult {
    success: boolean
    entity?: EntityData
    entityPath?: string
    warning?: string
    error?: string
}
export type CreateEntityResult = ICreateEntityResult

export interface IReadMarkdownResult {
    success: boolean
    content?: string
    isVirtual?: boolean
    error?: string
}
export type ReadMarkdownResult = IReadMarkdownResult

export interface ISaveMarkdownResult {
    success: boolean
    recreated?: boolean
    warning?: string
    error?: string
}
export type SaveMarkdownResult = ISaveMarkdownResult

export interface ISaveEntityResult {
    success: boolean
    error?: string
}
export type SaveEntityResult = ISaveEntityResult

export interface ISaveFullProjectPayload {
    project?: Record<string, unknown>
    paragraphs?: unknown[]
    scenes?: unknown[]
    entities?: Record<string, unknown[]>
    files?: Record<string, string>
    graph?: Record<string, unknown>
}
export type SaveFullProjectPayload = ISaveFullProjectPayload

export interface ISaveFullProjectResult {
    success: boolean
    path?: string
    error?: string
}
export type SaveFullProjectResult = ISaveFullProjectResult
