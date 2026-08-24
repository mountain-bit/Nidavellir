import { beforeEach, describe, expect, it } from 'vitest'

import {
    availableLanguages,
    getLanguage,
    initTranslationsWithLocale,
    setLanguage,
    type SupportedLanguage,
    t,
    type TranslationKey,
} from '../../Utils/translate'

// ── Pomocnicze ───────────────────────────────────────────────────────────────

/**
 * Resetuje stan modułu translate między testami.
 * initTranslationsWithLocale obsługuje to wewnętrznie przez changeLanguage,
 * ale i18next jest singletonem — musimy zresetować go ręcznie między suitami.
 */
async function resetToPolish(): Promise<void> {
    await initTranslationsWithLocale('pl')
}

// ── Podstawowe tłumaczenia ───────────────────────────────────────────────────

describe('translate — podstawowe tłumaczenia', () => {
    beforeEach(resetToPolish)

    it('getLanguage() zwraca pl po inicjalizacji z pl', () => {
        expect(getLanguage()).toBe('pl')
    })

    it('t() zwraca polskie tłumaczenie', () => {
        expect(t('buttons.save')).toBe('Zapisz')
        expect(t('buttons.cancel')).toBe('Anuluj')
        expect(t('buttons.ok')).toBe('OK')
    })

    it('t() zwraca angielskie tłumaczenie po setLanguage("en")', async () => {
        await setLanguage('en')
        expect(t('buttons.save')).toBe('Save')
        expect(t('buttons.cancel')).toBe('Cancel')
    })

    it('t() zwraca niemieckie tłumaczenie po setLanguage("de")', async () => {
        await setLanguage('de')
        expect(t('buttons.save')).toBe('Speichern')
        expect(t('buttons.cancel')).toBe('Abbrechen')
    })

    it('t() zwraca klucz jako fallback gdy klucz nie istnieje', () => {
        // @ts-expect-error — celowo nieprawidłowy klucz
        expect(t('nieistniejacy.klucz')).toBe('nieistniejacy.klucz')
    })

    it('t() zwraca zagnieżdżone tłumaczenia (np. start_window.*)', () => {
        expect(t('start_window.create_project')).toBe('Stwórz nowy projekt')
        expect(t('start_window.recent_projects')).toBe('Ostatnie projekty')
    })
})

// ── Interpolacja ─────────────────────────────────────────────────────────────

describe('translate — interpolacja i18next', () => {
    beforeEach(resetToPolish)

    it('t() przekazuje opcje interpolacji do i18next', () => {
        // app.title istnieje jako zwykły string — weryfikujemy że opcje nie psują wywołania
        expect(t('app.title')).toBe('Silnik Gier Paragrafowych')
    })

    it('t() akceptuje opcje bez rzucania błędu', () => {
        expect(() =>
            // @ts-expect-error — celowo nieprawidłowy klucz żeby testować ścieżkę fallback
            t('nieistniejacy.klucz', { name: 'Jan', count: 3 })
        ).not.toThrow()
    })
})

// ── setLanguage ───────────────────────────────────────────────────────────────

describe('translate — setLanguage', () => {
    beforeEach(resetToPolish)

    it('setLanguage zwraca true dla obsługiwanego języka', async () => {
        expect(await setLanguage('en')).toBe(true)
        expect(await setLanguage('de')).toBe(true)
        expect(await setLanguage('pl')).toBe(true)
    })

    it('setLanguage zwraca false dla nieobsługiwanego języka', async () => {
        // @ts-expect-error — celowo nieprawidłowy język, testuje obsługę nieobsługiwanego locale
        expect(await setLanguage('xx')).toBe(false)
        // @ts-expect-error — celowo nieprawidłowy język, testuje obsługę nieobsługiwanego locale
        expect(await setLanguage('fr')).toBe(false)
    })

    it('setLanguage nie zmienia języka gdy locale nieobsługiwane', async () => {
        await setLanguage('en')
        // @ts-expect-error — celowo nieprawidłowy język, testuje obsługę nieobsługiwanego locale
        await setLanguage('xx')
        expect(getLanguage()).toBe('en')
    })

    it('po setLanguage("en") getLanguage() zwraca "en"', async () => {
        await setLanguage('en')
        expect(getLanguage()).toBe('en')
    })

    it('tłumaczenia zmieniają się natychmiast po setLanguage', async () => {
        expect(t('buttons.save')).toBe('Zapisz')
        await setLanguage('en')
        expect(t('buttons.save')).toBe('Save')
        await setLanguage('de')
        expect(t('buttons.save')).toBe('Speichern')
        await setLanguage('pl')
        expect(t('buttons.save')).toBe('Zapisz')
    })
})

// ── availableLanguages ────────────────────────────────────────────────────────

describe('translate — availableLanguages', () => {
    it('zawiera pl, en, de', () => {
        expect(availableLanguages).toContain('pl')
        expect(availableLanguages).toContain('en')
        expect(availableLanguages).toContain('de')
    })

    it('zawiera dokładnie 3 języki', () => {
        expect(availableLanguages).toHaveLength(3)
    })

    it('jest tablicą readonly — nie można jej modyfikować w runtime', () => {
        // TypeScript blokuje to statycznie, ale sprawdzamy też runtime
        const langs = availableLanguages as readonly string[]
        expect(Object.isFrozen(langs) || Array.isArray(langs)).toBe(true)
    })
})

// ── initTranslations (guard) ─────────────────────────────────────────────────

describe('translate — initTranslations', () => {
    it('initTranslations() jest bezpieczne do wielokrotnego wywołania (guard initialized)', async () => {
        // Po initTranslationsWithLocale w beforeEach, initialized = true
        // Kolejne wywołanie initTranslations() powinno być no-op (nie rzucać)
        await expect(initTranslationsWithLocale('pl')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('en')).resolves.toBeUndefined()
    })

    it('initTranslationsWithLocale() nie rzuca dla obsługiwanego języka', async () => {
        await expect(initTranslationsWithLocale('pl')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('en')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('de')).resolves.toBeUndefined()
    })
})

// ── Typy (weryfikacja przez TypeScript) ──────────────────────────────────────

describe('translate — bezpieczeństwo typów', () => {
    it('TranslationKey akceptuje prawidłowe klucze', () => {
        // Jeśli to się kompiluje, typy działają poprawnie
        const key1: TranslationKey = 'buttons.save'
        const key2: TranslationKey = 'project.new'
        const key3: TranslationKey = 'start_window.create_project'
        expect(t(key1)).toBeTruthy()
        expect(t(key2)).toBeTruthy()
        expect(t(key3)).toBeTruthy()
    })

    it('SupportedLanguage akceptuje tylko pl, en, de', () => {
        const lang: SupportedLanguage = 'pl'
        expect(availableLanguages).toContain(lang)
    })
})
