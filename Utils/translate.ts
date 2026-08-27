import i18next from 'i18next'

import de from '../Locales/de/translation.json'
import en from '../Locales/en/translation.json'
import pl from '../Locales/pl/translation.json'

export type Translations = typeof pl

type NestedKeyOf<T, Prefix extends string = ''> = {
    [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
}[keyof T & string]

export type TranslationKey = NestedKeyOf<Translations>

export const availableLanguages = ['pl', 'en', 'de'] as const
export type SupportedLanguage = (typeof availableLanguages)[number]

const resources = {
    pl: { translation: pl as unknown as Translations },
    en: { translation: en as unknown as Translations },
    de: { translation: de as unknown as Translations },
}

let initialized = false

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

export function t(key: TranslationKey, options?: Record<string, unknown>): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return i18next.t(key as any, options as any) as string
}

export function getLanguage(): SupportedLanguage {
    return i18next.language as SupportedLanguage
}

export async function setLanguage(locale: SupportedLanguage): Promise<boolean> {
    if (!availableLanguages.includes(locale)) {
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
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = getLanguage()
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n')
        if (key) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            el.textContent = i18next.t(key as any) as string
        }
    })
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder')
        if (key && el instanceof HTMLInputElement) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            el.placeholder = i18next.t(key as any) as string
        }
    })
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title')
        if (key) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(el as HTMLElement).title = i18next.t(key as any) as string
        }
    })
}
