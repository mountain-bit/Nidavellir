/**
 * Testy dla Utils/i18n.js (main process)
 *
 * i18n.js przyjmuje opcjonalne { app } w initI18n() — dependency injection.
 * W testach przekazujemy mock app zamiast prawdziwego Electron API.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// ── Mock app ──────────────────────────────────────────────────────────────────

const mockApp = {
    getPath: (name: string): string =>
        name === 'userData' ? path.join(os.tmpdir(), 'sgp-test') : os.tmpdir(),
    getLocale: (): string => 'pl-PL',
}

// ── Import modułu ─────────────────────────────────────────────────────────────

const i18n = require('../../Utils/i18n.js') as {
    initI18n: (deps?: { app?: typeof mockApp }) => Promise<void>
    t: (key: string, options?: Record<string, unknown>) => string
    getTranslations: () => Record<string, unknown>
    getLocale: () => string
    setLocale: (locale: string) => Promise<boolean>
}

// Inicjalizujemy raz — i18next jest singletonem CJS
beforeAll(async (): Promise<void> => {
    await i18n.initI18n({ app: mockApp })
})

// Reset do polskiego przed każdym testem
beforeEach(async (): Promise<void> => {
    await i18n.setLocale('pl')
})

// ── initI18n ──────────────────────────────────────────────────────────────────

describe('i18n.js — initI18n', () => {
    it('po inicjalizacji getLocale() zwraca język wykryty z systemu', () => {
        // mockApp.getLocale() → 'pl-PL' → detekcja zwraca 'pl'
        expect(i18n.getLocale()).toBe('pl')
    })

    it('po inicjalizacji t() zwraca polskie tłumaczenie', () => {
        expect(i18n.t('przyciski.zapisz')).toBe('Zapisz')
        expect(i18n.t('przyciski.ok')).toBe('OK')
    })

    it('ponowne wywołanie initI18n() nie rzuca błędu (idempotentność)', async () => {
        await expect(i18n.initI18n({ app: mockApp })).resolves.not.toThrow()
    })
})

// ── setLocale / getLocale ─────────────────────────────────────────────────────

describe('i18n.js — setLocale i getLocale', () => {
    it('setLocale("en") zmienia język na angielski i zwraca true', async () => {
        const result = await i18n.setLocale('en')
        expect(result).toBe(true)
        expect(i18n.getLocale()).toBe('en')
        expect(i18n.t('przyciski.zapisz')).toBe('Save')
    })

    it('setLocale("de") zmienia język na niemiecki', async () => {
        await i18n.setLocale('de')
        expect(i18n.getLocale()).toBe('de')
        expect(i18n.t('przyciski.zapisz')).toBe('Speichern')
    })

    it('setLocale z nieobsługiwanym locale zwraca false', async () => {
        expect(await i18n.setLocale('fr')).toBe(false)
        expect(await i18n.setLocale('xx')).toBe(false)
    })

    it('setLocale z nieobsługiwanym locale nie zmienia aktualnego języka', async () => {
        await i18n.setLocale('en')
        await i18n.setLocale('xx')
        expect(i18n.getLocale()).toBe('en')
    })

    it('można przełączać między wszystkimi wspieranymi językami', async () => {
        await i18n.setLocale('de')
        expect(i18n.t('przyciski.zapisz')).toBe('Speichern')
        await i18n.setLocale('en')
        expect(i18n.t('przyciski.zapisz')).toBe('Save')
        await i18n.setLocale('pl')
        expect(i18n.t('przyciski.zapisz')).toBe('Zapisz')
    })
})

// ── getTranslations ───────────────────────────────────────────────────────────

describe('i18n.js — getTranslations', () => {
    it('zwraca obiekt z kluczami tłumaczeń dla polskiego', () => {
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(typeof tr).toBe('object')
        expect(tr.przyciski?.zapisz).toBe('Zapisz')
        expect(tr.projekt?.nowy).toBe('Nowy projekt')
    })

    it('zmienia się po setLocale', async () => {
        await i18n.setLocale('en')
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(tr.przyciski?.zapisz).toBe('Save')
    })

    it('zawiera klucze dialog i error (używane przez main process w showOpenDialog)', () => {
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(tr.dialog?.open_project).toBeTruthy()
        expect(tr.error?.project_not_found).toBeTruthy()
    })
})

// ── t() ───────────────────────────────────────────────────────────────────────

describe('i18n.js — t()', () => {
    it('tłumaczy klucze z sekcji projekt', () => {
        expect(i18n.t('projekt.nowy')).toBe('Nowy projekt')
        expect(i18n.t('projekt.zapisz')).toBe('Zapisz projekt')
    })

    it('tłumaczy klucze z sekcji dialog', () => {
        expect(i18n.t('dialog.open_project')).toBe('Otwórz projekt')
        expect(i18n.t('dialog.choose_new_project_folder')).toBe(
            'Wybierz folder dla nowego projektu'
        )
    })

    it('tłumaczy klucze z sekcji error', () => {
        expect(i18n.t('error.project_not_found')).toBe('Ścieżka projektu nie istnieje')
    })

    it('zwraca klucz jako fallback gdy klucz nie istnieje', () => {
        expect(i18n.t('nieistniejacy.klucz')).toBe('nieistniejacy.klucz')
    })

    it('działa poprawnie po zmianie języka', async () => {
        await i18n.setLocale('en')
        expect(i18n.t('dialog.open_project')).toBe('Open project')
        expect(i18n.t('error.project_not_found')).toBe('Project path does not exist')
    })
})
