// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import {
    CHOICE_FEATURE_OPTIONS,
    createChoiceAddDropdown,
    handleFeatureSelection,
    renderChoiceAddDropdownOptionsHtml,
} from '../../View/ui/detailsPanel/choice/choiceAddDropdown.js'

describe('choiceAddDropdown', () => {
    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''
    })

    describe('CHOICE_FEATURE_OPTIONS', () => {
        it('is an immutable frozen array of feature groups and options', () => {
            expect(Object.isFrozen(CHOICE_FEATURE_OPTIONS)).toBe(true)
            expect(CHOICE_FEATURE_OPTIONS.length).toBe(3)

            for (const group of CHOICE_FEATURE_OPTIONS) {
                expect(Object.isFrozen(group)).toBe(true)
                expect(Object.isFrozen(group.options)).toBe(true)
                for (const opt of group.options) {
                    expect(Object.isFrozen(opt)).toBe(true)
                }
            }
        })

        it('contains all required feature values for conditions, gain/loss, and dice check', () => {
            const allValues = CHOICE_FEATURE_OPTIONS.flatMap(g => g.options.map(o => o.value))
            expect(allValues).toEqual([
                'cond-item',
                'cond-stat',
                'cond-tag',
                'cond-text',
                'loss',
                'gain',
                'dice',
            ])
        })
    })

    describe('renderChoiceAddDropdownOptionsHtml', () => {
        it('renders disabled placeholder option and all optgroups with options', () => {
            const html = renderChoiceAddDropdownOptionsHtml()

            expect(html).toContain('<option value="" selected disabled>Dodaj warunek</option>')
            expect(html).toContain('<optgroup label="Warunek przeskoku">')
            expect(html).toContain('<option value="cond-item">Wymagany przedmiot</option>')
            expect(html).toContain('<option value="cond-stat">Wymagana cecha / parametr</option>')
            expect(html).toContain(
                '<option value="cond-tag">Wymagany tag / flaga fabularna</option>'
            )
            expect(html).toContain('<option value="cond-text">Warunek Autora</option>')
            expect(html).toContain('<optgroup label="Zysk / Strata">')
            expect(html).toContain(
                '<option value="loss">Strata (co się straci) – przedmiot lub parametr</option>'
            )
            expect(html).toContain(
                '<option value="gain">Zysk (co się zyska) – przedmiot lub parametr</option>'
            )
            expect(html).toContain('<optgroup label="Rzut kością">')
            expect(html).toContain('<option value="dice">Rzut – test rzutu kością</option>')
        })

        it('escapes special characters to prevent HTML injection', () => {
            const customGroups = [
                {
                    groupKey: 'test.xss',
                    defaultGroupLabel: '<script>alert("group")</script>',
                    options: [
                        {
                            value: 'xss"val',
                            labelKey: 'test.xss.opt',
                            defaultLabel: '<b>Bold Option</b>',
                        },
                    ],
                },
            ]

            const html = renderChoiceAddDropdownOptionsHtml(customGroups)
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;alert(&quot;group&quot;)&lt;/script&gt;')
            expect(html).toContain('value="xss&quot;val"')
            expect(html).toContain('&lt;b&gt;Bold Option&lt;/b&gt;')
        })

        it('returns placeholder only when given empty or non-array groups', () => {
            const html = renderChoiceAddDropdownOptionsHtml(
                null as unknown as typeof CHOICE_FEATURE_OPTIONS
            )
            expect(html).toBe('<option value="" selected disabled>Dodaj warunek</option>')
        })
    })

    describe('handleFeatureSelection', () => {
        it('invokes callback with selected value and resets select value to empty string', () => {
            const onSelect = vi.fn()
            const selectEl = document.createElement('select')
            selectEl.innerHTML =
                '<option value="">Placeholder</option><option value="cond-item">Item</option>'
            selectEl.value = 'cond-item'

            handleFeatureSelection(selectEl, onSelect)

            expect(onSelect).toHaveBeenCalledWith('cond-item')
            expect(selectEl.value).toBe('')
        })

        it('does not invoke callback when selected value is empty', () => {
            const onSelect = vi.fn()
            const selectEl = document.createElement('select')
            selectEl.innerHTML =
                '<option value="">Placeholder</option><option value="cond-item">Item</option>'
            selectEl.value = ''

            handleFeatureSelection(selectEl, onSelect)

            expect(onSelect).not.toHaveBeenCalled()
            expect(selectEl.value).toBe('')
        })

        it('handles null selectEl or missing callback safely without throwing', () => {
            expect(() => handleFeatureSelection(null, vi.fn())).not.toThrow()

            const selectEl = document.createElement('select')
            selectEl.innerHTML = '<option value="dice">Dice</option>'
            selectEl.value = 'dice'
            expect(() => handleFeatureSelection(selectEl, undefined)).not.toThrow()
            expect(selectEl.value).toBe('')
        })
    })

    describe('createChoiceAddDropdown UI component', () => {
        it('renders dropdown section with title, icon, and select element', () => {
            const section = createChoiceAddDropdown()

            expect(section.tagName.toLowerCase()).toBe('section')
            expect(section.className).toContain('border-b border-[#333338]')

            const title = section.querySelector('span.text-xs')
            expect(title?.textContent).toContain('Warunek przeskoku')
            expect(section.querySelector('svg')).not.toBeNull()

            const selectEl = section.querySelector(
                '#choice-add-feature-select'
            ) as HTMLSelectElement
            expect(selectEl).not.toBeNull()
            expect(selectEl.getAttribute('aria-label')).toBe('Dodaj warunek')
            expect(selectEl.options.length).toBeGreaterThanOrEqual(8)
        })

        it('calls onSelectFeature function when select changes and resets value', () => {
            const onSelect = vi.fn()
            const section = createChoiceAddDropdown(onSelect)

            const selectEl = section.querySelector(
                '#choice-add-feature-select'
            ) as HTMLSelectElement
            selectEl.value = 'cond-stat'
            selectEl.dispatchEvent(new Event('change'))

            expect(onSelect).toHaveBeenCalledWith('cond-stat')
            expect(selectEl.value).toBe('')
        })

        it('accepts options object parameter with onSelectFeature callback', () => {
            const onSelect = vi.fn()
            const section = createChoiceAddDropdown({ onSelectFeature: onSelect })

            const selectEl = section.querySelector(
                '#choice-add-feature-select'
            ) as HTMLSelectElement
            selectEl.value = 'gain'
            selectEl.dispatchEvent(new Event('change'))

            expect(onSelect).toHaveBeenCalledWith('gain')
            expect(selectEl.value).toBe('')
        })

        it('does not throw when select changes without a callback configured', () => {
            const section = createChoiceAddDropdown()
            const selectEl = section.querySelector(
                '#choice-add-feature-select'
            ) as HTMLSelectElement

            selectEl.value = 'dice'
            expect(() => selectEl.dispatchEvent(new Event('change'))).not.toThrow()
            expect(selectEl.value).toBe('')
        })
    })
})
