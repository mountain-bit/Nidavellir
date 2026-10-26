import '../../Utils/icons'

import { Scene } from '../../Model/Scene'
import { t } from '../../Utils/translate'
import {
    createSceneMoreTagsBadge,
    createSceneTagBadge,
    instantiateSceneNodeTemplate,
    ISceneNodeElements,
} from './SceneNodeTemplate'
import { getContrastTextColor, GRAPH_THEME } from './StoryGraphStyles'

export class SceneNode extends HTMLElement {
    private _scene: Scene | null = null
    private _themeColor: string = GRAPH_THEME.colors.defaultScene
    private _elements: ISceneNodeElements | null = null
    private _isInitialized: boolean = false
    public preventNextClick: boolean = false

    constructor() {
        super()
    }

    connectedCallback(): void {
        this._ensureDomAttached()
        this.render()
    }

    get scene(): Scene | null {
        return this._scene
    }

    set scene(val: Scene | null) {
        this._scene = val
        this.render()
    }

    get themeColor(): string {
        return this._themeColor
    }

    set themeColor(val: string) {
        this._themeColor = val || GRAPH_THEME.colors.defaultScene
        this.render()
    }

    public setPosition(x: number, y: number): void {
        this.style.left = `${x}px`
        this.style.top = `${y}px`
    }

    public setDimensions(width: number, height: number): void {
        this.style.width = `${Math.max(GRAPH_THEME.dimensions.sceneMinWidth, width)}px`
        this.style.height = `${Math.max(GRAPH_THEME.dimensions.sceneMinHeight, height)}px`
    }

    public setBounds(x: number, y: number, width: number, height: number): void {
        this.setPosition(x, y)
        this.setDimensions(width, height)
    }

    private _ensureDomAttached(): void {
        if (this._isInitialized) return
        this.className = 'scene-node group'
        this._elements = instantiateSceneNodeTemplate(this)
        this._setupEventListeners()
        this._isInitialized = true
    }

    private _setupEventListeners(): void {
        if (!this._elements) return
        const { header, body, lockBtn, handles } = this._elements

        const handleDblClick = (e: MouseEvent): void => {
            const target = e.target as HTMLElement
            if (target.closest('.scene-node-lock-btn') || target.closest('.scene-resize-handle')) {
                return
            }
            e.preventDefault()
            e.stopPropagation()
            this.dispatchEvent(
                new CustomEvent('scene-open-details', {
                    bubbles: true,
                    composed: true,
                    detail: { scene: this._scene },
                })
            )
        }

        header.addEventListener('dblclick', handleDblClick)
        body.addEventListener('dblclick', handleDblClick)

        // Lock button toggle
        lockBtn.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation()
            e.preventDefault()
            if (!this._scene) return
            const newLocked = !this._scene.getIsMovementLocked()
            this._scene.setIsMovementLocked(newLocked)
            this._updateLockUI(newLocked)

            this.dispatchEvent(
                new CustomEvent('scene-toggle-lock', {
                    bubbles: true,
                    composed: true,
                    detail: { scene: this._scene, isMovementLocked: newLocked },
                })
            )
        })

        // Drag & drop handlers for scene
        const onDragOver = (e: DragEvent): void => {
            if (e.dataTransfer) {
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
                this.classList.add('is-drag-target')
            }
        }

        const onDragLeave = (e: DragEvent): void => {
            const related = e.relatedTarget as Node | null
            if (!this.contains(related)) {
                this.classList.remove('is-drag-target')
            }
        }

        const onDrop = (e: DragEvent): void => {
            e.preventDefault()
            e.stopPropagation()
            this.classList.remove('is-drag-target')
            if (!this._scene) return
            const dt = e.dataTransfer
            if (!dt) return

            let entityType = dt.getData('application/x-entity-type')
            let entityId = dt.getData('application/x-entity-id')

            if (!entityType) {
                if (dt.getData('application/x-tag-id')) {
                    entityType = 'tag'
                    entityId = dt.getData('application/x-tag-id')
                } else if (dt.getData('application/x-character-id')) {
                    entityType = 'character'
                    entityId = dt.getData('application/x-character-id')
                } else if (dt.getData('application/x-location-id')) {
                    entityType = 'location'
                    entityId = dt.getData('application/x-location-id')
                }
            }

            if (entityType && entityId) {
                this.dispatchEvent(
                    new CustomEvent('scene-item-drop', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            scene: this._scene,
                            targetScene: this._scene,
                            entityType,
                            entityId,
                        },
                    })
                )
            }
        }

        this.addEventListener('dragover', onDragOver)
        this.addEventListener('dragenter', onDragOver)
        this.addEventListener('dragleave', onDragLeave)
        this.addEventListener('drop', onDrop)

        // Resize handles setup
        handles.forEach(handleEl => {
            const handleType = handleEl.dataset.handle || 'se'

            const onHandlePointerDown = (e: PointerEvent | MouseEvent): void => {
                if (e.button !== 0) return
                e.stopPropagation()
                e.preventDefault()
                if (!this._scene) return

                const startX = e.clientX
                const startY = e.clientY
                const currentPos = this._scene.getPosition() || { x: 0, y: 0 }
                const startNodeX = currentPos.x
                const startNodeY = currentPos.y
                const startWidth = this._scene.getWidth()
                const startHeight = this._scene.getHeight()

                const onHandleMove = (moveEv: PointerEvent | MouseEvent): void => {
                    const zoom =
                        window.cyInstance && typeof window.cyInstance.zoom === 'function'
                            ? window.cyInstance.zoom()
                            : 1
                    const dx = (moveEv.clientX - startX) / zoom
                    const dy = (moveEv.clientY - startY) / zoom

                    let newX = startNodeX
                    let newY = startNodeY
                    let newW = startWidth
                    let newH = startHeight

                    if (handleType.includes('e')) {
                        newW = Math.max(
                            GRAPH_THEME.dimensions.sceneMinWidth,
                            Math.round(startWidth + dx)
                        )
                    }
                    if (handleType.includes('w')) {
                        const proposedW = Math.max(
                            GRAPH_THEME.dimensions.sceneMinWidth,
                            Math.round(startWidth - dx)
                        )
                        newX = Math.round(startNodeX + (startWidth - proposedW))
                        newW = proposedW
                    }
                    if (handleType.includes('s')) {
                        newH = Math.max(
                            GRAPH_THEME.dimensions.sceneMinHeight,
                            Math.round(startHeight + dy)
                        )
                    }
                    if (handleType.includes('n')) {
                        const proposedH = Math.max(
                            GRAPH_THEME.dimensions.sceneMinHeight,
                            Math.round(startHeight - dy)
                        )
                        newY = Math.round(startNodeY + (startHeight - proposedH))
                        newH = proposedH
                    }

                    this._scene?.setPosition({ x: newX, y: newY })
                    this._scene?.setWidth(newW)
                    this._scene?.setHeight(newH)
                    this.setBounds(newX, newY, newW, newH)

                    this.dispatchEvent(
                        new CustomEvent('scene-resize', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                scene: this._scene,
                                bounds: { x: newX, y: newY, width: newW, height: newH },
                            },
                        })
                    )
                }

                const onHandleUp = (): void => {
                    window.removeEventListener('pointermove', onHandleMove)
                    window.removeEventListener('pointerup', onHandleUp)

                    this.dispatchEvent(
                        new CustomEvent('scene-resize-end', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                scene: this._scene,
                                bounds: {
                                    x: this._scene?.getPosition()?.x || 0,
                                    y: this._scene?.getPosition()?.y || 0,
                                    width: this._scene?.getWidth() || 400,
                                    height: this._scene?.getHeight() || 280,
                                },
                            },
                        })
                    )
                }

                window.addEventListener('pointermove', onHandleMove)
                window.addEventListener('pointerup', onHandleUp)
            }

            handleEl.addEventListener('pointerdown', onHandlePointerDown as EventListener)
        })
    }

    private _updateLockUI(isLocked: boolean): void {
        if (!this._elements) return
        const { lockBtn, iconUnlocked, iconLocked } = this._elements

        if (isLocked) {
            this.classList.add('is-locked')
            this.classList.remove('is-unlocked')
            if (iconLocked) iconLocked.classList.remove('hidden')
            if (iconUnlocked) iconUnlocked.classList.add('hidden')
            lockBtn.title = t('graph.scene.unlock_title')
            lockBtn.setAttribute('aria-label', t('graph.scene.unlock_title'))
        } else {
            this.classList.remove('is-locked')
            this.classList.add('is-unlocked')
            if (iconLocked) iconLocked.classList.add('hidden')
            if (iconUnlocked) iconUnlocked.classList.remove('hidden')
            lockBtn.title = t('graph.scene.lock_title')
            lockBtn.setAttribute('aria-label', t('graph.scene.lock_title'))
        }
    }

    public render(): void {
        this._ensureDomAttached()
        if (!this._elements) return

        if (!this._scene) {
            this._elements.title.textContent = ''
            this._elements.count.textContent = ''
            if (this._elements.badges) this._elements.badges.replaceChildren()
            return
        }

        const scene = this._scene
        const themeColor = scene.getColor() || this._themeColor || GRAPH_THEME.colors.defaultScene
        const headerTextColor = getContrastTextColor(themeColor)
        const defaultTitle = t('graph.scene.default_name')
        const title = scene.getName() || defaultTitle
        const paragraphs = scene.getParagraphs() || []
        const isLocked = scene.getIsMovementLocked()

        const tags = scene.getTags ? scene.getTags() : []

        // 1. Position and dimensions
        const pos = scene.getPosition()
        if (pos) {
            this.setPosition(pos.x, pos.y)
        }
        this.setDimensions(scene.getWidth(), scene.getHeight())

        // 2. CSS variables
        this.style.setProperty('--scene-theme-color', themeColor)
        this.style.setProperty('--scene-header-text-color', headerTextColor)

        // 3. Header title
        this._elements.title.textContent = title
        this._elements.title.title = title

        // 4. Badges (Tags only)
        if (this._elements.badges) {
            this._elements.badges.replaceChildren()

            if (tags && tags.length > 0) {
                const fragment = document.createDocumentFragment()
                tags.slice(0, 3).forEach(tObj => {
                    const tName = tObj.getName ? tObj.getName() : 'Tag'
                    const color = tObj.getColor ? tObj.getColor() : '#3b82f6'
                    fragment.appendChild(createSceneTagBadge(tName, color))
                })
                if (tags.length > 3) {
                    fragment.appendChild(createSceneMoreTagsBadge(tags.length - 3))
                }
                this._elements.badges.appendChild(fragment)
            }
        }

        // 5. Paragraphs count
        if (paragraphs.length > 0) {
            this._elements.count.textContent = String(paragraphs.length)
            this._elements.count.classList.remove('hidden')
            this._elements.count.title = t('graph.scene.paragraphs_count', {
                count: paragraphs.length,
            })
        } else {
            this._elements.count.classList.add('hidden')
            this._elements.count.textContent = ''
        }

        // 6. Lock state
        this._updateLockUI(isLocked)
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('scene-node')) {
    customElements.define('scene-node', SceneNode)
}
