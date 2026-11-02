// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Paragraph } from '../../Model/Paragraph'
import { initTranslationsWithLocale } from '../../Utils/i18n/translate'
import { renderParagraphNumberModule } from '../../View/ui/detailsPanel/modules/entityConfigModules.js'
import { MainWindowViewModel } from '../../ViewModel/MainWindowViewModel'

describe('DetailsPanel - Paragraph Number Module', () => {
    let vm: MainWindowViewModel
    let ctx: {
        vm: MainWindowViewModel
        projectParagraphs: Paragraph[]
        renderParagraphsList: () => void
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
        }
    })

    it('nie zawiera przycisku losuj (#btn-details-reroll-number)', () => {
        const paragraph = new Paragraph('p-1', 'Paragraf 1')
        renderParagraphNumberModule(container, paragraph, 'paragraph', ctx)

        const btnReroll = container.querySelector('#btn-details-reroll-number')
        expect(btnReroll).toBeNull()
        expect(container.textContent).not.toContain('Losuj')
    })

    it('wyświetla numer oraz przełącznik blokady numeru', () => {
        const paragraph = new Paragraph('p-1', 'Paragraf 1')
        paragraph.setRandomizedNumber(5)
        renderParagraphNumberModule(container, paragraph, 'paragraph', ctx)

        const modeBadge = container.querySelector('#details-number-mode-badge')
        expect(modeBadge?.textContent).toContain('#5')

        const lockCheckbox = container.querySelector('#details-number-lock') as HTMLInputElement
        expect(lockCheckbox).not.toBeNull()
        expect(lockCheckbox.checked).toBe(false)

        const customInput = container.querySelector('#details-custom-number') as HTMLInputElement
        expect(customInput).not.toBeNull()
        expect(customInput.disabled).toBe(true)
    })
})
