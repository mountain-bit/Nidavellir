// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { showToast, toast } from '../../Utils/ui/toast'

describe('Toast Notification System', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('powinien automatycznie stworzyć kontener #toast-container jeśli nie istnieje', () => {
        expect(document.getElementById('toast-container')).toBeNull()
        toast.info('Testowa wiadomość')
        const container = document.getElementById('toast-container')
        expect(container).not.toBeNull()
        expect(container?.children.length).toBe(1)
    })

    it('powinien renderować toast z poprawną treścią i typem success', () => {
        const el = toast.success('Operacja zakończona sukcesem', 'Sukces')
        expect(el.textContent).toContain('Sukces')
        expect(el.textContent).toContain('Operacja zakończona sukcesem')
        expect(el.className).toContain('border-emerald-500')
    })

    it('powinien renderować toast typu warning', () => {
        const el = toast.warning('Uwaga na plik', 'Ostrzeżenie')
        expect(el.textContent).toContain('Ostrzeżenie')
        expect(el.textContent).toContain('Uwaga na plik')
        expect(el.className).toContain('border-amber-500')
    })

    it('powinien renderować toast typu error', () => {
        const el = toast.error('Wystąpił błąd zapisu', 'Błąd')
        expect(el.textContent).toContain('Błąd')
        expect(el.textContent).toContain('Wystąpił błąd zapisu')
        expect(el.className).toContain('border-rose-500')
    })

    it('powinien renderować toast typu info', () => {
        const el = toast.info('Informacja systemowa')
        expect(el.textContent).toContain('Informacja systemowa')
        expect(el.className).toContain('border-blue-500')
    })

    it('powinien usunąć toast po kliknięciu przycisku zamknięcia i wyczyścić timer auto-zamykania', () => {
        toast.info('Do usunięcia', undefined, 5000)
        const container = document.getElementById('toast-container')
        const closeBtn = container?.querySelector('button')
        expect(closeBtn).not.toBeNull()

        closeBtn?.click()
        // Double click should be a safe no-op
        closeBtn?.click()
        vi.advanceTimersByTime(350)
        expect(container?.children.length).toBe(0)
    })

    it('powinien automatycznie usunąć toast po upływie czasu duration', () => {
        toast.info('Auto dismiss', undefined, 1000)
        const container = document.getElementById('toast-container')
        expect(container?.children.length).toBe(1)

        vi.advanceTimersByTime(1000)
        vi.advanceTimersByTime(350)
        expect(container?.children.length).toBe(0)
    })

    it('powinien obsługiwać showToast z obiektem opcji lub stringiem', () => {
        showToast('Prosty string')
        const container = document.getElementById('toast-container')
        expect(container?.children.length).toBe(1)
        expect(container?.textContent).toContain('Prosty string')
    })
})
