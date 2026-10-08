// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    ensureActiveProjectPath,
    getActiveProjectPath,
    importDroppedImage,
    pickProjectImage,
    setupElementDropZone,
} from '../../View/ui/assetPicker.js'

describe('AssetPicker and DropZone', () => {
    beforeEach(() => {
        delete (window as any).currentProjectPath
        ;(window as any).electronAPI = undefined
    })

    describe('getActiveProjectPath & ensureActiveProjectPath', () => {
        it('resolves project path from ctx.projectPath', () => {
            const ctx = { projectPath: '/projects/my-game' }
            expect(getActiveProjectPath(ctx)).toBe('/projects/my-game')
        })

        it('resolves project path from ctx.getProjectPath()', () => {
            const ctx = { getProjectPath: () => '/projects/my-game-2' }
            expect(getActiveProjectPath(ctx)).toBe('/projects/my-game-2')
        })

        it('resolves project path from window.currentProjectPath', () => {
            ;(window as any).currentProjectPath = '/projects/window-path'
            expect(getActiveProjectPath()).toBe('/projects/window-path')
        })

        it('queries electronAPI.getCurrentProject when ctx and window are empty', async () => {
            ;(window as any).electronAPI = {
                getCurrentProject: vi.fn().mockResolvedValue('/default/project/dir'),
            }
            const path = await ensureActiveProjectPath({})
            expect(path).toBe('/default/project/dir')
            expect((window as any).currentProjectPath).toBe('/default/project/dir')
        })
    })

    describe('pickProjectImage', () => {
        it('calls electronAPI.importImage and returns relativePath and assetUrl', async () => {
            ;(window as any).electronAPI = {
                getCurrentProject: vi.fn().mockResolvedValue('/active/proj'),
                importImage: vi.fn().mockResolvedValue({
                    success: true,
                    relativePath: 'Assets/Images/img_test.png',
                    fileName: 'img_test.png',
                    assetUrl: 'asset://project/Assets/Images/img_test.png',
                }),
            }

            const result = await pickProjectImage({}, 'img')
            expect(result).toEqual({
                relativePath: 'Assets/Images/img_test.png',
                fileName: 'img_test.png',
                assetUrl: 'asset://project/Assets/Images/img_test.png',
            })
            expect((window as any).electronAPI.importImage).toHaveBeenCalledWith(
                '/active/proj',
                'img'
            )
        })
    })

    describe('importDroppedImage', () => {
        it('imports file via importImageFile when native OS path is present', async () => {
            ;(window as any).electronAPI = {
                getCurrentProject: vi.fn().mockResolvedValue('/active/proj'),
                getPathForFile: vi.fn().mockReturnValue('C:\\Users\\test\\Desktop\\avatar.png'),
                importImageFile: vi.fn().mockResolvedValue({
                    success: true,
                    relativePath: 'Assets/Images/npc_avatar.png',
                    fileName: 'npc_avatar.png',
                    assetUrl: 'asset://project/Assets/Images/npc_avatar.png',
                }),
            }

            const fakeFile = new File(['content'], 'avatar.png', { type: 'image/png' })
            const result = await importDroppedImage(fakeFile, {}, 'npc')

            expect(result).toEqual({
                relativePath: 'Assets/Images/npc_avatar.png',
                fileName: 'npc_avatar.png',
                assetUrl: 'asset://project/Assets/Images/npc_avatar.png',
            })
            expect((window as any).electronAPI.importImageFile).toHaveBeenCalledWith(
                '/active/proj',
                'C:\\Users\\test\\Desktop\\avatar.png',
                'npc'
            )
        })

        it('falls back to saveEditedImage when file path is unavailable', async () => {
            ;(window as any).electronAPI = {
                getCurrentProject: vi.fn().mockResolvedValue('/active/proj'),
                getPathForFile: vi.fn().mockReturnValue(''),
                saveEditedImage: vi.fn().mockResolvedValue({
                    success: true,
                    relativePath: 'Assets/Images/dropped_hero.png',
                    fileName: 'dropped_hero.png',
                    assetUrl: 'asset://project/Assets/Images/dropped_hero.png',
                }),
            }

            const fakeFile = new File(['data'], 'hero.png', { type: 'image/png' })
            const result = await importDroppedImage(fakeFile, {}, 'hero')

            expect(result).toEqual({
                relativePath: 'Assets/Images/dropped_hero.png',
                fileName: 'dropped_hero.png',
                assetUrl: 'asset://project/Assets/Images/dropped_hero.png',
            })
            expect((window as any).electronAPI.saveEditedImage).toHaveBeenCalled()
        })
    })

    describe('setupElementDropZone', () => {
        it('attaches dragover and drop listeners and fires onFileDrop callback', async () => {
            const dropEl = document.createElement('div')
            const onFileDrop = vi.fn()

            setupElementDropZone(dropEl, {
                highlightClass: 'drag-active',
                onFileDrop,
            })

            const fakeFile = new File(['image-bytes'], 'pic.png', { type: 'image/png' })
            const dropEvent = new Event('drop') as any
            dropEvent.dataTransfer = {
                types: ['Files'],
                files: [fakeFile],
            }
            dropEvent.preventDefault = vi.fn()
            dropEvent.stopPropagation = vi.fn()

            dropEl.dispatchEvent(dropEvent)

            expect(onFileDrop).toHaveBeenCalledWith(fakeFile, dropEvent)
        })
    })
})
