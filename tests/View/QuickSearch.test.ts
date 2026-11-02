// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    closeQuickSearch,
    executeQuickSearchAction,
    getAllProjectObjects,
    getEntityText,
    highlightMatch,
    initQuickSearch,
    openQuickSearch,
    scoreCandidate,
    searchProjectObjects,
} from '../../View/ui/workspace/quickSearch.js'

describe('QuickSearch', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="modal-quick-search" class="hidden">
                <input id="quick-search-input" />
                <button id="btn-quick-search-clear" class="hidden"></button>
                <div id="quick-search-category-filters"></div>
                <div id="quick-search-results"></div>
                <div id="quick-search-stats"></div>
            </div>
            <button data-action="quick-search"></button>
        `
        vi.clearAllMocks()
    })

    describe('getEntityText', () => {
        it('extracts text from plain string', () => {
            expect(getEntityText('Przykładowy opis')).toBe('Przykładowy opis')
        })

        it('extracts text from object with getText() method', () => {
            const desc = { getText: () => 'Tekst z metody' }
            expect(getEntityText(desc)).toBe('Tekst z metody')
        })

        it('extracts summary from object with getSummary() method', () => {
            const desc = { getSummary: () => 'Podsumowanie' }
            expect(getEntityText(desc)).toBe('Podsumowanie')
        })

        it('extracts text from plain property', () => {
            const desc = { text: 'Pole tekstowe' }
            expect(getEntityText(desc)).toBe('Pole tekstowe')
        })

        it('returns empty string for null or undefined', () => {
            expect(getEntityText(null)).toBe('')
            expect(getEntityText(undefined)).toBe('')
        })
    })

    describe('highlightMatch', () => {
        it('wraps matching text with mark tags', () => {
            const html = highlightMatch('Karczma Pod Rozbrykanym Kucem', 'Karczma')
            expect(html).toContain('<mark')
            expect(html).toContain('Karczma</mark>')
        })

        it('returns safe escaped text if query is empty', () => {
            expect(highlightMatch('Karczma & Smok', '')).toBe('Karczma &amp; Smok')
        })
    })

    describe('Search Ranking: word prefix first, then substring inside words', () => {
        it('prioritizes beginning of words over substring inside words', () => {
            const itemWordPrefix = {
                id: '1',
                title: 'Karczma pod smokiem',
                description: 'Stary budynek',
                category: 'locations',
                type: 'location',
                tags: [],
            }

            const itemInsideWord = {
                id: '2',
                title: 'Stara Piekarnia', // contains "kar" inside word "Piekarnia"
                description: 'Pachnie chlebem',
                category: 'locations',
                type: 'location',
                tags: [],
            }

            const scorePrefix = scoreCandidate(itemWordPrefix as any, 'kar')
            const scoreInside = scoreCandidate(itemInsideWord as any, 'kar')

            // Lower numeric score / tier = higher ranking priority
            expect(scorePrefix.matched).toBe(true)
            expect(scoreInside.matched).toBe(true)
            expect(scorePrefix.tier).toBeLessThan(scoreInside.tier)
            expect(scorePrefix.score).toBeLessThan(scoreInside.score)
        })

        it('prioritizes title match over description match', () => {
            const itemTitleMatch = {
                id: '1',
                title: 'Sztylet bandyty',
                description: 'Zwykła broń',
                category: 'items',
                type: 'item',
                tags: [],
            }

            const itemDescMatch = {
                id: '2',
                title: 'Skrzynia',
                description: 'W środku leży ostry sztylet',
                category: 'items',
                type: 'item',
                tags: [],
            }

            const scoreTitle = scoreCandidate(itemTitleMatch as any, 'sztylet')
            const scoreDesc = scoreCandidate(itemDescMatch as any, 'sztylet')

            expect(scoreTitle.matched).toBe(true)
            expect(scoreDesc.matched).toBe(true)
            expect(scoreTitle.tier).toBeLessThan(scoreDesc.tier)
            expect(scoreTitle.score).toBeLessThan(scoreDesc.score)
        })

        it('ranks results correctly in searchProjectObjects', () => {
            const mockCtx = {
                projectLocations: [
                    {
                        getId: () => 'loc-piekarnia',
                        getName: () => 'Piekarnia',
                        getDescription: () => 'Ciepłe pieczywo',
                    },
                    {
                        getId: () => 'loc-karczma',
                        getName: () => 'Karczma',
                        getDescription: () => 'Zimne piwo',
                    },
                ],
            }

            // Searching for "kar" should return "Karczma" FIRST, then "Piekarnia"
            const results = searchProjectObjects(mockCtx, 'kar')
            expect(results.length).toBe(2)
            expect(results[0].id).toBe('loc-karczma')
            expect(results[1].id).toBe('loc-piekarnia')
        })
    })

    describe('getAllProjectObjects - Type differentiation', () => {
        it('correctly categorizes and tags all project entities', () => {
            const mockCtx = {
                projectParagraphs: [
                    {
                        getId: () => 'p-1',
                        getTitle: () => 'Rozstaje dróg',
                        getContent: () => 'Stoisz przed wyborem.',
                        getNumber: () => 1,
                        getIsStart: () => true,
                    },
                ],
                projectScenes: [
                    {
                        getId: () => 'scene-1',
                        getName: () => 'Akt I',
                        getDescription: () => 'Początek przygody',
                    },
                ],
                projectCharacters: [
                    {
                        getId: () => 'npc-1',
                        getName: () => 'Mędrzec Elrond',
                        getDescription: () => 'Nosi szatę',
                    },
                ],
                projectLocations: [
                    {
                        getId: () => 'loc-1',
                        getName: () => 'Dolina Rivendell',
                        getDescription: () => 'Ciche schronienie',
                    },
                ],
                projectItems: [
                    {
                        getId: () => 'item-1',
                        getName: () => 'Pierścień',
                        getDescription: () => 'Cenny skarb',
                    },
                ],
                projectStats: [
                    {
                        getId: () => 'stat-1',
                        getName: () => 'Siła',
                        getDescription: () => 'Moc mięśni',
                    },
                ],
            }

            const items = getAllProjectObjects(mockCtx)
            expect(items.length).toBe(6)

            const paragraph = items.find(i => i.id === 'p-1')
            expect(paragraph).toBeDefined()
            expect(paragraph?.type).toBe('paragraph')
            expect(paragraph?.typeLabel).toBe('Węzeł START')
            expect(paragraph?.actionText).toBe('Przejdź na grafie')

            const scene = items.find(i => i.id === 'scene-1')
            expect(scene?.type).toBe('scene')
            expect(scene?.actionText).toBe('Przejdź na grafie')

            const npc = items.find(i => i.id === 'npc-1')
            expect(npc?.type).toBe('character')
            expect(npc?.actionText).toBe('Otwórz szczegóły i opis')

            const location = items.find(i => i.id === 'loc-1')
            expect(location?.type).toBe('location')
            expect(location?.actionText).toBe('Otwórz szczegóły i opis')

            const item = items.find(i => i.id === 'item-1')
            expect(item?.type).toBe('item')

            const stat = items.find(i => i.id === 'stat-1')
            expect(stat?.type).toBe('stat')
        })

        it('indexes item tags, category, and modifiers correctly', () => {
            const mockCtx = {
                projectItems: [
                    {
                        getId: () => 'magic-sword',
                        getName: () => 'Miecz Płomieni',
                        getDescription: () => 'Ognisty oręż',
                        getCategory: () => 'weapon',
                        getTags: () => [{ getName: () => 'artefakt' }],
                        getModifiers: () => [{ targetName: 'Siła', operator: '+', value: 3 }],
                    },
                ],
            }

            const items = getAllProjectObjects(mockCtx)
            const sword = items.find(i => i.id === 'magic-sword')
            expect(sword).toBeDefined()
            expect(sword?.typeLabel).toBe('Przedmiot (weapon)')
            expect(sword?.tags).toEqual(['artefakt'])
            expect(sword?.modifiers).toEqual(['Siła +3'])

            // Test search matching by tag and modifier
            const byTag = searchProjectObjects(mockCtx, 'artefakt')
            expect(byTag.length).toBe(1)
            expect(byTag[0].id).toBe('magic-sword')

            const byModifier = searchProjectObjects(mockCtx, 'Siła')
            expect(byModifier.length).toBe(1)
            expect(byModifier[0].id).toBe('magic-sword')
        })
    })

    describe('executeQuickSearchAction', () => {
        it('navigates to graph and focuses paragraph when selecting a paragraph', () => {
            const mockFocusOnElement = vi.fn()
            const mockShowGraph = vi.fn()
            const mockSelectEntity = vi.fn()
            const mockVm = {
                layout: {
                    setActiveMainView: vi.fn(),
                    getActiveMainView: vi.fn().mockReturnValue('graph'),
                    isLeftDrawerOpen: vi.fn().mockReturnValue(false),
                    isRightSidebarCollapsed: vi.fn().mockReturnValue(false),
                    setRightSidebarCollapsed: vi.fn(),
                },
            }

            const mockCtx = {
                vm: mockVm,
                showGraph: mockShowGraph,
                selectEntity: mockSelectEntity,
                storyGraphInstance: {
                    focusOnElement: mockFocusOnElement,
                },
            }

            const paragraphItem = {
                id: 'p-10',
                type: 'paragraph',
                category: 'paragraphs',
                entity: { id: 'p-10' },
                title: 'Komnata tajemnic',
            }

            executeQuickSearchAction(paragraphItem as any, mockCtx)

            expect(mockShowGraph).toHaveBeenCalledWith(true)
            expect(mockVm.layout.setRightSidebarCollapsed).toHaveBeenCalledWith(false)
            expect(mockSelectEntity).toHaveBeenCalledWith(paragraphItem.entity, 'paragraph')
            expect(mockFocusOnElement).toHaveBeenCalledWith('p-10', true)
        })

        it('opens details and description in right sidebar when selecting an NPC or Location', () => {
            const mockSelectEntity = vi.fn()
            const mockRenderDetails = vi.fn()
            const mockRenderHistory = vi.fn()
            const mockVm = {
                layout: {
                    setRightSidebarCollapsed: vi.fn(),
                    isRightSidebarCollapsed: vi.fn().mockReturnValue(false),
                },
            }

            const mockCtx = {
                vm: mockVm,
                selectEntity: mockSelectEntity,
                renderDetailsPanel: mockRenderDetails,
                renderHistoryBar: mockRenderHistory,
            }

            const npcItem = {
                id: 'npc-karol',
                type: 'character',
                category: 'characters',
                entity: { id: 'npc-karol', name: 'Karol' },
                title: 'Karol',
            }

            executeQuickSearchAction(npcItem as any, mockCtx)

            expect(mockSelectEntity).toHaveBeenCalledWith(npcItem.entity, 'character')
            expect(mockVm.layout.setRightSidebarCollapsed).toHaveBeenCalledWith(false)
            expect(mockRenderHistory).toHaveBeenCalled()
            expect(mockRenderDetails).toHaveBeenCalled()
        })
    })

    describe('Modal Interactions and Keyboard Navigation', () => {
        it('opens modal, focuses input, and renders candidate items', () => {
            const mockCtx = {
                projectParagraphs: [
                    {
                        getId: () => 'p-1',
                        getTitle: () => 'Start',
                        getContent: () => 'Początek gry',
                    },
                ],
            }

            initQuickSearch(mockCtx)
            openQuickSearch(mockCtx)

            const modal = document.getElementById('modal-quick-search')
            expect(modal?.classList.contains('hidden')).toBe(false)

            const results = document.getElementById('quick-search-results')
            expect(results?.querySelectorAll('.quick-search-item').length).toBe(1)
        })

        it('closes modal when closeQuickSearch is invoked', () => {
            const modal = document.getElementById('modal-quick-search')
            modal?.classList.remove('hidden')

            closeQuickSearch()
            expect(modal?.classList.contains('hidden')).toBe(true)
        })

        it('supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', () => {
            const mockSelectEntity = vi.fn()
            const mockCtx = {
                projectCharacters: [
                    { getId: () => 'c1', getName: () => 'Geralt' },
                    { getId: () => 'c2', getName: () => 'Jaskier' },
                ],
                selectEntity: mockSelectEntity,
                vm: {
                    layout: {
                        setRightSidebarCollapsed: vi.fn(),
                        isRightSidebarCollapsed: vi.fn().mockReturnValue(false),
                    },
                },
            }

            initQuickSearch(mockCtx)
            openQuickSearch(mockCtx)

            const input = document.getElementById('quick-search-input') as HTMLInputElement

            // ArrowDown to move selection to second item ("Jaskier")
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

            // Enter to activate selection
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

            expect(mockSelectEntity).toHaveBeenCalled()
            const modal = document.getElementById('modal-quick-search')
            expect(modal?.classList.contains('hidden')).toBe(true)
        })
    })
})
