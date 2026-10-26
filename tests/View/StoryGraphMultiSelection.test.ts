// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { StoryGraph } from '../../Modules/Graph/StoryGraph'
import { initTranslationsWithLocale, t } from '../../Utils/translate'

describe('StoryGraph Multi-Selection, Group Dragging & Quick Scene Creation', () => {
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

        const cyNodesMap = new Map<
            string,
            { position: (pos?: { x: number; y: number }) => { x: number; y: number } }
        >()

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
            getElementById: vi.fn((id: string) => {
                if (!cyNodesMap.has(id)) {
                    let nodePos = { x: 0, y: 0 }
                    cyNodesMap.set(id, {
                        position: (pos?: { x: number; y: number }) => {
                            if (pos) nodePos = { ...pos }
                            return nodePos
                        },
                    })
                }
                return cyNodesMap.get(id)
            }),
            style: vi.fn(),
            animate: vi.fn(),
        }

        window.cytoscape = () => mockCy
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

    describe('Selection State and Toggle Methods', () => {
        it('should get, set and clear selected paragraph IDs', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const p2 = new Paragraph('p2', 'Paragraf 2')
            const p3 = new Paragraph('p3', 'Paragraf 3')

            const graph = createStoryGraph([p1, p2, p3])
            graph.render(true)

            expect(graph.getSelectedParagraphIds()).toEqual([])

            graph.setSelectedParagraphIds(['p1', 'p2'])
            expect(graph.getSelectedParagraphIds()).toEqual(['p1', 'p2'])

            graph.toggleParagraphSelection('p2')
            expect(graph.getSelectedParagraphIds()).toEqual(['p1'])

            graph.toggleParagraphSelection('p3')
            expect(graph.getSelectedParagraphIds()).toContain('p1')
            expect(graph.getSelectedParagraphIds()).toContain('p3')

            graph.selectAllParagraphs()
            const allSelected = graph.getSelectedParagraphIds()
            expect(allSelected).toContain('p1')
            expect(allSelected).toContain('p2')
            expect(allSelected).toContain('p3')

            graph.clearSelection()
            expect(graph.getSelectedParagraphIds()).toEqual([])

            graph.destroy()
        })

        it('should update visual classes on paragraph node custom elements and inner containers', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const p2 = new Paragraph('p2', 'Paragraf 2')

            const graph = createStoryGraph([p1, p2])
            graph.render(true)

            const node1 = nodesLayer.querySelector(
                'paragraph-node[data-node-id="p1"]'
            ) as HTMLElement
            const node2 = nodesLayer.querySelector(
                'paragraph-node[data-node-id="p2"]'
            ) as HTMLElement

            expect(node1).toBeDefined()
            expect(node2).toBeDefined()
            expect(node1.classList.contains('is-selected')).toBe(false)
            expect(node2.classList.contains('is-selected')).toBe(false)

            graph.setSelectedParagraphIds(['p1'])
            expect(node1.classList.contains('is-selected')).toBe(true)
            expect(node2.classList.contains('is-selected')).toBe(false)

            graph.clearSelection()
            expect(node1.classList.contains('is-selected')).toBe(false)

            graph.destroy()
        })

        it('should trigger onSelectionChange callback when selection changes', () => {
            const onSelectionChange = vi.fn()
            const p1 = new Paragraph('p1', 'Paragraf 1')

            const graph = createStoryGraph([p1], [], { onSelectionChange })
            graph.render(true)

            graph.setSelectedParagraphIds(['p1'])
            expect(onSelectionChange).toHaveBeenCalledWith(['p1'])

            graph.clearSelection()
            expect(onSelectionChange).toHaveBeenCalledWith([])

            graph.destroy()
        })
    })

    describe('Shift / Ctrl Click Selection', () => {
        it('should toggle node selection when clicking with shiftKey, ctrlKey or metaKey', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const p2 = new Paragraph('p2', 'Paragraf 2')

            const graph = createStoryGraph([p1, p2])
            graph.render(true)

            const node1 = nodesLayer.querySelector(
                'paragraph-node[data-node-id="p1"]'
            ) as HTMLElement
            const header1 = node1.querySelector('.paragraph-node-header') as HTMLElement

            // Shift + click on node 1 header
            header1.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    shiftKey: true,
                })
            )

            expect(graph.getSelectedParagraphIds()).toEqual(['p1'])

            // Ctrl + click on node 2 header
            const node2 = nodesLayer.querySelector(
                'paragraph-node[data-node-id="p2"]'
            ) as HTMLElement
            const header2 = node2.querySelector('.paragraph-node-header') as HTMLElement
            header2.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    ctrlKey: true,
                })
            )

            expect(graph.getSelectedParagraphIds()).toContain('p1')
            expect(graph.getSelectedParagraphIds()).toContain('p2')

            // Shift + click on node 1 again to deselect it
            header1.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    shiftKey: true,
                })
            )
            expect(graph.getSelectedParagraphIds()).toEqual(['p2'])

            graph.destroy()
        })
    })

    describe('Marquee Selection Box', () => {
        it('should select paragraphs intersecting the marquee rectangle on canvas LMB drag', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            p1.setPosition({ x: 100, y: 100 })
            const p2 = new Paragraph('p2', 'Paragraf 2')
            p2.setPosition({ x: 400, y: 100 })
            const p3 = new Paragraph('p3', 'Paragraf 3')
            p3.setPosition({ x: 800, y: 800 })

            const graph = createStoryGraph([p1, p2, p3])
            graph.render(true)

            // Start marquee selection drag on canvas at (50, 50)
            canvasContainer.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    button: 0,
                    clientX: 50,
                    clientY: 50,
                })
            )

            // Drag across p1 and p2 area: rectangle (50, 50) to (650, 250)
            window.dispatchEvent(
                new PointerEvent('pointermove', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 650,
                    clientY: 250,
                })
            )

            const marqueeEl = wrapper.querySelector('#graph-selection-marquee') as HTMLElement
            expect(marqueeEl).toBeDefined()
            expect(marqueeEl.classList.contains('hidden')).toBe(false)
            expect(marqueeEl.style.display).toBe('block')

            // p1 (x=100..320, y=100..180) and p2 (x=400..620, y=100..180) should be selected
            // p3 (x=800, y=800) should NOT be selected
            expect(graph.getSelectedParagraphIds()).toContain('p1')
            expect(graph.getSelectedParagraphIds()).toContain('p2')
            expect(graph.getSelectedParagraphIds()).not.toContain('p3')

            // Release pointer
            window.dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 650,
                    clientY: 250,
                })
            )

            expect(marqueeEl.classList.contains('hidden')).toBe(true)
            expect(marqueeEl.style.display).toBe('none')
            expect(graph.getSelectedParagraphIds()).toContain('p1')
            expect(graph.getSelectedParagraphIds()).toContain('p2')

            graph.destroy()
        })

        it('should clear selection when clicking on empty canvas without dragging', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const graph = createStoryGraph([p1])
            graph.render(true)

            graph.setSelectedParagraphIds(['p1'])
            expect(graph.getSelectedParagraphIds()).toEqual(['p1'])

            // Mouse down without movement
            canvasContainer.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    button: 0,
                    clientX: 10,
                    clientY: 10,
                })
            )

            // Mouse up at same position
            window.dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 10,
                    clientY: 10,
                })
            )

            expect(graph.getSelectedParagraphIds()).toEqual([])

            graph.destroy()
        })
    })

    describe('Floating Selection Action Toolbar', () => {
        it('should hide toolbar when fewer than 2 paragraphs are selected and show when 2 or more are selected', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const p2 = new Paragraph('p2', 'Paragraf 2')

            const graph = createStoryGraph([p1, p2])
            graph.render(true)

            const toolbar = wrapper.querySelector('#graph-selection-toolbar') as HTMLElement
            expect(toolbar).toBeDefined()
            expect(toolbar.classList.contains('hidden')).toBe(true)

            // Select 1 paragraph -> still hidden
            graph.setSelectedParagraphIds(['p1'])
            expect(toolbar.classList.contains('hidden')).toBe(true)

            // Select 2 paragraphs -> shown
            graph.setSelectedParagraphIds(['p1', 'p2'])
            expect(toolbar.classList.contains('hidden')).toBe(false)
            expect(toolbar.style.display).toBe('flex')

            const countText = toolbar.querySelector('#graph-selection-count-text')
            expect(countText?.textContent).toContain('2')

            // Clicking clear button in toolbar
            const btnClear = toolbar.querySelector('#btn-selection-clear') as HTMLButtonElement
            btnClear.click()

            expect(graph.getSelectedParagraphIds()).toEqual([])
            expect(toolbar.classList.contains('hidden')).toBe(true)

            graph.destroy()
        })
    })

    describe('Keyboard Shortcuts', () => {
        it('should clear selection on Escape key', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const graph = createStoryGraph([p1])
            graph.render(true)

            graph.setSelectedParagraphIds(['p1'])
            expect(graph.getSelectedParagraphIds()).toEqual(['p1'])

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
            expect(graph.getSelectedParagraphIds()).toEqual([])

            graph.destroy()
        })

        it('should select all paragraphs on Ctrl+A', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const p2 = new Paragraph('p2', 'Paragraf 2')
            const graph = createStoryGraph([p1, p2])
            graph.render(true)

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
            expect(graph.getSelectedParagraphIds()).toContain('p1')
            expect(graph.getSelectedParagraphIds()).toContain('p2')

            graph.destroy()
        })

        it('should create scene on Ctrl+G when 2 or more paragraphs are selected', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            p1.setPosition({ x: 100, y: 100 })
            const p2 = new Paragraph('p2', 'Paragraf 2')
            p2.setPosition({ x: 300, y: 100 })

            const scenes: Scene[] = []
            const graph = createStoryGraph([p1, p2], scenes)
            graph.render(true)

            graph.setSelectedParagraphIds(['p1', 'p2'])

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true }))

            expect(scenes.length).toBe(1)
            expect(scenes[0].hasParagraph('p1')).toBe(true)
            expect(scenes[0].hasParagraph('p2')).toBe(true)

            graph.destroy()
        })
    })

    describe('Group Dragging of Selected Paragraphs', () => {
        it('should translate all selected nodes simultaneously when one node is dragged', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            p1.setPosition({ x: 100, y: 100 })
            const p2 = new Paragraph('p2', 'Paragraf 2')
            p2.setPosition({ x: 400, y: 200 })

            const graph = createStoryGraph([p1, p2])
            graph.render(true)

            graph.setSelectedParagraphIds(['p1', 'p2'])

            const node1 = nodesLayer.querySelector(
                'paragraph-node[data-node-id="p1"]'
            ) as HTMLElement

            // Start dragging node1
            node1.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    cancelable: true,
                    button: 0,
                    clientX: 100,
                    clientY: 100,
                })
            )

            // Move mouse by dx=50, dy=70
            window.dispatchEvent(
                new PointerEvent('pointermove', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 150,
                    clientY: 170,
                })
            )

            // End drag
            window.dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    cancelable: true,
                    clientX: 150,
                    clientY: 170,
                })
            )

            // Both p1 and p2 should have moved by dx=50, dy=70
            expect(p1.getPosition()).toEqual({ x: 150, y: 170 })
            expect(p2.getPosition()).toEqual({ x: 450, y: 270 })

            graph.destroy()
        })
    })

    describe('Quick Scene Creation (createSceneFromSelection)', () => {
        it('should calculate bounding box with proper padding and create enclosing scene', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            p1.setPosition({ x: 100, y: 100 })
            const p2 = new Paragraph('p2', 'Paragraf 2')
            p2.setPosition({ x: 500, y: 300 })

            const scenes: Scene[] = []
            let createdSceneReceived: Scene | null = null

            const graph = createStoryGraph([p1, p2], scenes, {
                onCreateScene: (
                    name: string,
                    pos: { x: number; y: number },
                    w: number,
                    h: number,
                    paras: Paragraph[]
                ) => {
                    const sc = new Scene(
                        's-new',
                        name,
                        undefined,
                        paras,
                        [],
                        null,
                        [],
                        '',
                        pos,
                        w,
                        h
                    )
                    scenes.push(sc)
                    createdSceneReceived = sc
                    return sc
                },
            })
            graph.render(true)

            graph.setSelectedParagraphIds(['p1', 'p2'])

            const scene = graph.createSceneFromSelection('Scena Testowa')

            expect(scene).toBeDefined()
            expect(createdSceneReceived).toBe(scene)
            expect(scene?.getName()).toBe('Scena Testowa')

            // Bounding box:
            // minX = 100, minY = 100
            // maxX = 500 + 220 = 720
            // maxY = 300 + 80 = 380
            // paddingX = 40, paddingTop = 60, paddingBottom = 40
            // sX = 100 - 40 = 60
            // sY = 100 - 60 = 40
            // sW = (720 - 100) + 80 = 700
            // sH = (380 - 100) + 60 + 40 = 380
            const pos = scene?.getPosition()
            expect(pos).toEqual({ x: 60, y: 40 })
            expect(scene?.getWidth()).toBe(700)
            expect(scene?.getHeight()).toBe(380)

            // Both paragraphs assigned to scene
            expect(scene?.hasParagraph('p1')).toBe(true)
            expect(scene?.hasParagraph('p2')).toBe(true)

            // Selection is cleared after scene creation
            expect(graph.getSelectedParagraphIds()).toEqual([])

            graph.destroy()
        })
    })

    describe('Destruction Cleanup', () => {
        it('should unbind window and container listeners and remove DOM elements on destroy', () => {
            const p1 = new Paragraph('p1', 'Paragraf 1')
            const graph = createStoryGraph([p1])
            graph.render(true)

            graph.setSelectedParagraphIds(['p1'])
            expect(graph.getSelectedParagraphIds()).toEqual(['p1'])

            graph.destroy()

            expect(graph.getSelectedParagraphIds()).toEqual([])
            expect(wrapper.querySelector('#graph-selection-marquee')).toBeNull()
            expect(wrapper.querySelector('#graph-selection-toolbar')).toBeNull()

            // Escape key after destroy should not throw
            expect(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
            }).not.toThrow()
        })
    })
})
