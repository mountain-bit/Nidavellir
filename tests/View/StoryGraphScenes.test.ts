// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ParagraphNode } from '../../Modules/Graph/ParagraphNode'
import { StoryGraph } from '../../Modules/Graph/StoryGraph'
import { initTranslationsWithLocale } from '../../Utils/translate'

describe('StoryGraph Scene Integration', () => {
    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
    })

    it('should synchronize paragraph scene assignments based on graph geometry', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 100, y: 100 }) // inside s1
        const p2 = new Paragraph('p2', 'Paragraf 2')
        p2.setPosition({ x: 500, y: 500 }) // outside any scene

        const s1 = new Scene(
            's1',
            'Scena 1',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 0, y: 0 },
            300,
            250,
            '#3b82f6'
        )

        const paragraphs = [p1, p2]
        const scenes = [s1]

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        const result = storyGraph.syncParagraphSceneAssignments(paragraphs, scenes)
        expect(result.changed).toBe(true)
        expect(s1.hasParagraph('p1')).toBe(true)
        expect(s1.hasParagraph('p2')).toBe(false)

        // Move p1 outside of s1
        p1.setPosition({ x: 800, y: 800 })
        const result2 = storyGraph.syncParagraphSceneAssignments(paragraphs, scenes)
        expect(result2.changed).toBe(true)
        expect(s1.hasParagraph('p1')).toBe(false)

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should update paragraph node colors according to scene color', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-color-1', 'Paragraf Kolorowy')
        p1.setPosition({ x: 150, y: 150 })

        const s1 = new Scene(
            's-color-1',
            'Scena Czerwona',
            undefined,
            [p1],
            [],
            null,
            [],
            '',
            { x: 50, y: 50 },
            300,
            300,
            '#ef4444'
        )

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => [p1],
            getScenes: () => [s1],
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        const pNode = document.createElement('paragraph-node') as ParagraphNode
        pNode.paragraph = p1
        pNode.dataset.nodeId = p1.getId()
        nodesLayer.appendChild(pNode)

        storyGraph.updateParagraphNodeColors([p1], [s1])
        expect(pNode.themeColor).toBe('#ef4444')

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should place a new scene on graph via addSceneToGraph()', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-place-1', 'Paragraf w nowej scenie')
        p1.setPosition({ x: 200, y: 200 })

        const newScene = new Scene('s-new', 'Nowa scena z listy')
        expect(newScene.getPosition()).toBeNull()

        const paragraphs = [p1]
        const scenes = [newScene]

        const mockCy = {
            pan: () => ({ x: 0, y: 0 }),
            zoom: () => 1,
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: () => undefined,
            style: () => {},
            center: () => {},
            animate: () => {},
        }
        window.cytoscape = () => mockCy as any

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.addSceneToGraph(newScene, { x: 100, y: 100 }, 400, 300)

        expect(newScene.getPosition()).toEqual({ x: 100, y: 100 })
        expect(newScene.getWidth()).toBe(400)
        expect(newScene.getHeight()).toBe(300)
        expect(newScene.hasParagraph('p-place-1')).toBe(true)

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should focus on a scene by panning to its center via focusOnElement', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const s1 = new Scene(
            's-focus-target',
            'Docelowa Scena',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 400, y: 300 },
            200,
            200
        )

        let panTarget: { x: number; y: number } | null = null
        const mockCy = {
            pan: (pos?: { x: number; y: number }) => {
                if (pos) panTarget = pos
                return pos || { x: 0, y: 0 }
            },
            zoom: () => 1,
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: () => ({ length: 0, nonempty: () => false, empty: () => true }),
            style: () => {},
            center: () => {},
            animate: (opts: { pan?: { x: number; y: number } }) => {
                if (opts.pan) panTarget = opts.pan
            },
        }
        window.cytoscape = () => mockCy as any

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => [],
            getScenes: () => [s1],
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.render(true)
        storyGraph.focusOnElement('s-focus-target', false)

        expect(panTarget).not.toBeNull()
        // Center of scene is (400+100, 300+100) = (500, 400)
        // Default canvas width is 800 (800/2 - 500 = -100), height 600 (600/2 - 400 = -100)
        expect(panTarget).toEqual({ x: -100, y: -100 })

        const sceneNodeEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-focus-target"]'
        ) as HTMLElement
        expect(sceneNodeEl.classList.contains('is-selected')).toBe(true)

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should zoom graph when wheeling over a scene node', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const s1 = new Scene(
            's-wheel-target',
            'Scena do scrolla',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            200,
            200
        )

        let currentZoomLevel = 1.0
        let zoomPositionPassed: unknown = null

        const mockCy = {
            pan: (): { x: number; y: number } => ({ x: 0, y: 0 }),
            zoom: (arg?: number | { level?: number; renderedPosition?: unknown }): number => {
                if (typeof arg === 'number') {
                    currentZoomLevel = arg
                } else if (typeof arg === 'object' && arg !== null) {
                    if (typeof arg.level === 'number') {
                        currentZoomLevel = arg.level
                    }
                    if (arg.renderedPosition) {
                        zoomPositionPassed = arg.renderedPosition
                    }
                }
                return currentZoomLevel
            },
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: () => ({ length: 0, nonempty: () => false, empty: () => true }),
            style: () => {},
            center: () => {},
            animate: () => {},
        }
        window.cytoscape = () => mockCy as any

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            wheelSensitivity: 0.2,
            getParagraphs: () => [],
            getScenes: () => [s1],
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.render(true)

        const sceneNodeEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-wheel-target"]'
        ) as HTMLElement
        expect(sceneNodeEl).not.toBeNull()

        // Simulate wheeling down (zoom out, deltaY > 0)
        const wheelEv = new WheelEvent('wheel', {
            deltaY: 100,
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 150,
        })
        sceneNodeEl.dispatchEvent(wheelEv)

        const normalZoomLevel = currentZoomLevel
        expect(normalZoomLevel).toBeLessThan(1.0)
        expect(zoomPositionPassed).not.toBeNull()

        // Reset zoom to 1.0 and wheel down with Ctrl held (should zoom out faster)
        currentZoomLevel = 1.0
        const wheelEvCtrl = new WheelEvent('wheel', {
            deltaY: 100,
            bubbles: true,
            cancelable: true,
            clientX: 150,
            clientY: 150,
        })
        Object.defineProperty(wheelEvCtrl, 'ctrlKey', {
            value: true,
            configurable: true,
        })
        sceneNodeEl.dispatchEvent(wheelEvCtrl)

        expect(currentZoomLevel).toBeLessThan(normalZoomLevel)

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should assign paragraphs to multiple scenes and use innermost scene color', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-nested-child', 'Paragraf w podscenie')
        p1.setPosition({ x: 200, y: 200 })
        const p2 = new Paragraph('p-parent-only', 'Paragraf tylko w nadscenie')
        p2.setPosition({ x: 550, y: 450 })

        const parentScene = new Scene(
            's-parent-nested',
            'Scena Nadrzędna',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 50, y: 50 },
            700,
            600,
            '#3b82f6' // Blue
        )

        const childScene = new Scene(
            's-child-nested',
            'Scena Podrzędna',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            250,
            250,
            '#ef4444' // Red
        )

        const paragraphs = [p1, p2]
        const scenes = [parentScene, childScene]

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        const syncResult = storyGraph.syncParagraphSceneAssignments(paragraphs, scenes)
        expect(syncResult.changed).toBe(true)

        // p1 is inside both childScene and parentScene
        expect(parentScene.hasParagraph('p-nested-child')).toBe(true)
        expect(childScene.hasParagraph('p-nested-child')).toBe(true)

        // p2 is inside parentScene only
        expect(parentScene.hasParagraph('p-parent-only')).toBe(true)
        expect(childScene.hasParagraph('p-parent-only')).toBe(false)

        // Color update: child node p1 should take innermost childScene color (#ef4444)
        const pNode1 = document.createElement('paragraph-node') as ParagraphNode
        pNode1.paragraph = p1
        pNode1.dataset.nodeId = p1.getId()
        nodesLayer.appendChild(pNode1)

        const pNode2 = document.createElement('paragraph-node') as ParagraphNode
        pNode2.paragraph = p2
        pNode2.dataset.nodeId = p2.getId()
        nodesLayer.appendChild(pNode2)

        storyGraph.updateParagraphNodeColors(paragraphs, scenes)
        expect(pNode1.themeColor).toBe('#ef4444')
        expect(pNode2.themeColor).toBe('#3b82f6')

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should move child scenes and all paragraphs when locked parent scene is dragged', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-c1', 'Paragraf w podscenie')
        p1.setPosition({ x: 200, y: 200 })
        const p2 = new Paragraph('p-p1', 'Paragraf w nadscenie')
        p2.setPosition({ x: 500, y: 300 })

        const parentScene = new Scene(
            's-parent-drag',
            'Nadscena',
            undefined,
            [p1, p2],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            600,
            500,
            '#3b82f6',
            true // Locked
        )

        const childScene = new Scene(
            's-child-drag',
            'Podscena',
            undefined,
            [p1],
            [],
            null,
            [],
            '',
            { x: 150, y: 150 },
            250,
            200,
            '#ef4444',
            true // Locked
        )

        const paragraphs = [p1, p2]
        const scenes = [parentScene, childScene]

        const mockCy = {
            pan: () => ({ x: 0, y: 0 }),
            zoom: () => 1,
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: () => ({
                length: 0,
                nonempty: () => false,
                empty: () => true,
                position: () => {},
            }),
            style: () => {},
            center: () => {},
            animate: () => {},
        }
        window.cytoscape = () => mockCy as any

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.render(true)

        const parentEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-parent-drag"]'
        ) as HTMLElement
        expect(parentEl).not.toBeNull()

        // Drag parent scene by (+50, +80)
        parentEl.dispatchEvent(
            new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true })
        )
        window.dispatchEvent(
            new PointerEvent('pointermove', { clientX: 150, clientY: 180, bubbles: true })
        )
        window.dispatchEvent(
            new PointerEvent('pointerup', { clientX: 150, clientY: 180, bubbles: true })
        )

        // Parent scene moved +50, +80
        expect(parentScene.getPosition()).toEqual({ x: 150, y: 180 })
        // Child scene moved +50, +80
        expect(childScene.getPosition()).toEqual({ x: 200, y: 230 })
        // Both paragraphs moved +50, +80
        expect(p1.getPosition()).toEqual({ x: 250, y: 280 })
        expect(p2.getPosition()).toEqual({ x: 550, y: 380 })

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should move only child scene and its paragraphs when locked child scene is dragged', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-c2', 'Paragraf w podscenie')
        p1.setPosition({ x: 200, y: 200 })
        const p2 = new Paragraph('p-p2', 'Paragraf w nadscenie')
        p2.setPosition({ x: 550, y: 300 })

        const parentScene = new Scene(
            's-parent-drag-2',
            'Nadscena 2',
            undefined,
            [p1, p2],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            600,
            500,
            '#3b82f6',
            true // Locked
        )

        const childScene = new Scene(
            's-child-drag-2',
            'Podscena 2',
            undefined,
            [p1],
            [],
            null,
            [],
            '',
            { x: 150, y: 150 },
            250,
            200,
            '#ef4444',
            true // Locked
        )

        const paragraphs = [p1, p2]
        const scenes = [parentScene, childScene]

        const mockCy = {
            pan: () => ({ x: 0, y: 0 }),
            zoom: () => 1,
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: () => ({
                length: 0,
                nonempty: () => false,
                empty: () => true,
                position: () => {},
            }),
            style: () => {},
            center: () => {},
            animate: () => {},
        }
        window.cytoscape = () => mockCy as any

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.render(true)

        const childEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-child-drag-2"]'
        ) as HTMLElement
        expect(childEl).not.toBeNull()

        // Drag child scene by (+30, +40)
        childEl.dispatchEvent(
            new PointerEvent('pointerdown', { clientX: 150, clientY: 150, bubbles: true })
        )
        window.dispatchEvent(
            new PointerEvent('pointermove', { clientX: 180, clientY: 190, bubbles: true })
        )
        window.dispatchEvent(
            new PointerEvent('pointerup', { clientX: 180, clientY: 190, bubbles: true })
        )

        // Parent scene position did NOT change
        expect(parentScene.getPosition()).toEqual({ x: 100, y: 100 })
        // Child scene moved +30, +40
        expect(childScene.getPosition()).toEqual({ x: 180, y: 190 })
        // Child paragraph moved +30, +40
        expect(p1.getPosition()).toEqual({ x: 230, y: 240 })
        // Parent-only paragraph did NOT move
        expect(p2.getPosition()).toEqual({ x: 550, y: 300 })

        // Check dynamic z-index: child scene (smaller area) should have higher z-index than parent scene
        const parentNodeEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-parent-drag-2"]'
        ) as HTMLElement
        const childNodeEl = nodesLayer.querySelector(
            'scene-node[data-scene-id="s-child-drag-2"]'
        ) as HTMLElement
        expect(parseInt(childNodeEl.style.zIndex, 10)).toBeGreaterThan(
            parseInt(parentNodeEl.style.zIndex, 10)
        )

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    it('should center the graph on all nodes when center() is called', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 100, y: 100 })

        const storyGraph = new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => [p1],
            getScenes: () => [],
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('new-p', title),
            onToast: () => {},
            t: (k: string) => k,
        })

        storyGraph.render(true)

        expect(typeof storyGraph.center).toBe('function')
        // Call center without errors
        expect(() => storyGraph.center(false)).not.toThrow()
        expect(() => storyGraph.center(true)).not.toThrow()

        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })
})
