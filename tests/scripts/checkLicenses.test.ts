import path from 'path'
import { describe, expect, it } from 'vitest'

// @ts-expect-error CommonJS script import in test suite
import licenseChecker from '../../scripts/check-licenses.js'

const {
    allowedLicenses,
    isLicenseAllowed,
    extractLicense,
    collectPackageManifests,
    checkLicenses,
} = licenseChecker

describe('check-licenses.js', () => {
    describe('isLicenseAllowed', () => {
        it('powinien akceptować dozwolone licencje pojedyncze', () => {
            expect(isLicenseAllowed('MIT', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('ISC', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('Apache-2.0', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('BSD-3-Clause', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('0BSD', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('CC0-1.0', allowedLicenses)).toBe(true)
        })

        it('powinien obsługiwać tolerancję wielkości liter dla dozwolonych licencji', () => {
            expect(isLicenseAllowed('mit', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('isc', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('apache-2.0', allowedLicenses)).toBe(true)
        })

        it('powinien odrzucać licencje niedozwolone lub zastrzeżone', () => {
            expect(isLicenseAllowed('GPL-3.0', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('AGPL-3.0', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('UNLICENSED', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('SEE LICENSE IN LICENSE', allowedLicenses)).toBe(false)
        })

        it('powinien poprawnie ewaluować alternatywę OR', () => {
            expect(isLicenseAllowed('MIT OR GPL-3.0', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('GPL-3.0 OR Apache-2.0', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('GPL-3.0 OR AGPL-3.0', allowedLicenses)).toBe(false)
        })

        it('powinien poprawnie ewaluować koniunkcję AND', () => {
            expect(isLicenseAllowed('MIT AND ISC', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('MIT AND GPL-3.0', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('GPL-3.0 AND MIT', allowedLicenses)).toBe(false)
        })

        it('powinien poprawnie obsługiwać nawiasy w wyrażeniach złożonych', () => {
            expect(isLicenseAllowed('(MIT OR GPL-3.0) AND ISC', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('(GPL-3.0 OR AGPL-3.0) AND MIT', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('MIT AND (ISC OR GPL-3.0)', allowedLicenses)).toBe(true)
            expect(isLicenseAllowed('((MIT OR ISC))', allowedLicenses)).toBe(true)
        })

        it('powinien zwracać false dla wartości pustych, niepoprawnych lub null', () => {
            expect(isLicenseAllowed('', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed(null, allowedLicenses)).toBe(false)
            expect(isLicenseAllowed(undefined, allowedLicenses)).toBe(false)
            expect(isLicenseAllowed(123 as unknown as string, allowedLicenses)).toBe(false)
            expect(isLicenseAllowed('()', allowedLicenses)).toBe(false)
            expect(isLicenseAllowed(')', allowedLicenses)).toBe(false)
        })
    })

    describe('extractLicense', () => {
        it('powinien wyodrębnić licencję ze stringa', () => {
            expect(extractLicense({ license: 'MIT' })).toBe('MIT')
        })

        it('powinien wyodrębnić licencję z obiektu { type }', () => {
            expect(extractLicense({ license: { type: 'Apache-2.0' } })).toBe('Apache-2.0')
        })

        it('powinien wyodrębnić licencję z obiektu { name }', () => {
            expect(extractLicense({ license: { name: 'BSD-3-Clause' } })).toBe('BSD-3-Clause')
        })

        it('powinien wyodrębnić licencje z tablicy licenses', () => {
            const manifest = {
                licenses: [{ type: 'MIT' }, { name: 'ISC' }],
            }
            expect(extractLicense(manifest)).toBe('MIT OR ISC')
        })

        it('powinien zwrócić null gdy brak licencji lub manifest jest pusty', () => {
            expect(extractLicense(null)).toBeNull()
            expect(extractLicense({})).toBeNull()
            expect(extractLicense({ license: null })).toBeNull()
        })
    })

    describe('collectPackageManifests & checkLicenses', () => {
        it('powinien obsłużyć nieistniejący katalog storeDir', () => {
            const result = checkLicenses({
                virtualStoreDir: path.join(__dirname, 'non_existent_dir_12345'),
            })
            expect(result.success).toBe(false)
            expect(result.error).toContain('pnpm dependencies not found')
        })

        it('powinien zgłosić błąd dla pakietu bez package.json', () => {
            const invalidPackages: string[] = []
            const checkedPackages = new Set<string>()

            // Mocking a fake package structure using a temporary folder or check with invalid path
            collectPackageManifests(
                path.join(__dirname, '..'), // parent dir where child folders may not have package.json
                checkedPackages,
                invalidPackages,
                allowedLicenses
            )

            // At least one non-package dir in tests/ will trigger "brak package.json"
            expect(invalidPackages.length).toBeGreaterThan(0)
            expect(invalidPackages[0]).toContain('brak package.json')
        })
    })
})
