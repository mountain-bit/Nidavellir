// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice } from '../../Model/Choice'
import { ItemCondition, StatCondition, TagCondition, TextCondition } from '../../Model/Condition'
import {
    buildConditionFromInputs,
    createChoiceConditionSection,
    createDefaultConditionForType,
    detectConditionType,
    renderItemConditionBodyHtml,
    renderStatConditionBodyHtml,
    renderTagConditionBodyHtml,
    renderTextConditionBodyHtml,
} from '../../View/ui/detailsPanel/choice/choiceConditionSection.js'

describe('choiceConditionSection', () => {
    let choice: Choice

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''
        choice = new Choice('choice_1', 'Idź dalej', 'p1', 'p2')
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('detectConditionType', () => {
        it('returns none when condition is null or undefined', () => {
            expect(detectConditionType(null)).toBe('none')
            expect(detectConditionType(undefined)).toBe('none')
        })

        it('detects item condition for instances and plain objects', () => {
            const cond = new ItemCondition('c1', 'Wymagany przedmiot', 'Klucz', 1)
            expect(detectConditionType(cond)).toBe('item')
            expect(detectConditionType({ getType: () => 'item' })).toBe('item')
            expect(detectConditionType({ type: 'item' })).toBe('item')
        })

        it('detects stat condition for instances and plain objects', () => {
            const cond = new StatCondition('c2', 'Wymagana cecha', 'Siła', '>=', 10)
            expect(detectConditionType(cond)).toBe('stat')
            expect(detectConditionType({ getType: () => 'stat' })).toBe('stat')
            expect(detectConditionType({ type: 'stat' })).toBe('stat')
        })

        it('detects tag condition for instances and plain objects', () => {
            const cond = new TagCondition('c3', 'Wymagany tag', 'odwiedzono_zamek', false)
            expect(detectConditionType(cond)).toBe('tag')
            expect(detectConditionType({ getType: () => 'tag' })).toBe('tag')
            expect(detectConditionType({ type: 'tag' })).toBe('tag')
        })

        it('defaults to text condition for other conditions', () => {
            const cond = new TextCondition('c4', 'Warunek', 'Musisz mieć pochodnię')
            expect(detectConditionType(cond)).toBe('text')
            expect(detectConditionType({ custom: true })).toBe('text')
        })
    })

    describe('createDefaultConditionForType', () => {
        it('creates ItemCondition with localized name and preserved ID', () => {
            const existing = new ItemCondition('cond_item_id', '', 'Lina', 3)
            const created = createDefaultConditionForType('item', existing) as ItemCondition

            expect(created.getType()).toBe('item')
            expect(created.getId()).toBe('cond_item_id')
            expect(created.getItemName()).toBe('Lina')
            expect(created.getQuantity()).toBe(3)
            expect(created.getName()).toBe('Wymagany przedmiot')
        })

        it('creates StatCondition with operator and value defaults', () => {
            const existing = new StatCondition('cond_stat_id', '', 'Zręczność', '>', 15)
            const created = createDefaultConditionForType('stat', existing) as StatCondition

            expect(created.getType()).toBe('stat')
            expect(created.getId()).toBe('cond_stat_id')
            expect(created.getStatName()).toBe('Zręczność')
            expect(created.getOperator()).toBe('>')
            expect(created.getValue()).toBe(15)
            expect(created.getName()).toBe('Wymagana cecha / parametr')
        })

        it('creates TagCondition with negation support', () => {
            const existing = new TagCondition('cond_tag_id', '', 'odwiedzono', true)
            const created = createDefaultConditionForType('tag', existing) as TagCondition

            expect(created.getType()).toBe('tag')
            expect(created.getId()).toBe('cond_tag_id')
            expect(created.getTagName()).toBe('odwiedzono')
            expect(created.isNegated()).toBe(true)
            expect(created.getName()).toBe('Brak tagu')
        })

        it('creates TextCondition with existing text', () => {
            const existing = new TextCondition('cond_text_id', '', 'Wymóg ukończenia misji')
            const created = createDefaultConditionForType('text', existing) as TextCondition

            expect(created.getType()).toBe('text')
            expect(created.getId()).toBe('cond_text_id')
            expect(created.getText()).toBe('Wymóg ukończenia misji')
            expect(created.getName()).toBe('Warunek Autora')
        })

        it('returns null for none or unsupported types', () => {
            expect(createDefaultConditionForType('none', null)).toBeNull()
        })
    })

    describe('buildConditionFromInputs', () => {
        let container: HTMLElement

        beforeEach(() => {
            container = document.createElement('div')
        })

        it('builds ItemCondition from DOM inputs', () => {
            container.innerHTML = `
                <input id="choice-cond-item-name" value=" Pochodnia " />
                <input id="choice-cond-item-qty" value="5" />
            `
            const cond = buildConditionFromInputs(
                'item',
                container,
                new ItemCondition('item_1', '', '', 1)
            ) as ItemCondition

            expect(cond.getType()).toBe('item')
            expect(cond.getId()).toBe('item_1')
            expect(cond.getItemName()).toBe('Pochodnia')
            expect(cond.getQuantity()).toBe(5)
        })

        it('builds StatCondition from DOM inputs', () => {
            container.innerHTML = `
                <input id="choice-cond-stat-name" value=" Inteligencja " />
                <select id="choice-cond-stat-op"><option value="<=" selected>&le;</option></select>
                <input id="choice-cond-stat-val" value="12.5" />
            `
            const cond = buildConditionFromInputs('stat', container) as StatCondition

            expect(cond.getType()).toBe('stat')
            expect(cond.getStatName()).toBe('Inteligencja')
            expect(cond.getOperator()).toBe('<=')
            expect(cond.getValue()).toBe(12.5)
        })

        it('builds TagCondition stripping leading # and parsing negation', () => {
            container.innerHTML = `
                <input id="choice-cond-tag-name" value=" #wykonano_zadanie " />
                <select id="choice-cond-tag-mode"><option value="not_has" selected>Brak tagu</option></select>
            `
            const cond = buildConditionFromInputs('tag', container) as TagCondition

            expect(cond.getType()).toBe('tag')
            expect(cond.getTagName()).toBe('wykonano_zadanie')
            expect(cond.isNegated()).toBe(true)
        })

        it('builds TextCondition from textarea value', () => {
            container.innerHTML = `
                <textarea id="details-condition-text"> Warunek specjalny </textarea>
            `
            const cond = buildConditionFromInputs('text', container) as TextCondition

            expect(cond.getType()).toBe('text')
            expect(cond.getText()).toBe('Warunek specjalny')
        })

        it('returns null when container is missing or type is invalid', () => {
            expect(buildConditionFromInputs('item', null as unknown as HTMLElement)).toBeNull()
            expect(buildConditionFromInputs('none', container)).toBeNull()
        })
    })

    describe('render*ConditionBodyHtml security and escaping', () => {
        it('escapes item condition fields against XSS', () => {
            const maliciousCond = new ItemCondition('xss1', '', '<script>alert("xss")</script>', 2)
            const html = renderItemConditionBodyHtml(maliciousCond)

            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
            expect(html).toContain('value="2"')
        })

        it('escapes stat condition fields against XSS', () => {
            const maliciousCond = new StatCondition('xss2', '', 'Stat"onfocus="alert(1)', '>=', 10)
            const html = renderStatConditionBodyHtml(maliciousCond)

            expect(html).toContain('&quot;')
            expect(html).not.toContain('Stat"onfocus')
        })

        it('renders select dropdown and restricted operators for list-based stats', () => {
            const listStatCond = new StatCondition(
                'sc_gender',
                'Warunek płci',
                'Płeć',
                '==',
                'Kobieta'
            )
            const projectStats = [
                {
                    getName: (): string => 'Płeć',
                    getStatKind: (): string => 'list',
                    getOptions: (): string[] => ['Kobieta', 'Mężczyzna', 'Inna'],
                },
            ]

            const html = renderStatConditionBodyHtml(listStatCond, projectStats)
            expect(html).toContain('select id="choice-cond-stat-val"')
            expect(html).toContain('value="Kobieta" selected')
            expect(html).toContain('value="Mężczyzna"')
            expect(html).not.toContain('input id="choice-cond-stat-val"')

            // Only == and != operators should be rendered
            expect(html).toContain('value="==" selected')
            expect(html).toContain('value="!="')
            expect(html).not.toContain('value=">="')
        })

        it('renders number input with bounds and full operators for numeric stats', () => {
            const numStatCond = new StatCondition('sc_str', 'Warunek siły', 'Siła', '>=', 15)
            const projectStats = [
                {
                    getName: (): string => 'Siła',
                    getStatKind: (): string => 'numeric',
                    getMin: (): number => 1,
                    getMax: (): number => 20,
                    getOptions: (): string[] => [],
                },
            ]

            const html = renderStatConditionBodyHtml(numStatCond, projectStats)
            expect(html).toContain(
                'input id="choice-cond-stat-val" type="number" min="1" max="20" value="15"'
            )
            expect(html).toContain('value=">=" selected')
            expect(html).toContain('value="<="')
        })

        it('escapes tag condition fields against XSS', () => {
            const maliciousCond = new TagCondition('xss3', '', 'tag<b>bold</b>', true)
            const html = renderTagConditionBodyHtml(maliciousCond)

            expect(html).not.toContain('<b>bold</b>')
            expect(html).toContain('tag&lt;b&gt;bold&lt;/b&gt;')
        })

        it('escapes text condition textarea against XSS', () => {
            const maliciousCond = new TextCondition(
                'xss4',
                '',
                '</textarea><script>alert("xss")</script>'
            )
            const html = renderTextConditionBodyHtml(maliciousCond)

            expect(html).not.toContain('</textarea><script>')
            expect(html).toContain('&lt;/textarea&gt;&lt;script&gt;')
        })
    })

    describe('createChoiceConditionSection UI component', () => {
        it('renders condition section with title, dropdown selector, remove button, and help text', () => {
            const initialCond = new ItemCondition('c_init', '', 'Sztylet', 1)
            choice.setCondition(initialCond)

            const { sectionEl, getConditionType } = createChoiceConditionSection({ choice })

            expect(sectionEl.tagName.toLowerCase()).toBe('section')
            expect(getConditionType()).toBe('item')
            expect(sectionEl.textContent).toContain('Warunek przeskoku')

            const typeSelect = sectionEl.querySelector(
                '#choice-condition-type-select'
            ) as HTMLSelectElement
            expect(typeSelect).not.toBeNull()
            expect(typeSelect.value).toBe('item')

            const removeBtn = sectionEl.querySelector(
                '#btn-remove-choice-condition'
            ) as HTMLButtonElement
            expect(removeBtn).not.toBeNull()
            expect(removeBtn.getAttribute('aria-label')).toBe('Usuń warunek')
        })

        it('renders inputs and triggers onSave when input changes in condition body', () => {
            const onSave = vi.fn()
            const initialCond = new ItemCondition('c_init', '', 'Sztylet', 1)
            choice.setCondition(initialCond)

            const { sectionEl, renderCondBody } = createChoiceConditionSection({
                choice,
                onSave,
            })
            renderCondBody()

            const nameInput = sectionEl.querySelector('#choice-cond-item-name') as HTMLInputElement
            expect(nameInput).not.toBeNull()
            expect(nameInput.value).toBe('Sztylet')

            nameInput.value = 'Magiczny Miecz'
            nameInput.dispatchEvent(new Event('input'))

            expect(onSave).toHaveBeenCalled()
        })

        it('switches condition type and updates choice condition model when select changes', () => {
            const onSave = vi.fn()
            const { sectionEl, getConditionType, buildConditionObject } =
                createChoiceConditionSection({ choice, onSave })

            const typeSelect = sectionEl.querySelector(
                '#choice-condition-type-select'
            ) as HTMLSelectElement
            typeSelect.value = 'stat'
            typeSelect.dispatchEvent(new Event('change'))

            expect(getConditionType()).toBe('stat')
            expect(onSave).toHaveBeenCalled()

            const statInput = sectionEl.querySelector('#choice-cond-stat-name') as HTMLInputElement
            expect(statInput).not.toBeNull()
            statInput.value = 'Charyzma'

            const condition = buildConditionObject() as StatCondition
            expect(condition.getType()).toBe('stat')
            expect(condition.getStatName()).toBe('Charyzma')
        })

        it('invokes onRemove callback and updates condition type to none when remove button is clicked', () => {
            const onRemove = vi.fn()
            const { sectionEl, getConditionType } = createChoiceConditionSection({
                choice,
                onRemove,
            })

            const removeBtn = sectionEl.querySelector(
                '#btn-remove-choice-condition'
            ) as HTMLButtonElement
            removeBtn.click()

            expect(onRemove).toHaveBeenCalled()
            expect(getConditionType()).toBe('none')
        })

        it('allows programmatic condition type setting via setConditionType', () => {
            const { sectionEl, getConditionType, setConditionType } = createChoiceConditionSection({
                choice,
            })

            setConditionType('tag')
            expect(getConditionType()).toBe('tag')

            const typeSelect = sectionEl.querySelector(
                '#choice-condition-type-select'
            ) as HTMLSelectElement
            expect(typeSelect.value).toBe('tag')
        })

        it('adapts all labels when switching locale to English', async () => {
            await initTranslationsWithLocale('en')
            const initialCond = new ItemCondition('c_en', '', 'Torch', 2)
            choice.setCondition(initialCond)

            const { sectionEl, renderCondBody } = createChoiceConditionSection({ choice })
            renderCondBody()

            expect(sectionEl.textContent).toContain('Jump Condition')
            expect(sectionEl.textContent).toContain(
                'Enter the condition or requirements needed to unlock this choice.'
            )

            const typeSelect = sectionEl.querySelector(
                '#choice-condition-type-select'
            ) as HTMLSelectElement
            expect(typeSelect.textContent).toContain('Required item')
            expect(typeSelect.textContent).toContain('Required stat / parameter')
            expect(typeSelect.textContent).toContain('Required tag / story flag')
            expect(typeSelect.textContent).toContain('Author Condition')

            const removeBtn = sectionEl.querySelector(
                '#btn-remove-choice-condition'
            ) as HTMLButtonElement
            expect(removeBtn.getAttribute('aria-label')).toBe('Remove condition')

            const itemLabel = sectionEl.querySelector('label')
            expect(itemLabel?.textContent).toContain('Item name')
        })
    })
})
