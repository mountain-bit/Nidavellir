import { Projekt } from '../Model/Projekt'
import type { EntitiesData, ProjectData } from '../types/ipc'

/**
 * ProjectManager — singleton przechowujący aktualnie otwarty projekt w Renderer Process.
 *
 * Odpowiedzialności:
 * - przechowuje referencję do bieżącego Projekt
 * - deserializuje dane IPC do instancji Projekt przez Projekt.fromJSON()
 *
 * Czego NIE robi:
 * - nie czyta plików
 * - nie wykonuje IPC
 * - nie zna szczegółów Electron API
 */
export class ProjectManager {
    private static instance: ProjectManager

    private currentProject: Projekt | null = null

    private constructor() {}

    public static getInstance(): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager()
        }
        return ProjectManager.instance
    }

    /** Zwraca aktualnie załadowany projekt lub null. */
    public getProject(): Projekt | null {
        return this.currentProject
    }

    /**
     * Deserializuje dane przesłane przez IPC i ustawia projekt jako bieżący.
     *
     * @param projectData - dane z project.json
     * @param entities - kolekcje encji z podfolderów projektu
     * @returns instancja Projekt
     */
    public load(projectData: ProjectData, entities: EntitiesData = {}): Projekt {
        const projekt = Projekt.fromJSON(projectData, entities)
        this.currentProject = projekt
        return projekt
    }

    /** Czyści bieżący projekt. */
    public clear(): void {
        this.currentProject = null
    }
}
