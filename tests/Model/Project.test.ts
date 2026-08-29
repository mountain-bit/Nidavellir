import { beforeEach, describe, expect, it } from 'vitest'

import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'

describe('Project', () => {
    let project: Project

    beforeEach(() => {
        project = new Project('test-id', 'My Project', 'Author', '1.0.0')
    })

    it('powinien mieć poprawne ID po inicjalizacji', () => {
        expect(project.getId()).toBe('test-id')
    })

    it('powinien mieć poprawną nazwę', () => {
        expect(project.getName()).toBe('My Project')
    })

    it('powinien mieć poprawnego autora', () => {
        expect(project.getAuthor()).toBe('Author')
    })

    it('hasId powinno zwracać true gdy ID jest ustawione', () => {
        expect(project.hasId()).toBe(true)
    })

    it('hasId powinno zwracać false dla pustego ID', () => {
        const emptyProject = new Project()
        expect(emptyProject.hasId()).toBe(false)
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
