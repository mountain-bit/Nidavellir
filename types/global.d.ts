import type { OpenProjectResult } from './ipc'

declare global {
    interface IRecentProject {
        name: string
        path: string
        lastOpened: string
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        electronAPI: {
            closeApp: () => void
            loadMainWindow: () => void
            chooseFolder: () => Promise<{ canceled: boolean; path?: string }>
            createProject: (details: {
                id: string
                nazwa: string
                autor: string
                projectPath: string
            }) => Promise<{ success: boolean; path?: string; error?: string }>
            openProject: (path?: string) => Promise<OpenProjectResult>
            getRecentProjects: () => Promise<IRecentProject[]>
            getTranslations: () => Promise<Record<string, unknown>>
            getLocale: () => Promise<string>
            setLocale: (locale: string) => Promise<boolean>
            getSystemUsername: () => Promise<string>
        }
    }
}

export {}
