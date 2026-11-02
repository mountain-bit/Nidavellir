// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import {
    renderDetailsPanel,
    renderStartNodeDetails,
    renderStartNodeInfoHtml,
    resolveEntityScope,
} from '../../View/ui/detailsPanel/detailsPanel.js'
import * as StartNodeModule from '../../View/ui/detailsPanel/modules/startNodeModule.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('DetailsPanel - START Node Details & Main Controller', () => {
    let vm: MainWindowViewModel
    let ctx: {
        vm: MainWindowViewModel
        projectParagraphs: Paragraph[]
        projectLocations: unknown[]
        renderParagraphsList: () => void
        renderDetailsPanel: () => void
        storyGraphInstance: { focusOnElement: ReturnType<typeof vi.fn> }
    }
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        container = document.createElement('div')
        vm = new MainWindowViewModel()
        ctx = {
            vm,
            projectParagraphs: [],
            projectLocations: [{ id: 'loc_1', name: 'Zamek' }],
            renderParagraphsList: vi.fn(),
            renderDetailsPanel: vi.fn(),
            storyGraphInstance: {
                focusOnElement: vi.fn(),
            },
        }
    })

    it('re-eksportuje renderStartNodeDetails i renderStartNodeInfoHtml z modułu startNodeModule', () => {
        expect(renderStartNodeDetails).toBe(StartNodeModule.renderStartNodeDetails)
        expect(renderStartNodeInfoHtml).toBe(StartNodeModule.renderStartNodeInfoHtml)
    })

    it('nie zawiera wielkiego banera start ani ponumerowanych kroków przewodnika', () => {
        const startP = new Paragraph('start', 'START')
        startP.setIsStart(true)

        renderStartNodeDetails(container, startP, { type: 'paragraph', id: 'start' }, ctx, vi.fn())

        // Brak starego wielkiego banera ENTRY POINT
        expect(container.textContent).not.toContain('ENTRY POINT')
        // Brak starych wielkich sekcji przewodnika
        expect(container.textContent).not.toContain('Jak rozpocząć pracę:')
        expect(container.textContent).not.toContain('Techniczny punkt startowy')
    })

    it('renderuje czysty, standardowy nagłówek encji i sekcję informacji', () => {
        const startP = new Paragraph('start', 'START')
        startP.setIsStart(true)

        renderStartNodeDetails(container, startP, { type: 'paragraph', id: 'start' }, ctx, vi.fn())

        // Zawiera standardowy nagłówek z ID
        expect(container.textContent).toContain('ID: start')
        expect(container.textContent).toContain('Punkt startowy')

        // Posiada sekcję wyjść (exits)
        const exitsSection = container.querySelector('#details-exits-module, .border-b')
        expect(exitsSection).not.toBeNull()
    })

    it('generuje poprawny HTML informacji o punkcie startowym', () => {
        const html = renderStartNodeInfoHtml()
        expect(html).toContain('Punkt startowy')
        expect(html).toContain('Połącz z pierwszym paragrafem')
        expect(html).toContain('<svg')
    })

    describe('resolveEntityScope', () => {
        it('zwraca odpowiednie tablice encji dla każdego typu lub pustą tablicę', () => {
            expect(resolveEntityScope('paragraph', ctx)).toBe(ctx.projectParagraphs)
            expect(resolveEntityScope('location', ctx)).toBe(ctx.projectLocations)
            expect(resolveEntityScope('unknown_type', ctx)).toEqual([])
            expect(resolveEntityScope('paragraph', null)).toEqual([])
        })
    })

    describe('renderDetailsPanel container override', () => {
        it('renderuje bezpośrednio do przekazanego containerOverride bez globalnego elementu', () => {
            const customContainer = document.createElement('div')
            const p = new Paragraph('p_test', 'Paragraf testowy')
            ctx.vm.selection.selectElement(p, 'paragraph')

            renderDetailsPanel(ctx, customContainer)

            expect(customContainer.textContent).toContain('ID: p_test')
            expect(customContainer.children.length).toBeGreaterThan(0)
        })

        it('renderuje placeholder braku selekcji gdy nic nie jest wybrane', () => {
            const customContainer = document.createElement('div')
            ctx.vm.selection.closeAllHistory()

            renderDetailsPanel(ctx, customContainer)

            expect(customContainer.textContent).toContain('Zaznacz lub kliknij')
        })
    })
})
