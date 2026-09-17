// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Project } from '../../Model/Project'
import { Scene } from '../../Model/Scene'
import { Tag } from '../../Model/Tag'
import {
    createMockProjectData,
    extractProjectData,
    loadProjectData,
    loadRealProjectData,
    mockFiles,
    USE_MOCK,
} from '../../View/mockData.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('mockData and projectData provider', () => {
    let vm: MainWindowViewModel

    beforeEach(() => {
        vm = new MainWindowViewModel()
    })

    describe('mockFiles', () => {
        it('should contain expected default markdown files', () => {
            expect(mockFiles).toBeDefined()
            expect(mockFiles['Wprowadzenie.md']).toContain('# Wprowadzenie')
            expect(mockFiles['Zasady.md']).toContain('# Zasady Gry')
        })
    })

    describe('createMockProjectData', () => {
        it('should construct a complete mock project structure', () => {
            const data = createMockProjectData(vm)

            expect(data).toBeDefined()
            expect(data.files).toEqual(mockFiles)
            expect(data.projectTags).toHaveLength(3)
            expect(data.projectCharacters).toHaveLength(2)
            expect(data.projectLocations).toHaveLength(2)
            expect(data.projectStats).toHaveLength(2)
            expect(data.projectParagraphs).toHaveLength(3)
            expect(data.projectScenes).toHaveLength(2)
        })

        it('should configure mock paragraphs with positions, choices, and conditions', () => {
            const data = createMockProjectData(vm)
            const [p1, p2, p3] = data.projectParagraphs

            expect(p1.getId()).toBe('p1')
            expect(p1.getTitle()).toBe('Prolog: Przebudzenie')
            expect(p1.getPosition()).toEqual({ x: 180, y: 180 })
            expect(p1.getChoices()).toHaveLength(2)

            const choiceWithCond = p1.getChoices()[0]
            expect(choiceWithCond.getCondition()).not.toBeNull()
            expect(choiceWithCond.getCondition()?.getName()).toBe('Pochodnia')

            expect(p2.getPosition()).toEqual({ x: 480, y: 90 })
            expect(p3.getPosition()).toEqual({ x: 480, y: 290 })
        })

        it('should link paragraphs and characters into scenes', () => {
            const data = createMockProjectData(vm)
            const [s1, s2] = data.projectScenes

            expect(s1.getId()).toBe('s1')
            expect(s1.getParagraphs()).toHaveLength(1)
            expect(s1.getCharacters()).toHaveLength(1)

            expect(s2.getId()).toBe('s2')
            expect(s2.getParagraphs()).toHaveLength(2)
            expect(s2.getCharacters()).toHaveLength(1)
        })
    })

    describe('loadProjectData', () => {
        it('should default to mock data when USE_MOCK is true', () => {
            expect(USE_MOCK).toBe(true)
            const data = loadProjectData(vm)
            expect(data.projectParagraphs).toHaveLength(3)
            expect(data.files['Wprowadzenie.md']).toBeDefined()
        })

        it('should return mock data when useMock: true is explicitly passed', () => {
            const data = loadProjectData(vm, { useMock: true })
            expect(data.projectParagraphs).toHaveLength(3)
        })

        it('should return real project data when useMock: false is passed', () => {
            const dummyProject = new Project('dummy-id', 'Test Project')
            const data = loadProjectData(vm, { useMock: false, project: dummyProject })

            expect(data.projectParagraphs).toHaveLength(0)
            expect(data.projectScenes).toHaveLength(0)
            expect(data.files).toEqual({})
        })
    })

    describe('extractProjectData', () => {
        it('should gracefully handle null/undefined project', () => {
            const data = extractProjectData(null)
            expect(data).toEqual({
                files: {},
                projectTags: [],
                projectCharacters: [],
                projectLocations: [],
                projectStats: [],
                projectParagraphs: [],
                projectScenes: [],
            })
        })

        it('should extract scenes, paragraphs, and entities from a domain Project instance', () => {
            const p = new Paragraph('para-1', 'Paragraf 1')
            const scene = new Scene('sc-1', 'Scena 1', undefined, [p])
            const tag = new Tag('tag-1', 'Tag 1')
            const character = new NPC('npc-1', 'Jan')

            const project = new Project(
                'proj-1',
                'Moja Gra',
                'Autor',
                '1.0.0',
                undefined,
                [scene],
                [],
                [character],
                [],
                [],
                undefined,
                [],
                [],
                []
            )
            project.addTag(tag)

            const customFiles = { 'Rozdzial1.md': '# Rozdział 1' }
            const extracted = extractProjectData(project, customFiles)

            expect(extracted.files).toEqual(customFiles)
            expect(extracted.projectScenes).toHaveLength(1)
            expect(extracted.projectParagraphs).toHaveLength(1)
            expect(extracted.projectParagraphs[0].getId()).toBe('para-1')
            expect(extracted.projectTags).toHaveLength(1)
            expect(extracted.projectCharacters).toHaveLength(1)
        })
    })

    describe('loadRealProjectData', () => {
        it('should extract data from options.project if provided', async () => {
            const project = new Project('p-1', 'Projekt')
            const res = await loadRealProjectData(vm, { project })
            expect(res.projectScenes).toEqual([])
        })

        it('should return empty scaffold if options.project is not provided', async () => {
            const res = await loadRealProjectData(vm)
            expect(res.projectScenes).toEqual([])
            expect(res.projectParagraphs).toEqual([])
        })
    })
})
