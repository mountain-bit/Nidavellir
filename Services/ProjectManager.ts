import { Projekt } from '../Model/Projekt'
import type { EntitiesData, ProjectData } from '../types/ipc'

export class ProjectManager {
    private static instance: ProjectManager

    private currentProject: Projekt | null = null
    private currentProjectPath: string = ''

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

    public getProjectPath(): string {
        return this.currentProjectPath
    }

    public setProjectPath(projectPath: string): void {
        this.currentProjectPath = projectPath
    }

    public load(
        projectData: ProjectData,
        entities: EntitiesData = {},
        projectPath: string = ''
    ): Projekt {
        const projekt = Projekt.fromJSON(projectData, entities)
        this.currentProject = projekt
        this.currentProjectPath = projectPath
        return projekt
    }

    public clear(): void {
        this.currentProject = null
        this.currentProjectPath = ''
    }
}
