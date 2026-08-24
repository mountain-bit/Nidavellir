import { Projekt } from '../Model/Projekt'
import type { EntitiesData, ProjectData } from '../types/ipc'

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

    public getProject(): Projekt | null {
        return this.currentProject
    }

    public load(projectData: ProjectData, entities: EntitiesData = {}): Projekt {
        const projekt = Projekt.fromJSON(projectData, entities)
        this.currentProject = projekt
        return projekt
    }

    public clear(): void {
        this.currentProject = null
    }
}
