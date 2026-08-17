const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
    getTranslations: () => ipcRenderer.invoke('get-translations'),
    getLocale: () => ipcRenderer.invoke('get-locale'),
    setLocale: locale => ipcRenderer.invoke('set-locale', locale),
    chooseFolder: () => ipcRenderer.invoke('choose-folder'),
    createProject: details => ipcRenderer.invoke('create-project', details),
    openProject: path => ipcRenderer.invoke('open-project', path),
    closeApp: () => ipcRenderer.invoke('close-app'),
    loadMainWindow: () => ipcRenderer.invoke('load-main-window'),
})
