/**
 * Moduł lokalizacji (i18n)
 *
 * Użycie:
 *   import { t, setLanguage } from '../Utils/translate'
 *   setLanguage('en')
 *   console.log(t('przyciski.zapisz')) // "Save"
 */

import pl, { type Translations } from './i18n/pl'

// Typ klucza zagnieżdżonego, np. "projekt.nowy" | "przyciski.ok"
type NestedKeyOf<T, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
}[keyof T & string]

export type TranslationKey = NestedKeyOf<Translations>

type SupportedLanguage = 'pl' | 'en' | 'de'

const loaders: Record<SupportedLanguage, () => Promise<Translations>> = {
    pl: async () => (await import('./i18n/pl')).default,
    en: async () => (await import('./i18n/en')).default,
    de: async () => (await import('./i18n/de')).default,
}

let currentTranslations: Translations = pl
let currentLanguage: SupportedLanguage = 'pl'

/**
 * Asynchronicznie ładuje i ustawia język aplikacji.
 */
export async function setLanguage(lang: SupportedLanguage): Promise<void> {
    const loader = loaders[lang]
    if (!loader) {
        console.warn(`Nieznany język: ${lang}, pozostawiam domyślny`)
        return
    }
    currentTranslations = await loader()
    currentLanguage = lang
}

/**
 * Zwraca aktualnie ustawiony język.
 */
export function getLanguage(): SupportedLanguage {
    return currentLanguage
}

/**
 * Pobiera przetłumaczony tekst po kluczu (np. "projekt.nowy").
 * Jeśli klucz nie istnieje — zwraca sam klucz jako fallback.
 */
export function t(key: TranslationKey): string {
    const parts = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = currentTranslations

    for (const part of parts) {
        if (current == null || typeof current !== 'object') {
            console.warn(`Brak tłumaczenia dla klucza: "${key}"`)
            return key
        }
        current = current[part]
    }

    if (typeof current !== 'string') {
        console.warn(`Klucz "${key}" nie prowadzi do tekstu`)
        return key
    }

    return current
}

/**
 * Lista dostępnych języków.
 */
export const availableLanguages: SupportedLanguage[] = ['pl', 'en', 'de']
