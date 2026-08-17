/** Typy danych przesyłanych przez IPC między Main Process a Renderer */

/** Surowe dane projektu z project.json */
export interface ProjectData {
    id: string
    nazwa: string
    autor: string
    wersja: string
    sciezkiOpisow: string[]
    sciezkiDanych: string[]
}

/** Surowe dane pojedynczego elementu (np. Lokacja, NPC, Przedmiot itp.) */
export type EntityData = Record<string, unknown>

/** Kolekcja encji pogrupowanych według nazwy folderu */
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

/** Zserializowany projekt przekazywany przez IPC do Renderera */
export interface SerializedProject {
    project: ProjectData
    entities: EntitiesData
}

/** Wynik operacji open-project zwracany przez Main Process */
export interface OpenProjectResult {
    success: boolean
    path?: string
    project?: ProjectData
    entities?: EntitiesData
    error?: string
}
