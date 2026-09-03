// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { Tag } from '../../Model/Tag'
import { getContrastTextColor, ParagraphNode } from '../../Modules/Graph/ParagraphNode'
import { instantiateParagraphNodeTemplate } from '../../Modules/Graph/ParagraphNodeTemplate'
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
