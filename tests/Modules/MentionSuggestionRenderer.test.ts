// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IEntityMentionItem } from '../../Modules/Editor/types'
import {
    ISuggestionProps,
    MentionSuggestionRenderer,
} from '../../Modules/Editor/ui/MentionSuggestionRenderer'

describe('MentionSuggestionRenderer', () => {
    let renderer: MentionSuggestionRenderer
    let mockCommand: (attrs: { id: string; label: string; type: string }) => void

    const sampleItems: IEntityMentionItem[] = [
        { id: 'loc-1', name: 'Karczma Pod Smokiem', type: 'location' },
        { id: 'npc-1', name: 'Geralt & Jaskier', type: 'character' },
        { id: 'item-1', name: 'Złoty Miecz <Ognisty>', type: 'item' },
        { id: 'trait-1', name: 'Odwaga', type: 'trait' },
        { id: 'tag-1', name: 'Fabuła Główna', type: 'tag' },
    ]

    const createMockProps = (
        items: IEntityMentionItem[] = sampleItems,
        rect: Partial<DOMRect> = { bottom: 100, top: 80, left: 50, right: 150 }
    ): ISuggestionProps => ({
        items,
        command: mockCommand,
        clientRect: () =>
            ({
                bottom: rect.bottom ?? 100,
                top: rect.top ?? 80,
                left: rect.left ?? 50,
                right: rect.right ?? 150,
                width: 100,
                height: 20,
                x: 50,
                y: 80,
                toJSON: () => {},
            }) as DOMRect,
    })

    beforeEach(() => {
        mockCommand = vi.fn()
        renderer = new MentionSuggestionRenderer()
    })

    afterEach(() => {
        renderer.destroy()
        document.body.innerHTML = ''
    })

    it('renders popup with items and attaches to document.body onStart', () => {
        const props = createMockProps()
        renderer.onStart(props)

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        expect(popup).toBeTruthy()

        const renderedItems = popup.querySelectorAll('[data-suggestion-index]')
        expect(renderedItems.length).toBe(5)

        // Sprawdzenie pierwszego zaznaczonego elementu
        expect(renderedItems[0].className).toContain('bg-blue-600/25')
        expect(renderedItems[0].textContent).toContain('Karczma Pod Smokiem')
        expect(renderedItems[0].textContent).toContain('LOCATION')

        // Sprawdzenie drugiego elementu
        expect(renderedItems[1].className).not.toContain('bg-blue-600/25')
        expect(renderedItems[1].textContent).toContain('CHARACTER')
    })

    it('escapes special HTML characters in entity names', () => {
        renderer.onStart(createMockProps())

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        const renderedItems = popup.querySelectorAll('[data-suggestion-index]')

        // Item 1: Geralt & Jaskier -> &amp;
        expect(renderedItems[1].innerHTML).toContain('Geralt &amp; Jaskier')

        // Item 2: Złoty Miecz <Ognisty> -> &lt;Ognisty&gt;
        expect(renderedItems[2].innerHTML).toContain('&lt;Ognisty&gt;')
    })

    it('displays fallback message when items array is empty', () => {
        renderer.onStart(createMockProps([]))

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        expect(popup).toBeTruthy()
        expect(popup.textContent).toContain('Brak pasujących słów kluczowych...')
    })

    it('handles keyboard navigation with ArrowDown and ArrowUp', () => {
        renderer.onStart(createMockProps())
        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement

        // Początkowo wybrany indeks 0
        let items = popup.querySelectorAll('[data-suggestion-index]')
        expect(items[0].className).toContain('bg-blue-600/25')

        // ArrowDown -> wybiera indeks 1
        const downEvent = { event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) }
        const consumedDown = renderer.onKeyDown(downEvent)
        expect(consumedDown).toBe(true)

        items = popup.querySelectorAll('[data-suggestion-index]')
        expect(items[0].className).not.toContain('bg-blue-600/25')
        expect(items[1].className).toContain('bg-blue-600/25')

        // ArrowUp -> wraca do indeksu 0
        const upEvent = { event: new KeyboardEvent('keydown', { key: 'ArrowUp' }) }
        const consumedUp = renderer.onKeyDown(upEvent)
        expect(consumedUp).toBe(true)

        items = popup.querySelectorAll('[data-suggestion-index]')
        expect(items[0].className).toContain('bg-blue-600/25')

        // ArrowUp na indeksie 0 -> wrap-around do ostatniego indeksu (4)
        renderer.onKeyDown(upEvent)
        items = popup.querySelectorAll('[data-suggestion-index]')
        expect(items[4].className).toContain('bg-blue-600/25')
    })

    it('selects item on Enter key and executes command with attributes', () => {
        renderer.onStart(createMockProps())

        // Wybór drugiego elementu (Geralt & Jaskier)
        renderer.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) })

        const enterEvent = { event: new KeyboardEvent('keydown', { key: 'Enter' }) }
        const consumed = renderer.onKeyDown(enterEvent)
        expect(consumed).toBe(true)

        expect(mockCommand).toHaveBeenCalledTimes(1)
        expect(mockCommand).toHaveBeenCalledWith({
            id: 'npc-1',
            label: 'Geralt & Jaskier',
            type: 'character',
        })

        // Popup powinien zostać zniszczony po wyborze
        expect(document.body.querySelector('.custom-scrollbar')).toBeNull()
    })

    it('selects item on Tab key and executes command', () => {
        renderer.onStart(createMockProps())

        const tabEvent = { event: new KeyboardEvent('keydown', { key: 'Tab' }) }
        const consumed = renderer.onKeyDown(tabEvent)
        expect(consumed).toBe(true)

        expect(mockCommand).toHaveBeenCalledWith({
            id: 'loc-1',
            label: 'Karczma Pod Smokiem',
            type: 'location',
        })
    })

    it('destroys popup on Escape key', () => {
        renderer.onStart(createMockProps())
        expect(document.body.querySelector('.custom-scrollbar')).toBeTruthy()

        const escEvent = { event: new KeyboardEvent('keydown', { key: 'Escape' }) }
        const consumed = renderer.onKeyDown(escEvent)
        expect(consumed).toBe(true)
        expect(document.body.querySelector('.custom-scrollbar')).toBeNull()
    })

    it('allows Escape key even when items list is empty', () => {
        renderer.onStart(createMockProps([]))
        expect(document.body.querySelector('.custom-scrollbar')).toBeTruthy()

        const escEvent = { event: new KeyboardEvent('keydown', { key: 'Escape' }) }
        const consumed = renderer.onKeyDown(escEvent)
        expect(consumed).toBe(true)
        expect(document.body.querySelector('.custom-scrollbar')).toBeNull()
    })

    it('ignores navigation keys when items list is empty', () => {
        renderer.onStart(createMockProps([]))

        const downEvent = { event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) }
        expect(renderer.onKeyDown(downEvent)).toBe(false)

        const enterEvent = { event: new KeyboardEvent('keydown', { key: 'Enter' }) }
        expect(renderer.onKeyDown(enterEvent)).toBe(false)
        expect(mockCommand).not.toHaveBeenCalled()
    })

    it('selects item on mousedown and prevents default event', () => {
        renderer.onStart(createMockProps())
        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        const thirdItem = popup.querySelectorAll('[data-suggestion-index]')[2] as HTMLElement

        const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
        thirdItem.dispatchEvent(mousedownEvent)

        expect(mousedownEvent.defaultPrevented).toBe(true)
        expect(mockCommand).toHaveBeenCalledWith({
            id: 'item-1',
            label: 'Złoty Miecz <Ognisty>',
            type: 'item',
        })
        expect(document.body.querySelector('.custom-scrollbar')).toBeNull()
    })

    it('updates items and reclamps selected index on onUpdate', () => {
        renderer.onStart(createMockProps())

        // Przejście na element o indeksie 4
        renderer.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'ArrowUp' }) })

        // Zmniejszenie liczby elementów do 2
        const updatedProps = createMockProps(sampleItems.slice(0, 2))
        renderer.onUpdate(updatedProps)

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        const items = popup.querySelectorAll('[data-suggestion-index]')
        expect(items.length).toBe(2)

        // Indeks powinien zostać ograniczony do 1 (ostatni dopuszczalny)
        expect(items[1].className).toContain('bg-blue-600/25')
    })

    it('initializes popup in onUpdate if container was not yet initialized', () => {
        // Symulacja onUpdate bez wcześniejszego onStart
        const props = createMockProps()
        renderer.onUpdate(props)

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        expect(popup).toBeTruthy()
        expect(popup.querySelectorAll('[data-suggestion-index]').length).toBe(5)
    })

    it('cleans up DOM on onExit and multiple destroy calls safely', () => {
        renderer.onStart(createMockProps())
        expect(document.body.querySelector('.custom-scrollbar')).toBeTruthy()

        renderer.onExit()
        expect(document.body.querySelector('.custom-scrollbar')).toBeNull()

        // Kolejne wywołanie destroy nie rzuca błędu
        expect(() => renderer.destroy()).not.toThrow()
    })

    it('correctly maps type labels and badges for trait and tag', () => {
        renderer.onStart(createMockProps())
        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        const items = popup.querySelectorAll('[data-suggestion-index]')

        // trait-1
        expect(items[3].textContent).toContain('TRAIT')
        // tag-1
        expect(items[4].textContent).toContain('TAG')
    })

    it('positions popup using clientRect coordinates', () => {
        const props = createMockProps(sampleItems, {
            bottom: 250,
            top: 230,
            left: 120,
            right: 220,
        })
        renderer.onStart(props)

        const popup = document.body.querySelector('.custom-scrollbar') as HTMLElement
        expect(popup.style.top).toBe('256px') // bottom + 6
        expect(popup.style.left).toBe('120px')
    })
})
