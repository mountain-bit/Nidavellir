// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Item } from '../../Model/Item.js'
import { Tag } from '../../Model/Tag.js'
import {
    createItemTagsSection,
    createTagChip,
    renderItemTagsHtml,
    renderTagChipHtml,
} from '../../View/ui/detailsPanel/item/itemTagsSection.js'

describe('itemTagsSection Component', () => {
    let itemEntity: Item
    let tagQuest: Tag
    let tagMagic: Tag
    let ctx: {
        projectTags: Tag[]
        markDirty: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        itemEntity = new Item('it_ring_1', 'Pierścień Mocy')
        tagQuest = new Tag('tag_quest_1', 'fabularny', '#ef4444')
        tagMagic = new Tag('tag_magic_1', 'magiczny', '#8b5cf6')

        ctx = {
            projectTags: [tagQuest, tagMagic],
            markDirty: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderItemTagsHtml', () => {
        it('renders tags section header, counter, and select elements', () => {
            const html = renderItemTagsHtml(2)
            expect(html).toContain('Tagi')
            expect(html).toContain('details-item-tags-count')
            expect(html).toContain('>2<')
            expect(html).toContain('details-add-item-tag-select')
            expect(html).toContain('Wybierz tag z projektu...')
            expect(html).toContain('+ Tag')
        })
    })

    describe('renderTagChipHtml', () => {
        it('renders chip html with tag name, hash prefix, and close button', () => {
            const html = renderTagChipHtml('unikat', 'Usuń tag')
            expect(html).toContain('#unikat')
            expect(html).toContain('btn-remove-tag')
            expect(html).toContain('title="Usuń tag"')
        })

        it('safely escapes special characters', () => {
            const html = renderTagChipHtml('<script>alert(1)</script>', 'Remove & delete')
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
            expect(html).toContain('title="Remove &amp; delete"')
        })
    })

    describe('createTagChip', () => {
        it('creates tag chip element and attaches onRemove event listener', () => {
            const onRemove = vi.fn()
            const chip = createTagChip(tagQuest, onRemove)

            expect(chip.style.backgroundColor).toBe('#ef4444')
            expect(chip.textContent).toContain('#fabularny')

            const removeBtn = chip.querySelector('.btn-remove-tag') as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            removeBtn.click()

            expect(onRemove).toHaveBeenCalledWith('tag_quest_1', 'fabularny')
        })
    })

    describe('createItemTagsSection', () => {
        it('displays empty state when item has no assigned tags', () => {
            const section = createItemTagsSection(itemEntity, [], ctx)
            expect(section.textContent).toContain('Brak przypisanych tagów')
            const countBadge = section.querySelector('#details-item-tags-count')
            expect(countBadge?.textContent).toBe('0')
        })

        it('displays assigned tags and populates project tags in select', () => {
            itemEntity.addTag(tagQuest)
            const section = createItemTagsSection(itemEntity, itemEntity.getTags(), ctx)

            expect(section.textContent).toContain('#fabularny')
            const countBadge = section.querySelector('#details-item-tags-count')
            expect(countBadge?.textContent).toBe('1')

            const select = section.querySelector(
                '#details-add-item-tag-select'
            ) as HTMLSelectElement
            expect(select.options.length).toBe(3) // 1 placeholder + 2 project tags
            expect(select.options[1].value).toBe('tag_quest_1')
            expect(select.options[2].value).toBe('tag_magic_1')
        })

        it('adds a project tag to item when clicking add button and updates UI and count', () => {
            const section = createItemTagsSection(itemEntity, [], ctx)
            const select = section.querySelector(
                '#details-add-item-tag-select'
            ) as HTMLSelectElement
            const addBtn = section.querySelector('#btn-details-add-item-tag') as HTMLButtonElement
            const countBadge = section.querySelector('#details-item-tags-count')

            select.value = 'tag_magic_1'
            addBtn.click()

            expect(itemEntity.getTags().length).toBe(1)
            expect(itemEntity.getTags()[0].getName()).toBe('magiczny')
            expect(section.textContent).toContain('#magiczny')
            expect(countBadge?.textContent).toBe('1')
            expect(select.value).toBe('')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('removes tag when clicking remove button on chip and updates UI and count', () => {
            itemEntity.addTag(tagQuest)
            const section = createItemTagsSection(itemEntity, itemEntity.getTags(), ctx)
            const countBadge = section.querySelector('#details-item-tags-count')
            expect(countBadge?.textContent).toBe('1')

            const removeBtn = section.querySelector('.btn-remove-tag') as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            removeBtn.click()

            expect(itemEntity.getTags().length).toBe(0)
            expect(section.textContent).toContain('Brak przypisanych tagów')
            expect(countBadge?.textContent).toBe('0')
            expect(ctx.markDirty).toHaveBeenCalled()
        })

        it('handles omitted currentTags parameter gracefully', () => {
            itemEntity.addTag(tagQuest)
            const section = createItemTagsSection(itemEntity, undefined, ctx)
            expect(section.textContent).toContain('#fabularny')
            const countBadge = section.querySelector('#details-item-tags-count')
            expect(countBadge?.textContent).toBe('1')
        })

        it('supports multi-language translations (EN, DE)', async () => {
            await initTranslationsWithLocale('en')
            const sectionEn = createItemTagsSection(itemEntity, [], ctx)
            expect(sectionEn.textContent).toContain('Tags')
            expect(sectionEn.textContent).toContain('No assigned tags')
            expect(sectionEn.textContent).toContain('Select tag from project...')

            await initTranslationsWithLocale('de')
            const sectionDe = createItemTagsSection(itemEntity, [], ctx)
            expect(sectionDe.textContent).toContain('Tag aus dem Projekt auswählen...')
        })
    })
})
