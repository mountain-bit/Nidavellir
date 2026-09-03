import './ParagraphNode'

import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { ParagraphNode } from './ParagraphNode'
import { IStoryGraphOptions } from './types'

export interface ICytoscapeInstance {
    pan: () => { x: number; y: number }
    zoom: () => number
    resize: () => void
    destroy: () => void
    on: (events: string, handler: unknown) => void
    removeListener: (events: string, handler: unknown) => void
    getElementById: (id: string) =>
        | {
              position: (pos?: { x: number; y: number }) => { x: number; y: number }
          }
        | undefined
}

declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        cytoscape?: (options?: unknown) => ICytoscapeInstance
        cyInstance?: ICytoscapeInstance | null
    }
}

export class StoryGraph {
    private canvasContainer: HTMLElement
    private nodesLayer: HTMLElement
    private options: IStoryGraphOptions
    private cy: ICytoscapeInstance | null = null
    private boundSyncTransform: () => void

    constructor(options: IStoryGraphOptions) {
        this.canvasContainer = options.canvasContainer
        this.nodesLayer = options.nodesLayer
        this.options = options
        this.boundSyncTransform = this.syncTransform.bind(this)
    }

    public getCyInstance(): ICytoscapeInstance | null {
        return this.cy
    }

    public syncTransform(): void {
        if (!this.cy || !this.nodesLayer) return
        const pan = this.cy.pan()
        const zoom = this.cy.zoom()
        this.nodesLayer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`

        // Synchronize dashed grid pattern with Cytoscape pan and zoom
        const gridPattern = document.getElementById('graph-dashed-grid-pattern')
        if (gridPattern) {
            const baseSize = 40
            const scaledSize = baseSize * zoom
            const offsetX = ((pan.x % scaledSize) + scaledSize) % scaledSize
            const offsetY = ((pan.y % scaledSize) + scaledSize) % scaledSize

            gridPattern.setAttribute('x', String(offsetX))
            gridPattern.setAttribute('y', String(offsetY))
            gridPattern.setAttribute('width', String(scaledSize))
            gridPattern.setAttribute('height', String(scaledSize))

            const path = gridPattern.querySelector('path')
            if (path) {
                path.setAttribute('d', `M ${scaledSize} 0 L 0 0 0 ${scaledSize}`)
            }
        }
    }

    public render(forceRebuild = false): void {
        if (!this.canvasContainer || !this.nodesLayer) return
        if (typeof window === 'undefined' || !window.cytoscape) return

        const paragraphs = this.options.getParagraphs()
        const scenes = this.options.getScenes()

        // Prepare Cytoscape elements (nodes for bounding box + edges for choices)
        const elements: Array<Record<string, unknown>> = []

        paragraphs.forEach((p, index) => {
            let pos = p.getPosition()
            if (!pos) {
                const col = index % 3
                const row = Math.floor(index / 3)
                pos = { x: 180 + col * 280, y: 140 + row * 190 }
                p.setPosition(pos)
            }
            elements.push({
                data: { id: p.getId() },
                position: { x: pos.x, y: pos.y },
            })
        })

        // (Connections/edges logic removed for now - will be implemented later)

        // If already initialized and not forced to rebuild
        if (this.cy && !forceRebuild) {
            this.cy.resize()
            this.syncTransform()
            this.renderCustomNodes(paragraphs, scenes)
            return
        }

        if (this.cy) {
            this.cy.destroy()
            this.cy = null
        }

        this.cy = window.cytoscape({
            container: this.canvasContainer,
            elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        shape: 'rectangle',
                        'background-opacity': 0,
                        'border-opacity': 0,
                        width: 220,
                        height: 80,
                        label: '',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2.5,
                        'line-color': '#4f46e5',
                        'target-arrow-color': '#4f46e5',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        label: 'data(label)',
                        color: '#a1a1aa',
                        'font-size': '10px',
                        'text-background-color': '#18181b',
                        'text-background-opacity': 0.85,
                        'text-background-padding': '2px 4px',
                        'text-background-shape': 'roundrectangle',
                    },
                },
            ],
            layout: { name: 'preset' },
            minZoom: 0.2,
            maxZoom: 2.5,
            wheelSensitivity: 0.3,
        })

        window.cyInstance = this.cy

        this.cy.on('pan zoom', this.boundSyncTransform)

        this.renderCustomNodes(paragraphs, scenes)
        this.syncTransform()
    }

    public renderCustomNodes(paragraphs: Paragraph[], scenes: Scene[]): void {
        if (!this.nodesLayer) return
        this.nodesLayer.innerHTML = ''

        paragraphs.forEach((p, index) => {
            let pos = p.getPosition()
            if (!pos) {
                const col = index % 3
                const row = Math.floor(index / 3)
                pos = { x: 180 + col * 280, y: 140 + row * 190 }
                p.setPosition(pos)
            }

            const parentScene = scenes.find(s => s.hasParagraph && s.hasParagraph(p.getId()))
            const sceneColor = '#3b82f6'

            const nodeEl = document.createElement('paragraph-node') as ParagraphNode
            nodeEl.paragraph = p
            nodeEl.themeColor = sceneColor
            nodeEl.style.left = `${pos.x}px`
            nodeEl.style.top = `${pos.y}px`
            nodeEl.dataset.nodeId = p.getId()

            // Drag handling
            let isDragging = false
            let startX = 0
            let startY = 0
            let nodeStartX = pos.x
            let nodeStartY = pos.y
            let hasMoved = false

            const onPointerDown = (e: PointerEvent | MouseEvent): void => {
                const target = e.target as HTMLElement
                if (
                    target.closest('.paragraph-node-socket') ||
                    target.closest('.paragraph-node-add-container') ||
                    target.closest('input') ||
                    target.closest('button')
                ) {
                    return
                }

                isDragging = true
                hasMoved = false
                startX = e.clientX
                startY = e.clientY
                const currentPos = p.getPosition() || pos
                nodeStartX = currentPos.x
                nodeStartY = currentPos.y

                window.addEventListener('pointermove', onPointerMove)
                window.addEventListener('pointerup', onPointerUp)
            }

            const onPointerMove = (e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                const zoom = this.cy ? this.cy.zoom() : 1
                const dx = (e.clientX - startX) / zoom
                const dy = (e.clientY - startY) / zoom

                if (!hasMoved && Math.hypot(dx, dy) > 3) {
                    hasMoved = true
                }

                if (hasMoved) {
                    const newX = Math.round(nodeStartX + dx)
                    const newY = Math.round(nodeStartY + dy)
                    nodeEl.style.left = `${newX}px`
                    nodeEl.style.top = `${newY}px`

                    if (this.cy) {
                        const cyNode = this.cy.getElementById(p.getId())
                        if (cyNode) {
                            cyNode.position({ x: newX, y: newY })
                        }
                    }
                }
            }

            const onPointerUp = (e: PointerEvent | MouseEvent): void => {
                if (!isDragging) return
                isDragging = false
                window.removeEventListener('pointermove', onPointerMove)
                window.removeEventListener('pointerup', onPointerUp)

                if (hasMoved) {
                    // Suppress subsequent click events so details / expansion do not trigger on drag
                    nodeEl.preventNextClick = true
                    setTimeout(() => {
                        nodeEl.preventNextClick = false
                    }, 300)

                    const interceptClick = (ev: MouseEvent): void => {
                        ev.stopImmediatePropagation()
                        ev.preventDefault()
                    }
                    nodeEl.addEventListener('click', interceptClick, { capture: true, once: true })
                    setTimeout(() => {
                        nodeEl.removeEventListener('click', interceptClick, { capture: true })
                    }, 300)

                    const zoom = this.cy ? this.cy.zoom() : 1
                    const dx = (e.clientX - startX) / zoom
                    const dy = (e.clientY - startY) / zoom
                    const finalPos = {
                        x: Math.round(nodeStartX + dx),
                        y: Math.round(nodeStartY + dy),
                    }
                    p.setPosition(finalPos)

                    if (this.cy) {
                        const cyNode = this.cy.getElementById(p.getId())
                        if (cyNode) {
                            cyNode.position(finalPos)
                        }
                    }
                }
            }

            nodeEl.addEventListener('pointerdown', onPointerDown as EventListener)

            // Selection / Details event (triggered on double click)
            const openDetails = (): void => {
                this.options.onSelectParagraph(p, parentScene)
                this.nodesLayer.querySelectorAll('.paragraph-node').forEach(n => {
                    n.classList.toggle('is-selected', n === nodeEl.querySelector('.paragraph-node'))
                })
            }
            nodeEl.addEventListener('node-open-details', openDetails)
            nodeEl.addEventListener('node-select', openDetails)

            // Socket click event
            nodeEl.addEventListener('node-socket-click', () => {
                this.options.onToast('info', this.options.t('graph.socket_tooltip'), 'Informacja')
            })

            // Add paragraph event
            nodeEl.addEventListener('node-add-paragraph', (e: Event) => {
                const customEvent = e as CustomEvent<{ sourceParagraph: Paragraph; title: string }>
                const { sourceParagraph, title } = customEvent.detail

                const newParagraph = this.options.onCreateParagraph(title, sourceParagraph)
                const parentPos = sourceParagraph.getPosition() || { x: 200, y: 200 }
                const newPos = { x: parentPos.x + 270, y: parentPos.y + 40 }
                newParagraph.setPosition(newPos)

                // Re-render
                this.render(true)
                this.options.onSelectParagraph(newParagraph, parentScene)

                this.options.onToast(
                    'success',
                    this.options.t('toast.element_created', { name: title }),
                    this.options.t('toast.element_created_title')
                )
            })

            this.nodesLayer.appendChild(nodeEl)
        })
    }

    public resize(): void {
        if (this.cy) {
            this.cy.resize()
            this.syncTransform()
        }
    }

    public destroy(): void {
        if (this.cy) {
            this.cy.removeListener('pan zoom', this.boundSyncTransform)
            this.cy.destroy()
            this.cy = null
            window.cyInstance = null
        }
        if (this.nodesLayer) {
            this.nodesLayer.innerHTML = ''
        }
    }
}
