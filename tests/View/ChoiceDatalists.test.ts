// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import {
    ensureChoiceDatalists,
    extractItemNames,
    extractStatNames,
    extractTagNames,
    renderChoiceDatalistsHtml,
    renderDatalistHtml,
} from '../../View/ui/detailsPanel/choice/choiceDatalists.js'

describe('choiceDatalists', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    describe('extractItemNames', () => {
        it('returns empty array when ctx is missing or items are empty', () => {
            expect(extractItemNames(null)).toEqual([])
            expect(extractItemNames(undefined)).toEqual([])
            expect(extractItemNames({})).toEqual([])
            expect(extractItemNames({ projectItems: [] })).toEqual([])
        })

        it('extracts item names from objects with getName() or name property', () => {
            const ctx = {
                projectItems: [
                    { getName: (): string => 'Pochodnia' },
                    { name: 'Klucz' },
                    null,
                    { name: '   ' },
                    { getName: (): string => '' },
                ],
            }
            expect(extractItemNames(ctx)).toEqual(['Klucz', 'Pochodnia'])
        })

        it('deduplicates and sorts item names alphabetically', () => {
            const ctx = {
                projectItems: [
                    { name: 'Złoto' },
                    { name: 'Diament' },
                    { getName: (): string => 'Złoto' },
                    { name: 'Bursztyn' },
                ],
            }
            expect(extractItemNames(ctx)).toEqual(['Bursztyn', 'Diament', 'Złoto'])
        })

        it('falls back to ctx.projectData.projectItems if present', () => {
            const ctx = {
                projectData: {
                    projectItems: [{ name: 'Lina' }, { name: 'Topór' }],
                },
            }
            expect(extractItemNames(ctx)).toEqual(['Lina', 'Topór'])
        })
    })

    describe('extractStatNames', () => {
        it('returns empty array when ctx is missing or stats are empty', () => {
            expect(extractStatNames(null)).toEqual([])
            expect(extractStatNames(undefined)).toEqual([])
            expect(extractStatNames({})).toEqual([])
        })

        it('combines projectStats, projectParameters, and projectSkills, deduplicating and sorting', () => {
            const ctx = {
                projectStats: [{ getName: (): string => 'Siła' }, { name: 'Zręczność' }],
                projectParameters: [{ name: 'Zdrowie' }, { getName: (): string => 'Siła' }],
                projectSkills: [{ name: 'Otwieranie zamków' }],
            }
            expect(extractStatNames(ctx)).toEqual([
                'Otwieranie zamków',
                'Siła',
                'Zdrowie',
                'Zręczność',
            ])
        })

        it('falls back to ctx.projectData for stats, parameters, and skills', () => {
            const ctx = {
                projectData: {
                    projectStats: [{ name: 'Magia' }],
                    projectParameters: [{ name: 'Mana' }],
                    projectSkills: [{ name: 'Zielarstwo' }],
                },
            }
            expect(extractStatNames(ctx)).toEqual(['Magia', 'Mana', 'Zielarstwo'])
        })
    })

    describe('extractTagNames', () => {
        it('returns empty array when ctx is missing or tags are empty', () => {
            expect(extractTagNames(null)).toEqual([])
            expect(extractTagNames(undefined)).toEqual([])
            expect(extractTagNames({})).toEqual([])
        })

        it('extracts unique tags from projectTags and paragraph tags (both strings and objects)', () => {
            const ctx = {
                projectTags: ['wioska', { getName: (): string => 'las' }, { name: 'jaskinia' }],
                projectParagraphs: [
                    {
                        getTags: (): (string | { name?: string; getName?: () => string })[] => [
                            'wioska',
                            { name: 'boss_pokonany' },
                            { getName: (): string => 'skarb' },
                        ],
                    },
                    {
                        tags: ['las', 'noc', null, { name: '   ' }],
                    },
                ],
            }
            expect(extractTagNames(ctx)).toEqual([
                'boss_pokonany',
                'jaskinia',
                'las',
                'noc',
                'skarb',
                'wioska',
            ])
        })

        it('falls back to ctx.projectData for tags and paragraphs', () => {
            const ctx = {
                projectData: {
                    projectTags: [{ name: 'zamek' }],
                    projectParagraphs: [{ tags: ['smok'] }],
                },
            }
            expect(extractTagNames(ctx)).toEqual(['smok', 'zamek'])
        })
    })

    describe('renderDatalistHtml and renderChoiceDatalistsHtml', () => {
        it('renders empty datalist when options list is empty or invalid', () => {
            const html = renderDatalistHtml('my-list', [])
            expect(html).toBe('<datalist id="my-list"></datalist>')

            const nullHtml = renderDatalistHtml('my-list', null as unknown as string[])
            expect(nullHtml).toBe('<datalist id="my-list"></datalist>')
        })

        it('escapes option values in renderDatalistHtml to prevent HTML injection', () => {
            const html = renderDatalistHtml('items', [
                '<script>alert(1)</script>',
                'Miecz "Zwycięzca"',
            ])
            expect(html).toContain(
                '<option value="&lt;script&gt;alert(1)&lt;/script&gt;"></option>'
            )
            expect(html).toContain('<option value="Miecz &quot;Zwycięzca&quot;"></option>')
        })

        it('renders all three choice datalists in renderChoiceDatalistsHtml', () => {
            const html = renderChoiceDatalistsHtml({
                items: ['Miecz'],
                stats: ['Siła'],
                tags: ['wioska'],
            })
            expect(html).toContain('id="choice-items-datalist"')
            expect(html).toContain('id="choice-stats-datalist"')
            expect(html).toContain('id="choice-tags-datalist"')
            expect(html).toContain('<option value="Miecz"></option>')
            expect(html).toContain('<option value="Siła"></option>')
            expect(html).toContain('<option value="wioska"></option>')
        })
    })

    describe('ensureChoiceDatalists DOM helper', () => {
        it('returns null if container is missing or invalid', () => {
            expect(ensureChoiceDatalists(null)).toBeNull()
            expect(ensureChoiceDatalists(undefined)).toBeNull()
            expect(ensureChoiceDatalists({} as HTMLElement)).toBeNull()
        })

        it('creates #choice-datalists-container in container and populates options', () => {
            const container = document.createElement('div')
            const ctx = {
                projectItems: [{ name: 'Lina' }],
                projectStats: [{ name: 'Kondycja' }],
                projectTags: ['odkryto'],
            }

            const datalistsEl = ensureChoiceDatalists(container, ctx)
            expect(datalistsEl).not.toBeNull()
            expect(container.querySelector('#choice-datalists-container')).toBe(datalistsEl)
            expect(datalistsEl?.getAttribute('aria-hidden')).toBe('true')

            const itemsDatalist = datalistsEl?.querySelector('#choice-items-datalist')
            expect(itemsDatalist).not.toBeNull()
            expect(itemsDatalist?.innerHTML).toContain('<option value="Lina"></option>')

            const statsDatalist = datalistsEl?.querySelector('#choice-stats-datalist')
            expect(statsDatalist?.innerHTML).toContain('<option value="Kondycja"></option>')

            const tagsDatalist = datalistsEl?.querySelector('#choice-tags-datalist')
            expect(tagsDatalist?.innerHTML).toContain('<option value="odkryto"></option>')
        })

        it('reuses existing #choice-datalists-container without re-rendering when forceUpdate is false', () => {
            const container = document.createElement('div')
            const existingEl = document.createElement('div')
            existingEl.id = 'choice-datalists-container'
            existingEl.innerHTML = '<span id="cached-content">old</span>'
            container.appendChild(existingEl)

            const ctx = { projectItems: [{ name: 'Nowy miecz' }] }
            const result = ensureChoiceDatalists(container, ctx)

            expect(result).toBe(existingEl)
            expect(existingEl.querySelector('#cached-content')).not.toBeNull()
            expect(existingEl.innerHTML).not.toContain('Nowy miecz')
        })

        it('re-renders content of existing container when forceUpdate is true', () => {
            const container = document.createElement('div')
            const existingEl = document.createElement('div')
            existingEl.id = 'choice-datalists-container'
            existingEl.innerHTML = '<span id="cached-content">old</span>'
            container.appendChild(existingEl)

            const ctx = { projectItems: [{ name: 'Nowy miecz' }] }
            const result = ensureChoiceDatalists(container, ctx, { forceUpdate: true })

            expect(result).toBe(existingEl)
            expect(existingEl.querySelector('#cached-content')).toBeNull()
            expect(existingEl.innerHTML).toContain('Nowy miecz')
        })
    })
})
