// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { initTranslationsWithLocale } from '../../Utils/translate'
import { renderStartNodeDetails } from '../../View/ui/detailsPanel/detailsPanel.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('DetailsPanel - START Node Details', () => {
    let vm: MainWindowViewModel
    let ctx: {
        vm: MainWindowViewModel
        projectParagraphs: Paragraph[]
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
            renderParagraphsList: vi.fn(),
            renderDetailsPanel: vi.fn(),
            storyGraphInstance: {
                focusOnElement: vi.fn(),
            },
        }
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
})
