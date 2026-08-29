import { describe, expect, it } from 'vitest'

import {
    generateUniqueSlug,
    MAX_SLUG_ATTEMPTS,
    removeDiacritics,
    sanitizeFileName,
    slugifyEntityName,
} from '../../Utils/pathSanitizer'

describe('Path and Name Sanitizer', () => {
    describe('removeDiacritics', () => {
        it('powinien usunąć polskie i niemieckie znaki diakrytyczne', () => {
            expect(removeDiacritics('Zażółć gęślą jaźń')).toBe('Zazolc gesla jazn')
            expect(removeDiacritics('Äpfel und Öl')).toBe('Aepfel und Oel')
        })
    })

    describe('sanitizeFileName', () => {
        it('powinien zastąpić znaki zakazane w Windows podkreśleniem', () => {
            expect(sanitizeFileName('plik:test<1>"2"?*|')).toBe('plik_test_1__2____')
        })

        it('powinien usunąć spacje i kropki na końcu nazwy', () => {
            expect(sanitizeFileName('plik.test... ')).toBe('plik.test')
        })

        it('powinien obsłużyć zastrzeżone nazwy Windows (np. CON, AUX, NUL)', () => {
            expect(sanitizeFileName('con')).toBe('con_file')
            expect(sanitizeFileName('NUL')).toBe('NUL_file')
        })

        it('powinien zwrócić fallback gdy pusta wartość', () => {
            expect(sanitizeFileName('')).toBe('element')
        })
    })

    describe('slugifyEntityName', () => {
        it('powinien przekonwertować nazwę na czytelny, bezpieczny slug', () => {
            expect(slugifyEntityName('Karczmarz: "Stary Jan" / Część 1?')).toBe(
                'karczmarz_stary_jan_czesc_1'
            )
        })

        it('powinien usunąć powtarzające się podkreślenia', () => {
            expect(slugifyEntityName('a --- b ___ c')).toBe('a_b_c')
        })

        it('powinien zabezpieczyć zastrzeżone nazwy Windows w slugach', () => {
            expect(slugifyEntityName('prn')).toBe('prn_elem')
        })
    })

    describe('generateUniqueSlug', () => {
        it('powinien zwrócić oryginalny slug jeśli brak kolizji', () => {
            const existing = ['straznik', 'kupiec']
            expect(generateUniqueSlug('karczmarz', existing)).toBe('karczmarz')
        })

        it('powinien dodać sufiks _1 gdy występuje kolizja', () => {
            const existing = ['straznik', 'kupiec']
            expect(generateUniqueSlug('straznik', existing)).toBe('straznik_1')
        })

        it('powinien iterować sufiksy (_2, _3) aż znajdzie wolną nazwę', () => {
            const existing = ['straznik', 'straznik_1', 'straznik_2']
            expect(generateUniqueSlug('straznik', existing)).toBe('straznik_3')
        })

        it('powinien działać z funkcją sprawdzającą kolizje', () => {
            const existsFn = (name: string): boolean => name === 'las' || name === 'las_1'
            expect(generateUniqueSlug('las', existsFn)).toBe('las_2')
        })

        it('powinien przerwać pętlę i użyć timestamp po osiągnięciu MAX_SLUG_ATTEMPTS', () => {
            expect(MAX_SLUG_ATTEMPTS).toBe(1000)
            const alwaysCollides = (): boolean => true
            const slug = generateUniqueSlug('kolizja', alwaysCollides)
            expect(slug).toMatch(/^kolizja_\d+$/)
        })
    })
})
