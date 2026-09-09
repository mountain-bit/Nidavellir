import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { t } from '../../Utils/translate'
import {
    escapeHtml,
    instantiateParagraphNodeTemplate,
    IParagraphNodeElements,
} from './ParagraphNodeTemplate'
import { GRAPH_THEME } from './StoryGraphStyles'

/**
 * Calculates accessible high-contrast text color (#ffffff or #18181b)
 * based on the background color luminance (YIQ formula).
 */
export function getContrastTextColor(hexColor: string): string {
    if (!hexColor || typeof hexColor !== 'string') return '#ffffff'
    let hex = hexColor.trim().replace('#', '')
    if (hex.length === 3) {
        hex = hex
            .split('')
            .map(c => c + c)
            .join('')
    }
    if (hex.length !== 6) return '#ffffff'
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff'
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 145 ? '#18181b' : '#ffffff'
}

const BaseElement =
    typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as typeof HTMLElement)

export class ParagraphNode extends BaseElement {
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

        addInput.addEventListener('input', () => {
            addInput.classList.remove('has-error')
        })
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
            this._elements.tagsContainer.innerHTML = ''
            this._elements.summaryContainer.innerHTML = ''
            return
        }

        const p = this._paragraph
        const themeColor = this._themeColor || GRAPH_THEME.colors.defaultScene
        const headerTextColor = getContrastTextColor(themeColor)
        const defaultTitle = t('graph.node.default_title')
        const title = p.getTitle ? p.getTitle() : defaultTitle
        const tags: Tag[] = p.getTags ? p.getTags() : []
        const content = p.getContent ? p.getContent() : null
        const summaryText = content && content.getSummary ? content.getSummary() : ''
        const textFallback = content && content.getText ? content.getText().slice(0, 100) : ''

        // 1. Dynamic CSS variables — no hardcoded inline background/colors
        this.style.setProperty('--node-theme-color', themeColor)
        this.style.setProperty('--node-header-text-color', headerTextColor)

        // 2. Header and title
        const displayTitle = title || defaultTitle
        this._elements.title.textContent = `§ ${displayTitle}`
        this._elements.title.title = displayTitle

        // 3. Socket button i18n
        this._elements.socketBtn.title = t('graph.node.socket_title')
        this._elements.socketBtn.setAttribute('aria-label', t('graph.node.socket_aria_label'))

        // 4. Tags with CSS variable per pill
        if (tags.length > 0) {
            const defaultTagName = t('graph.node.default_tag')
            this._elements.tagsContainer.innerHTML = tags
                .map(tObj => {
                    const name = tObj.getName ? tObj.getName() : defaultTagName
                    const color = tObj.getColor ? tObj.getColor() : '#3b82f6'
                    return `<span class="node-tag-pill" style="--tag-color: ${escapeHtml(color)}">${escapeHtml(name)}</span>`
                })
                .join('')
        } else {
            this._elements.tagsContainer.innerHTML = `<span class="paragraph-node-no-tags">${escapeHtml(t('graph.node.no_tags'))}</span>`
        }

        // 5. Summary with clean semantic classes
        if (summaryText || textFallback) {
            this._elements.summaryContainer.textContent = summaryText || textFallback
        } else {
            this._elements.summaryContainer.innerHTML = `<span class="paragraph-node-no-summary">${escapeHtml(t('graph.node.no_summary'))}</span>`
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
