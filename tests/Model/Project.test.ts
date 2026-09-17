import { beforeEach, describe, expect, it } from 'vitest'

import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'

describe('Project', () => {
    let project: Project

    beforeEach(() => {
        project = new Project('test-id', 'My Project', 'Author', '1.0.0')
    })

    it('initializes with correct id, name, author and version', () => {
        expect(project.getId()).toBe('test-id')
        expect(project.getName()).toBe('My Project')
        expect(project.getAuthor()).toBe('Author')
        expect(project.getVersion()).toBe('1.0.0')
    })

    it('hasId returns true when ID is set and false for an empty ID', () => {
        expect(project.hasId()).toBe(true)
        expect(new Project().hasId()).toBe(false)
    })

    it('powinien dodawać scenę', () => {
        const scene = new Scene('scena-1', 'Prologue')
        project.addScene(scene)
        expect(project.getScenes()).toHaveLength(1)
        expect(project.hasScene('scena-1')).toBe(true)
    })

    it('powinien usuwać scenę po ID', () => {
        const scene = new Scene('scena-1', 'Prologue')
        project.addScene(scene)
        project.removeScene('scena-1')
        expect(project.getScenes()).toHaveLength(0)
        expect(project.hasScene('scena-1')).toBe(false)
    })

    it('getScene powinno zwracać undefined dla nieistniejącej sceny', () => {
        expect(project.getScene('non-existent')).toBeUndefined()
    })
})
