// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import { Choice } from '../../Model/Choice'
import { Paragraph } from '../../Model/Paragraph'
import {
    createChoiceHeader,
    handleSaveChoiceName,
    handleSelectNode,
    renderChoiceHeaderSectionHtml,
    renderChoiceNameSectionHtml,
    renderChoiceNodesSectionHtml,
    renderChoiceTypeBadgeHtml,
    resolveChoiceEndpoints,
} from '../../View/ui/detailsPanel/choice/choiceHeader.js'

describe('choiceHeader', () => {
    let choice: Choice
    let fromParagraph: Paragraph
    let toParagraph: Paragraph
    let ctx: {
        projectParagraphs: Paragraph[]
        vm: { updateChoiceDetails: ReturnType<typeof vi.fn> }
        renderConnectionsList: ReturnType<typeof vi.fn>
        renderParagraphsList: ReturnType<typeof vi.fn>
        selectEntity: ReturnType<typeof vi.fn>
        storyGraphInstance: { render: ReturnType<typeof vi.fn> }
        selectionHistory: unknown[]
        historyIndex: number
    }

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = ''

        choice = new Choice('choice_1', 'Zbadaj ołtarz', 'p_from', 'p_to')
        fromParagraph = new Paragraph('p_from', 'Komnata Wstępna')
        toParagraph = new Paragraph('p_to', 'Mroczny Ołtarz')

        ctx = {
            projectParagraphs: [fromParagraph, toParagraph],
            vm: {
                updateChoiceDetails: vi.fn(),
            },
            renderConnectionsList: vi.fn(),
            renderParagraphsList: vi.fn(),
            selectEntity: vi.fn(),
            storyGraphInstance: {
                render: vi.fn(),
            },
            selectionHistory: [],
            historyIndex: -1,
        }
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('resolveChoiceEndpoints', () => {
        it('returns default fallback values when choice is null or undefined', () => {
            const endpoints = resolveChoiceEndpoints(null, ctx)
            expect(endpoints.fromId).toBe('')
            expect(endpoints.toId).toBe('')
            expect(endpoints.fromP).toBeNull()
            expect(endpoints.toP).toBeNull()
            expect(endpoints.fromTitle).toBe('?')
            expect(endpoints.toTitle).toBe('?')
            expect(endpoints.isCombat).toBe(false)
        })

        it('resolves source and target paragraphs and their titles', () => {
            const endpoints = resolveChoiceEndpoints(choice, ctx)
            expect(endpoints.fromId).toBe('p_from')
            expect(endpoints.toId).toBe('p_to')
            expect(endpoints.fromP).toBe(fromParagraph)
            expect(endpoints.toP).toBe(toParagraph)
            expect(endpoints.fromTitle).toBe('Komnata Wstępna')
            expect(endpoints.toTitle).toBe('Mroczny Ołtarz')
            expect(endpoints.isCombat).toBe(false)
        })

        it('detects combat outcome flag on Choice instances and plain objects', () => {
            choice.setIsCombatOutcome(true)
            expect(resolveChoiceEndpoints(choice, ctx).isCombat).toBe(true)

            const plainObj = { fromParagraphId: 'p_from', isCombatOutcome: true }
            expect(resolveChoiceEndpoints(plainObj, ctx).isCombat).toBe(true)
        })

        it('falls back to paragraph IDs when titles are empty', () => {
            const emptyTitleP = new Paragraph('p_empty', '')
            const ctxWithEmpty = { projectParagraphs: [emptyTitleP] }
            const c = new Choice('c_1', 'C', 'p_empty', 'p_missing')

            const endpoints = resolveChoiceEndpoints(c, ctxWithEmpty)
            expect(endpoints.fromTitle).toBe('p_empty')
            expect(endpoints.toTitle).toBe('p_missing')
        })
    })

    describe('renderChoiceTypeBadgeHtml', () => {
        it('renders standard choice badge for non-combat choice', () => {
            const html = renderChoiceTypeBadgeHtml(false)
            expect(html).toContain('Przeskok')
            expect(html).not.toContain('Po walce')
        })

        it('renders combat badge with swords icon for combat outcome choice', () => {
            const html = renderChoiceTypeBadgeHtml(true)
            expect(html).toContain('Przeskok (Po walce)')
            expect(html).toContain('<svg')
            expect(html).toContain('bg-rose-950/60')
        })
    })

    describe('renderChoiceHeaderSectionHtml', () => {
        it('renders Type header and escaped item ID', () => {
            const html = renderChoiceHeaderSectionHtml({ id: 'c_id_<xss>' }, false)
            expect(html).toContain('Typ')
            expect(html).toContain('ID: c_id_&lt;xss&gt;')
            expect(html).toContain('Przeskok')
        })
    })

    describe('renderChoiceNameSectionHtml', () => {
        it('renders label and input with escaped choice name', () => {
            const html = renderChoiceNameSectionHtml('Idź prosto & nie oglądaj się')
            expect(html).toContain('Treść / etykieta wyboru')
            expect(html).toContain('value="Idź prosto &amp; nie oglądaj się"')
            expect(html).toContain('details-choice-name-error')
        })
    })

    describe('renderChoiceNodesSectionHtml', () => {
        it('renders source and target navigation buttons with titles and icons', () => {
            const html = renderChoiceNodesSectionHtml('Komnata', 'Skarbiec', true, true)
            expect(html).toContain('Węzły połączenia')
            expect(html).toContain('Z paragrafu')
            expect(html).toContain('Do paragrafu')
            expect(html).toContain('Komnata')
            expect(html).toContain('Skarbiec')
            expect(html).toContain('title="Otwórz szczegóły paragrafu"')
        })

        it('escapes paragraph titles to prevent HTML injection', () => {
            const html = renderChoiceNodesSectionHtml(
                '<script>alert(1)</script>',
                'Ogr "Niszczyciel"',
                false,
                false
            )
            expect(html).not.toContain('<script>')
            expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
            expect(html).toContain('Ogr &quot;Niszczyciel&quot;')
        })
    })

    describe('handleSaveChoiceName', () => {
        let nameInput: HTMLInputElement
        let nameError: HTMLElement

        beforeEach(() => {
            nameInput = document.createElement('input')
            nameError = document.createElement('div')
        })

        it('returns false and displays error styling when name input is empty', () => {
            nameInput.value = '   '
            const result = handleSaveChoiceName({
                choice,
                nameInput,
                nameError,
                ctx,
            })

            expect(result).toBe(false)
            expect(nameError.textContent).toBe('Nazwa nie może być pusta.')
            expect(nameError.classList.contains('hidden')).toBe(false)
            expect(nameInput.classList.contains('border-red-500')).toBe(true)
            expect(ctx.vm.updateChoiceDetails).not.toHaveBeenCalled()
        })

        it('saves valid name, clears error styling, and triggers UI updates', () => {
            nameInput.value = 'Nowa nazwa wyboru'
            nameError.classList.remove('hidden')
            nameInput.classList.add('border-red-500')

            const onRefreshDetails = vi.fn()
            const result = handleSaveChoiceName({
                choice,
                nameInput,
                nameError,
                fromP: fromParagraph,
                isCombat: false,
                ctx,
                onRefreshDetails,
            })

            expect(result).toBe(true)
            expect(nameError.classList.contains('hidden')).toBe(true)
            expect(nameInput.classList.contains('border-red-500')).toBe(false)
            expect(ctx.vm.updateChoiceDetails).toHaveBeenCalledWith(
                choice,
                'Nowa nazwa wyboru',
                choice.getCondition(),
                choice.getCosts(),
                choice.getRewards(),
                choice.getDiceCheck()
            )
            expect(ctx.renderConnectionsList).toHaveBeenCalled()
            expect(ctx.renderParagraphsList).toHaveBeenCalled()
            expect(ctx.storyGraphInstance.render).toHaveBeenCalledWith(true)
        })

        it('updates combat outcome name when choice is a combat outcome', () => {
            nameInput.value = 'Ucieczka z pola bitwy'
            const combatMock = { updateOutcome: vi.fn() }
            const combatFromP = {
                getHasCombat: (): boolean => true,
                getCombat: (): { updateOutcome: ReturnType<typeof vi.fn> } => combatMock,
            }

            handleSaveChoiceName({
                choice,
                nameInput,
                nameError,
                fromP: combatFromP,
                isCombat: true,
                ctx,
            })

            expect(combatMock.updateOutcome).toHaveBeenCalledWith('choice_1', {
                name: 'Ucieczka z pola bitwy',
            })
        })
    })

    describe('handleSelectNode', () => {
        it('calls ctx.selectEntity with node and paragraph type', () => {
            handleSelectNode(fromParagraph, ctx)
            expect(ctx.selectEntity).toHaveBeenCalledWith(fromParagraph, 'paragraph')
        })

        it('safely handles null node or null ctx', () => {
            expect(() => handleSelectNode(null, ctx)).not.toThrow()
            expect(() => handleSelectNode(fromParagraph, null)).not.toThrow()
        })
    })

    describe('createChoiceHeader UI component interactions', () => {
        it('renders all three modules and exposes getNameInput', () => {
            const { headerMod, nameMod, nodesMod, getNameInput } = createChoiceHeader(
                choice,
                { id: 'choice_1' },
                ctx
            )

            expect(headerMod.textContent).toContain('Typ')
            expect(headerMod.textContent).toContain('ID: choice_1')
            expect(nameMod.textContent).toContain('Treść / etykieta wyboru')
            expect(nodesMod.textContent).toContain('Węzły połączenia')

            const input = getNameInput()
            expect(input).not.toBeNull()
            expect(input?.value).toBe('Zbadaj ołtarz')
        })

        it('clears error when user types valid input', () => {
            const { nameMod, getNameInput } = createChoiceHeader(choice, { id: 'choice_1' }, ctx)
            const input = getNameInput() as HTMLInputElement
            const error = nameMod.querySelector('#details-choice-name-error') as HTMLElement

            // Make empty to show error
            input.value = ''
            input.dispatchEvent(new Event('input'))
            expect(error.classList.contains('hidden')).toBe(false)
            expect(input.classList.contains('border-red-500')).toBe(true)

            // Type valid characters
            input.value = 'Lepszy wybór'
            input.dispatchEvent(new Event('input'))
            expect(error.classList.contains('hidden')).toBe(true)
            expect(input.classList.contains('border-red-500')).toBe(false)
        })

        it('triggers save on input blur', () => {
            const { getNameInput } = createChoiceHeader(choice, { id: 'choice_1' }, ctx)
            const input = getNameInput() as HTMLInputElement

            input.value = 'Zaktualizowana etykieta'
            input.dispatchEvent(new Event('blur'))

            expect(ctx.vm.updateChoiceDetails).toHaveBeenCalledWith(
                choice,
                'Zaktualizowana etykieta',
                choice.getCondition(),
                choice.getCosts(),
                choice.getRewards(),
                choice.getDiceCheck()
            )
        })

        it('triggers save and blurs when pressing Enter key', () => {
            const { getNameInput } = createChoiceHeader(choice, { id: 'choice_1' }, ctx)
            const input = getNameInput() as HTMLInputElement

            input.value = 'Zapis przez Enter'
            const blurSpy = vi.spyOn(input, 'blur')

            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
            expect(ctx.vm.updateChoiceDetails).toHaveBeenCalled()
            expect(blurSpy).toHaveBeenCalled()
        })

        it('selects source paragraph on clicking source node button', () => {
            const { nodesMod } = createChoiceHeader(choice, { id: 'choice_1' }, ctx)
            const sourceBtn = nodesMod.querySelector('#btn-node-source') as HTMLButtonElement
            expect(sourceBtn).not.toBeNull()

            sourceBtn.click()
            expect(ctx.selectEntity).toHaveBeenCalledWith(fromParagraph, 'paragraph')
        })

        it('selects target paragraph on clicking target node button', () => {
            const { nodesMod } = createChoiceHeader(choice, { id: 'choice_1' }, ctx)
            const targetBtn = nodesMod.querySelector('#btn-node-target') as HTMLButtonElement
            expect(targetBtn).not.toBeNull()

            targetBtn.click()
            expect(ctx.selectEntity).toHaveBeenCalledWith(toParagraph, 'paragraph')
        })
    })

    describe('multilingual support', () => {
        it('renders German translations correctly', async () => {
            await initTranslationsWithLocale('de')
            choice.setIsCombatOutcome(true)
            const { headerMod, nameMod, nodesMod } = createChoiceHeader(choice, { id: 'c1' }, ctx)

            expect(headerMod.textContent).toContain('Typ')
            expect(headerMod.textContent).toContain('Sprung (Nach dem Kampf)')
            expect(nameMod.textContent).toContain('Auswahlbeschriftung / Text')
            expect(nodesMod.textContent).toContain('Verbindungsknoten')
            expect(nodesMod.textContent).toContain('Von Absatz')
            expect(nodesMod.textContent).toContain('Zu Absatz')
        })

        it('renders English translations correctly', async () => {
            await initTranslationsWithLocale('en')
            choice.setIsCombatOutcome(false)
            const { headerMod, nameMod, nodesMod } = createChoiceHeader(choice, { id: 'c1' }, ctx)

            expect(headerMod.textContent).toContain('Type')
            expect(headerMod.textContent).toContain('Jump')
            expect(nameMod.textContent).toContain('Choice label / text')
            expect(nodesMod.textContent).toContain('Connection Nodes')
            expect(nodesMod.textContent).toContain('From paragraph')
            expect(nodesMod.textContent).toContain('To paragraph')
        })
    })
})
