/**
 * i18n dla renderer process
 *
 * Pobiera tłumaczenia jednorazowo przez IPC, a potem działa w pełni lokalnie.
 * Używa i18next bez backendu plikowego (zasoby są wstrzyknięte ręcznie).
 *
 * Użycie:
 *   await initTranslations()         // wywołać raz przy starcie strony
 *   t('przyciski.zapisz')            // → "Save"
 *   t('start_window.last_opened')    // → "Last opened:"
 */

import i18next from 'i18next'
import pl from '../Locales/pl/translation.json'
import en from '../Locales/en/translation.json'
import de from '../Locales/de/translation.json'

// Typ wyprowadzony ze struktury wzorcowego pliku PL
export type Translations = typeof pl

// Typ bezpiecznego klucza zagnieżdżonego, np. "projekt.nowy" | "przyciski.ok"
type NestedKeyOf<T, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
}[keyof T & string]

export type TranslationKey = NestedKeyOf<Translations>

export const availableLanguages = ['pl', 'en', 'de'] as const
export type SupportedLanguage = (typeof availableLanguages)[number]

// Słownik wszystkich zasobów — dostępny zarówno w renderer jak i w testach
const resources = {
    pl: { translation: pl as unknown as Translations },
    en: { translation: en as unknown as Translations },
    de: { translation: de as unknown as Translations },
}

// ── Inicjalizacja ─────────────────────────────────────────────────────────────

let initialized = false

/**
 * Inicjalizuje i18next w renderer process.
 * Pobiera aktualny język z main process przez IPC (jeden call),
 * a tłumaczenia ładuje z bundlowanych JSON — bez dalszych wywołań IPC.
 */
export async function initTranslations(): Promise<void> {
    if (initialized) return

    const locale = await window.electronAPI.getLocale()

    await i18next.init({
        lng: locale,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: true },
    })

    initialized = true
}

/**
 * Inicjalizuje i18next z podanym językiem — używane w testach.
 * @internal
 */
export async function initTranslationsWithLocale(locale: SupportedLanguage): Promise<void> {
    if (i18next.isInitialized) {
        await i18next.changeLanguage(locale)
        return
    }
    await i18next.init({
        lng: locale,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: true },
    })
    initialized = true
}

// ── API publiczne ─────────────────────────────────────────────────────────────

/**
 * Tłumaczy klucz. Wymaga wcześniejszego wywołania initTranslations().
 * @param key     - bezpieczny typowo klucz, np. "projekt.nowy"
 * @param options - opcjonalne opcje i18next (interpolacja, count, itp.)
 */
export function t(key: TranslationKey, options?: Record<string, unknown>): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return i18next.t(key as any, options as any) as string
}

/**
 * Zwraca aktualnie ustawiony język.
 */
export function getLanguage(): SupportedLanguage {
    return i18next.language as SupportedLanguage
}

/**
 * Zmienia język: powiadamia main process przez IPC (żeby zapisał preferencję),
 * a lokalnie przełącza i18next — zasoby są już załadowane w bundlu.
 */
export async function setLanguage(locale: SupportedLanguage): Promise<boolean> {
    if (!availableLanguages.includes(locale)) {
        console.warn(`[i18n] Unsupported locale: ${locale}`)
        return false
    }
    await i18next.changeLanguage(locale)
    // Powiadom main process, żeby zapisał preferencję (fire-and-forget, nie blokujemy)
    if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.setLocale(locale).catch(() => {
            // Ignorujemy błąd — zmiana języka działa lokalnie nawet bez IPC
        })
    }
    return true
}
