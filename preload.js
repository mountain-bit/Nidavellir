const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
    getTranslations: () => ipcRenderer.invoke('get-translations'),
    getLocale: () => ipcRenderer.invoke('get-locale'),
    setLocale: locale => ipcRenderer.invoke('set-locale', locale),
    chooseFolder: () => ipcRenderer.invoke('choose-folder'),
    createProject: details => ipcRenderer.invoke('create-project', details),
    openProject: path => ipcRenderer.invoke('open-project', path),
    saveProject: (projectPath, projectData) =>
        ipcRenderer.invoke('save-project', { projectPath, projectData }),
    createEntity: options => ipcRenderer.invoke('create-entity', options),
    saveEntity: (projectPath, category, entityFolder, entityData) =>
        ipcRenderer.invoke('save-entity', { projectPath, category, entityFolder, entityData }),
    readMarkdownFile: (projectPath, relativePath) =>
        ipcRenderer.invoke('read-markdown-file', { projectPath, relativePath }),
    saveMarkdownFile: (projectPath, relativePath, content) =>
        ipcRenderer.invoke('save-markdown-file', { projectPath, relativePath, content }),
    closeApp: () => ipcRenderer.invoke('close-app'),
    loadMainWindow: () => ipcRenderer.invoke('load-main-window'),
    loadStartWindow: () => ipcRenderer.invoke('load-start-window'),
    getSystemUsername: () => ipcRenderer.invoke('get-system-username'),
    getCurrentProject: () => ipcRenderer.invoke('get-current-project'),
    getPathForFile: file => {
        if (webUtils && typeof webUtils.getPathForFile === 'function') {
            try {
                const p = webUtils.getPathForFile(file)
                if (p) return p
            } catch {
                // ignore
            }
        }
        return file && file.path ? file.path : ''
    },
    importImage: (projectPath, prefix) =>
        ipcRenderer.invoke('asset-import-image', { projectPath, prefix }),
    importImageFile: (projectPath, filePath, prefix) =>
        ipcRenderer.invoke('asset-import-file', { projectPath, filePath, prefix }),
    listImages: projectPath => ipcRenderer.invoke('asset-list-images', { projectPath }),
    saveEditedImage: payload => ipcRenderer.invoke('asset-save-edited-image', payload),
})
