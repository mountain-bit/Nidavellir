import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { getIconSvg } from '../../Utils/icons'
import { t } from '../../Utils/translate'
import {
    createCharacterPill,
    createCombatPill,
    createLocationPill,
    createNoSummaryPlaceholder,
    createNoTagsPlaceholder,
    createTagPill,
    instantiateParagraphNodeTemplate,
    IParagraphNodeElements,
} from './ParagraphNodeTemplate'
import { getContrastTextColor, GRAPH_THEME } from './StoryGraphStyles'

export { getContrastTextColor }

export class ParagraphNode extends HTMLElement {
    private _paragraph: Paragraph | null = null
    private _themeColor: string = GRAPH_THEME.colors.defaultScene
    private _isExpanded: boolean = false
    private _isAddFormOpen: boolean = false
    private _onDocumentClick: (e: MouseEvent) => void
    private _elements: IParagraphNodeElements | null = null
    private _isInitialized: boolean = false
    public preventNextClick: boolean = false

    constructor() {
        super()
        this._onDocumentClick = this._handleDocumentClick.bind(this)
    }

    connectedCallback(): void {
        this._ensureDomAttached()
        this.render()
        document.addEventListener('click', this._onDocumentClick)
    }

    disconnectedCallback(): void {
        document.removeEventListener('click', this._onDocumentClick)
    }

    get paragraph(): Paragraph | null {
        return this._paragraph
    }

    set paragraph(val: Paragraph | null) {
        this._paragraph = val
        this.render()
    }

    get themeColor(): string {
        return this._themeColor
    }

    set themeColor(val: string) {
        this._themeColor = val || GRAPH_THEME.colors.defaultScene
        this.render()
    }

    /**
     * Encapsulated position assignment for absolute DOM placement.
     */
    public setPosition(x: number, y: number): void {
        this.style.left = `${x}px`
        this.style.top = `${y}px`
    }

    get isExpanded(): boolean {
        return this._isExpanded
    }

    set isExpanded(val: boolean) {
        this._isExpanded = Boolean(val)
        this._updateExpansionUI()
    }

    public toggleExpand(): void {
        if (this._paragraph && this._paragraph.getIsStart && this._paragraph.getIsStart()) {
            return
        }
        this.isExpanded = !this.isExpanded
    }

    public openAddForm(): void {
        this._isAddFormOpen = true
        if (this._elements) {
            this._elements.addContainer.classList.add('is-open')
            setTimeout(() => this._elements?.addInput.focus(), 50)
        }
    }

    public closeAddForm(): void {
        this._isAddFormOpen = false
        if (this._elements) {
            this._elements.addContainer.classList.remove('is-open')
            this._elements.addInput.value = ''
            this._elements.addInput.classList.remove('has-error')
        }
    }

    private _ensureDomAttached(): void {
        if (this._isInitialized) return
        this.className = 'paragraph-node group'
        this._elements = instantiateParagraphNodeTemplate(this)
        this._setupEventListeners()
        this._isInitialized = true
    }

    private _setupEventListeners(): void {
        if (!this._elements) return
        const { header, body, socketBtn, addBtn, addSubmitBtn, addInput } = this._elements

        const handleNodeClick = (e: Event): void => {
            if (this.preventNextClick) {
                this.preventNextClick = false
                return
            }
            const target = e.target as HTMLElement
            if (
                target.closest('.paragraph-node-socket') ||
                target.closest('.paragraph-node-add-container')
            ) {
                return
            }
            if (this._paragraph && this._paragraph.getIsStart && this._paragraph.getIsStart()) {
                this.dispatchEvent(
                    new CustomEvent('node-select', {
                        bubbles: true,
                        composed: true,
                        detail: { paragraph: this._paragraph },
                    })
                )
                return
            }
            this.toggleExpand()
        }

        const handleNodeDblClick = (e: Event): void => {
            const target = e.target as HTMLElement
            if (
                target.closest('.paragraph-node-socket') ||
                target.closest('.paragraph-node-add-container')
            ) {
                return
            }
            e.preventDefault()
            e.stopPropagation()
            if (this._paragraph && this._paragraph.getIsStart && this._paragraph.getIsStart()) {
                this.dispatchEvent(
                    new CustomEvent('node-select', {
                        bubbles: true,
                        composed: true,
                        detail: { paragraph: this._paragraph },
                    })
                )
                return
            }
            this.dispatchEvent(
                new CustomEvent('node-open-details', {
                    bubbles: true,
                    composed: true,
                    detail: { paragraph: this._paragraph },
                })
            )
        }

        header.addEventListener('click', handleNodeClick)
        header.addEventListener('dblclick', handleNodeDblClick)
        body.addEventListener('click', handleNodeClick)
        body.addEventListener('dblclick', handleNodeDblClick)

        socketBtn.addEventListener('pointerdown', e => {
            e.stopPropagation()
            this.dispatchEvent(
                new CustomEvent('node-socket-pointerdown', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        paragraph: this._paragraph,
                        socketElement: socketBtn,
                        originalEvent: e,
                    },
                })
            )
        })

        socketBtn.addEventListener('click', e => {
            e.stopPropagation()
            this.dispatchEvent(
                new CustomEvent('node-socket-click', {
                    bubbles: true,
                    composed: true,
                    detail: { paragraph: this._paragraph, socketElement: socketBtn },
                })
            )
        })

        addBtn.addEventListener('click', e => {
            e.stopPropagation()
            this.openAddForm()
        })

        addSubmitBtn.addEventListener('click', e => {
            e.stopPropagation()
            this._submitAddForm()
        })

        addInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault()
                this._submitAddForm()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                this.closeAddForm()
            }
        })

        const onDragOver = (e: DragEvent): void => {
            if (this._paragraph && this._paragraph.getIsStart && this._paragraph.getIsStart()) {
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'none'
                }
                return
            }
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
            this.classList.remove('is-drag-target')
            if (this._paragraph && this._paragraph.getIsStart && this._paragraph.getIsStart()) {
                return
            }
            e.preventDefault()
            e.stopPropagation()
            if (!this._paragraph) return
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
                    new CustomEvent('node-item-drop', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            paragraph: this._paragraph,
                            targetParagraph: this._paragraph,
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
    }

    private _handleDocumentClick(e: MouseEvent): void {
        const target = e.target as Node
        if (this._isAddFormOpen && this._elements) {
            if (!this._elements.addContainer.contains(target)) {
                this.closeAddForm()
            }
        }
    }

    private _submitAddForm(): void {
        if (!this._elements) return
        const input = this._elements.addInput
        const title = input.value.trim()
        if (!title) {
            input.classList.add('has-error')
            input.focus()
            return
        }

        input.classList.remove('has-error')
        const sourceParagraph = this._paragraph

        this.dispatchEvent(
            new CustomEvent('node-add-paragraph', {
                bubbles: true,
                composed: true,
                detail: {
                    sourceParagraph,
                    title,
                },
            })
        )

        this.closeAddForm()
    }

    private _updateExpansionUI(): void {
        if (!this._elements) return
        const { separator, summaryContainer } = this._elements

        if (this._isExpanded) {
            separator.classList.remove('hidden')
            summaryContainer.classList.remove('hidden')
            this.classList.add('is-expanded')
        } else {
            separator.classList.add('hidden')
            summaryContainer.classList.add('hidden')
            this.classList.remove('is-expanded')
        }
    }

    public render(): void {
        this._ensureDomAttached()
        if (!this._elements) return

        if (!this._paragraph) {
            this._elements.title.textContent = ''
            this._elements.tagsContainer.replaceChildren()
            this._elements.summaryContainer.replaceChildren()
            return
        }

        const p = this._paragraph
        const themeColor = this._themeColor || GRAPH_THEME.colors.defaultScene
        const headerTextColor = getContrastTextColor(themeColor)
        const defaultTitle = t('graph.node.default_title')
        const title = p.getTitle ? p.getTitle() : defaultTitle
        const tags: Tag[] = p.getTags ? p.getTags() : []
        const characters = p.getCharacters ? p.getCharacters() : []
        const locations = p.getLocations
            ? p.getLocations()
            : p.getLocation && p.getLocation()
              ? [p.getLocation()!]
              : []
        const content = p.getContent ? p.getContent() : null
        const summaryText = content && content.getSummary ? content.getSummary() : ''
        const textFallback = content && content.getText ? content.getText().slice(0, 100) : ''

        const isStart = Boolean(p.getIsStart && p.getIsStart())

        // 1. Dynamic CSS variables — no hardcoded inline background/colors
        if (isStart) {
            this.classList.add('is-start-node')
            this.classList.remove('is-expanded')
            this._isExpanded = false
            this.style.setProperty('--node-theme-color', GRAPH_THEME.colors.startNode || '#10b981')
            this.style.setProperty('--node-header-text-color', '#ffffff')

            this._elements.title.innerHTML = `${getIconSvg('play', 'w-3.5 h-3.5 inline-block shrink-0')}<span>START</span>`
            this._elements.title.title = `START - ${t('graph.start_node_entry_point') || 'Punkt startowy opowieści'}`
            this._elements.socketBtn.title =
                t('graph.start_node_socket_title') ||
                'Gniazdo początkowe (przeciągnij do pierwszego paragrafu)'
            this._elements.socketBtn.setAttribute('aria-label', 'START socket')

            // START node has NO tags, NO locations, NO characters, NO summary, NO description
            this._elements.tagsContainer.replaceChildren()
            this._elements.tagsContainer.classList.add('hidden')
            this._elements.separator.classList.add('hidden')
            this._elements.summaryContainer.replaceChildren()
            this._elements.summaryContainer.classList.add('hidden')

            // Render technical instruction block in body
            let instructionEl = this._elements.body.querySelector(
                '.start-node-instruction'
            ) as HTMLElement | null
            if (!instructionEl) {
                instructionEl = document.createElement('div')
                instructionEl.className = 'start-node-instruction'
                this._elements.body.appendChild(instructionEl)
            }
            instructionEl.innerHTML = `
                <div class="start-node-badge">
                    <span class="start-node-dot"></span>
                    <span>${t('graph.start_node_entry_point') || 'PUNKT STARTOWY'}</span>
                </div>
                <div class="start-node-hint">
                    ${t('graph.start_node_technical_hint') || 'Tu rozpoczyna się historia. Przeciągnij połączenie z prawego gniazda lub użyj (+), aby utworzyć pierwszy paragraf.'}
                </div>
            `

            this._elements.addBtn.title = t('graph.node.add_btn_title')
            this._elements.addBtn.setAttribute('aria-label', t('graph.node.add_btn_aria_label'))
            this._elements.addInput.placeholder = t('graph.node.add_input_placeholder')
            this._elements.addSubmitBtn.title = t('graph.node.add_submit_title')

            if (this._isAddFormOpen) {
                this._elements.addContainer.classList.add('is-open')
            } else {
                this._elements.addContainer.classList.remove('is-open')
            }
            return
        }

        this.classList.remove('is-start-node')
        const oldInstruction = this._elements.body.querySelector('.start-node-instruction')
        if (oldInstruction) oldInstruction.remove()
        this._elements.tagsContainer.classList.remove('hidden')

        this.style.setProperty('--node-theme-color', themeColor)
        this.style.setProperty('--node-header-text-color', headerTextColor)

        const displayTitle = title || defaultTitle
        const isEnd = Boolean(p.getIsEnd && p.getIsEnd())
        if (isEnd) {
            this.classList.add('is-end-node')
            this._elements.title.innerHTML = `<span class="end-node-badge">${getIconSvg('flag', 'w-2.5 h-2.5 inline-block shrink-0')}<span>KONIEC</span></span><span>§ ${displayTitle}</span>`
            this._elements.title.title = `${displayTitle} (Finał opowieści)`
        } else {
            this.classList.remove('is-end-node')
            this._elements.title.textContent = `§ ${displayTitle}`
            this._elements.title.title = displayTitle
        }

        // 3. Socket button i18n
        this._elements.socketBtn.title = t('graph.node.socket_title')
        this._elements.socketBtn.setAttribute('aria-label', t('graph.node.socket_aria_label'))

        // 4. Badges (Combat, Locations, Characters, Tags)
        this._elements.tagsContainer.replaceChildren()
        const badgesFragment = document.createDocumentFragment()

        const hasCombat = Boolean(p.getHasCombat && p.getHasCombat())
        if (hasCombat) {
            const combat = p.getCombat ? p.getCombat() : null
            const oppCount =
                combat && combat.getCombatOpponents ? combat.getCombatOpponents().length : 0
            badgesFragment.appendChild(createCombatPill(oppCount))
        }

        if (locations && locations.length > 0) {
            locations.forEach(loc => {
                const locName = loc.getName ? loc.getName() : 'Location'
                badgesFragment.appendChild(
                    createLocationPill(locName, `${t('location.list')}: ${locName}`)
                )
            })
        }

        if (characters && characters.length > 0) {
            characters.forEach(c => {
                const charName = c.getName ? c.getName() : 'Character'
                badgesFragment.appendChild(
                    createCharacterPill(charName, `${t('character.npc')}: ${charName}`)
                )
            })
        }

        if (tags.length > 0) {
            const defaultTagName = t('graph.node.default_tag')
            tags.forEach(tObj => {
                const name = tObj.getName ? tObj.getName() : defaultTagName
                const color = tObj.getColor ? tObj.getColor() : '#3b82f6'
                badgesFragment.appendChild(createTagPill(name, color))
            })
        }

        if (badgesFragment.childNodes.length > 0) {
            this._elements.tagsContainer.appendChild(badgesFragment)
        } else {
            this._elements.tagsContainer.appendChild(
                createNoTagsPlaceholder(t('graph.node.no_tags'))
            )
        }

        // 5. Summary with clean semantic classes
        if (summaryText || textFallback) {
            this._elements.summaryContainer.textContent = summaryText || textFallback
        } else {
            this._elements.summaryContainer.replaceChildren(
                createNoSummaryPlaceholder(t('graph.node.no_summary'))
            )
        }

        // 6. Add button & form i18n
        this._elements.addBtn.title = t('graph.node.add_btn_title')
        this._elements.addBtn.setAttribute('aria-label', t('graph.node.add_btn_aria_label'))
        this._elements.addInput.placeholder = t('graph.node.add_input_placeholder')
        this._elements.addSubmitBtn.title = t('graph.node.add_submit_title')

        // 7. Expansion & form states
        this._updateExpansionUI()
        if (this._isAddFormOpen) {
            this._elements.addContainer.classList.add('is-open')
        } else {
            this._elements.addContainer.classList.remove('is-open')
        }
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('paragraph-node')) {
    customElements.define('paragraph-node', ParagraphNode)
}
