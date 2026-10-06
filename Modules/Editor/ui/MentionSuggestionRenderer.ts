import { getIconSvg } from '../../../Utils/icons'
import { IEntityMentionItem } from '../types'

export interface ISuggestionProps {
    items: IEntityMentionItem[]
    command: (attrs: { id: string; label: string; type: string }) => void
    clientRect?: (() => DOMRect | null) | null
    event?: KeyboardEvent
}

export class MentionSuggestionRenderer {
    private container: HTMLElement | null = null
    private selectedIndex: number = 0
    private items: IEntityMentionItem[] = []
    private command: ((attrs: { id: string; label: string; type: string }) => void) | null = null

    public onStart(props: ISuggestionProps): void {
        this.items = props.items || []
        this.command = props.command
        this.selectedIndex = 0
        this.renderPopup(props)
    }

    public onUpdate(props: ISuggestionProps): void {
        this.items = props.items || []
        this.command = props.command
        this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.items.length - 1))
        this.updateItems()
        this.updatePosition(props)
    }

    public onKeyDown(props: { event: KeyboardEvent }): boolean {
        if (!this.container || this.items.length === 0) return false

        if (props.event.key === 'ArrowUp') {
            this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length
            this.updateSelection()
            return true
        }

        if (props.event.key === 'ArrowDown') {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length
            this.updateSelection()
            return true
        }

        if (props.event.key === 'Enter' || props.event.key === 'Tab') {
            this.selectItem(this.selectedIndex)
            return true
        }

        if (props.event.key === 'Escape') {
            this.destroy()
            return true
        }

        return false
    }

    public onExit(): void {
        this.destroy()
    }

    public destroy(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container)
        }
        this.container = null
        this.items = []
        this.command = null
    }

    private selectItem(index: number): void {
        const item = this.items[index]
        if (item && this.command) {
            this.command({
                id: item.id,
                label: item.name,
                type: item.type,
            })
        }
        this.destroy()
    }

    private renderPopup(props: ISuggestionProps): void {
        this.destroy()

        if (!this.items || this.items.length === 0) return

        this.container = document.createElement('div')
        this.container.className =
            'fixed z-50 min-w-[220px] max-w-[320px] max-h-[260px] overflow-y-auto rounded-lg border border-[#2d2d32] bg-[#1f1f22] p-1.5 shadow-2xl backdrop-blur-md text-xs text-zinc-200 custom-scrollbar font-sans'
        this.container.style.display = 'block'

        document.body.appendChild(this.container)
        this.updateItems()
        this.updatePosition(props)
    }

    private updateItems(): void {
        if (!this.container) return

        if (this.items.length === 0) {
            this.container.innerHTML = `
                <div class="px-3 py-2 text-zinc-500 italic text-[11px]">
                    Brak pasujących słów kluczowych...
                </div>
            `
            return
        }

        this.container.innerHTML = this.items
            .map((item, index) => {
                const isSelected = index === this.selectedIndex
                const { badgeClass, icon, typeLabel } = this.getTypeInfo(item.type)

                return `
                <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-600/25 text-white' : 'hover:bg-zinc-800 text-zinc-300'
                }" data-suggestion-index="${index}">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="shrink-0 flex items-center">${icon}</span>
                        <span class="truncate font-medium">${this.escapeHtml(item.name)}</span>
                    </div>
                    <span class="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}">
                        ${typeLabel}
                    </span>
                </div>
            `
            })
            .join('')

        this.container.querySelectorAll('[data-suggestion-index]').forEach(el => {
            el.addEventListener('mousedown', e => {
                e.preventDefault()
                const idx = parseInt(el.getAttribute('data-suggestion-index') || '0', 10)
                this.selectItem(idx)
            })
        })
    }

    private updateSelection(): void {
        if (!this.container) return
        const elements = this.container.querySelectorAll('[data-suggestion-index]')
        elements.forEach((el, index) => {
            const isSelected = index === this.selectedIndex
            el.className = `flex items-center justify-between gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-600/25 text-white' : 'hover:bg-zinc-800 text-zinc-300'
            }`
            if (isSelected) {
                el.scrollIntoView({ block: 'nearest' })
            }
        })
    }

    private updatePosition(props: ISuggestionProps): void {
        if (!this.container || !props.clientRect) return

        const rect = props.clientRect()
        if (!rect) return

        const popupHeight = this.container.offsetHeight || 180
        const popupWidth = this.container.offsetWidth || 220
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth

        let top = rect.bottom + 6
        if (top + popupHeight > viewportHeight && rect.top - popupHeight > 0) {
            top = rect.top - popupHeight - 6
        }

        let left = rect.left
        if (left + popupWidth > viewportWidth) {
            left = viewportWidth - popupWidth - 12
        }

        this.container.style.top = `${Math.max(6, top)}px`
        this.container.style.left = `${Math.max(6, left)}px`
    }

    private getTypeInfo(type: string): { badgeClass: string; icon: string; typeLabel: string } {
        switch (type) {
            case 'location':
                return {
                    icon: getIconSvg('location', 'w-3.5 h-3.5 text-blue-400 shrink-0'),
                    typeLabel: 'Lokacja',
                    badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
                }
            case 'character':
                return {
                    icon: getIconSvg('character', 'w-3.5 h-3.5 text-amber-400 shrink-0'),
                    typeLabel: 'Postać',
                    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                }
            case 'trait':
            case 'tag':
                return {
                    icon: getIconSvg('tag', 'w-3.5 h-3.5 text-purple-400 shrink-0'),
                    typeLabel: 'Cecha',
                    badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
                }
            case 'item':
                return {
                    icon: getIconSvg('item', 'w-3.5 h-3.5 text-emerald-400 shrink-0'),
                    typeLabel: 'Przedmiot',
                    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
                }
            default:
                return {
                    icon: getIconSvg('connection', 'w-3.5 h-3.5 text-zinc-400 shrink-0'),
                    typeLabel: 'Encja',
                    badgeClass: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30',
                }
        }
    }

    private escapeHtml(str: string): string {
        return (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
    }
}
