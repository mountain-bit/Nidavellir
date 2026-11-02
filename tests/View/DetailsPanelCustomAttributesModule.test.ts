// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import {
    renderAddCustomAttributeBarHtml,
    renderCustomAttributeRowHtml,
    renderCustomAttributesHeaderHtml,
    renderCustomAttributesModule,
    renderCustomAttributesSectionHtml,
    renderEmptyCustomAttributesHtml,
} from '../../View/ui/detailsPanel/modules/customAttributesModule.js'

describe('customAttributesModule', () => {
    let container: HTMLElement
    let mockEntity: {
        _attrs: Array<{ name: string; value: string | number }>
        getCustomAttributes: () => Array<{ name: string; value: string | number }>
        setCustomAttributes: (attrs: Array<{ name: string; value: string | number }>) => void
    }
    let mockCtx: {
        renderDetailsPanel: ReturnType<typeof vi.fn>
        refreshActiveSection: ReturnType<typeof vi.fn>
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        document.body.appendChild(container)

        mockEntity = {
            _attrs: [
                { name: 'Rasa', value: 'Krasnolud' },
                { name: 'Frakcja', value: 'Górnicy' },
            ],
            getCustomAttributes: vi.fn(() => mockEntity._attrs),
            setCustomAttributes: vi.fn((attrs: Array<{ name: string; value: string | number }>) => {
                mockEntity._attrs = attrs
            }),
        }

        mockCtx = {
            renderDetailsPanel: vi.fn(),
            refreshActiveSection: vi.fn(),
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        container.remove()
        vi.restoreAllMocks()
    })

    describe('Template helper functions', () => {
        it('renderCustomAttributesHeaderHtml renders title and count badge', () => {
            const html = renderCustomAttributesHeaderHtml(3)
            expect(html).toContain('Atrybuty niestandardowe')
            expect(html).toContain('>3<')
        })

        it('renderCustomAttributesHeaderHtml handles invalid or negative counts', () => {
            expect(renderCustomAttributesHeaderHtml(-5)).toContain('>0<')
            expect(renderCustomAttributesHeaderHtml(NaN)).toContain('>0<')
        })

        it('renderEmptyCustomAttributesHtml renders italic empty message', () => {
            const html = renderEmptyCustomAttributesHtml()
            expect(html).toContain('Brak atrybutów niestandardowych')
            expect(html).toContain('italic')
        })

        it('renderCustomAttributeRowHtml renders inputs with escaped values and close button', () => {
            const html = renderCustomAttributeRowHtml(
                { name: '<tag>&"name"', value: '<b>"val"&</b>' },
                1
            )
            expect(html).toContain('&lt;tag&gt;&amp;&quot;name&quot;')
            expect(html).toContain('&lt;b&gt;&quot;val&quot;&amp;&lt;/b&gt;')
            expect(html).toContain('data-attr-index="1"')
            expect(html).toContain('btn-remove-attr')
            expect(html).toContain('<svg')
        })

        it('renderAddCustomAttributeBarHtml renders input placeholders and add button', () => {
            const html = renderAddCustomAttributeBarHtml()
            expect(html).toContain('details-add-attr-name')
            expect(html).toContain('details-add-attr-val')
            expect(html).toContain('btn-details-add-attr')
            expect(html).toContain('Dodaj')
        })

        it('renderCustomAttributesSectionHtml renders empty state when attributes are empty', () => {
            const html = renderCustomAttributesSectionHtml([])
            expect(html).toContain('Brak atrybutów niestandardowych')
            expect(html).toContain('>0<')
        })

        it('renderCustomAttributesSectionHtml renders list when attributes exist', () => {
            const html = renderCustomAttributesSectionHtml([{ name: 'Klucz', value: 'Wartość' }])
            expect(html).not.toContain('Brak atrybutów niestandardowych')
            expect(html).toContain('Klucz')
            expect(html).toContain('Wartość')
            expect(html).toContain('>1<')
        })
    })

    describe('renderCustomAttributesModule DOM and event interactions', () => {
        it('returns null if container or entity is missing or invalid', () => {
            expect(renderCustomAttributesModule(null, mockEntity)).toBeNull()
            expect(renderCustomAttributesModule(container, null)).toBeNull()
            expect(renderCustomAttributesModule(container, {})).toBeNull()
        })

        it('renders attributes section and appends to container', () => {
            const section = renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx)
            expect(section).not.toBeNull()
            expect(container.contains(section as Node)).toBe(true)
            const rows = container.querySelectorAll('[data-attr-index]')
            expect(rows.length).toBe(2)
        })

        it('updates entity and calls refreshActiveSection when input changes', () => {
            renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx)
            const firstRow = container.querySelector('[data-attr-index="0"]')
            const nameInput = firstRow?.querySelector('.attr-name-input') as HTMLInputElement
            const valInput = firstRow?.querySelector('.attr-val-input') as HTMLInputElement

            nameInput.value = 'NowaRasa'
            nameInput.dispatchEvent(new Event('change'))

            expect(mockEntity.setCustomAttributes).toHaveBeenCalled()
            expect(mockEntity._attrs[0].name).toBe('NowaRasa')
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('npc')

            valInput.value = 'Elf'
            valInput.dispatchEvent(new Event('change'))

            expect(mockEntity._attrs[0].value).toBe('Elf')
        })

        it('removes attribute when remove button is clicked', () => {
            const onRefreshDetails = vi.fn()
            renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx, onRefreshDetails)

            const firstRemoveBtn = container.querySelector(
                '[data-attr-index="0"] .btn-remove-attr'
            ) as HTMLButtonElement
            firstRemoveBtn.click()

            expect(mockEntity.setCustomAttributes).toHaveBeenCalledWith([
                { name: 'Frakcja', value: 'Górnicy' },
            ])
            expect(onRefreshDetails).toHaveBeenCalledWith(mockCtx)
            expect(mockCtx.refreshActiveSection).toHaveBeenCalledWith('npc')
        })

        it('adds a new attribute on clicking add button and clears inputs', () => {
            const onRefreshDetails = vi.fn()
            renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx, onRefreshDetails)

            const newNameInput = container.querySelector(
                '#details-add-attr-name'
            ) as HTMLInputElement
            const newValInput = container.querySelector('#details-add-attr-val') as HTMLInputElement
            const addBtn = container.querySelector('#btn-details-add-attr') as HTMLButtonElement

            newNameInput.value = 'Klasa'
            newValInput.value = 'Wojownik'
            addBtn.click()

            expect(mockEntity.setCustomAttributes).toHaveBeenCalledWith([
                { name: 'Rasa', value: 'Krasnolud' },
                { name: 'Frakcja', value: 'Górnicy' },
                { name: 'Klasa', value: 'Wojownik' },
            ])
            expect(newNameInput.value).toBe('')
            expect(newValInput.value).toBe('')
            expect(onRefreshDetails).toHaveBeenCalledWith(mockCtx)
        })

        it('adds a new attribute when pressing Enter in inputs', () => {
            renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx)

            const newNameInput = container.querySelector(
                '#details-add-attr-name'
            ) as HTMLInputElement
            const newValInput = container.querySelector('#details-add-attr-val') as HTMLInputElement

            newNameInput.value = 'Rząd'
            newValInput.value = 'Królewski'

            newNameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
            expect(mockEntity.setCustomAttributes).toHaveBeenCalledWith([
                { name: 'Rasa', value: 'Krasnolud' },
                { name: 'Frakcja', value: 'Górnicy' },
                { name: 'Rząd', value: 'Królewski' },
            ])
        })

        it('does not add attribute when name is empty or only whitespace', () => {
            renderCustomAttributesModule(container, mockEntity, 'npc', mockCtx)

            const newNameInput = container.querySelector(
                '#details-add-attr-name'
            ) as HTMLInputElement
            const newValInput = container.querySelector('#details-add-attr-val') as HTMLInputElement
            const addBtn = container.querySelector('#btn-details-add-attr') as HTMLButtonElement

            newNameInput.value = '   '
            newValInput.value = 'Wartość'
            addBtn.click()

            expect(mockEntity.setCustomAttributes).not.toHaveBeenCalled()
        })
    })

    describe('Internationalization (i18n)', () => {
        it('renders in English correctly', async () => {
            await initTranslationsWithLocale('en')
            const header = renderCustomAttributesHeaderHtml(1)
            expect(header).toContain('Custom Attributes')

            const empty = renderEmptyCustomAttributesHtml()
            expect(empty).toContain('No custom attributes')

            const addBar = renderAddCustomAttributeBarHtml()
            expect(addBar).toContain('Add')
        })

        it('renders in German correctly', async () => {
            await initTranslationsWithLocale('de')
            const header = renderCustomAttributesHeaderHtml(2)
            expect(header).toContain('Benutzerdefinierte Attribute')

            const empty = renderEmptyCustomAttributesHtml()
            expect(empty).toContain('Keine benutzerdefinierten Attribute')

            const addBar = renderAddCustomAttributeBarHtml()
            expect(addBar).toContain('Hinzufügen')
        })
    })
})
