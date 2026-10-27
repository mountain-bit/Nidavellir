// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { StoryGraph } from '../../Modules/Graph/core/StoryGraph'
import { initTranslationsWithLocale } from '../../Utils/translate'

describe('StoryGraph RMB (Right Mouse Button) Panning', () => {
    let wrapper: HTMLElement
    let canvasContainer: HTMLElement
    let nodesLayer: HTMLElement
    let capturedCyOptions: any
    let mockCy: any
    let currentPan: { x: number; y: number }
    let currentZoom: number

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')

        document.body.innerHTML = ''
        wrapper = document.createElement('div')
        wrapper.id = 'story-graph-wrapper'
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

        capturedCyOptions = null
        window.cytoscape = (options: any) => {
            capturedCyOptions = options
            return mockCy
        }
    })

    function createStoryGraph(paragraphs: Paragraph[] = [], scenes: Scene[] = []): StoryGraph {
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
            t: (k: string) => k,
        })
    }

    it('should initialize Cytoscape with userPanningEnabled: false to disable default left-click drag panning', () => {
        const graph = createStoryGraph()
        graph.render(true)

        expect(capturedCyOptions).toBeDefined()
        expect(capturedCyOptions.userPanningEnabled).toBe(false)
        expect(capturedCyOptions.boxSelectionEnabled).toBe(false)
        graph.destroy()
    })

    it('should not start RMB panning when pressing primary mouse button (LMB, button: 0)', () => {
        const graph = createStoryGraph()
        graph.render(true)

        const lmbEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            clientX: 100,
            clientY: 100,
        })
        canvasContainer.dispatchEvent(lmbEvent)

        expect(graph.isPanningWithRmb()).toBe(false)
        expect(wrapper.classList.contains('is-panning')).toBe(false)
        graph.destroy()
    })

    it('should start RMB panning when pressing right mouse button (RMB, button: 2) on canvasContainer', () => {
        const graph = createStoryGraph()
        graph.render(true)

        const rmbEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 150,
            clientY: 200,
        })
        canvasContainer.dispatchEvent(rmbEvent)

        expect(graph.isPanningWithRmb()).toBe(true)
        expect(wrapper.classList.contains('is-panning')).toBe(true)
        expect(rmbEvent.defaultPrevented).toBe(true)

        graph.destroy()
    })

    it('should start RMB panning when pressing right mouse button on nodesLayer', () => {
        const graph = createStoryGraph()
        graph.render(true)

        const rmbEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 300,
            clientY: 400,
        })
        nodesLayer.dispatchEvent(rmbEvent)

        expect(graph.isPanningWithRmb()).toBe(true)
        expect(wrapper.classList.contains('is-panning')).toBe(true)

        graph.destroy()
    })

    it('should pan the Cytoscape graph and sync nodesLayer transform on mouse move during RMB drag', () => {
        const graph = createStoryGraph()
        graph.render(true)

        // Start RMB drag at (100, 100)
        canvasContainer.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 100,
                clientY: 100,
            })
        )

        // Move mouse by dx=50, dy=-30
        window.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 150,
                clientY: 70,
            })
        )

        expect(mockCy.panBy).toHaveBeenCalledWith({ x: 50, y: -30 })
        expect(currentPan).toEqual({ x: 50, y: -30 })
        expect(nodesLayer.style.transform).toBe('translate(50px, -30px) scale(1)')

        // Move again by dx=-20, dy=10
        window.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 130,
                clientY: 80,
            })
        )

        expect(mockCy.panBy).toHaveBeenCalledWith({ x: -20, y: 10 })
        expect(currentPan).toEqual({ x: 30, y: -20 })
        expect(nodesLayer.style.transform).toBe('translate(30px, -20px) scale(1)')

        graph.destroy()
    })

    it('should fall back to cy.pan() when cy.panBy is undefined', () => {
        delete mockCy.panBy
        const graph = createStoryGraph()
        graph.render(true)

        canvasContainer.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 100,
                clientY: 100,
            })
        )

        window.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 140,
                clientY: 160,
            })
        )

        expect(mockCy.pan).toHaveBeenCalledWith({ x: 40, y: 60 })
        expect(nodesLayer.style.transform).toBe('translate(40px, 60px) scale(1)')

        graph.destroy()
    })

    it('should stop RMB panning on pointerup with button 2', () => {
        const graph = createStoryGraph()
        graph.render(true)

        canvasContainer.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 100,
                clientY: 100,
            })
        )
        expect(graph.isPanningWithRmb()).toBe(true)

        window.dispatchEvent(
            new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 120,
                clientY: 120,
            })
        )

        expect(graph.isPanningWithRmb()).toBe(false)
        expect(wrapper.classList.contains('is-panning')).toBe(false)

        // Subsequent move should not trigger panBy
        mockCy.panBy.mockClear()
        window.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 150,
                clientY: 150,
            })
        )
        expect(mockCy.panBy).not.toHaveBeenCalled()

        graph.destroy()
    })

    it('should stop RMB panning on pointercancel', () => {
        const graph = createStoryGraph()
        graph.render(true)

        canvasContainer.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 100,
                clientY: 100,
            })
        )
        expect(graph.isPanningWithRmb()).toBe(true)

        window.dispatchEvent(
            new PointerEvent('pointercancel', {
                bubbles: true,
                cancelable: true,
            })
        )

        expect(graph.isPanningWithRmb()).toBe(false)
        expect(wrapper.classList.contains('is-panning')).toBe(false)

        graph.destroy()
    })

    it('should prevent default browser context menu on graph canvas and wrapper', () => {
        const graph = createStoryGraph()
        graph.render(true)

        const ctxMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        })
        canvasContainer.dispatchEvent(ctxMenuEvent)
        expect(ctxMenuEvent.defaultPrevented).toBe(true)

        const ctxMenuEvent2 = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
        })
        wrapper.dispatchEvent(ctxMenuEvent2)
        expect(ctxMenuEvent2.defaultPrevented).toBe(true)

        graph.destroy()
    })

    it('should not start RMB panning if target is an input field', () => {
        const graph = createStoryGraph()
        graph.render(true)

        const input = document.createElement('input')
        nodesLayer.appendChild(input)

        const rmbOnInput = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 100,
            clientY: 100,
        })
        input.dispatchEvent(rmbOnInput)

        expect(graph.isPanningWithRmb()).toBe(false)
        expect(wrapper.classList.contains('is-panning')).toBe(false)

        graph.destroy()
    })

    it('should start RMB panning when right-clicking on a scene node or paragraph node', () => {
        const p1 = new Paragraph('p1', 'Paragraf 1')
        p1.setPosition({ x: 100, y: 100 })
        const s1 = new Scene(
            's1',
            'Scena 1',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 50, y: 50 },
            300,
            200
        )

        const graph = createStoryGraph([p1], [s1])
        graph.render(true)

        const pNodeEl = nodesLayer.querySelector(`paragraph-node[data-node-id="p1"]`) as HTMLElement
        expect(pNodeEl).toBeDefined()

        // RMB click on paragraph node
        const rmbOnNode = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 120,
            clientY: 120,
        })
        pNodeEl.dispatchEvent(rmbOnNode)

        expect(graph.isPanningWithRmb()).toBe(true)
        expect(wrapper.classList.contains('is-panning')).toBe(true)

        // Clean up
        window.dispatchEvent(
            new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                button: 2,
            })
        )
        expect(graph.isPanningWithRmb()).toBe(false)

        // RMB click on scene node
        const sNodeEl = nodesLayer.querySelector(`scene-node[data-scene-id="s1"]`) as HTMLElement
        expect(sNodeEl).toBeDefined()

        const rmbOnScene = new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 2,
            clientX: 60,
            clientY: 60,
        })
        sNodeEl.dispatchEvent(rmbOnScene)

        expect(graph.isPanningWithRmb()).toBe(true)
        expect(wrapper.classList.contains('is-panning')).toBe(true)

        graph.destroy()
    })

    it('should remove listeners and reset panning state on destroy', () => {
        const graph = createStoryGraph()
        graph.render(true)

        canvasContainer.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 100,
                clientY: 100,
            })
        )
        expect(graph.isPanningWithRmb()).toBe(true)

        graph.destroy()

        expect(graph.isPanningWithRmb()).toBe(false)
        expect(wrapper.classList.contains('is-panning')).toBe(false)

        // Dispatching pointermove after destroy should not do anything
        mockCy.panBy.mockClear()
        window.dispatchEvent(
            new PointerEvent('pointermove', {
                bubbles: true,
                cancelable: true,
                button: 2,
                clientX: 200,
                clientY: 200,
            })
        )
        expect(mockCy.panBy).not.toHaveBeenCalled()
    })
})
