import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'

function escapeHtml(str: unknown): string {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

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
    private _themeColor: string = '#3b82f6'
    private _isExpanded: boolean = false
    private _isAddFormOpen: boolean = false
    private _onDocumentClick: (e: MouseEvent) => void
    public preventNextClick: boolean = false

    constructor() {
        super()
        this._onDocumentClick = this._handleDocumentClick.bind(this)
    }

    connectedCallback(): void {
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
        this._themeColor = val || '#3b82f6'
        this.render()
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
        const addContainer = this.querySelector('.paragraph-node-add-container')
        if (addContainer) {
            addContainer.classList.add('is-open')
            const input = addContainer.querySelector<HTMLInputElement>('.paragraph-node-add-input')
            if (input) {
                setTimeout(() => input.focus(), 50)
            }
        }
    }

    public closeAddForm(): void {
        this._isAddFormOpen = false
        const addContainer = this.querySelector('.paragraph-node-add-container')
        if (addContainer) {
            addContainer.classList.remove('is-open')
            const input = addContainer.querySelector<HTMLInputElement>('.paragraph-node-add-input')
            if (input) {
                input.value = ''
                input.classList.remove('has-error')
            }
        }
    }

    private _handleDocumentClick(e: MouseEvent): void {
        const target = e.target as Node
        if (this._isAddFormOpen) {
            const addContainer = this.querySelector('.paragraph-node-add-container')
            if (addContainer && !addContainer.contains(target)) {
                this.closeAddForm()
            }
        }
    }

    private _submitAddForm(): void {
        const input = this.querySelector<HTMLInputElement>('.paragraph-node-add-input')
        if (!input) return
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
        const separatorEl = this.querySelector('.paragraph-node-separator')
        const summaryEl = this.querySelector('.paragraph-node-summary')
        if (!separatorEl || !summaryEl) return

        if (this._isExpanded) {
            separatorEl.classList.remove('hidden')
            summaryEl.classList.remove('hidden')
            this.classList.add('is-expanded')
        } else {
            separatorEl.classList.add('hidden')
            summaryEl.classList.add('hidden')
            this.classList.remove('is-expanded')
        }
    }

    public render(): void {
        if (!this._paragraph) {
            this.innerHTML = ''
            return
        }

        const p = this._paragraph
        const borderColor = this._themeColor || '#3b82f6'
        const headerTextColor = getContrastTextColor(borderColor)
        const title = p.getTitle ? p.getTitle() : 'Paragraf'
        const tags: Tag[] = p.getTags ? p.getTags() : []
        const content = p.getContent ? p.getContent() : null
        const summaryText = content && content.getSummary ? content.getSummary() : ''
        const textFallback = content && content.getText ? content.getText().slice(0, 100) : ''
        const summaryDisplay =
            summaryText ||
            textFallback ||
            '<span class="italic text-gray-500">Brak streszczenia</span>'

        const tagsHtml =
            tags.length > 0
                ? tags
                      .map(tObj => {
                          const name = tObj.getName ? tObj.getName() : 'Tag'
                          const color = tObj.getColor ? tObj.getColor() : '#3b82f6'
                          return `<span class="node-tag-pill" style="background-color: ${escapeHtml(color)}">${escapeHtml(name)}</span>`
                      })
                      .join('')
                : '<span class="text-[10px] text-gray-500 italic">Brak tagów</span>'

        this.className = 'paragraph-node group'
        this.style.borderColor = borderColor

        this.innerHTML = `
            <!-- Header bar with exact matching background as border -->
            <div class="paragraph-node-header" style="background-color: ${escapeHtml(borderColor)}; color: ${escapeHtml(headerTextColor)}">
                <span class="paragraph-node-title" title="${escapeHtml(title)}">
                    § ${escapeHtml(title)}
                </span>
                <!-- Connection socket button -->
                <button type="button" class="paragraph-node-socket" title="Gniazdo połączenia (wyciągnij połączenie)" aria-label="Gniazdo połączenia">
                    <span class="socket-inner-dot"></span>
                </button>
            </div>

            <!-- Card Body on default dark background -->
            <div class="paragraph-node-body">
                <!-- Tags Container (style like left panel) -->
                <div class="paragraph-node-tags">
                    ${tagsHtml}
                </div>

                <!-- Separator (visible on expand) -->
                <div class="paragraph-node-separator ${this._isExpanded ? '' : 'hidden'}"></div>

                <!-- Summary text (visible on expand) -->
                <div class="paragraph-node-summary ${this._isExpanded ? '' : 'hidden'}">
                    ${summaryDisplay}
                </div>
            </div>

            <!-- Floating Hover Plus Button & Expandable Add Form -->
            <div class="paragraph-node-add-container ${this._isAddFormOpen ? 'is-open' : ''}">
                <button type="button" class="paragraph-node-add-btn" title="Dodaj nowy powiązany paragraf" aria-label="Dodaj paragraf">
                    +
                </button>
                <div class="paragraph-node-add-form">
                    <input type="text" class="paragraph-node-add-input" placeholder="Tytuł paragrafu..." />
                    <button type="button" class="paragraph-node-add-submit" title="Zatwierdź">
                        ✓
                    </button>
                </div>
            </div>
        `

        // Event Listeners
        const headerEl = this.querySelector('.paragraph-node-header')
        const bodyEl = this.querySelector('.paragraph-node-body')
        const socketBtn = this.querySelector('.paragraph-node-socket')
        const addBtn = this.querySelector('.paragraph-node-add-btn')
        const addSubmitBtn = this.querySelector('.paragraph-node-add-submit')
        const addInput = this.querySelector<HTMLInputElement>('.paragraph-node-add-input')

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

        if (headerEl) {
            headerEl.addEventListener('click', handleNodeClick)
            headerEl.addEventListener('dblclick', handleNodeDblClick)
        }
        if (bodyEl) {
            bodyEl.addEventListener('click', handleNodeClick)
            bodyEl.addEventListener('dblclick', handleNodeDblClick)
        }

        if (socketBtn) {
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
        }

        if (addBtn) {
            addBtn.addEventListener('click', e => {
                e.stopPropagation()
                this.openAddForm()
            })
        }

        if (addSubmitBtn) {
            addSubmitBtn.addEventListener('click', e => {
                e.stopPropagation()
                this._submitAddForm()
            })
        }

        if (addInput) {
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
    }
}

if (typeof customElements !== 'undefined' && !customElements.get('paragraph-node')) {
    customElements.define('paragraph-node', ParagraphNode)
}
