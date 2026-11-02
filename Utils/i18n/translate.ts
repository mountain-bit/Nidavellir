import i18next from 'i18next'

import de from '../../Locales/de/translation.json'
import en from '../../Locales/en/translation.json'
import pl from '../../Locales/pl/translation.json'

export type Translations = typeof en

type NestedKeyOf<T, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
}[keyof T & string]

export type TranslationKey = NestedKeyOf<Translations>

export const availableLanguages = Object.freeze(['en', 'pl', 'de'] as const)
export type SupportedLanguage = (typeof availableLanguages)[number]

const resources = {
    en: { translation: en },
    pl: { translation: pl },
    de: { translation: de },
}

// Synchronously initialize i18next with default 'pl' locale so t() works immediately
i18next.init({
    lng: 'pl',
    fallbackLng: 'en',
    resources,
    interpolation: { escapeValue: false },
})

let initialized = false

/**
 * Invokes i18next.t with a string key and returns a guaranteed string.
 */
function translateRaw(key: string, options?: Record<string, unknown>): string {
    const translated = i18next.t(key, options)
    return typeof translated === 'string' ? translated : String(key)
}

/**
 * Interpolates `{key}` and `{{key}}` placeholders when fallback strings or single-brace patterns are used.
 */
function interpolatePlaceholders(text: string, options?: Record<string, unknown>): string {
    if (!text || !options || typeof options !== 'object') return text
    let result = text
    for (const [k, v] of Object.entries(options)) {
        const valStr = String(v)
        if (result.includes(`{${k}}`)) {
            result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr)
        }
        if (result.includes(`{{${k}}}`)) {
            result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), valStr)
        }
    }
    return result
}

export async function initTranslations(): Promise<void> {
    if (initialized) return

    const locale =
        (typeof window !== 'undefined' ? await window.electronAPI?.getLocale?.() : undefined) ||
        'en'

    await i18next.changeLanguage(locale)
    initialized = true
}

export async function initTranslationsWithLocale(locale: SupportedLanguage): Promise<void> {
    await i18next.changeLanguage(locale)
    initialized = true
}

export function t(key: TranslationKey, options?: Record<string, unknown>): string {
    const raw = translateRaw(key, options)
    return interpolatePlaceholders(raw, options)
}

export function isSupportedLanguage(locale: string): locale is SupportedLanguage {
    return locale === 'en' || locale === 'pl' || locale === 'de'
}

export function getLanguage(): SupportedLanguage {
    return isSupportedLanguage(i18next.language) ? i18next.language : 'en'
}

export async function setLanguage(locale: SupportedLanguage): Promise<boolean> {
    if (!isSupportedLanguage(locale)) {
        console.warn(`[i18n] Unsupported locale: ${locale}`)
        return false
    }
    await i18next.changeLanguage(locale)
    if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.setLocale(locale).catch(() => {})
    }
    return true
}

export function applyTranslations(): void {
    if (typeof document === 'undefined') return

    if (document.documentElement) {
        document.documentElement.lang = getLanguage()
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n')
        if (key) {
            el.textContent = translateRaw(key)
        }
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder')
        if (key && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
            el.placeholder = translateRaw(key)
        }
    })
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title')
        if (key) {
            el.title = translateRaw(key)
        }
    })
}
