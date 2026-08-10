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
            createProject: () => Promise<{ success: boolean; path?: string }>
            openProject: (
                path?: string
            ) => Promise<{ success: boolean; path?: string; error?: string }>
            getRecentProjects: () => Promise<IRecentProject[]>
            getTranslations: () => Promise<Record<string, unknown>>
            getLocale: () => Promise<string>
            setLocale: (locale: string) => Promise<boolean>
        }
    }
}

export {}
