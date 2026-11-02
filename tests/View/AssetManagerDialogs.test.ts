// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { confirmDeleteAsset } from '../../View/ui/assets/manager/assetDeleteDialog.js'
import { promptRenameAsset } from '../../View/ui/assets/manager/assetRenameDialog.js'

describe('AssetManager Dialogs', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        vi.restoreAllMocks()
    })

    describe('promptRenameAsset', () => {
        it('returns null if asset or fileName is missing', async () => {
            expect(await promptRenameAsset(null)).toBeNull()
            expect(await promptRenameAsset({ fileName: '' })).toBeNull()
        })

        it('falls back to window.prompt if dialog DOM elements are absent', async () => {
            const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('new_name')
            const result = await promptRenameAsset({ fileName: 'hero.png', extension: 'png' })

            expect(promptSpy).toHaveBeenCalled()
            expect(result).toBe('new_name')
        })

        it('falls back to window.prompt and returns null if cancelled', async () => {
            vi.spyOn(window, 'prompt').mockReturnValue(null)
            const result = await promptRenameAsset({ fileName: 'hero.png' })
            expect(result).toBeNull()
        })

        describe('with custom modal DOM', () => {
            let dialog: HTMLDivElement
            let input: HTMLInputElement
            let extBadge: HTMLElement
            let btnConfirm: HTMLButtonElement
            let btnCancel: HTMLButtonElement

            beforeEach(() => {
                document.body.innerHTML = `
                    <div id="asset-rename-dialog" class="hidden">
                        <input id="asset-rename-input" type="text" />
                        <span id="asset-rename-ext-badge"></span>
                        <button id="btn-confirm-asset-rename">OK</button>
                        <button id="btn-cancel-asset-rename">Cancel</button>
                        <button id="btn-cancel-asset-rename-x">X</button>
                    </div>
                `
                dialog = document.getElementById('asset-rename-dialog') as HTMLDivElement
                input = document.getElementById('asset-rename-input') as HTMLInputElement
                extBadge = document.getElementById('asset-rename-ext-badge') as HTMLElement
                btnConfirm = document.getElementById(
                    'btn-confirm-asset-rename'
                ) as HTMLButtonElement
                btnCancel = document.getElementById('btn-cancel-asset-rename') as HTMLButtonElement
            })

            it('initializes input with base name and displays extension in badge', () => {
                promptRenameAsset({ fileName: 'castle_ruins.jpg', extension: 'jpg' })

                expect(dialog.classList.contains('hidden')).toBe(false)
                expect(input.value).toBe('castle_ruins')
                expect(extBadge.textContent).toBe('.jpg')
            })

            it('resolves with trimmed name when confirm button is clicked', async () => {
                const promise = promptRenameAsset({
                    fileName: 'castle_ruins.jpg',
                    extension: 'jpg',
                })
                input.value = '   ancient_castle   '
                btnConfirm.click()

                const result = await promise
                expect(result).toBe('ancient_castle')
                expect(dialog.classList.contains('hidden')).toBe(true)
            })

            it('resolves with null when cancel button is clicked', async () => {
                const promise = promptRenameAsset({
                    fileName: 'castle_ruins.jpg',
                    extension: 'jpg',
                })
                btnCancel.click()

                const result = await promise
                expect(result).toBeNull()
                expect(dialog.classList.contains('hidden')).toBe(true)
            })

            it('submits on Enter keypress', async () => {
                const promise = promptRenameAsset({
                    fileName: 'hero.png',
                    extension: 'png',
                })
                input.value = 'hero_v2'
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

                const result = await promise
                expect(result).toBe('hero_v2')
            })

            it('cancels on Escape keypress', async () => {
                const promise = promptRenameAsset({
                    fileName: 'hero.png',
                    extension: 'png',
                })
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

                const result = await promise
                expect(result).toBeNull()
            })
        })
    })

    describe('confirmDeleteAsset', () => {
        it('returns false if asset is missing', async () => {
            expect(await confirmDeleteAsset(null)).toBe(false)
        })

        it('falls back to window.confirm if dialog DOM is absent', async () => {
            const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
            const result = await confirmDeleteAsset({ fileName: 'tree.png' })

            expect(confirmSpy).toHaveBeenCalled()
            expect(result).toBe(true)
        })

        describe('with custom modal DOM', () => {
            let dialog: HTMLDivElement
            let msgEl: HTMLElement
            let warnBox: HTMLDivElement
            let warnDetails: HTMLElement
            let btnConfirm: HTMLButtonElement
            let btnCancel: HTMLButtonElement

            beforeEach(() => {
                document.body.innerHTML = `
                    <div id="asset-delete-dialog" class="hidden">
                        <p id="asset-delete-message"></p>
                        <div id="asset-delete-warning-box" class="hidden">
                            <span id="asset-delete-warning-details"></span>
                        </div>
                        <button id="btn-confirm-asset-delete">Delete</button>
                        <button id="btn-cancel-asset-delete">Cancel</button>
                    </div>
                `
                dialog = document.getElementById('asset-delete-dialog') as HTMLDivElement
                msgEl = document.getElementById('asset-delete-message') as HTMLElement
                warnBox = document.getElementById('asset-delete-warning-box') as HTMLDivElement
                warnDetails = document.getElementById('asset-delete-warning-details') as HTMLElement
                btnConfirm = document.getElementById(
                    'btn-confirm-asset-delete'
                ) as HTMLButtonElement
                btnCancel = document.getElementById('btn-cancel-asset-delete') as HTMLButtonElement
            })

            it('shows dialog without warning box when usages are empty', () => {
                confirmDeleteAsset({ fileName: 'tree.png' }, [])

                expect(dialog.classList.contains('hidden')).toBe(false)
                expect(warnBox.classList.contains('hidden')).toBe(true)
                expect(msgEl.textContent).toContain('tree.png')
            })

            it('shows warning box with usage places when usages are present', () => {
                confirmDeleteAsset({ fileName: 'tree.png' }, [
                    { name: 'Forest Node', field: 'Background' },
                    { name: 'Druid', field: 'Avatar' },
                ])

                expect(warnBox.classList.contains('hidden')).toBe(false)
                expect(warnDetails.textContent).toContain('Forest Node (Background)')
                expect(warnDetails.textContent).toContain('Druid (Avatar)')
            })

            it('resolves true on confirm click', async () => {
                const promise = confirmDeleteAsset({ fileName: 'tree.png' })
                btnConfirm.click()

                const result = await promise
                expect(result).toBe(true)
                expect(dialog.classList.contains('hidden')).toBe(true)
            })

            it('resolves false on cancel click', async () => {
                const promise = confirmDeleteAsset({ fileName: 'tree.png' })
                btnCancel.click()

                const result = await promise
                expect(result).toBe(false)
                expect(dialog.classList.contains('hidden')).toBe(true)
            })

            it('resolves false on Escape keydown', async () => {
                const promise = confirmDeleteAsset({ fileName: 'tree.png' })
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

                const result = await promise
                expect(result).toBe(false)
            })
        })
    })
})
