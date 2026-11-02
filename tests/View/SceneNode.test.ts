// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Location } from '../../Model/Location'
import { NPC } from '../../Model/NPC'
import { Paragraph } from '../../Model/Paragraph'
import { Scene } from '../../Model/Scene'
import { Tag } from '../../Model/Tag'
import { SceneNode } from '../../Modules/Graph/nodes/SceneNode'
import { instantiateSceneNodeTemplate } from '../../Modules/Graph/nodes/SceneNodeTemplate'
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
})
