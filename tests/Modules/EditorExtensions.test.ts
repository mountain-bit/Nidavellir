/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createEntitySuggestionConfig } from '../../Modules/Editor/extensions/EntityMention'
import { IEntityMentionItem } from '../../Modules/Editor/types'
import {
    ISuggestionProps,
    MentionSuggestionRenderer,
} from '../../Modules/Editor/ui/MentionSuggestionRenderer'

describe('MentionSuggestionRenderer', () => {
    let renderer: MentionSuggestionRenderer
    const mockItems: IEntityMentionItem[] = [
        { id: 'char_1', name: 'Geralt', type: 'character' },
        { id: 'loc_1', name: 'Kaer Morhen', type: 'location' },
        { id: 'item_1', name: 'Srebrny Miecz', type: 'item' },
        { id: 'tag_1', name: 'Wiedźmin', type: 'tag' },
        { id: 'var_1', name: 'Złoto', type: 'variable' },
        { id: 'trait_1', name: 'Znak Aard', type: 'trait' },
        { id: 'custom_1', name: 'Inne', type: 'unknown_type' as any },
    ]

    beforeEach(() => {
        renderer = new MentionSuggestionRenderer()
    })

    afterEach(() => {
        renderer.destroy()
        document.body.innerHTML = ''
    })

    const createMockProps = (items = mockItems, command = vi.fn()): ISuggestionProps => ({
        items,
        command,
        clientRect: () =>
            ({
                top: 50,
                left: 100,
                bottom: 70,
                right: 200,
                width: 100,
                height: 20,
            }) as DOMRect,
    })

    it('renders popup with all entity types and applies proper badges', () => {
        const props = createMockProps()
        renderer.onStart(props)

        const container = document.body.querySelector('.fixed') as HTMLElement
        expect(container).not.toBeNull()

        const renderedItems = container.querySelectorAll('[data-suggestion-index]')
        expect(renderedItems.length).toBe(mockItems.length)

        expect(renderedItems[0].textContent).toContain('Geralt')
        expect(renderedItems[1].textContent).toContain('Kaer Morhen')
        expect(renderedItems[2].textContent).toContain('Srebrny Miecz')
        expect(renderedItems[3].textContent).toContain('Wiedźmin')
        expect(renderedItems[4].textContent).toContain('Złoto')
        expect(renderedItems[5].textContent).toContain('Znak Aard')
    })

    it('handles empty items state gracefully', () => {
        const props = createMockProps([])
        renderer.onStart(props)

        const container = document.body.querySelector('.fixed') as HTMLElement
        expect(container).not.toBeNull()
        expect(container.textContent).toContain('Brak pasujących słów kluczowych')
    })

    it('navigates through items with ArrowDown and ArrowUp and selects with Enter', () => {
        const commandSpy = vi.fn()
        const props = createMockProps(mockItems, commandSpy)
        renderer.onStart(props)

        // Down to index 1
        const downEvent = { event: new KeyboardEvent('keydown', { key: 'ArrowDown' }) }
        const consumedDown = renderer.onKeyDown(downEvent)
        expect(consumedDown).toBe(true)

        // Up wraps back to index 0
        const upEvent = { event: new KeyboardEvent('keydown', { key: 'ArrowUp' }) }
        renderer.onKeyDown(upEvent)

        // Enter selects index 0
        const enterEvent = { event: new KeyboardEvent('keydown', { key: 'Enter' }) }
        const consumedEnter = renderer.onKeyDown(enterEvent)
        expect(consumedEnter).toBe(true)

        expect(commandSpy).toHaveBeenCalledWith({
            id: 'char_1',
            label: 'Geralt',
            type: 'character',
        })
        expect(document.body.querySelector('.fixed')).toBeNull()
    })

    it('selects item with Tab key', () => {
        const commandSpy = vi.fn()
        const props = createMockProps(mockItems, commandSpy)
        renderer.onStart(props)

        const tabEvent = { event: new KeyboardEvent('keydown', { key: 'Tab' }) }
        renderer.onKeyDown(tabEvent)

        expect(commandSpy).toHaveBeenCalledWith({
            id: 'char_1',
            label: 'Geralt',
            type: 'character',
        })
    })

    it('dismisses popup on Escape key or onExit', () => {
        const props = createMockProps()
        renderer.onStart(props)
        expect(document.body.querySelector('.fixed')).not.toBeNull()

        const escEvent = { event: new KeyboardEvent('keydown', { key: 'Escape' }) }
        const consumedEsc = renderer.onKeyDown(escEvent)
        expect(consumedEsc).toBe(true)
        expect(document.body.querySelector('.fixed')).toBeNull()

        renderer.onStart(props)
        expect(document.body.querySelector('.fixed')).not.toBeNull()
        renderer.onExit()
        expect(document.body.querySelector('.fixed')).toBeNull()
    })

    it('ignores unknown keys and calls when destroyed', () => {
        const props = createMockProps()
        renderer.onStart(props)

        const unhandled = renderer.onKeyDown({ event: new KeyboardEvent('keydown', { key: 'a' }) })
        expect(unhandled).toBe(false)

        renderer.destroy()
        const afterDestroy = renderer.onKeyDown({
            event: new KeyboardEvent('keydown', { key: 'Enter' }),
        })
        expect(afterDestroy).toBe(false)
    })

    it('selects item on mouse click (mousedown)', () => {
        const commandSpy = vi.fn()
        const props = createMockProps(mockItems, commandSpy)
        renderer.onStart(props)

        const secondItem = document.body.querySelector('[data-suggestion-index="1"]') as HTMLElement
        expect(secondItem).not.toBeNull()

        const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
        secondItem.dispatchEvent(mousedown)

        expect(commandSpy).toHaveBeenCalledWith({
            id: 'loc_1',
            label: 'Kaer Morhen',
            type: 'location',
        })
    })

    it('updates position and items on onUpdate call', () => {
        const props = createMockProps(mockItems)
        renderer.onStart(props)

        const updatedProps = createMockProps([mockItems[0], mockItems[1]])
        renderer.onUpdate(updatedProps)

        const renderedItems = document.body.querySelectorAll('[data-suggestion-index]')
        expect(renderedItems.length).toBe(2)
    })
})

describe('createEntitySuggestionConfig', () => {
    const mockEntities: IEntityMentionItem[] = [
        { id: 'tavern', name: 'Karczma', type: 'location' },
        { id: 'barkeep', name: 'Jan', type: 'character' },
        { id: 'sword', name: 'Miecz Stalowy', type: 'item' },
    ]

    it('filters entity suggestions by name and id', () => {
        const config = createEntitySuggestionConfig(() => mockEntities)
        const getItems = config.items as (props: { query: string }) => IEntityMentionItem[]

        expect(config.char).toBe('@')
        const allItems = getItems({ query: '' })
        expect(allItems.length).toBe(3)

        const byName = getItems({ query: 'stal' })
        expect(byName).toEqual([mockEntities[2]])

        const byId = getItems({ query: 'bar' })
        expect(byId).toEqual([mockEntities[1]])

        const emptySearch = getItems({ query: 'nonexistent' })
        expect(emptySearch.length).toBe(0)
    })

    it('creates interactive suggestion renderer lifecycle', () => {
        const config = createEntitySuggestionConfig(() => mockEntities)
        const renderObj = (config.render as () => any)()

        const mockProps: any = {
            items: mockEntities,
            command: vi.fn(),
            clientRect: () =>
                ({
                    top: 10,
                    left: 10,
                    bottom: 20,
                    right: 20,
                    width: 10,
                    height: 10,
                }) as DOMRect,
        }

        renderObj.onStart(mockProps)
        expect(document.body.querySelector('.fixed')).not.toBeNull()

        renderObj.onUpdate(mockProps)
        expect(document.body.querySelector('.fixed')).not.toBeNull()

        const consumedEsc = renderObj.onKeyDown({
            event: new KeyboardEvent('keydown', { key: 'Escape' }),
        })
        expect(consumedEsc).toBe(true)

        renderObj.onExit()
    })
})
