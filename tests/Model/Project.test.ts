import { beforeEach, describe, expect, it } from 'vitest'

import { NPC } from '../../Model/NPC'
import { NPC_Template } from '../../Model/NPC_Template'
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

    it('manages customStyles and customFonts with serialization roundtrip', () => {
        const styles = [{ id: 'style_1', name: 'Myśli', color: '#c084fc', italic: true }]
        const fonts = [{ name: 'Cinzel', isCustom: true, googleFont: true }]

        project.setCustomStyles(styles)
        project.setCustomFonts(fonts)

        expect(project.getCustomStyles()).toEqual(styles)
        expect(project.getCustomFonts()).toEqual(fonts)

        const json = project.toJSON()
        expect(json.editor?.customStyles).toEqual(styles)
        expect(json.editor?.customFonts).toEqual(fonts)

        const reconstructed = Project.fromJSON(json)
        expect(reconstructed.getCustomStyles()).toEqual(styles)
        expect(reconstructed.getCustomFonts()).toEqual(fonts)
    })

    it('powinien dodawać postać i ignorować duplikaty o tym samym ID', () => {
        const npc1 = new NPC('char-1', 'Strażnik')
        const npc2 = new NPC('char-1', 'Strażnik Kopia')
        project.addCharacter(npc1)
        expect(project.getCharacters()).toHaveLength(1)
        expect(project.hasCharacter('char-1')).toBe(true)

        project.addCharacter(npc2)
        expect(project.getCharacters()).toHaveLength(1)
        expect(project.getCharacters()[0].getName()).toBe('Strażnik')
    })

    it('powinien dodawać szablon i ignorować duplikaty o tym samym ID', () => {
        const tpl1 = new NPC_Template('tpl-1', 'Bandyta')
        const tpl2 = new NPC_Template('tpl-1', 'Bandyta Kopia')
        project.addTemplate(tpl1)
        expect(project.getTemplates()).toHaveLength(1)
        expect(project.hasTemplate('tpl-1')).toBe(true)

        project.addTemplate(tpl2)
        expect(project.getTemplates()).toHaveLength(1)
        expect(project.getTemplates()[0].getName()).toBe('Bandyta')
    })
})
