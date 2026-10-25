const path = require('path')
const fs = require('fs')
const os = require('os')

const { atomicWriteJsonSync } = require('../../Utils/fsSecurity')

let _app = null
try {
    const electron = require('electron')
    if (electron && typeof electron === 'object' && electron.app) {
        _app = electron.app
    }
} catch {
    _app = null
}

class RecentProjectsService {
    /**
     * Optional setter to inject electron app instance or mock.
     * @param {any} appInstance
     */
    static setApp(appInstance) {
        _app = appInstance
    }

    static getRecentProjectsPath() {
        const poolSuffix = process.env.VITEST_POOL_ID ? `-${process.env.VITEST_POOL_ID}` : ''
        const userDataPath =
            _app && typeof _app.getPath === 'function'
                ? _app.getPath('userData')
                : path.join(os.tmpdir(), `sgp-test-userData${poolSuffix}`)
        return path.join(userDataPath, 'recent-projects.json')
    }

    static getRecentProjects() {
        const filePath = RecentProjectsService.getRecentProjectsPath()
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8')
                if (!data || !data.trim()) return []
                return JSON.parse(data)
            } catch (err) {
                console.error('Error reading recent projects:', err)
            }
        }
        return []
    }

    static saveRecentProject(projectPath, projectName) {
        const filePath = RecentProjectsService.getRecentProjectsPath()
        let projects = RecentProjectsService.getRecentProjects()
        projects = projects.filter(p => p.path !== projectPath)
        projects.unshift({
            name: projectName,
            path: projectPath,
            lastOpened: new Date().toISOString(),
        })
        if (projects.length > 10) projects = projects.slice(0, 10)

        try {
            atomicWriteJsonSync(filePath, projects)
        } catch (err) {
            console.error('Error saving recent projects:', err)
        }
    }
}

module.exports = RecentProjectsService
