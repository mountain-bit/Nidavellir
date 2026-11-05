import { createRequire } from 'module'
import { describe, expect, it } from 'vitest'

import * as tsSanitizer from '../../Utils/fs/pathSanitizer'
import {
    formatDescriptionFileName,
    generateUniqueSlug,
    MAX_SLUG_ATTEMPTS,
    removeDiacritics,
    sanitizeFileName,
    slugifyEntityName,
} from '../../Utils/fs/pathSanitizer'

const require = createRequire(import.meta.url)
const cjsSanitizer = require('../../Utils/fs/pathSanitizer.js')

describe('Path and Name Sanitizer', () => {
    describe('removeDiacritics', () => {
        it('powinien usunąć polskie i niemieckie znaki diakrytyczne', () => {
            expect(removeDiacritics('Zażółć gęślą jaźń')).toBe('Zazolc gesla jazn')
            expect(removeDiacritics('Äpfel und Öl')).toBe('Aepfel und Oel')
            expect(removeDiacritics('')).toBe('')
            // @ts-expect-error testowanie niepoprawnych typów
            expect(removeDiacritics(null)).toBe('')
            // @ts-expect-error testowanie niepoprawnych typów
            expect(removeDiacritics(123)).toBe('')
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

        it('powinien zwrócić fallback gdy pusta wartość lub nieprawidłowy typ', () => {
            expect(sanitizeFileName('')).toBe('element')
            // @ts-expect-error testowanie niepoprawnych typów
            expect(sanitizeFileName(null, 'domyslny')).toBe('domyslny')
            expect(sanitizeFileName('   ', 'fallbackVal')).toBe('fallbackVal')
            expect(sanitizeFileName('...   ', 'safe')).toBe('safe')
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

        it('powinien zwrócić fallback gdy pusta wartość lub po oczyszczeniu brak znaków', () => {
            expect(slugifyEntityName('')).toBe('element')
            // @ts-expect-error testowanie niepoprawnych typów
            expect(slugifyEntityName(null, 'default_slug')).toBe('default_slug')
            expect(slugifyEntityName('!!!???###', 'fallback_slug')).toBe('fallback_slug')
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

    describe('formatDescriptionFileName', () => {
        it('powinien formatować ustandaryzowaną nazwę pliku opisu dla różnych kategorii', () => {
            expect(formatDescriptionFileName('characters', 'Strażnik Miejski')).toBe(
                'Description_NPC_Straznik_Miejski.md'
            )
            expect(formatDescriptionFileName('locations', 'Mroczna Wieża')).toBe(
                'Description_Location_Mroczna_Wieza.md'
            )
            expect(formatDescriptionFileName('items', 'Złoty Klucz')).toBe(
                'Description_Item_Zloty_Klucz.md'
            )
            expect(formatDescriptionFileName('customCategory', 'Magiczna Brama')).toBe(
                'Description_CustomCategory_Magiczna_Brama.md'
            )
            expect(formatDescriptionFileName('', '')).toBe('Description_Entity_element.md')
            expect(formatDescriptionFileName('rules', '---')).toBe('Description_Rule_element.md')
        })
    })

    describe('Synchronizacja pathSanitizer.ts i pathSanitizer.js', () => {
        it('powinien eksportować identyczne stałe i zwracać identyczne wyniki w TS i CommonJS', () => {
            expect(tsSanitizer.DIACRITICS_MAP).toEqual(cjsSanitizer.DIACRITICS_MAP)
            expect(tsSanitizer.CATEGORY_SINGULAR_MAP).toEqual(cjsSanitizer.CATEGORY_SINGULAR_MAP)
            expect(tsSanitizer.MAX_SLUG_ATTEMPTS).toBe(cjsSanitizer.MAX_SLUG_ATTEMPTS)

            const samples = ['Zażółć gęślą jaźń!', 'CON', 'Karczma: Pod Różą', '']
            for (const sample of samples) {
                expect(tsSanitizer.removeDiacritics(sample)).toBe(
                    cjsSanitizer.removeDiacritics(sample)
                )
                expect(tsSanitizer.sanitizeFileName(sample)).toBe(
                    cjsSanitizer.sanitizeFileName(sample)
                )
                expect(tsSanitizer.slugifyEntityName(sample)).toBe(
                    cjsSanitizer.slugifyEntityName(sample)
                )
                expect(tsSanitizer.formatDescriptionFileName('npc', sample)).toBe(
                    cjsSanitizer.formatDescriptionFileName('npc', sample)
                )
            }
        })
    })
})
