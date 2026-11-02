/**
 * @vitest-environment happy-dom
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale, t } from '../../dist/Utils/translate.js'
import { DEFAULT_TAG_COLOR } from '../../dist/ViewModel/MainWindowViewModel.js'

const translate = (key: string): string => (t as unknown as (k: string) => string)(key)
import {
    renderAssignCharacterBarHtml,
    renderAssignLocationBarHtml,
    renderAssignTagBarHtml,
    renderCharacterItemHtml,
    renderCharacterOptionsHtml,
    renderCharactersModule,
    renderCharactersModuleHeaderHtml,
    renderCharactersModuleHtml,
    renderEmptyCharactersHtml,
    renderEmptyLocationsHtml,
    renderEmptyTagsHtml,
    renderLocationItemHtml,
    renderLocationOptionsHtml,
    renderLocationsModule,
    renderLocationsModuleHeaderHtml,
    renderLocationsModuleHtml,
    renderTagChipHtml,
    renderTagOptionsHtml,
    renderTagsModule,
    renderTagsModuleHeaderHtml,
    renderTagsModuleHtml,
} from '../../View/ui/detailsPanel/modules/associationModules.js'

describe('associationModules - Part 1 (Locations, Characters, Tags)', () => {
    let container: HTMLElement

    beforeEach(() => {
        initTranslationsWithLocale('en')
        container = document.createElement('div')
    })

    describe('Locations Module Templates', () => {
        it('renders locations module header with count and icon', () => {
            const html = renderLocationsModuleHeaderHtml(3)
            expect(html).toContain('3')
            expect(html).toContain(translate('details.locations'))
            expect(html).toContain('<svg')
        })

        it('renders empty locations state', () => {
            const html = renderEmptyLocationsHtml()
            expect(html).toContain(translate('details.no_locations'))
        })

        it('renders location item with name and delete button, escapes XSS', () => {
            const mockLoc = {
                getId: (): string => 'loc-1',
                getName: (): string => '<img src=x onerror=alert(1)> Castle',
            }
            const html = renderLocationItemHtml(mockLoc)
            expect(html).toContain('&lt;img src=x onerror=alert(1)&gt; Castle')
            expect(html).not.toContain('<img src=x')
            expect(html).toContain('btn-remove-location')
            expect(html).toContain(translate('buttons.delete'))
        })

        it('handles null in renderLocationItemHtml safely', () => {
            expect(renderLocationItemHtml(null)).toBe('')
        })

        it('renders location select options', () => {
            const locs = [
                { getId: (): string => 'l1', getName: (): string => 'Tavern' },
                { getId: (): string => 'l2', getName: (): string => 'Dungeon' },
            ]
            const html = renderLocationOptionsHtml(locs)
            expect(html).toContain(translate('details.select_location'))
            expect(html).toContain('value="l1">Tavern</option>')
            expect(html).toContain('value="l2">Dungeon</option>')
        })

        it('renders assign location bar', () => {
            const html = renderAssignLocationBarHtml([])
            expect(html).toContain('id="details-add-location-select"')
            expect(html).toContain('id="btn-details-add-location"')
            expect(html).toContain(translate('details.add_location'))
        })

        it('renders full locations module template structure', () => {
            const html = renderLocationsModuleHtml(2, [])
            expect(html).toContain('details-locations-list')
            expect(html).toContain('details-add-location-select')
            expect(html).toContain('2')
        })
    })

    describe('Characters Module Templates', () => {
        it('renders characters module header with count and icon', () => {
            const html = renderCharactersModuleHeaderHtml(5)
            expect(html).toContain('5')
            expect(html).toContain(translate('details.characters'))
            expect(html).toContain('<svg')
        })

        it('renders empty characters state', () => {
            const html = renderEmptyCharactersHtml()
            expect(html).toContain(translate('details.no_characters'))
        })

        it('renders character item with name and delete button, escapes XSS', () => {
            const mockChar = {
                getId: (): string => 'char-1',
                getName: (): string => '<script>evil()</script> Wizard',
            }
            const html = renderCharacterItemHtml(mockChar)
            expect(html).toContain('&lt;script&gt;evil()&lt;/script&gt; Wizard')
            expect(html).not.toContain('<script>')
            expect(html).toContain('btn-remove-character')
            expect(html).toContain(translate('buttons.delete'))
        })

        it('handles null in renderCharacterItemHtml safely', () => {
            expect(renderCharacterItemHtml(null)).toBe('')
        })

        it('renders character select options', () => {
            const chars = [
                { getId: (): string => 'c1', getName: (): string => 'Alice' },
                { getId: (): string => 'c2', getName: (): string => 'Bob' },
            ]
            const html = renderCharacterOptionsHtml(chars)
            expect(html).toContain(translate('details.select_character'))
            expect(html).toContain('value="c1">Alice</option>')
            expect(html).toContain('value="c2">Bob</option>')
        })

        it('renders assign character bar', () => {
            const html = renderAssignCharacterBarHtml([])
            expect(html).toContain('id="details-add-char-select"')
            expect(html).toContain('id="btn-details-add-char"')
            expect(html).toContain(translate('details.add_character'))
        })

        it('renders full characters module template structure', () => {
            const html = renderCharactersModuleHtml(1, [])
            expect(html).toContain('details-characters-list')
            expect(html).toContain('details-add-char-select')
            expect(html).toContain('1')
        })
    })

    describe('Tags Module Templates', () => {
        it('renders tags module header with count and icon', () => {
            const html = renderTagsModuleHeaderHtml(4)
            expect(html).toContain('4')
            expect(html).toContain(translate('details.tags'))
            expect(html).toContain('<svg')
        })

        it('renders empty tags state', () => {
            const html = renderEmptyTagsHtml()
            expect(html).toContain(translate('details.no_tags'))
        })

        it('renders tag chip with color, name with #, and delete button', () => {
            const mockTag = {
                getId: (): string => 'tag-1',
                getName: (): string => 'combat',
                getColor: (): string => '#ff0055',
            }
            const html = renderTagChipHtml(mockTag)
            expect(html).toContain('#combat')
            expect(html).toContain('background-color: #ff0055')
            expect(html).toContain('btn-remove-tag')
            expect(html).toContain(translate('buttons.delete'))
        })

        it('falls back to default tag color if none provided', () => {
            const mockTag = {
                getId: (): string => 'tag-2',
                getName: (): string => 'lore',
                getColor: (): string => '',
            }
            const html = renderTagChipHtml(mockTag)
            expect(html).toContain(`background-color: ${DEFAULT_TAG_COLOR}`)
        })

        it('handles null in renderTagChipHtml safely', () => {
            expect(renderTagChipHtml(null)).toBe('')
        })

        it('renders tag select options', () => {
            const tags = [
                { getId: (): string => 't1', getName: (): string => 'quest' },
                { getId: (): string => 't2', getName: (): string => 'boss' },
            ]
            const html = renderTagOptionsHtml(tags)
            expect(html).toContain(translate('details.select_tag'))
            expect(html).toContain('value="t1">quest</option>')
            expect(html).toContain('value="t2">boss</option>')
        })

        it('renders assign tag bar', () => {
            const html = renderAssignTagBarHtml([])
            expect(html).toContain('id="details-add-tag-select"')
            expect(html).toContain('id="btn-details-add-tag"')
            expect(html).toContain(translate('details.add_tag'))
        })

        it('renders full tags module template structure', () => {
            const html = renderTagsModuleHtml(0, [])
            expect(html).toContain('details-tags-list')
            expect(html).toContain('details-add-tag-select')
        })
    })

    describe('renderLocationsModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderLocationsModule(null, {}, 'paragraph', {})).not.toThrow()
            expect(() => renderLocationsModule(container, null, 'paragraph', {})).not.toThrow()
            expect(() => renderLocationsModule(container, {}, 'paragraph', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no locations', () => {
            const entity = {
                getLocations: (): unknown[] => [],
            }
            renderLocationsModule(container, entity, 'paragraph', { projectLocations: [] })
            expect(container.textContent).toContain(translate('details.no_locations'))
        })

        it('renders existing locations and removes location on click', () => {
            const loc1 = { getId: (): string => 'l-1', getName: (): string => 'Castle' }
            const entity = {
                getLocations: (): Array<{ getId(): string; getName(): string }> => [loc1],
            }
            const mockVm = {
                selection: {
                    removeLocationFromSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const mockRenderGraph = vi.fn()
            const ctx = {
                vm: mockVm,
                projectLocations: [loc1],
                refreshActiveSection: mockRefresh,
                storyGraphInstance: { render: mockRenderGraph },
            }

            renderLocationsModule(container, entity, 'paragraph', ctx)
            expect(container.textContent).toContain('Castle')

            const removeBtn = container.querySelector('.btn-remove-location') as HTMLButtonElement
            expect(removeBtn).toBeTruthy()
            removeBtn.click()

            expect(mockVm.selection.removeLocationFromSelected).toHaveBeenCalledWith('l-1')
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
            expect(mockRenderGraph).toHaveBeenCalledWith(true)
        })

        it('adds a location when selected and add button is clicked', () => {
            const loc1 = { getId: (): string => 'l-1', getName: (): string => 'Forest' }
            const entity = {
                getLocations: (): unknown[] => [],
            }
            const mockVm = {
                selection: {
                    addLocationToSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectLocations: [loc1],
                refreshActiveSection: mockRefresh,
            }

            renderLocationsModule(container, entity, 'paragraph', ctx)

            const select = container.querySelector(
                '#details-add-location-select'
            ) as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-location') as HTMLButtonElement

            select.value = 'l-1'
            addBtn.click()

            expect(mockVm.selection.addLocationToSelected).toHaveBeenCalledWith(loc1)
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
        })
    })

    describe('renderCharactersModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderCharactersModule(null, {}, 'paragraph', {})).not.toThrow()
            expect(() => renderCharactersModule(container, null, 'paragraph', {})).not.toThrow()
            expect(() => renderCharactersModule(container, {}, 'paragraph', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no characters', () => {
            const entity = {
                getCharacters: (): unknown[] => [],
                addCharacter: vi.fn(),
                removeCharacter: vi.fn(),
            }
            renderCharactersModule(container, entity, 'paragraph', { projectCharacters: [] })
            expect(container.textContent).toContain(translate('details.no_characters'))
        })

        it('renders existing characters and removes character on click', () => {
            const char1 = { getId: (): string => 'c-1', getName: (): string => 'Goblin King' }
            const entity = {
                getCharacters: (): Array<{ getId(): string; getName(): string }> => [char1],
                addCharacter: vi.fn(),
                removeCharacter: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeCharacterFromSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const mockRenderGraph = vi.fn()
            const ctx = {
                vm: mockVm,
                projectCharacters: [char1],
                refreshActiveSection: mockRefresh,
                storyGraphInstance: { render: mockRenderGraph },
            }

            renderCharactersModule(container, entity, 'paragraph', ctx)
            expect(container.textContent).toContain('Goblin King')

            const removeBtn = container.querySelector('.btn-remove-character') as HTMLButtonElement
            expect(removeBtn).toBeTruthy()
            removeBtn.click()

            expect(mockVm.selection.removeCharacterFromSelected).toHaveBeenCalledWith('c-1')
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
            expect(mockRenderGraph).toHaveBeenCalledWith(true)
        })

        it('adds a character when selected and add button is clicked', () => {
            const char1 = { getId: (): string => 'c-1', getName: (): string => 'Merchant' }
            const entity = {
                getCharacters: (): unknown[] => [],
                addCharacter: vi.fn(),
                removeCharacter: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addCharacterToSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectCharacters: [char1],
                refreshActiveSection: mockRefresh,
            }

            renderCharactersModule(container, entity, 'paragraph', ctx)

            const select = container.querySelector('#details-add-char-select') as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-char') as HTMLButtonElement

            select.value = 'c-1'
            addBtn.click()

            expect(mockVm.selection.addCharacterToSelected).toHaveBeenCalledWith(char1)
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
        })
    })

    describe('renderTagsModule DOM integration', () => {
        it('handles invalid arguments gracefully', () => {
            expect(() => renderTagsModule(null, {}, 'paragraph', {})).not.toThrow()
            expect(() => renderTagsModule(container, null, 'paragraph', {})).not.toThrow()
            expect(() => renderTagsModule(container, {}, 'paragraph', {})).not.toThrow()
            expect(container.children.length).toBe(0)
        })

        it('renders empty message when entity has no tags', () => {
            const entity = {
                getTags: (): unknown[] => [],
                addTag: vi.fn(),
                removeTag: vi.fn(),
            }
            renderTagsModule(container, entity, 'paragraph', { projectTags: [] })
            expect(container.textContent).toContain(translate('details.no_tags'))
        })

        it('renders existing tags and removes tag on click', () => {
            const tag1 = {
                getId: (): string => 't-1',
                getName: (): string => 'Important',
                getColor: (): string => '#ff0000',
            }
            const entity = {
                getTags: (): Array<{ getId(): string; getName(): string; getColor(): string }> => [
                    tag1,
                ],
                addTag: vi.fn(),
                removeTag: vi.fn(),
            }
            const mockVm = {
                selection: {
                    removeTagFromSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectTags: [tag1],
                refreshActiveSection: mockRefresh,
            }

            renderTagsModule(container, entity, 'paragraph', ctx)
            expect(container.textContent).toContain('#Important')

            const removeBtn = container.querySelector('.btn-remove-tag') as HTMLButtonElement
            expect(removeBtn).toBeTruthy()
            removeBtn.click()

            expect(mockVm.selection.removeTagFromSelected).toHaveBeenCalledWith('t-1')
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
        })

        it('adds a tag when selected and add button is clicked', () => {
            const tag1 = {
                getId: (): string => 't-1',
                getName: (): string => 'Secret',
                getColor: (): string => '#123456',
            }
            const entity = {
                getTags: (): unknown[] => [],
                addTag: vi.fn(),
                removeTag: vi.fn(),
            }
            const mockVm = {
                selection: {
                    addTagToSelected: vi.fn(),
                },
            }
            const mockRefresh = vi.fn()
            const ctx = {
                vm: mockVm,
                projectTags: [tag1],
                refreshActiveSection: mockRefresh,
            }

            renderTagsModule(container, entity, 'paragraph', ctx)

            const select = container.querySelector('#details-add-tag-select') as HTMLSelectElement
            const addBtn = container.querySelector('#btn-details-add-tag') as HTMLButtonElement

            select.value = 't-1'
            addBtn.click()

            expect(mockVm.selection.addTagToSelected).toHaveBeenCalledWith(tag1)
            expect(mockRefresh).toHaveBeenCalledWith('paragraph')
        })
    })

    describe('Multilingual i18n support', () => {
        it('renders proper translations in PL, EN, and DE', () => {
            initTranslationsWithLocale('pl')
            expect(renderLocationsModuleHeaderHtml(0)).toContain('Lokacje')
            expect(renderCharactersModuleHeaderHtml(0)).toContain('Postacie')
            expect(renderTagsModuleHeaderHtml(0)).toContain('Tagi')
            expect(renderEmptyLocationsHtml()).toContain('Brak przypisanych lokacji')
            expect(renderEmptyCharactersHtml()).toContain('Brak przypisanych postaci')
            expect(renderEmptyTagsHtml()).toContain('Brak przypisanych tagów')

            initTranslationsWithLocale('de')
            expect(renderLocationsModuleHeaderHtml(0)).toContain('Orte')
            expect(renderCharactersModuleHeaderHtml(0)).toContain('Charaktere')
            expect(renderTagsModuleHeaderHtml(0)).toContain('Tags')
            expect(renderEmptyLocationsHtml()).toContain('Keine zugewiesenen Orte')
            expect(renderEmptyCharactersHtml()).toContain('Keine zugewiesenen Charaktere')
            expect(renderEmptyTagsHtml()).toContain('Keine zugewiesenen Tags')
        })
    })
})
