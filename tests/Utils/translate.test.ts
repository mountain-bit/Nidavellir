// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'

import {
    applyTranslations,
    availableLanguages,
    getLanguage,
    initTranslationsWithLocale,
    setLanguage,
    type SupportedLanguage,
    t,
    type TranslationKey,
} from '../../Utils/i18n/translate'

async function resetToPolish(): Promise<void> {
    await initTranslationsWithLocale('pl')
}

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
        // @ts-expect-error -- intentional invalid key for testing fallback
        expect(t('nieistniejacy.klucz')).toBe('nieistniejacy.klucz')
    })

    it('t() zwraca zagnieżdżone tłumaczenia (np. start_window.*)', () => {
        expect(t('start_window.create_project')).toBe('Stwórz nowy projekt')
        expect(t('start_window.recent_projects')).toBe('Ostatnie projekty')
    })
})

describe('translate — interpolacja i18next', () => {
    beforeEach(resetToPolish)

    it('t() przekazuje opcje interpolacji do i18next', () => {
        expect(t('app.title')).toBe('Nidavelir')
    })

    it('t() akceptuje opcje bez rzucania błędu', () => {
        expect(() =>
            // @ts-expect-error -- intentional invalid key for testing fallback
            t('nieistniejacy.klucz', { name: 'Jan', count: 3 })
        ).not.toThrow()
    })

    it('t() poprawnie interpoluje zmienne {{name}} w template_applied_toast', () => {
        expect(t('npc.template_applied_toast', { name: 'Wojownik' })).toBe(
            'Zastosowano szablon "Wojownik"'
        )
    })

    it('t() poprawnie interpoluje zmienne {{name}} w template_already_applied', () => {
        expect(t('npc.template_already_applied', { name: 'Mag' })).toBe(
            'Szablon "Mag" został już wcześniej nałożony'
        )
    })

    it('t() poprawnie interpoluje zmienne {{stat}} w vital_formula_missing_stat', () => {
        expect(t('npc.vital_formula_missing_stat', { stat: 'Siła' })).toBe('Brakująca cecha: Siła')
    })

    it('t() poprawnie zastępuje jednouchwytowe {name} gdyby wystąpiły w fallbacku', () => {
        // @ts-expect-error -- intentional key with single brace format
        expect(t('Testowy {name} i {count}', { name: 'Łucznik', count: 5 })).toBe(
            'Testowy Łucznik i 5'
        )
    })
})

describe('translate — setLanguage i applyTranslations', () => {
    beforeEach(resetToPolish)

    it('setLanguage zwraca true dla obsługiwanego języka', async () => {
        expect(await setLanguage('en')).toBe(true)
        expect(await setLanguage('de')).toBe(true)
        expect(await setLanguage('pl')).toBe(true)
    })

    it('setLanguage zwraca false dla nieobsługiwanego języka', async () => {
        // @ts-expect-error -- intentional invalid locale for testing error handling
        expect(await setLanguage('xx')).toBe(false)
        // @ts-expect-error -- intentional invalid locale for testing error handling
        expect(await setLanguage('fr')).toBe(false)
    })

    it('setLanguage nie zmienia języka gdy locale nieobsługiwane', async () => {
        await setLanguage('en')
        // @ts-expect-error -- intentional invalid locale for testing error handling
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

    it('applyTranslations() aktualizuje textContent, placeholder, title i atrybut lang', async () => {
        document.body.innerHTML = `
            <span id="lbl" data-i18n="buttons.save"></span>
            <input id="inp" data-i18n-placeholder="buttons.cancel" />
            <button id="btn" data-i18n-title="buttons.ok"></button>
        `
        await setLanguage('en')
        applyTranslations()

        expect(document.documentElement.lang).toBe('en')
        expect(document.getElementById('lbl')?.textContent).toBe('Save')
        expect((document.getElementById('inp') as HTMLInputElement)?.placeholder).toBe('Cancel')
        expect(document.getElementById('btn')?.title).toBe('OK')
    })
})

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
        const langs = availableLanguages as readonly string[]
        expect(Object.isFrozen(langs)).toBe(true)
    })
})

describe('translate — initTranslations', () => {
    it('initTranslations() jest bezpieczne do wielokrotnego wywołania (guard initialized)', async () => {
        await expect(initTranslationsWithLocale('pl')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('en')).resolves.toBeUndefined()
    })

    it('initTranslationsWithLocale() nie rzuca dla obsługiwanego języka', async () => {
        await expect(initTranslationsWithLocale('pl')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('en')).resolves.toBeUndefined()
        await expect(initTranslationsWithLocale('de')).resolves.toBeUndefined()
    })
})

describe('translate — bezpieczeństwo typów', () => {
    it('TranslationKey akceptuje prawidłowe klucze', () => {
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
