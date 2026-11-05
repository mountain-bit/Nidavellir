import { describe, expect, it } from 'vitest'

import { Description } from '../../Model/Description'
import { Location } from '../../Model/Location'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'

describe('Scene Model', () => {
    it('should create a Scene instance with default and custom values', () => {
        const scene = new Scene('s-1', 'Rozdział 1')
        expect(scene.getId()).toBe('s-1')
        expect(scene.getName()).toBe('Rozdział 1')
        expect(scene.getPosition()).toBeNull()
        expect(scene.getWidth()).toBe(400)
        expect(scene.getHeight()).toBe(280)
        expect(scene.getColor()).toBe('#4a5b6d')
        expect(scene.getIsMovementLocked()).toBe(true)
        expect(scene.getParagraphs()).toEqual([])
    })

    it('should allow updating position, dimensions, color, and movement lock', () => {
        const scene = new Scene('s-2', 'Akt I')
        scene.setPosition({ x: 100, y: 150 })
        expect(scene.getPosition()).toEqual({ x: 100, y: 150 })

        scene.setWidth(450)
        expect(scene.getWidth()).toBe(450)

        // Minimum width clamping (160)
        scene.setWidth(50)
        expect(scene.getWidth()).toBe(160)

        scene.setHeight(300)
        expect(scene.getHeight()).toBe(300)

        // Minimum height clamping (110)
        scene.setHeight(30)
        expect(scene.getHeight()).toBe(110)

        scene.setColor('#10b981')
        expect(scene.getColor()).toBe('#10b981')

        scene.setIsMovementLocked(true)
        expect(scene.getIsMovementLocked()).toBe(true)
    })

    it('should correctly test point containment with containsPoint()', () => {
        const scene = new Scene(
            's-3',
            'Plac targowy',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            300,
            200
        )

        expect(scene.containsPoint(150, 150)).toBe(true)
        expect(scene.containsPoint(100, 100)).toBe(true)
        expect(scene.containsPoint(400, 300)).toBe(true)
        expect(scene.containsPoint(50, 150)).toBe(false)
        expect(scene.containsPoint(450, 150)).toBe(false)
        expect(scene.containsPoint(200, 50)).toBe(false)
        expect(scene.containsPoint(200, 350)).toBe(false)

        const unplacedScene = new Scene('s-unplaced', 'Niezmieszczona')
        expect(unplacedScene.containsPoint(100, 100)).toBe(false)
    })

    it('should correctly test paragraph intersection with intersectsParagraph()', () => {
        const scene = new Scene(
            's-4',
            'Komnata Runiczna',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            300,
            200
        )

        const insideParagraph = new Paragraph('p-1', 'Paragraf wewnątrz')
        insideParagraph.setPosition({ x: 200, y: 180 })
        expect(scene.intersectsParagraph(insideParagraph)).toBe(true)

        // Paragraph partially overlapping left boundary
        // Paragraph center at x=50, width=220 (halfWidth=110), so right edge is 50+110=160 > 100
        const overlappingParagraph = new Paragraph('p-2', 'Nachodzący')
        overlappingParagraph.setPosition({ x: 50, y: 150 })
        expect(scene.intersectsParagraph(overlappingParagraph)).toBe(true)

        // Paragraph completely outside
        const outsideParagraph = new Paragraph('p-3', 'Na zewnątrz')
        outsideParagraph.setPosition({ x: 600, y: 600 })
        expect(scene.intersectsParagraph(outsideParagraph)).toBe(false)

        // Paragraph with no position
        const unplacedParagraph = new Paragraph('p-4', 'Bez pozycji')
        expect(scene.intersectsParagraph(unplacedParagraph)).toBe(false)
    })

    it('should calculate area and detect intersection and containment with other scenes', () => {
        const parentScene = new Scene(
            's-parent',
            'Duża Scena',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            600,
            400
        )

        const childScene = new Scene(
            's-child',
            'Mała Scena Wewnątrz',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 200, y: 150 },
            250,
            200
        )

        const outsideScene = new Scene(
            's-outside',
            'Scena Na Zewnątrz',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 1000, y: 1000 },
            200,
            200
        )

        const overlappingScene = new Scene(
            's-overlap',
            'Nachodząca Scena',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 600, y: 400 },
            300,
            300
        )

        expect(parentScene.getArea()).toBe(600 * 400)
        expect(childScene.getArea()).toBe(250 * 200)

        // Intersections
        expect(parentScene.intersectsScene(childScene)).toBe(true)
        expect(childScene.intersectsScene(parentScene)).toBe(true)
        expect(parentScene.intersectsScene(overlappingScene)).toBe(true)
        expect(parentScene.intersectsScene(outsideScene)).toBe(false)

        // Containment (parent contains child, but child does not contain parent)
        expect(parentScene.containsScene(childScene)).toBe(true)
        expect(childScene.containsScene(parentScene)).toBe(false)
        expect(parentScene.containsScene(outsideScene)).toBe(false)
        expect(parentScene.containsScene(overlappingScene)).toBe(false)
    })

    it('should serialize to JSON and deserialize from JSON correctly', () => {
        const p1 = new Paragraph('p-10', 'Początek')
        const scene = new Scene(
            's-5',
            'Epilog',
            undefined,
            [p1],
            [],
            null,
            [],
            'icon-1',
            { x: 250, y: 350 },
            450,
            320,
            '#8b5cf6',
            true
        )

        const json = scene.toJSON()
        expect(json.id).toBe('s-5')
        expect(json.name).toBe('Epilog')
        expect(json.position).toEqual({ x: 250, y: 350 })
        expect(json.width).toBe(450)
        expect(json.height).toBe(320)
        expect(json.color).toBe('#8b5cf6')
        expect(json.isMovementLocked).toBe(true)
        expect(json.paragraphs).toHaveLength(1)

        const restored = Scene.fromJSON(json)
        expect(restored.getId()).toBe('s-5')
        expect(restored.getName()).toBe('Epilog')
        expect(restored.getPosition()).toEqual({ x: 250, y: 350 })
        expect(restored.getWidth()).toBe(450)
        expect(restored.getHeight()).toBe(320)
        expect(restored.getColor()).toBe('#8b5cf6')
        expect(restored.getIsMovementLocked()).toBe(true)
        expect(restored.getParagraphs()).toHaveLength(1)
        expect(restored.getParagraphs()[0].getId()).toBe('p-10')
    })

    it('should deserialize complete Scene from English JSON in fromJSON', () => {
        const englishJson = {
            id: 'scene_1',
            name: 'Crypt of Shadows',
            description: { text: 'Dark catacombs', summary: 'Catacombs' },
            paragraphs: [{ id: 'p_100', title: 'Entrance' }],
            characters: [{ id: 'npc_1', name: 'Skeleton' }],
            location: { id: 'loc_1', name: 'Crypt' },
            tags: [{ id: 't_dark', name: 'Darkness', color: '#000000' }],
            initialParagraphId: 'p_100',
            position: { x: 120, y: 220 },
            width: 500,
            height: 350,
            color: '#ef4444',
            isMovementLocked: false,
        }

        const scene = Scene.fromJSON(englishJson)
        expect(scene.getId()).toBe('scene_1')
        expect(scene.getName()).toBe('Crypt of Shadows')
        expect(scene.getDescription().getText()).toBe('Dark catacombs')
        expect(scene.getParagraphs()).toHaveLength(1)
        expect(scene.getParagraphs()[0].getId()).toBe('p_100')
        expect(scene.getCharacters()).toHaveLength(1)
        expect(scene.getCharacters()[0].getId()).toBe('npc_1')
        expect(scene.getLocation()?.getId()).toBe('loc_1')
        expect(scene.getTags()).toHaveLength(1)
        expect(scene.getTags()[0].getColor()).toBe('#000000')
        expect(scene.getInitialParagraphId()).toBe('p_100')
        expect(scene.getPosition()).toEqual({ x: 120, y: 220 })
        expect(scene.getWidth()).toBe(500)
        expect(scene.getHeight()).toBe(350)
        expect(scene.getColor()).toBe('#ef4444')
        expect(scene.getIsMovementLocked()).toBe(false)
    })

    it('should manage locations via addLocation, removeLocation, getLocations, and hasLocation', () => {
        const scene = new Scene('s-loc', 'Lokacje Sceny')
        const loc1 = new Location('loc_1', 'Zamek')
        const loc2 = new Location('loc_2', 'Karczma')

        expect(scene.getLocations()).toEqual([])
        expect(scene.getLocation()).toBeNull()
        expect(scene.hasLocation('loc_1')).toBe(false)

        scene.addLocation(loc1)
        scene.addLocation(loc2)
        // Adding duplicate should be ignored
        scene.addLocation(new Location('loc_1', 'Zamek Duplikat'))

        expect(scene.getLocations()).toHaveLength(2)
        expect(scene.getLocation()?.getName()).toBe('Zamek')
        expect(scene.hasLocation('loc_1')).toBe(true)
        expect(scene.hasLocation('Zamek')).toBe(true)
        expect(scene.hasLocation('Karczma')).toBe(true)
        expect(scene.hasLocation('Las')).toBe(false)

        scene.removeLocation('Zamek')
        expect(scene.hasLocation('loc_1')).toBe(false)
        expect(scene.getLocations()).toHaveLength(1)

        scene.removeLocation('loc_2')
        expect(scene.hasLocation('loc_2')).toBe(false)
        expect(scene.getLocations()).toHaveLength(0)
    })

    it('should serialize multiple locations to JSON and restore via fromJSON', () => {
        const loc1 = new Location('loc_castle', 'Royal Castle')
        const loc2 = new Location('loc_dungeon', 'Dungeon')
        const scene = new Scene('s-multi-loc', 'Wielkie Królestwo')
        scene.addLocation(loc1)
        scene.addLocation(loc2)

        const json = scene.toJSON() as any
        expect(json.locations).toBeDefined()
        expect(json.locations).toHaveLength(2)
        expect(json.locations[0].id).toBe('loc_castle')
        expect(json.locations[1].id).toBe('loc_dungeon')
        expect(json.location).toBeDefined()
        expect(json.location.id).toBe('loc_castle')

        const restored = Scene.fromJSON(json)
        expect(restored.getLocations()).toHaveLength(2)
        expect(restored.getLocations()[0].getId()).toBe('loc_castle')
        expect(restored.getLocations()[1].getId()).toBe('loc_dungeon')
        expect(restored.getLocation()?.getId()).toBe('loc_castle')
    })

    it('should handle all setters, entity queries, and tags', () => {
        const scene = new Scene('s-full', 'Scena Pełna')
        expect(scene.hasId()).toBe(true)

        scene.setId('s-changed')
        expect(scene.getId()).toBe('s-changed')
        scene.setName('Zmieniona Nazwa')
        expect(scene.getName()).toBe('Zmieniona Nazwa')

        const desc = new Description('Opis sceny')
        scene.setDescription(desc)
        expect(scene.getDescription().getText()).toBe('Opis sceny')

        // Paragraphs
        const p1 = new Paragraph('p_sub1', 'Podparagraf 1')
        scene.setParagraphs([p1])
        expect(scene.getParagraph('p_sub1')).toBe(p1)
        expect(scene.getParagraph('nonexistent')).toBeUndefined()

        // Characters
        const npc1 = { getId: () => 'npc_bob', getName: () => 'Bob' } as any
        scene.setCharacters([npc1])
        expect(scene.hasCharacter('npc_bob')).toBe(true)
        expect(scene.getCharacter('npc_bob')).toBe(npc1)
        expect(scene.getCharacter('nonexistent')).toBeUndefined()

        // Locations & setLocation
        const loc = new Location('loc_single', 'Pojedyncza')
        scene.setLocation(loc)
        expect(scene.getLocation()?.getId()).toBe('loc_single')
        scene.setLocations([loc])
        expect(scene.getLocations()).toHaveLength(1)

        // Tags
        const tag = { getId: () => 'tg_act', getName: () => 'Akt1' } as any
        scene.setTags([tag])
        expect(scene.hasTag('Akt1')).toBe(true)
        expect(scene.hasTag('tg_act')).toBe(true)
        scene.removeTag('Akt1')
        expect(scene.hasTag('Akt1')).toBe(false)

        // InitialParagraphId
        scene.setInitialParagraphId('p_init')
        expect(scene.getInitialParagraphId()).toBe('p_init')
    })
})
