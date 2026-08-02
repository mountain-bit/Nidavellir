import { describe, it, expect, beforeEach } from 'vitest'
import { t, setLanguage, getLanguage, availableLanguages } from '../../Utils/translate'

describe('translate', () => {
    beforeEach(async () => {
        await setLanguage('pl')
    })

    it('domyślnie powinien używać języka polskiego', () => {
        expect(getLanguage()).toBe('pl')
    })

    it('t() powinno zwracać polskie tłumaczenie', () => {
        expect(t('przyciski.zapisz')).toBe('Zapisz')
    })

    it('t() powinno zwracać angielskie tłumaczenie po zmianie języka', async () => {
        await setLanguage('en')
        expect(t('przyciski.zapisz')).toBe('Save')
    })

    it('t() powinno zwracać niemieckie tłumaczenie', async () => {
        await setLanguage('de')
        expect(t('przyciski.zapisz')).toBe('Speichern')
    })

    it('t() powinno zwracać klucz jako fallback gdy klucz nie istnieje', () => {
        // @ts-expect-error - celowo podajemy zły klucz
        expect(t('nieistniejacy.klucz')).toBe('nieistniejacy.klucz')
    })

    it('availableLanguages powinno zawierać pl, en, de', () => {
        expect(availableLanguages).toContain('pl')
        expect(availableLanguages).toContain('en')
        expect(availableLanguages).toContain('de')
    })

    it('setLanguage z nieznanym językiem nie powinno rzucać błędu', async () => {
        // @ts-expect-error - celowo podajemy zły język
        await expect(setLanguage('xx')).resolves.toBeUndefined()
    })
})
