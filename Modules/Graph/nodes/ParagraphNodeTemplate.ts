/**
 * ParagraphNodeTemplate.ts
 *
 * Provides the extracted DOM template and element references for the <paragraph-node> Web Component.
 */

import { t } from '../../../Utils/translate'
import paragraphNodeHtml from './ParagraphNode.html'

export interface IParagraphNodeElements {
    header: HTMLElement
    title: HTMLElement
    socketBtn: HTMLButtonElement
    body: HTMLElement
    tagsContainer: HTMLElement
    separator: HTMLElement
    summaryContainer: HTMLElement
    addContainer: HTMLElement
    addBtn: HTMLButtonElement
    addForm: HTMLElement
    addInput: HTMLInputElement
    addSubmitBtn: HTMLButtonElement
}

export function escapeHtml(str: unknown): string {
    if (!str) return ''
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

let cachedTemplate: HTMLTemplateElement | null = null

export function getParagraphNodeTemplate(): HTMLTemplateElement | null {
    if (!cachedTemplate && typeof document !== 'undefined') {
        cachedTemplate = document.createElement('template')
        cachedTemplate.innerHTML = paragraphNodeHtml.trim()
    }
    return cachedTemplate
}

/**
 * Clones the template content into the given container element
 * and returns references to all key interactive elements.
 */
export function instantiateParagraphNodeTemplate(container: HTMLElement): IParagraphNodeElements {
    const template = getParagraphNodeTemplate()
    if (template && template.content) {
        container.appendChild(template.content.cloneNode(true))
    } else {
        container.innerHTML = paragraphNodeHtml.trim()
    }

    const header = container.querySelector('.paragraph-node-header') as HTMLElement
    const title = container.querySelector('.paragraph-node-title') as HTMLElement
    const socketBtn = container.querySelector('.paragraph-node-socket') as HTMLButtonElement
    const body = container.querySelector('.paragraph-node-body') as HTMLElement
    const tagsContainer = container.querySelector('.paragraph-node-tags') as HTMLElement
    const separator = container.querySelector('.paragraph-node-separator') as HTMLElement
    const summaryContainer = container.querySelector('.paragraph-node-summary') as HTMLElement
    const addContainer = container.querySelector('.paragraph-node-add-container') as HTMLElement
    const addBtn = container.querySelector('.paragraph-node-add-btn') as HTMLButtonElement
    const addForm = container.querySelector('.paragraph-node-add-form') as HTMLElement
    const addInput = container.querySelector('.paragraph-node-add-input') as HTMLInputElement
    const addSubmitBtn = container.querySelector('.paragraph-node-add-submit') as HTMLButtonElement

    return {
        header,
        title,
        socketBtn,
        body,
        tagsContainer,
        separator,
        summaryContainer,
        addContainer,
        addBtn,
        addForm,
        addInput,
        addSubmitBtn,
    }
}

export function createLocationPill(name: string, title?: string): HTMLSpanElement {
    const pill = document.createElement('span')
    pill.className = 'node-location-pill'
    if (title) pill.title = title
    pill.textContent = name
    return pill
}

export function createCharacterPill(name: string, title?: string): HTMLSpanElement {
    const pill = document.createElement('span')
    pill.className = 'node-character-pill'
    if (title) pill.title = title
    pill.textContent = name
    return pill
}

export function createCombatPill(
    opponentsCount: number = 0,
    customLabel?: string,
    customTitle?: string
): HTMLSpanElement {
    const pill = document.createElement('span')
    pill.className = 'node-combat-pill'
    pill.title = customTitle || t('graph.node.combat_title') || 'Combat encounter'
    if (customLabel) {
        pill.textContent = customLabel
    } else if (opponentsCount > 0) {
        pill.textContent =
            t('graph.node.combat_with_count', { count: opponentsCount }) ||
            `Combat (${opponentsCount})`
    } else {
        pill.textContent = t('graph.node.combat') || 'Combat'
    }
    return pill
}

export function createTagPill(name: string, color: string): HTMLSpanElement {
    const pill = document.createElement('span')
    pill.className = 'node-tag-pill'
    pill.style.setProperty('--tag-color', color)
    pill.textContent = name
    return pill
}

export function createNoTagsPlaceholder(text: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'paragraph-node-no-tags'
    span.textContent = text
    return span
}

export function createNoSummaryPlaceholder(text: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'paragraph-node-no-summary'
    span.textContent = text
    return span
}
