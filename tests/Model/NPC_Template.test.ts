import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Feature } from '../../Model/Feature'
import { NPC_Template } from '../../Model/NPC_Template'
import { Parameter } from '../../Model/Parameter'
import { Project } from '../../Model/Project'
import { Skill } from '../../Model/Skill'
import { Stat } from '../../Model/Stat'
import { Tag } from '../../Model/Tag'

describe('NPC_Template Model', () => {
    it('tworzy szablon z pełnymi danymi (avatar, stats, skills, parameters, features, customAttributes, tags)', () => {
        const desc = new Description('Długi opis szablonu z kroniki', 'Szablon szeregowego bandyty')
        const template = new NPC_Template(
            'tpl-1',
            'Bandyta Szablon',
            desc,
            [new Stat('st1', 'Siła', new Description(), 12)],
            [new Skill('sk1', 'Broń biała', new Description(), 'direct', '+2')],
            [new Feature('f1', 'Klasa', new Description('Rzezimieszek'))],
            [new Tag('t1', 'Wróg')],
            'warrior',
            [new Parameter('p1', 'Zdrowie', new Description(), 'direct', 30)],
            [
                { name: 'poziom', value: 'łatwy' },
                { name: 'frakcja', value: 'Bandyci' },
            ]
        )

        expect(template.getId()).toBe('tpl-1')
        expect(template.getName()).toBe('Bandyta Szablon')
        expect(template.getSummary()).toBe('Szablon szeregowego bandyty')
        expect(template.getAvatar()).toBe('warrior')
        expect(template.getStats()).toHaveLength(1)
        expect(template.getSkills()).toHaveLength(1)
        expect(template.getParameters()).toHaveLength(1)
        expect(template.getFeatures()).toHaveLength(1)
        expect(template.getCustomAttributes()).toEqual([
            { name: 'poziom', value: 'łatwy' },
            { name: 'frakcja', value: 'Bandyci' },
        ])
        expect(template.getTags()).toHaveLength(1)
        expect(template.getDescription().getText()).toBe('Długi opis szablonu z kroniki')
    })

    it('obsługuje mutatory i metody pomocnicze parametrów, awatara, podsumowania i tagów', () => {
        const template = new NPC_Template('tpl-2', 'Domyślny')

        expect(template.getAvatar()).toBe('warrior')
        template.setAvatar('rogue')
        expect(template.getAvatar()).toBe('rogue')

        expect(template.getSummary()).toBe('')
        template.setSummary('Krótkie podsumowanie')
        expect(template.getSummary()).toBe('Krótkie podsumowanie')

        const param = new Parameter('p2', 'Energia', new Description(), 'direct', 50)
        template.addParameter(param)
        expect(template.hasParameter('Energia')).toBe(true)
        expect(template.getParameter('p2')?.getValue()).toBe(50)
        expect(template.getParameters()).toHaveLength(1)

        template.removeParameter('Energia')
        expect(template.hasParameter('Energia')).toBe(false)
        expect(template.getParameters()).toHaveLength(0)

        const tag = new Tag('t2', 'Elita')
        template.addTag(tag)
        expect(template.hasTag('Elita')).toBe(true)
        expect(template.getTags()).toHaveLength(1)

        template.removeTag('Elita')
        expect(template.hasTag('Elita')).toBe(false)
        expect(template.getTags()).toHaveLength(0)
    })

    it('poprawnie serializuje do JSON i deserializuje z fromJSON z zachowaniem pełnej zgodności z NPC', () => {
        const desc = new Description('Strażnik w pełnym rynsztunku', 'Strażnik pilnujący wejścia')
        const original = new NPC_Template(
            'tpl-3',
            'Strażnik Bramy',
            desc,
            [new Stat('st3', 'Wytrzymałość', new Description(), 15)],
            [new Skill('sk3', 'Czujność', new Description(), 'stat_mod', '', 'Wytrzymałość', '+1')],
            [new Feature('f3', 'Uzbrojenie', new Description('Tarcza i miecz'))],
            [new Tag('t3', 'Miasto')],
            'guard',
            [new Parameter('p3', 'Kondycja', new Description(), 'formula', 'Wytrzymałość * 5')],
            [{ name: 'poziomTrudnosci', value: 'Średni' }]
        )

        const json = original.toJSON()
        expect(json.id).toBe('tpl-3')
        expect(json.name).toBe('Strażnik Bramy')
        expect(json.avatar).toBe('guard')
        expect(json.description.summary).toBe('Strażnik pilnujący wejścia')
        expect(json.customAttributes).toEqual([{ name: 'poziomTrudnosci', value: 'Średni' }])
        expect(json.stats).toHaveLength(1)
        expect(json.skills).toHaveLength(1)
        expect(json.parameters).toHaveLength(1)
        expect(json.features).toHaveLength(1)
        expect(json.tags).toHaveLength(1)

        const restored = NPC_Template.fromJSON(json)
        expect(restored.getId()).toBe(original.getId())
        expect(restored.getName()).toBe(original.getName())
        expect(restored.getAvatar()).toBe(original.getAvatar())
        expect(restored.getSummary()).toBe(original.getSummary())
        expect(restored.getCustomAttributes()).toEqual(original.getCustomAttributes())
        expect(restored.getStats()[0].getName()).toBe('Wytrzymałość')
        expect(restored.getSkills()[0].getName()).toBe('Czujność')
        expect(restored.getParameters()[0].getName()).toBe('Kondycja')
        expect(restored.getFeatures()[0].getName()).toBe('Uzbrojenie')
        expect(restored.getTags()[0].getName()).toBe('Miasto')
        expect(restored.getDescription().getText()).toBe('Strażnik w pełnym rynsztunku')
    })

    it('integruje się z modelem Project: addTemplate, getTemplates, removeTemplate, toJSON i fromJSON', () => {
        const project = new Project('proj-test', 'Projekt z Szablonami')
        expect(project.getTemplates()).toEqual([])

        const desc = new Description('', 'Kupiec wędrowny')
        const tpl = new NPC_Template('tpl-p1', 'Kupiec', desc)
        project.addTemplate(tpl)
        expect(project.getTemplates()).toHaveLength(1)
        expect(project.hasTemplate('Kupiec')).toBe(true)
        expect(project.hasTemplate('tpl-p1')).toBe(true)
        expect(project.getTemplate('tpl-p1')?.getName()).toBe('Kupiec')

        const entities = {
            Templates: [tpl.toJSON()],
        }
        const restoredProject = Project.fromJSON(project.toJSON(), entities)
        expect(restoredProject.getTemplates()).toHaveLength(1)
        expect(restoredProject.getTemplate('tpl-p1')?.getSummary()).toBe('Kupiec wędrowny')

        restoredProject.removeTemplate('Kupiec')
        expect(restoredProject.hasTemplate('Kupiec')).toBe(false)
        expect(restoredProject.getTemplates()).toHaveLength(0)
    })
})
