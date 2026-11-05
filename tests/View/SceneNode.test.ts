/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { Tag } from '../../Model/Tag'
import { SceneNode } from '../../Modules/Graph/nodes/SceneNode'
import {
    escapeHtml,
    instantiateSceneNodeTemplate,
} from '../../Modules/Graph/nodes/SceneNodeTemplate'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'

describe('instantiateSceneNodeTemplate', () => {
    it('should clone template and return all interactive element references', () => {
        const container = document.createElement('div')
        const elements = instantiateSceneNodeTemplate(container)

        expect(elements.header).toBeInstanceOf(HTMLElement)
        expect(elements.title).toBeInstanceOf(HTMLElement)
        expect(elements.count).toBeInstanceOf(HTMLElement)
        expect(elements.lockBtn).toBeInstanceOf(HTMLButtonElement)
        expect(elements.body).toBeInstanceOf(HTMLElement)
        expect(elements.handles.length).toBe(8)
    })

    it('should escape HTML characters correctly', () => {
        expect(escapeHtml('')).toBe('')
        expect(escapeHtml(null)).toBe('')
        expect(escapeHtml('<script>alert("x & y\'")</script>')).toBe(
            '&lt;script&gt;alert(&quot;x &amp; y&#039;&quot;)&lt;/script&gt;'
        )
    })
})

describe('SceneNode Web Component', () => {
    beforeEach(async () => {
        await initTranslationsWithLocale('en')
    })

    it('should render title, color, lock icon, and paragraph count badge', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const p1 = new Paragraph('p-1', 'Paragraf 1')
        const scene = new Scene(
            's-1',
            'Arena Walk',
            undefined,
            [p1],
            [],
            null,
            [],
            '',
            { x: 50, y: 80 },
            350,
            250,
            '#e11d48',
            true
        )

        node.scene = scene

        expect(node.style.getPropertyValue('--scene-theme-color')).toBe('#e11d48')
        expect(node.style.left).toBe('50px')
        expect(node.style.top).toBe('80px')
        expect(node.style.width).toBe('350px')
        expect(node.style.height).toBe('250px')

        const titleEl = node.querySelector('.scene-node-title')
        expect(titleEl?.textContent).toBe('Arena Walk')

        const countBadge = node.querySelector('.scene-node-count')
        expect(countBadge?.textContent).toBe('1')

        node.remove()
    })

    it('should toggle lock state and dispatch scene-toggle-lock on lock button click', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene(
            's-2',
            'Zamek',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 0, y: 0 },
            300,
            200,
            '#3b82f6',
            true
        )
        node.scene = scene

        const lockToggleSpy = vi.fn()
        node.addEventListener('scene-toggle-lock', lockToggleSpy)

        const lockBtn = node.querySelector('.scene-node-lock-btn') as HTMLButtonElement
        expect(lockBtn).not.toBeNull()

        lockBtn.click()

        expect(scene.getIsMovementLocked()).toBe(false)
        expect(lockToggleSpy).toHaveBeenCalledTimes(1)
        expect(lockToggleSpy.mock.calls[0][0].detail.isMovementLocked).toBe(false)

        lockBtn.click()
        expect(scene.getIsMovementLocked()).toBe(true)
        expect(lockToggleSpy).toHaveBeenCalledTimes(2)
        expect(lockToggleSpy.mock.calls[1][0].detail.isMovementLocked).toBe(true)

        node.remove()
    })

    it('should dispatch scene-open-details when double clicking on header badge', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene(
            's-3',
            'Port',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 10, y: 10 },
            300,
            200
        )
        node.scene = scene

        const openDetailsSpy = vi.fn()
        node.addEventListener('scene-open-details', openDetailsSpy)

        const headerBadge = node.querySelector('.scene-node-header') as HTMLElement
        expect(headerBadge).not.toBeNull()

        headerBadge.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        expect(openDetailsSpy).toHaveBeenCalledTimes(1)

        node.remove()
    })

    it('should update geometry via setDimensions and setPosition', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        node.setPosition(120, 240)
        expect(node.style.left).toBe('120px')
        expect(node.style.top).toBe('240px')

        node.setDimensions(500, 400)
        expect(node.style.width).toBe('500px')
        expect(node.style.height).toBe('400px')

        node.remove()
    })

    it('should render tag badges on scene node header and not location/character markers', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene(
            's-badges',
            'Enchanted Valley',
            undefined,
            [],
            [new NPC('npc-elena', 'Elena')],
            new Location('loc-valley', 'Hidden Valley'),
            [new Tag('tag-mag', 'Magic', '#8b5cf6')]
        )
        node.scene = scene

        const locBadge = node.querySelector('.scene-location-badge')
        expect(locBadge).toBeNull()

        const charBadge = node.querySelector('.scene-characters-badge')
        expect(charBadge).toBeNull()

        const tagBadge = node.querySelector('.scene-tag-badge') as HTMLElement
        expect(tagBadge).not.toBeNull()
        expect(tagBadge.textContent).toContain('Magic')

        node.remove()
    })

    it('should handle drop event and dispatch scene-item-drop event', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene('s-drop', 'Drop Target Scene')
        node.scene = scene

        let dropDetail: any = null
        node.addEventListener('scene-item-drop', ((e: CustomEvent) => {
            dropDetail = e.detail
        }) as EventListener)

        const dropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
        dropEvent.dataTransfer = {
            getData: (type: string) => {
                if (type === 'application/x-entity-type') return 'character'
                if (type === 'application/x-entity-id') return 'npc-elena'
                return ''
            },
        }

        node.dispatchEvent(dropEvent)
        expect(dropDetail).not.toBeNull()
        expect(dropDetail.targetScene).toBe(scene)
        expect(dropDetail.entityType).toBe('character')
        expect(dropDetail.entityId).toBe('npc-elena')

        node.remove()
    })

    it('should handle fallback drop MIME types and ignore invalid drop', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene('s-drop-2', 'Drop Target Scene 2')
        node.scene = scene

        let dropDetail: any = null
        node.addEventListener('scene-item-drop', ((e: CustomEvent) => {
            dropDetail = e.detail
        }) as EventListener)

        // Drop with application/x-tag-id fallback
        const dropTagEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
        dropTagEvent.dataTransfer = {
            getData: (type: string) => {
                if (type === 'application/x-tag-id') return 'tag-123'
                return ''
            },
        }
        node.dispatchEvent(dropTagEvent)
        expect(dropDetail).not.toBeNull()
        expect(dropDetail.entityType).toBe('tag')
        expect(dropDetail.entityId).toBe('tag-123')

        // Drop with application/x-location-id fallback
        dropDetail = null
        const dropLocEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
        dropLocEvent.dataTransfer = {
            getData: (type: string) => {
                if (type === 'application/x-location-id') return 'loc-456'
                return ''
            },
        }
        node.dispatchEvent(dropLocEvent)
        expect(dropDetail).not.toBeNull()
        expect(dropDetail.entityType).toBe('location')
        expect(dropDetail.entityId).toBe('loc-456')

        // Drop with empty dataTransfer
        dropDetail = null
        const emptyDropEvent = new Event('drop', { bubbles: true, cancelable: true }) as any
        emptyDropEvent.dataTransfer = {
            getData: () => '',
        }
        node.dispatchEvent(emptyDropEvent)
        expect(dropDetail).toBeNull()

        node.remove()
    })

    it('should handle dragenter, dragover and dragleave visual state', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene('s-drag', 'Drag State Scene')
        node.scene = scene

        const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true }) as any
        dragOverEvent.dataTransfer = { dropEffect: 'none' }
        node.dispatchEvent(dragOverEvent)
        expect(node.classList.contains('is-drag-target')).toBe(true)
        expect(dragOverEvent.dataTransfer.dropEffect).toBe('copy')

        const dragLeaveEvent = new Event('dragleave', { bubbles: true, cancelable: true }) as any
        dragLeaveEvent.relatedTarget = document.body
        node.dispatchEvent(dragLeaveEvent)
        expect(node.classList.contains('is-drag-target')).toBe(false)

        node.remove()
    })

    it('should render more-tags badge when scene has more than 3 tags', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene('s-many-tags', 'Tags Scene', undefined, [], [], null, [
            new Tag('t1', 'Tag 1', '#111111'),
            new Tag('t2', 'Tag 2', '#222222'),
            new Tag('t3', 'Tag 3', '#333333'),
            new Tag('t4', 'Tag 4', '#444444'),
            new Tag('t5', 'Tag 5', '#555555'),
        ])
        node.scene = scene

        const badgesEl = node.querySelector('.scene-node-badges')
        expect(badgesEl).not.toBeNull()
        expect(badgesEl?.textContent).toContain('+2')

        node.remove()
    })

    it('should handle empty scene name and resetting scene to null', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const emptyNameScene = new Scene('s-empty', '')
        node.scene = emptyNameScene

        const titleEl = node.querySelector('.scene-node-title')
        expect(titleEl?.textContent).toBeTruthy() // default title fallback

        // Setting scene to null
        node.scene = null
        expect(titleEl?.textContent).toBe('')
        const countEl = node.querySelector('.scene-node-count')
        expect(countEl?.textContent).toBe('')

        node.remove()
    })

    it('should manage themeColor getter and setter and setBounds', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        expect(node.themeColor).toBeTruthy()
        node.themeColor = '#abcdef'
        expect(node.themeColor).toBe('#abcdef')
        node.themeColor = ''
        expect(node.themeColor).toBeTruthy()

        node.setBounds(15, 25, 320, 220)
        expect(node.style.left).toBe('15px')
        expect(node.style.top).toBe('25px')
        expect(node.style.width).toBe('320px')
        expect(node.style.height).toBe('220px')

        node.remove()
    })

    it('should handle resize handles pointer events and resizing with zoom', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene(
            's-resize',
            'Resize Scene',
            undefined,
            [],
            [],
            null,
            [],
            '',
            { x: 100, y: 100 },
            400,
            300
        )
        node.scene = scene

        // Mock cyInstance for zoom
        ;(window as any).cyInstance = {
            zoom: () => 2,
        }

        const resizeSpy = vi.fn()
        const resizeEndSpy = vi.fn()
        node.addEventListener('scene-resize', resizeSpy)
        node.addEventListener('scene-resize-end', resizeEndSpy)

        const seHandle = node.querySelector('[data-handle="se"]') as HTMLElement
        expect(seHandle).not.toBeNull()

        // Ignore secondary button
        const rightClickDown = new MouseEvent('pointerdown', { button: 2, bubbles: true })
        seHandle.dispatchEvent(rightClickDown)
        expect(resizeSpy).not.toHaveBeenCalled()

        // Pointerdown with main button
        const downEvent = new MouseEvent('pointerdown', {
            button: 0,
            clientX: 500,
            clientY: 400,
            bubbles: true,
        })
        seHandle.dispatchEvent(downEvent)

        // Move pointer by 100px client -> dx = 50 with zoom 2
        const moveEvent = new MouseEvent('pointermove', {
            clientX: 600,
            clientY: 460,
            bubbles: true,
        })
        window.dispatchEvent(moveEvent)

        expect(resizeSpy).toHaveBeenCalledTimes(1)
        expect(scene.getWidth()).toBe(450)
        expect(scene.getHeight()).toBe(330)

        // Pointerup finishes resize
        const upEvent = new MouseEvent('pointerup', { bubbles: true })
        window.dispatchEvent(upEvent)

        expect(resizeEndSpy).toHaveBeenCalledTimes(1)

        // Test NW handle
        const nwHandle = node.querySelector('[data-handle="nw"]') as HTMLElement
        expect(nwHandle).not.toBeNull()

        const nwDown = new MouseEvent('pointerdown', {
            button: 0,
            clientX: 100,
            clientY: 100,
            bubbles: true,
        })
        nwHandle.dispatchEvent(nwDown)

        const nwMove = new MouseEvent('pointermove', {
            clientX: 80,
            clientY: 80,
            bubbles: true,
        })
        window.dispatchEvent(nwMove)

        expect(scene.getPosition()?.x).toBe(90)
        expect(scene.getPosition()?.y).toBe(90)

        window.dispatchEvent(upEvent)

        delete (window as any).cyInstance
        node.remove()
    })

    it('should ignore double clicks on lock button and resize handles', () => {
        const node = new SceneNode()
        document.body.appendChild(node)

        const scene = new Scene('s-dblclick', 'DblClick Scene')
        node.scene = scene

        const detailsSpy = vi.fn()
        node.addEventListener('scene-open-details', detailsSpy)

        const lockBtn = node.querySelector('.scene-node-lock-btn') as HTMLElement
        lockBtn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        expect(detailsSpy).not.toHaveBeenCalled()

        const handle = node.querySelector('.scene-resize-handle') as HTMLElement
        handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        expect(detailsSpy).not.toHaveBeenCalled()

        const body = node.querySelector('.scene-node-body') as HTMLElement
        body.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
        expect(detailsSpy).toHaveBeenCalledTimes(1)

        node.remove()
    })
})
