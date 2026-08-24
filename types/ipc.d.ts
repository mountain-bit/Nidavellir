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
