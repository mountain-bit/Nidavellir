/**
 * SceneNodeTemplate.ts
 *
 * Provides the extracted DOM template and element references for the <scene-node> Web Component.
 */

import sceneNodeHtml from './SceneNode.html'

export interface ISceneNodeElements {
    header: HTMLElement
    title: HTMLElement
    badges: HTMLElement | null
    count: HTMLElement
    lockBtn: HTMLButtonElement
    iconUnlocked: HTMLElement | null
    iconLocked: HTMLElement | null
    body: HTMLElement
    handles: HTMLElement[]
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

export function getSceneNodeTemplate(): HTMLTemplateElement | null {
    if (!cachedTemplate && typeof document !== 'undefined') {
        cachedTemplate = document.createElement('template')
        cachedTemplate.innerHTML = sceneNodeHtml.trim()
    }
    return cachedTemplate
}

/**
 * Clones the template content into the given container element
 * and returns references to all key interactive elements.
 */
export function instantiateSceneNodeTemplate(container: HTMLElement): ISceneNodeElements {
    const template = getSceneNodeTemplate()
    if (template && template.content) {
        container.appendChild(template.content.cloneNode(true))
    } else {
        container.innerHTML = sceneNodeHtml.trim()
    }

    const header = container.querySelector('.scene-node-header') as HTMLElement
    const title = container.querySelector('.scene-node-title') as HTMLElement
    const badges = container.querySelector('.scene-node-badges') as HTMLElement | null
    const count = container.querySelector('.scene-node-count') as HTMLElement
    const lockBtn = container.querySelector('.scene-node-lock-btn') as HTMLButtonElement
    const iconUnlocked = container.querySelector('.icon-unlocked') as HTMLElement | null
    const iconLocked = container.querySelector('.icon-locked') as HTMLElement | null
    const body = container.querySelector('.scene-node-body') as HTMLElement
    const handles = Array.from(container.querySelectorAll('.scene-resize-handle')) as HTMLElement[]

    return {
        header,
        title,
        badges,
        count,
        lockBtn,
        iconUnlocked,
        iconLocked,
        body,
        handles,
    }
}

export function createSceneTagBadge(name: string, color: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className =
        'scene-tag-badge px-1.5 py-0.5 rounded text-[10px] text-white truncate max-w-[70px]'
    span.style.backgroundColor = color || '#3b82f6'
    span.title = name
    span.textContent = name
    return span
}

export function createSceneMoreTagsBadge(count: number): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = 'text-[9px] text-gray-400 font-mono'
    span.textContent = `+${count}`
    return span
}
