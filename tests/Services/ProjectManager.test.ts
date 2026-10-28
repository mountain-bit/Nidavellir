import { beforeEach, describe, expect, it } from 'vitest'

import { ProjectManager } from '../../Services/project/ProjectManager'

describe('ProjectManager', () => {
    beforeEach(() => {
        ProjectManager.getInstance().clear()
    })

    it('returns a singleton instance', () => {
        const inst1 = ProjectManager.getInstance()
        const inst2 = ProjectManager.getInstance()
        expect(inst1).toBe(inst2)
    })

    it('loads project data, stores path, and clears state cleanly', () => {
        const manager = ProjectManager.getInstance()
        expect(manager.getProject()).toBeNull()
        expect(manager.getProjectPath()).toBe('')

        const project = manager.load(
            {
                id: 'proj_1',
                name: 'Tajemnica Twierdzy',
                author: 'Autor Testowy',
                version: '1.0.0',
            },
            {},
            'C:/Projekty/Tajemnica'
        )

        expect(project).toBeDefined()
        expect(manager.getProject()).toBe(project)
        expect(manager.getProject()?.getName()).toBe('Tajemnica Twierdzy')
        expect(manager.getProjectPath()).toBe('C:/Projekty/Tajemnica')

        manager.setProjectPath('C:/Projekty/NowaSciezka')
        expect(manager.getProjectPath()).toBe('C:/Projekty/NowaSciezka')

        manager.clear()
        expect(manager.getProject()).toBeNull()
        expect(manager.getProjectPath()).toBe('')
    })
})
