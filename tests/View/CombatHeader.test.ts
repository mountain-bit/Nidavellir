// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initTranslationsWithLocale } from '../../dist/Utils/translate.js'
import {
    renderCombatBadgeHtml,
    renderCombatHeader,
    renderCombatHeaderHtml,
} from '../../View/ui/detailsPanel/combat/combatHeader.js'

describe('combatHeader Component', () => {
    let container: HTMLElement

    beforeEach(async () => {
        await initTranslationsWithLocale('pl')
        document.body.innerHTML = '<div id="container"></div>'
        container = document.getElementById('container')!
    })

    afterEach(async () => {
        await initTranslationsWithLocale('pl')
        vi.restoreAllMocks()
    })

    describe('renderCombatBadgeHtml', () => {
        it('renders active combat badge when hasCombat is true', () => {
            const html = renderCombatBadgeHtml(true)
            expect(html).toContain('Walka')
            expect(html).toContain('bg-amber-500/20')
        })

        it('renders disabled combat badge when hasCombat is false', () => {
            const html = renderCombatBadgeHtml(false)
            expect(html).toContain('Wyłączona')
            expect(html).toContain('bg-zinc-800')
        })

        it('supports English and German locales for badge', async () => {
            await initTranslationsWithLocale('en')
            expect(renderCombatBadgeHtml(true)).toContain('Combat')
            expect(renderCombatBadgeHtml(false)).toContain('Disabled')

            await initTranslationsWithLocale('de')
            expect(renderCombatBadgeHtml(true)).toContain('Kampf')
            expect(renderCombatBadgeHtml(false)).toContain('Deaktiviert')
        })
    })

    describe('renderCombatHeaderHtml', () => {
        it('renders header HTML with enable button when combat is false', () => {
            const html = renderCombatHeaderHtml(false)
            expect(html).toContain('Starcie z przeciwnikami')
            expect(html).toContain('Włącz walkę')
            expect(html).toContain('aria-pressed="false"')
            expect(html).toContain('data-action="toggle-combat"')
            expect(html).toContain('bg-amber-600')
        })

        it('renders header HTML with disable button when combat is true', () => {
            const html = renderCombatHeaderHtml(true)
            expect(html).toContain('Starcie z przeciwnikami')
            expect(html).toContain('Wyłącz walkę')
            expect(html).toContain('aria-pressed="true"')
            expect(html).toContain('data-action="toggle-combat"')
            expect(html).toContain('bg-zinc-800')
        })
    })

    describe('renderCombatHeader', () => {
        it('returns null and does not throw if container is null or invalid', () => {
            expect(renderCombatHeader(null as unknown as HTMLElement, false)).toBeNull()
            expect(renderCombatHeader(undefined as unknown as HTMLElement, true)).toBeNull()
        })

        it('renders combat header into the container and returns the header element', () => {
            const onToggle = vi.fn()
            const headerEl = renderCombatHeader(container, false, onToggle)

            expect(headerEl).not.toBeNull()
            expect(container.children.length).toBe(1)
            expect(container.querySelector('[data-action="toggle-combat"]')).not.toBeNull()
            expect(container.querySelector('#btn-toggle-combat-state')).not.toBeNull()
        })

        it('triggers onToggle callback when button is clicked', () => {
            const onToggle = vi.fn()
            renderCombatHeader(container, true, onToggle)

            const button = container.querySelector(
                '[data-action="toggle-combat"]'
            ) as HTMLButtonElement
            expect(button).not.toBeNull()

            button.click()
            expect(onToggle).toHaveBeenCalledTimes(1)
        })

        it('does not throw when clicking button if onToggle is not provided', () => {
            renderCombatHeader(container, true)

            const button = container.querySelector(
                '[data-action="toggle-combat"]'
            ) as HTMLButtonElement
            expect(() => button.click()).not.toThrow()
        })
    })
})
