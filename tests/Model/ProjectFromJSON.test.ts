import { describe, expect, it } from 'vitest'

import { CharacterClass } from '../../Model/CharacterClass'
import { Item } from '../../Model/Item'
import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Project } from '../../Model/Project'
import type { EntitiesData, ProjectData } from '../../types/ipc'

const minimalProjectDataEN: ProjectData = {
    id: 'test-project',
    name: 'Test Project',
    author: 'John Tester',
    version: '2.0.0',
    descriptionPaths: [],
    dataPaths: [],
}

describe('Project.fromJSON()', () => {
    it('powinien zwrócić instancję Project dla formatu EN', () => {
        const project = Project.fromJSON(minimalProjectDataEN)
        expect(project).toBeInstanceOf(Project)
        expect(project.getId()).toBe('test-project')
        expect(project.getName()).toBe('Test Project')
        expect(project.getAuthor()).toBe('John Tester')
        expect(project.getVersion()).toBe('2.0.0')
    })

    it('powinien zwrócić pusty projekt gdy brak encji', () => {
        const project = Project.fromJSON(minimalProjectDataEN)
        expect(project.getLocations()).toHaveLength(0)
        expect(project.getCharacters()).toHaveLength(0)
        expect(project.getItems()).toHaveLength(0)
        expect(project.getCharacterClasses()).toHaveLength(0)
        expect(project.getScenes()).toHaveLength(0)
    })

    it('powinien deserializować Locations jako instancje Location', () => {
        const entities: EntitiesData = {
            Locations: [
                {
                    id: 'forest',
                    name: 'Forest',
                    description: { text: 'Deep forest', summary: '', authorNotes: '' },
                    tags: ['outside'],
                },
            ],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        const locations = project.getLocations()
        expect(locations).toHaveLength(1)
        locations.forEach(l => expect(l).toBeInstanceOf(Location))
        expect(locations[0].getId()).toBe('forest')
        expect(locations[0].getName()).toBe('Forest')
        expect(locations[0].getDescription().getText()).toBe('Deep forest')
        expect(locations[0].getTags().map(t => t.getId())).toEqual(['outside'])
    })

    it('powinien deserializować NPC jako instancje NPC', () => {
        const entities: EntitiesData = {
            NPC: [
                {
                    id: 'guard',
                    name: 'Guard',
                    description: { text: '', summary: '', authorNotes: '' },
                    traits: [],
                    skills: [],
                    qualities: [],
                },
            ],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        const characters = project.getCharacters()
        expect(characters).toHaveLength(1)
        expect(characters[0]).toBeInstanceOf(NPC)
        expect(characters[0].getId()).toBe('guard')
        expect(characters[0].getName()).toBe('Guard')
    })

    it('powinien deserializować Items jako instancje Item', () => {
        const entities: EntitiesData = {
            Items: [
                {
                    id: 'sword',
                    name: 'Sword',
                    description: { text: 'Steel sword', summary: '', authorNotes: '' },
                },
            ],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        const items = project.getItems()
        expect(items).toHaveLength(1)
        expect(items[0]).toBeInstanceOf(Item)
        expect(items[0].getId()).toBe('sword')
        expect(items[0].getName()).toBe('Sword')
    })

    it('powinien deserializować CharacterClasses jako instancje CharacterClass', () => {
        const entities: EntitiesData = {
            CharacterClasses: [
                {
                    id: 'warrior',
                    name: 'Warrior',
                    level: 1,
                    description: { text: '', summary: '', authorNotes: '' },
                    traits: [],
                    skills: [],
                    qualities: [],
                },
            ],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        const classes = project.getCharacterClasses()
        expect(classes).toHaveLength(1)
        expect(classes[0]).toBeInstanceOf(CharacterClass)
        expect(classes[0].getId()).toBe('warrior')
        expect(classes[0].getName()).toBe('Warrior')
    })

    it('powinien obsłużyć brakujące pola w projectData (wartości domyślne)', () => {
        const incomplete = {
            id: '',
            name: '',
            author: '',
            version: '',
            descriptionPaths: [],
            dataPaths: [],
        } as ProjectData
        const project = Project.fromJSON(incomplete)
        expect(project).toBeInstanceOf(Project)
        expect(project.getId()).toBe('')
        expect(project.getName()).toBe('')
    })

    it('powinien obsłużyć puste tablice encji', () => {
        const entities: EntitiesData = {
            Locations: [],
            NPC: [],
            Items: [],
            CharacterClasses: [],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        expect(project.getLocations()).toHaveLength(0)
        expect(project.getCharacters()).toHaveLength(0)
        expect(project.getItems()).toHaveLength(0)
        expect(project.getCharacterClasses()).toHaveLength(0)
    })

    it('powinien deserializować wiele lokacji z zagnieżdżonymi opisami', () => {
        const entities: EntitiesData = {
            Locations: [
                {
                    id: 'crypt',
                    name: 'Crypt',
                    description: {
                        text: 'Cold crypt',
                        summary: 'Location',
                        authorNotes: 'Author note',
                    },
                    tags: ['underground', 'dark'],
                },
            ],
        }
        const project = Project.fromJSON(minimalProjectDataEN, entities)
        const location = project.getLocation('crypt')
        expect(location).toBeInstanceOf(Location)
        expect(location?.getDescription().getText()).toBe('Cold crypt')
        expect(location?.getDescription().getSummary()).toBe('Location')
        expect(location?.getDescription().getAuthorNotes()).toBe('Author note')
        expect(location?.getTags().map(t => t.getId())).toEqual(['underground', 'dark'])
    })
})
