// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Item } from '../../Model/Item'
import {
    getActiveDrawerCategory,
    renderDrawerSearchResults,
    setActiveDrawerCategory,
    setupDrawerSearch,
    setupSectionSearchInputs,
} from '../../View/ui/drawer/drawerSearch.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('Drawer Search Functionality (Krok 4)', () => {
    let vm: MainWindowViewModel
    let mockCtx: any

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="left-content-search">
                <input type="text" id="drawer-search-input" />
                <button id="btn-drawer-search-clear" class="hidden"></button>
                <div id="drawer-search-category-filters"></div>
                <div id="drawer-search-results"></div>
                <span id="drawer-search-stats"></span>
            </div>

            <div id="left-content-tags">
                <input type="text" id="tag-search-input" />
                <div id="tags-list-container"></div>
            </div>

            <div id="left-content-scenes">
                <input type="text" id="scene-search-input" />
                <div id="scenes-list-container"></div>
            </div>

            <div id="left-content-connections">
                <input type="text" id="connection-search-input" />
                <div id="connections-list-container"></div>
            </div>

            <div id="left-content-characters">
                <input type="text" id="character-search-input" />
                <div id="characters-list-container"></div>
            </div>

            <div id="left-content-locations">
                <input type="text" id="location-search-input" />
                <div id="locations-list-container"></div>
            </div>

            <div id="left-content-traits">
                <input type="text" id="trait-search-input" />
                <div id="traits-list-container"></div>
            </div>
        `

        vm = new MainWindowViewModel()
        mockCtx = {
            vm,
            projectParagraphs: [
                {
                    getId: () => 'p1',
                    getTitle: () => 'Brama do lasu',
                    getNumber: () => 1,
                    getDisplayNumber: () => 1,
                    getContent: () => ({ getText: () => 'Stoisz przed ciemnym borem.' }),
                    getTags: () => [{ getName: () => 'Las' }],
                    getLocation: () => ({ getName: () => 'Skraj Puszczy' }),
                    getCharacters: () => [],
                },
                {
                    getId: () => 'p2',
                    getTitle: () => 'Jaskinia trolla',
                    getNumber: () => 2,
                    getDisplayNumber: () => 2,
                    getContent: () => ({ getText: () => 'Słyszysz chrapanie bestii.' }),
                    getTags: () => [],
                    getLocation: () => null,
                    getCharacters: () => [],
                },
            ],
            projectScenes: [
                {
                    getId: () => 's1',
                    getName: () => 'Akt 1: Wyprawa',
                    getDescription: () => ({ getText: () => 'Początek podróży przez góry.' }),
                    getTags: () => [],
                    getPosition: () => ({ x: 0, y: 0 }),
                    getParagraphs: () => ['p1'],
                },
            ],
            projectCharacters: [
                {
                    getId: () => 'c1',
                    getName: () => 'Geralt z Rivii',
                    getDescription: () => ({ getText: () => 'Biały Wilk.' }),
                    getTags: () => [],
                    getStats: () => [],
                },
            ],
            projectTemplates: [],
            projectLocations: [
                {
                    getId: () => 'loc1',
                    getName: () => 'Kaer Morhen',
                    getDescription: () => ({ getText: () => 'Górskie zamczysko wiedźminów.' }),
                    getTags: () => [],
                },
            ],
            projectItems: [
                {
                    getId: () => 'it1',
                    getName: () => 'Srebrny Miecz',
                    getDescription: () => ({ getText: () => 'Skuteczny przeciw potworom.' }),
                    getTags: () => [],
                },
            ],
            projectStats: [
                {
                    getId: () => 'st1',
                    getName: () => 'Siła',
                    getDescription: () => ({ getText: () => 'Fizyczna moc.' }),
                },
            ],
            projectSkills: [],
            projectParameters: [],
            projectFeatures: [],
            projectTags: [
                {
                    getId: () => 't1',
                    getName: () => 'Magia',
                    getColor: () => '#9333ea',
                },
            ],
            selectEntity: vi.fn(),
            updateMainWorkspaceUI: vi.fn(),
            renderDetailsPanel: vi.fn(),
            renderHistoryBar: vi.fn(),
        }
    })

    describe('Global Drawer Search', () => {
        it('initializes category filters and switches active filter on click', () => {
            setupDrawerSearch(mockCtx)

            const filterContainer = document.getElementById('drawer-search-category-filters')
            const buttons = filterContainer?.querySelectorAll('.drawer-search-filter-btn')
            expect(buttons?.length).toBe(8)

            const charactersBtn = Array.from(buttons || []).find(
                b => (b as HTMLElement).dataset.filter === 'characters'
            ) as HTMLButtonElement

            charactersBtn.click()
            expect(getActiveDrawerCategory()).toBe('characters')

            // Reset
            setActiveDrawerCategory('all')
            expect(getActiveDrawerCategory()).toBe('all')
        })

        it('renders matching results and highlights matched terms', () => {
            setupDrawerSearch(mockCtx)
            renderDrawerSearchResults(mockCtx, 'Miecz')

            const resultsContainer = document.getElementById('drawer-search-results')!
            expect(resultsContainer.innerHTML).toContain('Srebrny <mark')
            expect(resultsContainer.innerHTML).toContain('Przedmiot')

            const statsEl = document.getElementById('drawer-search-stats')!
            expect(statsEl.textContent).toContain('1 wyników')
        })

        it('clears query when clear button is clicked', () => {
            setupDrawerSearch(mockCtx)
            const input = document.getElementById('drawer-search-input') as HTMLInputElement
            const clearBtn = document.getElementById('btn-drawer-search-clear') as HTMLButtonElement

            input.value = 'las'
            input.dispatchEvent(new Event('input'))

            expect(clearBtn.classList.contains('hidden')).toBe(false)

            clearBtn.click()
            expect(input.value).toBe('')
            expect(clearBtn.classList.contains('hidden')).toBe(true)
        })

        it('executes item selection and details display when search result is clicked', () => {
            setupDrawerSearch(mockCtx)
            renderDrawerSearchResults(mockCtx, 'Geralt')

            const resultItem = document.querySelector(
                '.drawer-search-result-item'
            ) as HTMLDivElement | null
            expect(resultItem).not.toBeNull()

            resultItem?.click()
            expect(mockCtx.selectEntity).toHaveBeenCalled()
        })
    })

    describe('Section Search Inputs (live filtering)', () => {
        it('wires up tag-search-input to vm.setTagSearchQuery', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('tag-search-input') as HTMLInputElement

            input.value = 'mag'
            input.dispatchEvent(new Event('input'))

            expect(vm.getTagSearchQuery()).toBe('mag')
        })

        it('wires up scene-search-input to vm.setSceneSearchQuery', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('scene-search-input') as HTMLInputElement

            input.value = 'wyprawa'
            input.dispatchEvent(new Event('input'))

            expect(vm.getSceneSearchQuery()).toBe('wyprawa')
        })

        it('wires up connection-search-input to vm.setConnectionSearchQuery', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('connection-search-input') as HTMLInputElement

            input.value = 'skok'
            input.dispatchEvent(new Event('input'))

            expect(vm.getConnectionSearchQuery()).toBe('skok')
        })

        it('wires up character-search-input to vm.setCharacterSearchQuery', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('character-search-input') as HTMLInputElement

            input.value = 'wiedźmin'
            input.dispatchEvent(new Event('input'))

            expect(vm.getCharacterSearchQuery()).toBe('wiedźmin')
        })

        it('wires up location-search-input to vm.setLocationSearchQuery', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('location-search-input') as HTMLInputElement

            input.value = 'zamek'
            input.dispatchEvent(new Event('input'))

            expect(vm.getLocationSearchQuery()).toBe('zamek')
        })

        it('wires up trait-search-input to stat, skill, parameter and feature queries', () => {
            setupSectionSearchInputs(mockCtx)
            const input = document.getElementById('trait-search-input') as HTMLInputElement

            input.value = 'siła'
            input.dispatchEvent(new Event('input'))

            expect(vm.getStatSearchQuery()).toBe('siła')
            expect(vm.getSkillSearchQuery()).toBe('siła')
            expect(vm.getParameterSearchQuery()).toBe('siła')
            expect(vm.getFeatureSearchQuery()).toBe('siła')
        })
    })

    describe('MainWindowViewModel Item Filtering', () => {
        it('filters items by itemSearchQuery matching name and description', () => {
            const it1 = new Item('i1', 'Lemiesz')
            const it2 = new Item('i2', 'Tarcza')
            it2.getDescription().setText('Wykuta z mocnego żelaza.')

            vm.setItemSearchQuery('żelaz')
            expect(vm.searchAndFilterItems([it1, it2])).toEqual([it2])

            vm.setItemSearchQuery('lem')
            expect(vm.searchAndFilterItems([it1, it2])).toEqual([it1])

            vm.setItemSearchQuery('')
            expect(vm.searchAndFilterItems([it1, it2])).toEqual([it1, it2])
        })
    })
})
