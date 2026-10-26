// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { StoryGraph } from '../../Modules/Graph/StoryGraph'
import { initTranslationsWithLocale, t } from '../../Utils/translate'

describe('StoryGraph Viewport Preservation On Drag & Drop and Re-renders', () => {
    let wrapper: HTMLElement
    let canvasContainer: HTMLElement
    let nodesLayer: HTMLElement
    let mockCy: any
    let currentPan: { x: number; y: number }
    let currentZoom: number

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = ''
        wrapper = document.createElement('div')
        wrapper.id = 'story-graph-wrapper'
        wrapper.getBoundingClientRect = () => ({
            left: 0,
            top: 0,
            right: 1200,
            bottom: 800,
            width: 1200,
            height: 800,
            x: 0,
            y: 0,
            toJSON: () => {},
        })

        canvasContainer = document.createElement('div')
        canvasContainer.id = 'story-graph'
        nodesLayer = document.createElement('div')
        nodesLayer.id = 'graph-nodes-layer'

        wrapper.appendChild(canvasContainer)
        wrapper.appendChild(nodesLayer)
        document.body.appendChild(wrapper)

        currentPan = { x: 0, y: 0 }
        currentZoom = 1

        mockCy = {
            pan: vi.fn((pos?: { x: number; y: number }) => {
                if (pos) {
                    currentPan = { ...pos }
                }
                return currentPan
            }),
            panBy: vi.fn((pos: { x: number; y: number }) => {
                currentPan.x += pos.x
                currentPan.y += pos.y
            }),
            zoom: vi.fn((lvl?: number) => {
                if (typeof lvl === 'number') currentZoom = lvl
                return currentZoom
            }),
            center: vi.fn(),
            fit: vi.fn(),
            resize: vi.fn(),
            destroy: vi.fn(),
            on: vi.fn(),
            removeListener: vi.fn(),
            getElementById: vi.fn(() => undefined),
            style: vi.fn(),
            animate: vi.fn(),
        }

        window.cytoscape = (options: any) => {
            if (options?.pan) {
                currentPan = { ...options.pan }
            }
            if (typeof options?.zoom === 'number') {
                currentZoom = options.zoom
            }
            return mockCy
        }
    })

    function createStoryGraph(
        paragraphs: Paragraph[] = [],
        scenes: Scene[] = [],
        extraOptions: Record<string, any> = {}
    ): StoryGraph {
        return new StoryGraph({
            canvasContainer,
            nodesLayer,
            lineStyle: 'curved',
            getParagraphs: () => paragraphs,
            getScenes: () => scenes,
            onSelectParagraph: () => {},
            onSelectChoice: () => {},
            onCreateParagraph: (title: string) => new Paragraph('p-new', title),
            onToast: () => {},
            t,
            ...extraOptions,
        })
    }

    it('should preserve custom pan and zoom when calling render(true) after initial setup', () => {
        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 100, y: 100 })

        const graph = createStoryGraph([p1])
        graph.render(true)

        // Initial pan and zoom
        expect(mockCy.pan()).toEqual({ x: 0, y: 0 })
        expect(mockCy.zoom()).toBe(1)

        // User pans the camera to (-250, 180) and zooms to 1.5
        mockCy.pan({ x: -250, y: 180 })
        mockCy.zoom(1.5)
        graph.syncTransform()

        expect(nodesLayer.style.transform).toBe('translate(-250px, 180px) scale(1.5)')

        // Trigger full rebuild
        graph.render(true)

        // Viewport camera should remain at (-250, 180) and scale 1.5
        expect(mockCy.pan()).toEqual({ x: -250, y: 180 })
        expect(mockCy.zoom()).toBe(1.5)
        expect(nodesLayer.style.transform).toBe('translate(-250px, 180px) scale(1.5)')

        graph.destroy()
    })

    it('should preserve camera view in place when dropping and adding a scene to the graph', () => {
        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 150, y: 150 })
        const scenes: Scene[] = []

        const graph = createStoryGraph([p1], scenes)
        graph.render(true)

        // Simulate user panning and zooming to focus on a particular scene area
        mockCy.pan({ x: -400, y: -200 })
        mockCy.zoom(1.25)
        graph.syncTransform()

        expect(nodesLayer.style.transform).toBe('translate(-400px, -200px) scale(1.25)')

        // Drag & drop a new scene onto the graph
        const newScene = new Scene('s-dropped', 'Scena Upuszczona')
        scenes.push(newScene)

        graph.addSceneToGraph(newScene, { x: 300, y: 250 }, 400, 300)

        // Viewport position must not be reset to (0, 0)
        expect(mockCy.pan()).toEqual({ x: -400, y: -200 })
        expect(mockCy.zoom()).toBe(1.25)
        expect(nodesLayer.style.transform).toBe('translate(-400px, -200px) scale(1.25)')

        const sceneEl = nodesLayer.querySelector('scene-node[data-scene-id="s-dropped"]')
        expect(sceneEl).toBeDefined()

        graph.destroy()
    })

    it('should preserve camera view in place when an entity is assigned or dropped onto a node', () => {
        const onItemAssigned = vi.fn()
        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 200, y: 200 })

        const graph = createStoryGraph([p1], [], { onItemAssigned })
        graph.render(true)

        // User panned to (120, -80) and zoomed to 0.8
        mockCy.pan({ x: 120, y: -80 })
        mockCy.zoom(0.8)
        graph.syncTransform()

        expect(nodesLayer.style.transform).toBe('translate(120px, -80px) scale(0.8)')

        // Re-render after item drop (simulates controller handling onItemAssigned)
        graph.render(true)

        expect(mockCy.pan()).toEqual({ x: 120, y: -80 })
        expect(mockCy.zoom()).toBe(0.8)
        expect(nodesLayer.style.transform).toBe('translate(120px, -80px) scale(0.8)')

        graph.destroy()
    })
})
