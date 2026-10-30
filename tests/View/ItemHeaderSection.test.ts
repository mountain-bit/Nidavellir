// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { toast } from '../../dist/Utils/toast.js'
import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Item } from '../../Model/Item.js'
import {
    createItemHeaderSection,
    renderItemHeaderHtml,
} from '../../View/ui/detailsPanel/item/itemHeaderSection.js'

describe('itemHeaderSection Component', () => {
    let item: Item
    let ctx: {
        vm: { selection: { closeHistoryItem: ReturnType<typeof vi.fn> } }
        renderDetailsPanel: ReturnType<typeof vi.fn>
        refreshActiveSection: ReturnType<typeof vi.fn>
    }
    let onRefreshDetails: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        item = new Item('it_sword_1', 'Miecz Świtu')

        ctx = {
            vm: {
                selection: {
                    closeHistoryItem: vi.fn(),
                },
            },
            renderDetailsPanel: vi.fn(),
            refreshActiveSection: vi.fn(),
        }

        onRefreshDetails = vi.fn()
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderItemHeaderHtml', () => {
        it('renders title, item ID, and control buttons', () => {
            const html = renderItemHeaderHtml('it_sword_1')
            expect(html).toContain('Przedmiot')
            expect(html).toContain('it_sword_1')
            expect(html).toContain('data-action="close-item-details"')
            expect(html).toContain('data-action="copy-item-id"')
        })
    })

    describe('createItemHeaderSection', () => {
        it('returns null if entity is missing', () => {
            expect(createItemHeaderSection(null as unknown as Item)).toBeNull()
        })

        it('creates header section DOM and handles close button click', () => {
            const section = createItemHeaderSection(
                item,
                'it_sword_1',
                { id: 'it_sword_1' },
                ctx,
                onRefreshDetails
            )

            expect(section).not.toBeNull()
            const closeBtn = section?.querySelector('#btn-details-close-item') as HTMLButtonElement
            expect(closeBtn).not.toBeNull()

            closeBtn.click()

            expect(ctx.vm.selection.closeHistoryItem).toHaveBeenCalledWith('it_sword_1')
            expect(onRefreshDetails).toHaveBeenCalledWith(ctx)
            expect(ctx.refreshActiveSection).toHaveBeenCalledWith('item')
        })

        it('handles copy ID button click and triggers toast notification', async () => {
            const writeTextMock = vi.fn().mockResolvedValue(undefined)
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: writeTextMock,
                },
                configurable: true,
            })

            const toastSpy = vi.spyOn(toast, 'success').mockImplementation(() => '')

            const section = createItemHeaderSection(item, 'it_sword_1', null, ctx)
            const copyBtn = section?.querySelector('#btn-copy-item-id') as HTMLButtonElement
            expect(copyBtn).not.toBeNull()

            copyBtn.click()

            expect(writeTextMock).toHaveBeenCalledWith('it_sword_1')
            await vi.waitFor(() => {
                expect(toastSpy).toHaveBeenCalledWith('Skopiowano ID do schowka')
            })
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemHeaderSection(item, 'it_sword_1')
            expect(sectionEn?.textContent).toContain('Item')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemHeaderSection(item, 'it_sword_1')
            expect(sectionDe?.textContent).toContain('Gegenstand')
        })
    })
})
