import { createRequire } from 'module'
import os from 'os'
import path from 'path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

const mockApp = {
    getPath: (name: string): string =>
        name === 'userData' ? path.join(os.tmpdir(), 'sgp-test') : os.tmpdir(),
    getLocale: (): string => 'pl-PL',
}

const i18n = require('../../Utils/i18n.js') as {
    initI18n: (deps?: { app?: typeof mockApp }) => Promise<void>
    t: (key: string, options?: Record<string, unknown>) => string
    getTranslations: () => Record<string, unknown>
    getLocale: () => string
    setLocale: (locale: string) => Promise<boolean>
}

beforeAll(async (): Promise<void> => {
    await i18n.initI18n({ app: mockApp })
})

beforeEach(async (): Promise<void> => {
    await i18n.setLocale('pl')
})

describe('i18n.js — initI18n', () => {
    it('po inicjalizacji getLocale() zwraca język wykryty z systemu', () => {
        expect(i18n.getLocale()).toBe('pl')
    })

    it('po inicjalizacji t() zwraca polskie tłumaczenie', () => {
        expect(i18n.t('buttons.save')).toBe('Zapisz')
        expect(i18n.t('buttons.ok')).toBe('OK')
    })

    it('ponowne wywołanie initI18n() nie rzuca błędu (idempotentność)', async () => {
        await expect(i18n.initI18n({ app: mockApp })).resolves.not.toThrow()
    })
})

describe('i18n.js — setLocale i getLocale', () => {
    it('setLocale("en") zmienia język na angielski i zwraca true', async () => {
        const result = await i18n.setLocale('en')
        expect(result).toBe(true)
        expect(i18n.getLocale()).toBe('en')
        expect(i18n.t('buttons.save')).toBe('Save')
    })

    it('setLocale("de") zmienia język na niemiecki', async () => {
        await i18n.setLocale('de')
        expect(i18n.getLocale()).toBe('de')
        expect(i18n.t('buttons.save')).toBe('Speichern')
    })

    it('setLocale z nieobsługiwanym locale zwraca false', async () => {
        expect(await i18n.setLocale('fr')).toBe(false)
        expect(await i18n.setLocale('xx')).toBe(false)
    })

    it('setLocale z nieobsługiwanym locale nie zmienia aktualnego języka', async () => {
        await i18n.setLocale('en')
        await i18n.setLocale('xx')
        expect(i18n.getLocale()).toBe('en')
    })

    it('można przełączać między wszystkimi wspieranymi językami', async () => {
        await i18n.setLocale('de')
        expect(i18n.t('buttons.save')).toBe('Speichern')
        await i18n.setLocale('en')
        expect(i18n.t('buttons.save')).toBe('Save')
        await i18n.setLocale('pl')
        expect(i18n.t('buttons.save')).toBe('Zapisz')
    })
})

describe('i18n.js — getTranslations', () => {
    it('zwraca obiekt z kluczami tłumaczeń dla polskiego', () => {
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(typeof tr).toBe('object')
        expect(tr.buttons?.save).toBe('Zapisz')
        expect(tr.project?.new).toBe('Nowy projekt')
    })

    it('zmienia się po setLocale', async () => {
        await i18n.setLocale('en')
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(tr.buttons?.save).toBe('Save')
    })

    it('zawiera klucze dialog i error (używane przez main process w showOpenDialog)', () => {
        const tr = i18n.getTranslations() as Record<string, Record<string, string>>
        expect(tr.dialog?.open_project).toBeTruthy()
        expect(tr.error?.project_not_found).toBeTruthy()
    })
})

describe('i18n.js — t()', () => {
    it('tłumaczy klucze z sekcji projekt', () => {
        expect(i18n.t('project.new')).toBe('Nowy projekt')
        expect(i18n.t('project.save')).toBe('Zapisz projekt')
    })

    it('tłumaczy klucze z sekcji dialog', () => {
        expect(i18n.t('dialog.open_project')).toBe('Otwórz projekt')
        expect(i18n.t('dialog.choose_new_project_folder')).toBe(
            'Wybierz folder dla nowego projektu'
        )
    })

    it('tłumaczy klucze z sekcji error', () => {
        expect(i18n.t('error.project_not_found')).toBe('Ścieżka projektu nie istnieje')
    })

    it('zwraca klucz jako fallback gdy klucz nie istnieje', () => {
        expect(i18n.t('nieistniejacy.klucz')).toBe('nieistniejacy.klucz')
    })

    it('działa poprawnie po zmianie języka', async () => {
        await i18n.setLocale('en')
        expect(i18n.t('dialog.open_project')).toBe('Open project')
        expect(i18n.t('error.project_not_found')).toBe('Project path does not exist')
    })
})
