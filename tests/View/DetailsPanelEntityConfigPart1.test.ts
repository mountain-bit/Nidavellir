// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import {
    renderAvatarGridHtml,
    renderAvatarGridItemHtml,
    renderAvatarModule,
    renderAvatarModuleHtml,
    renderAvatarPreviewHtml,
    renderColorModule,
    renderColorModuleHtml,
    renderEntityHeaderModule,
    renderEntityHeaderModuleHtml,
    renderNameModule,
    renderNameModuleHtml,
} from '../../View/ui/detailsPanel/modules/entityConfigModules.js'

describe('entityConfigModules - Part 1 (Header, Avatar, Name, Color)', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        container.remove()
        vi.restoreAllMocks()
    })

    describe('renderEntityHeaderModule', () => {
        it('renderEntityHeaderModuleHtml renders type label, badge color, and escaped id', () => {
            const html = renderEntityHeaderModuleHtml({
                id: 'char_<1>',
                type: 'character',
            })
            expect(html).toContain('Typ')
            expect(html).toContain('Postać')
            expect(html).toContain('ID: char_&lt;1&gt;')
            expect(html).toContain('border-purple-700/50')
        })

        it('returns null if container or item is missing', () => {
            expect(renderEntityHeaderModule(null, { id: '1', type: 'tag' })).toBeNull()
            expect(renderEntityHeaderModule(container, null)).toBeNull()
        })

        it('appends header section to container', () => {
            const section = renderEntityHeaderModule(container, {
                id: 'tag_1',
                type: 'tag',
            })
            expect(section).not.toBeNull()
            expect(container.contains(section as Node)).toBe(true)
            expect(container.textContent).toContain('Tag')
            expect(container.textContent).toContain('ID: tag_1')
        })
    })

    describe('renderAvatarModule', () => {
        let mockNpc: {
            _avatar: string
            getAvatar: () => string
            setAvatar: (av: string) => void
        }
        let mockCtx: {
            refreshActiveSection: ReturnType<typeof vi.fn>
            renderDetailsPanel: ReturnType<typeof vi.fn>
        }

        beforeEach(() => {
            mockNpc = {
                _avatar: 'warrior',
                getAvatar: vi.fn(() => mockNpc._avatar),
                setAvatar: vi.fn(av => {
                    mockNpc._avatar = av
                }),
            }
            mockCtx = {
                refreshActiveSection: vi.fn(),
                renderDetailsPanel: vi.fn(),
            }
        })

        it('renderAvatarPreviewHtml and grid templates render expected SVG and attributes', () => {
            const preview = renderAvatarPreviewHtml({
                bgColor: '#333',
                color: '#fff',
                borderColor: '#555',
                svg: '<svg test="1"></svg>',
            })
            expect(preview).toContain('details-avatar-preview')
            expect(preview).toContain('<svg test="1"></svg>')

            const gridItem = renderAvatarGridItemHtml(
                {
                    id: 'rogue',
                    name: 'Łotrzyk',
                    bgColor: '#111',
                    color: '#eee',
                    svg: '<svg rogue></svg>',
                },
                'rogue'
            )
            expect(gridItem).toContain('border-blue-500 ring-1 ring-blue-500')
            expect(gridItem).toContain('data-avatar-id="rogue"')
            expect(gridItem).toContain('Łotrzyk')

            const fullGrid = renderAvatarGridHtml([
                { id: 'av1', name: 'A1', bgColor: '#000', color: '#fff', svg: '' },
            ])
            expect(fullGrid).toContain('data-avatar-id="av1"')

            const fullHtml = renderAvatarModuleHtml(
                {
                    name: 'Wojownik',
                    category: 'human',
                    bgColor: '#000',
                    color: '#fff',
                    svg: '',
                },
                'warrior',
                []
            )
            expect(fullHtml).toContain('Wojownik')
            expect(fullHtml).toContain('human')
        })

        it('returns null for non-character/template types or missing entity methods', () => {
            expect(renderAvatarModule(container, mockNpc, 'paragraph', mockCtx)).toBeNull()
            expect(renderAvatarModule(container, {}, 'character', mockCtx)).toBeNull()
            expect(renderAvatarModule(null, mockNpc, 'character', mockCtx)).toBeNull()
        })

        it('renders avatar module and toggles avatar grid', () => {
            const section = renderAvatarModule(container, mockNpc, 'character', mockCtx)
            expect(section).not.toBeNull()

            const toggleBtn = container.querySelector(
                '#btn-details-toggle-avatar-grid'
            ) as HTMLButtonElement
            const grid = container.querySelector('#details-avatar-grid') as HTMLElement

            expect(grid.classList.contains('hidden')).toBe(true)
            toggleBtn.click()
            expect(grid.classList.contains('hidden')).toBe(false)
            toggleBtn.click()
            expect(grid.classList.contains('hidden')).toBe(true)
        })

        it('selects new avatar on clicking grid button', () => {
            const onRefresh = vi.fn()
            renderAvatarModule(container, mockNpc, 'character', mockCtx, onRefresh)

            const mageBtn = container.querySelector('[data-avatar-id="mage"]') as HTMLButtonElement
            if (mageBtn) {
                mageBtn.click()
                expect(mockNpc.setAvatar).toHaveBeenCalledWith('mage')
                expect(onRefresh).toHaveBeenCalledWith(mockCtx)
                expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('character')
            }
        })
    })

    describe('renderNameModule', () => {
        let mockItem: { id: string; name: string; type: string }
        let mockCtx: {
            vm: {
                validateName: (val: string) => { valid: boolean; message: string }
                updateName: (val: string) => void
            }
            refreshActiveSection: (type?: string) => void
        }

        beforeEach(() => {
            mockItem = { id: 'it_1', name: 'Stary Miecz', type: 'item' }
            mockCtx = {
                vm: {
                    validateName: vi.fn((val: string) => ({
                        valid: val.length > 0,
                        message: val.length === 0 ? 'Nazwa jest wymagana' : '',
                    })),
                    updateName: vi.fn((val: string) => {
                        mockItem.name = val
                    }),
                },
                refreshActiveSection: vi.fn(),
            }
        })

        it('renderNameModuleHtml renders input and error box', () => {
            const html = renderNameModuleHtml('Nazwa', 'Błąd', true)
            expect(html).toContain('value="Nazwa"')
            expect(html).toContain('border-red-500')
            expect(html).toContain('Błąd')
        })

        it('returns null if container or item is missing', () => {
            expect(renderNameModule(null, mockItem, [], mockCtx)).toBeNull()
            expect(renderNameModule(container, null, [], mockCtx)).toBeNull()
        })

        it('shows live validation error on input when name is empty', () => {
            renderNameModule(container, mockItem, [], mockCtx)

            const input = container.querySelector('#details-name-input') as HTMLInputElement
            const errorDiv = container.querySelector('#details-name-error') as HTMLElement

            input.value = ''
            input.dispatchEvent(new Event('input'))

            expect(errorDiv.classList.contains('hidden')).toBe(false)
            expect(errorDiv.textContent).toBe('Nazwa jest wymagana')
            expect(input.classList.contains('border-red-500')).toBe(true)

            input.value = 'Topór'
            input.dispatchEvent(new Event('input'))
            expect(errorDiv.classList.contains('hidden')).toBe(true)
            expect(input.classList.contains('border-red-500')).toBe(false)
        })

        it('saves valid name on blur and Enter keydown', () => {
            renderNameModule(container, mockItem, [], mockCtx)

            const input = container.querySelector('#details-name-input') as HTMLInputElement
            input.value = 'Młot Bojowy'
            input.dispatchEvent(new Event('blur'))

            expect(mockCtx.vm.updateName).toHaveBeenCalledWith('Młot Bojowy', [], mockCtx)
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('item')

            input.value = 'Sztylet'
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
            expect(mockCtx.vm.updateName).toHaveBeenCalledWith('Sztylet', [], mockCtx)
        })
    })

    describe('renderColorModule', () => {
        let mockEntity: {
            _color: string
            getColor: () => string
            setColor: (c: string) => void
        }
        let mockCtx: {
            renderTagsList: ReturnType<typeof vi.fn>
            renderFilterTags: ReturnType<typeof vi.fn>
            renderParagraphsList: ReturnType<typeof vi.fn>
            storyGraphInstance: { render: ReturnType<typeof vi.fn> }
        }

        beforeEach(() => {
            mockEntity = {
                _color: '#3b82f6',
                getColor: vi.fn(() => mockEntity._color),
                setColor: vi.fn(c => {
                    mockEntity._color = c
                }),
            }
            mockCtx = {
                renderTagsList: vi.fn(),
                renderFilterTags: vi.fn(),
                renderParagraphsList: vi.fn(),
                storyGraphInstance: {
                    render: vi.fn(),
                },
            }
        })

        it('renderColorModuleHtml renders section title, preview, and color inputs', () => {
            const html = renderColorModuleHtml('#ff0000', 'Kolor taga')
            expect(html).toContain('Kolor taga')
            expect(html).toContain('#ff0000')
            expect(html).toContain('details-color-picker')
            expect(html).toContain('details-color-hex-input')
        })

        it('returns null if container or entity color methods missing', () => {
            expect(renderColorModule(null, mockEntity, 'tag', mockCtx)).toBeNull()
            expect(renderColorModule(container, {}, 'tag', mockCtx)).toBeNull()
        })

        it('applies color when clicking preset button', () => {
            renderColorModule(container, mockEntity, 'tag', mockCtx)

            const presetBtn = container.querySelector(
                '.details-color-preset-btn'
            ) as HTMLButtonElement
            const color = presetBtn.getAttribute('data-color') || '#ef4444'
            presetBtn.click()

            expect(mockEntity.setColor).toHaveBeenCalledWith(color)
            expect(mockCtx.renderTagsList).toHaveBeenCalled()
            expect(mockCtx.storyGraphInstance.render).toHaveBeenCalledWith(true)
        })

        it('applies color on hex input change with valid hex', () => {
            renderColorModule(container, mockEntity, 'tag', mockCtx)

            const hexInput = container.querySelector('#details-color-hex-input') as HTMLInputElement
            hexInput.value = '10b981'
            hexInput.dispatchEvent(new Event('change'))

            expect(mockEntity.setColor).toHaveBeenCalledWith('#10b981')
        })
    })

    describe('Internationalization (i18n)', () => {
        it('renders templates in English correctly', async () => {
            await initTranslationsWithLocale('en')
            const header = renderEntityHeaderModuleHtml({
                id: '1',
                type: 'scene',
            })
            expect(header).toContain('Type')
            expect(header).toContain('Scene')

            const nameHtml = renderNameModuleHtml('Test')
            expect(nameHtml).toContain('Name')

            const colorHtml = renderColorModuleHtml('#fff', 'Scene color')
            expect(colorHtml).toContain('Scene color')
            expect(colorHtml).toContain('Custom color')
        })

        it('renders templates in German correctly', async () => {
            await initTranslationsWithLocale('de')
            const header = renderEntityHeaderModuleHtml({
                id: '1',
                type: 'tag',
            })
            expect(header).toContain('Typ')
            expect(header).toContain('Tag')

            const colorHtml = renderColorModuleHtml('#fff', 'Tag-Farbe')
            expect(colorHtml).toContain('Tag-Farbe')
        })
    })
})
