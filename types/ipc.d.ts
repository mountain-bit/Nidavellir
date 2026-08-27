export interface ProjectData {
    id: string
    nazwa: string
    autor: string
    wersja: string
    sciezkiOpisow: string[]
    sciezkiDanych: string[]
}

export type EntityData = Record<string, unknown>

export interface EntitiesData {
    Lokacje?: EntityData[]
    NPC?: EntityData[]
    Przedmioty?: EntityData[]
    Paragrafy?: EntityData[]
    Templates?: EntityData[]
    KlasyPostaci?: EntityData[]
    Zasady?: EntityData[]
    PostacGracza?: EntityData[]
    [folder: string]: EntityData[] | undefined
}

export interface SerializedProject {
    project: ProjectData
    entities: EntitiesData
}

export interface OpenProjectResult {
    success: boolean
    path?: string
    project?: ProjectData
    entities?: EntitiesData
    error?: string
}

export interface CreateEntityOptions {
    projectPath: string
    category: string
    entityData: EntityData
    folderName?: string
    createDescriptionPaths?: boolean
}

export interface CreateEntityResult {
    success: boolean
    entity?: EntityData
    entityPath?: string
    warning?: string
    error?: string
}

export interface ReadMarkdownResult {
    success: boolean
    content?: string
    isVirtual?: boolean
    error?: string
}

export interface SaveMarkdownResult {
    success: boolean
    recreated?: boolean
    warning?: string
    error?: string
}

export interface SaveEntityResult {
    success: boolean
    error?: string
}
