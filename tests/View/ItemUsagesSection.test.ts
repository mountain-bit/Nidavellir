// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Description } from '../../Model/Description.js'
import { Item } from '../../Model/Item.js'
import { Paragraph } from '../../Model/Paragraph.js'
import {
    createItemUsagesSection,
    createUsageRow,
    findItemUsages,
    getActionBadgeConfig,
    renderItemUsagesHtml,
    renderUsageItemHtml,
} from '../../View/ui/detailsPanel/item/itemUsagesSection.js'

describe('itemUsagesSection Component', () => {
    let itemEntity: Item
    let paragraph1: Paragraph
    let paragraph2: Paragraph
    let ctx: {
        projectParagraphs: Paragraph[]
        selectEntity?: ReturnType<typeof vi.fn>
        vm: {
            selectElement: ReturnType<typeof vi.fn>
        }
        renderDetailsPanel: ReturnType<typeof vi.fn>
        storyGraphInstance: {
            focusOnElement: ReturnType<typeof vi.fn>
        }
    }
    let onRefreshDetails: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_key_1', 'Złoty Klucz')

        paragraph1 = new Paragraph('p_1', 'Komnata Tronowa', new Description('# Wstęp'))
        paragraph1.setNumber(1)
        paragraph1.setItemActions([{ itemId: 'it_key_1', action: 'give', quantity: 1 }])

        paragraph2 = new Paragraph('p_2', 'Skarbiec', new Description('# Skarbiec'))
        paragraph2.setNumber(2)
        paragraph2.setItemActions([{ itemId: 'it_key_1', action: 'require', quantity: 2 }])

        ctx = {
            projectParagraphs: [paragraph1, paragraph2],
            vm: {
                selectElement: vi.fn(),
            },
            renderDetailsPanel: vi.fn(),
            storyGraphInstance: {
                focusOnElement: vi.fn(),
            },
        }

        onRefreshDetails = vi.fn()
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('findItemUsages', () => {
        it('returns matching usages by itemId and itemName', () => {
            const usages = findItemUsages('it_key_1', 'Złoty Klucz', ctx.projectParagraphs)
            expect(usages.length).toBe(2)
            expect(usages[0].paragraph).toBe(paragraph1)
            expect(usages[0].action).toBe('give')
            expect(usages[0].quantity).toBe(1)
            expect(usages[1].paragraph).toBe(paragraph2)
            expect(usages[1].action).toBe('require')
            expect(usages[1].quantity).toBe(2)
        })

        it('returns empty array when no paragraphs match or array is empty', () => {
            expect(findItemUsages('it_non_existent', '', ctx.projectParagraphs)).toEqual([])
            expect(findItemUsages('it_key_1', '', [])).toEqual([])
        })
    })

    describe('getActionBadgeConfig', () => {
        it('returns appropriate badge classes and labels', () => {
            const give = getActionBadgeConfig('give', 1)
            expect(give.badgeLabel).toBe('Otrzymaj')
            expect(give.badgeClass).toContain('emerald')

            const req = getActionBadgeConfig('require', 3)
            expect(req.badgeLabel).toBe('Wymagaj x3')
            expect(req.badgeClass).toContain('amber')

            const rem = getActionBadgeConfig('remove', 1)
            expect(rem.badgeLabel).toBe('Utrata')
            expect(rem.badgeClass).toContain('rose')
        })
    })

    describe('renderItemUsagesHtml', () => {
        it('renders usages section header and count badge', () => {
            const html = renderItemUsagesHtml(2)
            expect(html).toContain('Występowanie w paragrafach')
            expect(html).toContain('>2<')
        })

        it('renders empty message when usagesCount is 0', () => {
            const html = renderItemUsagesHtml(0)
            expect(html).toContain('Przedmiot nie jest jeszcze przypisany do żadnego paragrafu.')
        })
    })

    describe('renderUsageItemHtml', () => {
        it('renders paragraph number, name, and badge', () => {
            const html = renderUsageItemHtml({
                paragraph: paragraph1,
                action: 'give',
                quantity: 1,
            })
            expect(html).toContain('#1')
            expect(html).toContain('Komnata Tronowa')
            expect(html).toContain('Otrzymaj')
        })

        it('safely escapes special characters', () => {
            const malformedP = new Paragraph('p_bad', '<script>danger()</script>')
            malformedP.setNumber(99)
            const html = renderUsageItemHtml({
                paragraph: malformedP,
                action: 'remove',
                quantity: 1,
            })
            expect(html).toContain('&lt;script&gt;danger()&lt;/script&gt;')
        })
    })

    describe('createUsageRow', () => {
        it('handles click navigation to paragraph via VM and storyGraphInstance', () => {
            const row = createUsageRow(
                { paragraph: paragraph1, action: 'give', quantity: 1 },
                ctx,
                onRefreshDetails
            )
            row.click()

            expect(ctx.vm.selectElement).toHaveBeenCalledWith(paragraph1, 'paragraph')
            expect(onRefreshDetails).toHaveBeenCalledWith(ctx)
            expect(ctx.storyGraphInstance.focusOnElement).toHaveBeenCalledWith('p_1')
        })

        it('supports ctx.selectEntity alternative if provided', () => {
            ctx.selectEntity = vi.fn()
            const row = createUsageRow(
                { paragraph: paragraph2, action: 'require', quantity: 2 },
                ctx
            )
            row.click()

            expect(ctx.selectEntity).toHaveBeenCalledWith(paragraph2, 'paragraph')
        })
    })

    describe('createItemUsagesSection', () => {
        it('renders empty state when item is not used in any paragraphs', () => {
            const section = createItemUsagesSection(itemEntity, 'it_unused', 'Nieużyty', ctx)
            expect(section.textContent).toContain(
                'Przedmiot nie jest jeszcze przypisany do żadnego paragrafu.'
            )
        })

        it('renders matching paragraph usage rows', () => {
            const section = createItemUsagesSection(
                itemEntity,
                'it_key_1',
                'Złoty Klucz',
                ctx,
                onRefreshDetails
            )
            expect(section.textContent).toContain('Komnata Tronowa')
            expect(section.textContent).toContain('Skarbiec')
            expect(section.textContent).toContain('Otrzymaj')
            expect(section.textContent).toContain('Wymagaj x2')
        })

        it('falls back to entity methods when itemId and itemName are not supplied', () => {
            const section = createItemUsagesSection(itemEntity, '', '', ctx)
            expect(section.textContent).toContain('Komnata Tronowa')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemUsagesSection(itemEntity, 'it_key_1', '', ctx)
            expect(sectionEn.textContent).toContain('Paragraph Usages')
            expect(sectionEn.textContent).toContain('Obtain')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemUsagesSection(itemEntity, 'it_key_1', '', ctx)
            expect(sectionDe.textContent).toContain('Vorkommen in Absätzen')
            expect(sectionDe.textContent).toContain('Erhalten')
        })
    })
})
