// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { getContrastTextColor, ParagraphNode } from '../../Modules/Graph/ParagraphNode'
import { instantiateParagraphNodeTemplate } from '../../Modules/Graph/ParagraphNodeTemplate'
import { StoryGraph } from '../../Modules/Graph/StoryGraph'
import { initTranslationsWithLocale, setLanguage, t } from '../../Utils/translate'

describe('getContrastTextColor utility', () => {
    it('should return dark text for light background colors', () => {
        expect(getContrastTextColor('#ffffff')).toBe('#18181b')
        expect(getContrastTextColor('#facc15')).toBe('#18181b') // bright yellow
        expect(getContrastTextColor('#e2e8f0')).toBe('#18181b') // light slate
        expect(getContrastTextColor('#a7f3d0')).toBe('#18181b') // light emerald
        expect(getContrastTextColor('#fff')).toBe('#18181b') // 3-digit hex
    })

    it('should return light text for dark background colors', () => {
        expect(getContrastTextColor('#18181b')).toBe('#ffffff') // dark background
        expect(getContrastTextColor('#000000')).toBe('#ffffff') // black
        expect(getContrastTextColor('#1e3a8a')).toBe('#ffffff') // dark blue
        expect(getContrastTextColor('#581c87')).toBe('#ffffff') // dark purple
        expect(getContrastTextColor('#7f1d1d')).toBe('#ffffff') // dark red
    })

    it('should handle invalid or missing colors gracefully', () => {
        expect(getContrastTextColor('')).toBe('#ffffff')
        expect(getContrastTextColor(null as unknown as string)).toBe('#ffffff')
        expect(getContrastTextColor('invalid')).toBe('#ffffff')
    })
})

describe('instantiateParagraphNodeTemplate', () => {
    it('should clone template and return all interactive element references', () => {
        const container = document.createElement('div')
        const elements = instantiateParagraphNodeTemplate(container)

        expect(elements.header).toBeInstanceOf(HTMLElement)
        expect(elements.title).toBeInstanceOf(HTMLElement)
        expect(elements.socketBtn).toBeInstanceOf(HTMLButtonElement)
        expect(elements.body).toBeInstanceOf(HTMLElement)
        expect(elements.tagsContainer).toBeInstanceOf(HTMLElement)
        expect(elements.separator).toBeInstanceOf(HTMLElement)
        expect(elements.summaryContainer).toBeInstanceOf(HTMLElement)
        expect(elements.addContainer).toBeInstanceOf(HTMLElement)
        expect(elements.addBtn).toBeInstanceOf(HTMLButtonElement)
        expect(elements.addForm).toBeInstanceOf(HTMLElement)
        expect(elements.addInput).toBeInstanceOf(HTMLInputElement)
        expect(elements.addSubmitBtn).toBeInstanceOf(HTMLButtonElement)
    })
})

describe('ParagraphNode Web Component', () => {
    beforeEach(async () => {
        await initTranslationsWithLocale('en')
    })

    it('should render title, CSS variables, and localized buttons correctly', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-1', 'Prologue')
        p.addTag(new Tag('tag-1', 'Story', '#22c55e'))
        node.themeColor = '#3b82f6'
        node.paragraph = p

        expect(node.style.getPropertyValue('--node-theme-color')).toBe('#3b82f6')
        expect(node.style.getPropertyValue('--node-header-text-color')).toBe('#ffffff')

        const titleEl = node.querySelector('.paragraph-node-title')
        expect(titleEl?.textContent).toBe('§ Prologue')

        const tagPill = node.querySelector('.node-tag-pill') as HTMLElement
        expect(tagPill?.textContent).toBe('Story')
        expect(tagPill?.getAttribute('style')).toContain('--tag-color: #22c55e')

        const socketBtn = node.querySelector('.paragraph-node-socket') as HTMLButtonElement
        expect(socketBtn.title).toBe(t('graph.node.socket_title'))

        const addBtn = node.querySelector('.paragraph-node-add-btn') as HTMLButtonElement
        expect(addBtn.title).toBe(t('graph.node.add_btn_title'))

        node.remove()
    })

    it('should set position correctly via setPosition()', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        node.setPosition(150, 320)
        expect(node.style.left).toBe('150px')
        expect(node.style.top).toBe('320px')

        node.remove()
    })

    it('should display localized fallback when no tags and no summary exist', async () => {
        await setLanguage('pl')
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-empty', 'Pusty Paragraf')
        node.paragraph = p

        const noTagsEl = node.querySelector('.paragraph-node-no-tags')
        expect(noTagsEl?.textContent).toBe('Brak tagów')

        const noSummaryEl = node.querySelector('.paragraph-node-no-summary')
        expect(noSummaryEl?.textContent).toBe('Brak streszczenia')

        node.remove()
    })

    it('should toggle expansion state correctly', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-2', 'Chapter 1')
        node.paragraph = p

        expect(node.isExpanded).toBe(false)
        const separator = node.querySelector('.paragraph-node-separator')
        expect(separator?.classList.contains('hidden')).toBe(true)

        node.toggleExpand()
        expect(node.isExpanded).toBe(true)
        expect(node.classList.contains('is-expanded')).toBe(true)
        expect(separator?.classList.contains('hidden')).toBe(false)

        node.toggleExpand()
        expect(node.isExpanded).toBe(false)
        expect(separator?.classList.contains('hidden')).toBe(true)

        node.remove()
    })

    it('should open, submit and dispatch node-add-paragraph event', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-source', 'Source Node')
        node.paragraph = p

        let dispatchedEvent: CustomEvent | null = null
        node.addEventListener('node-add-paragraph', ((e: CustomEvent) => {
            dispatchedEvent = e
        }) as EventListener)

        node.openAddForm()
        const addContainer = node.querySelector('.paragraph-node-add-container')
        expect(addContainer?.classList.contains('is-open')).toBe(true)

        const input = node.querySelector('.paragraph-node-add-input') as HTMLInputElement
        input.value = 'New Connected Node'

        const submitBtn = node.querySelector('.paragraph-node-add-submit') as HTMLButtonElement
        submitBtn.click()

        expect(dispatchedEvent).not.toBeNull()
        expect(dispatchedEvent!.detail.title).toBe('New Connected Node')
        expect(dispatchedEvent!.detail.sourceParagraph).toBe(p)
        expect(addContainer?.classList.contains('is-open')).toBe(false)

        node.remove()
    })

    it('should dispatch node-socket-click on socket button click', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-socket', 'Socket Test')
        node.paragraph = p

        let socketClicked = false
        node.addEventListener('node-socket-click', () => {
            socketClicked = true
        })

        const socketBtn = node.querySelector('.paragraph-node-socket') as HTMLButtonElement
        socketBtn.click()

        expect(socketClicked).toBe(true)
        node.remove()
    })

    it('should dispatch node-open-details on double click', () => {
        const node = document.createElement('paragraph-node') as ParagraphNode
        document.body.appendChild(node)

        const p = new Paragraph('p-dbl', 'DblClick Test')
        node.paragraph = p

        let openedDetails = false
        node.addEventListener('node-open-details', () => {
            openedDetails = true
        })

        const header = node.querySelector('.paragraph-node-header') as HTMLElement
        header.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))

        expect(openedDetails).toBe(true)
        node.remove()
    })
})

describe('StoryGraph focusOnElement', () => {
    it('should focus and center on the target paragraph node element', () => {
        const canvasContainer = document.createElement('div')
        const nodesLayer = document.createElement('div')
        document.body.appendChild(canvasContainer)
        document.body.appendChild(nodesLayer)

        const p1 = new Paragraph('p-focus-1', 'Focus Test 1')
        p1.setPosition({ x: 200, y: 150 })

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

        let animatedCenterEles: unknown = null
        const mockCy = {
            pan: () => ({ x: 0, y: 0 }),
            zoom: () => 1,
            resize: () => {},
            destroy: () => {},
            on: () => {},
            removeListener: () => {},
            getElementById: (id: string) => {
                if (id === 'p-focus-1') {
                    return {
                        position: () => ({ x: 200, y: 150 }),
                        data: () => ({}),
                    }
                }
                return undefined
            },
            style: () => {},
            center: (eles: unknown) => {
                animatedCenterEles = eles
            },
            animate: (options: { center?: { eles: unknown }; pan?: unknown }) => {
                if (options.center) animatedCenterEles = options.center.eles
            },
        }

        window.cytoscape = () => mockCy as any

        storyGraph.render(true)
        storyGraph.focusOnElement('p-focus-1')

        expect(animatedCenterEles).not.toBeNull()
        storyGraph.destroy()
        canvasContainer.remove()
        nodesLayer.remove()
    })

    describe('StoryGraph zoom and wheel sensitivity operations', () => {
        it('should perform zoomIn, zoomOut, zoomTo, resetZoom and getZoomPercentage', () => {
            const canvasContainer = document.createElement('div')
            const nodesLayer = document.createElement('div')
            document.body.appendChild(canvasContainer)
            document.body.appendChild(nodesLayer)

            let currentZoomLevel = 1.0
            let zoomChangeReceived: number | null = null

            const mockCy = {
                pan: (): { x: number; y: number } => ({ x: 0, y: 0 }),
                zoom: (lvl?: number): number => {
                    if (typeof lvl === 'number') {
                        currentZoomLevel = lvl
                    }
                    return currentZoomLevel
                },
                fit: vi.fn(),
                resize: (): void => {},
                destroy: (): void => {},
                on: (_ev: string, selectorOrHandler: unknown): void => {
                    if (typeof selectorOrHandler === 'function') {
                        selectorOrHandler()
                    }
                },
                removeListener: (): void => {},
                getElementById: (): undefined => undefined,
                style: (): void => {},
                animate: (
                    opts: { zoom?: { level?: number } },
                    params?: { complete?: () => void }
                ): void => {
                    if (opts.zoom?.level) {
                        currentZoomLevel = opts.zoom.level
                    }
                    if (params?.complete) params.complete()
                },
                _private: {
                    options: { wheelSensitivity: 0.2 },
                    renderer: { wheelSensitivity: 0.2 },
                },
            }

            window.cytoscape = () => mockCy as any

            const storyGraph = new StoryGraph({
                canvasContainer,
                nodesLayer,
                wheelSensitivity: 0.25,
                onZoomChange: lvl => {
                    zoomChangeReceived = lvl
                },
                getParagraphs: () => [],
                getScenes: () => [],
                onSelectParagraph: () => {},
                onCreateParagraph: () => new Paragraph('p', 'P'),
                onToast: () => {},
                t: k => k,
            })

            storyGraph.render(true)

            expect(storyGraph.getZoom()).toBe(1.0)
            expect(storyGraph.getZoomPercentage()).toBe(100)
            expect(storyGraph.getWheelSensitivity()).toBe(0.25)

            // Test setWheelSensitivity
            storyGraph.setWheelSensitivity(0.35)
            expect(storyGraph.getWheelSensitivity()).toBe(0.35)
            expect(mockCy._private.options.wheelSensitivity).toBe(0.35)
            expect(mockCy._private.renderer.wheelSensitivity).toBe(0.35)

            // Test zoomIn
            storyGraph.zoomIn(1.2)
            expect(currentZoomLevel).toBeCloseTo(1.2)
            expect(storyGraph.getZoomPercentage()).toBe(120)
            expect(zoomChangeReceived).toBeCloseTo(1.2)

            // Test zoomOut
            storyGraph.zoomOut(1.2)
            expect(currentZoomLevel).toBeCloseTo(1.0)
            expect(storyGraph.getZoomPercentage()).toBe(100)

            // Test resetZoom
            storyGraph.zoomTo(2.5)
            expect(storyGraph.getZoomPercentage()).toBe(250)
            storyGraph.resetZoom()
            expect(storyGraph.getZoomPercentage()).toBe(100)

            // Test zoom clamping between 0.05 and 4.0
            storyGraph.zoomTo(0.01)
            expect(currentZoomLevel).toBe(0.05)
            expect(storyGraph.getZoomPercentage()).toBe(5)

            storyGraph.zoomTo(10.0)
            expect(currentZoomLevel).toBe(4.0)
            expect(storyGraph.getZoomPercentage()).toBe(400)

            // Test fit
            storyGraph.fit(50)
            expect(mockCy.fit).toHaveBeenCalledWith(undefined, 50)

            storyGraph.destroy()
            canvasContainer.remove()
            nodesLayer.remove()
        })
    })
})
