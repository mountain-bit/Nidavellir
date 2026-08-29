/* eslint-disable no-control-regex */
export const FORBIDDEN_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g
export const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

export const DIACRITICS_MAP: Record<string, string> = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ź: 'z',
    ż: 'z',
    Ą: 'A',
    Ć: 'C',
    Ę: 'E',
    Ł: 'L',
    Ń: 'N',
    Ó: 'O',
    Ś: 'S',
    Ź: 'Z',
    Ż: 'Z',
    ä: 'ae',
    ö: 'oe',
    ü: 'ue',
    ß: 'ss',
    Ä: 'Ae',
    Ö: 'Oe',
    Ü: 'Ue',
}

export const MAX_SLUG_ATTEMPTS = 1000

/**
 * Normalizuje polskie i niemieckie znaki diakrytyczne.
 */
export function removeDiacritics(str: string): string {
    if (!str || typeof str !== 'string') return ''
    return str
        .split('')
        .map(char => DIACRITICS_MAP[char] || char)
        .join('')
}

/**
 * Bezpiecznie oczyszcza nazwę pliku lub folderu ze znaków niedozwolonych w systemie Windows / POSIX.
 */
export function sanitizeFileName(name: string, fallback: string = 'element'): string {
    if (!name || typeof name !== 'string') return fallback

    let sanitized = name
        .replace(FORBIDDEN_CHARS_REGEX, '_')
        .replace(/[. ]+$/, '') // Windows: brak kropek i spacji na końcu
        .trim()

    if (RESERVED_WINDOWS_NAMES.test(sanitized)) {
        sanitized = `${sanitized}_file`
    }

    return sanitized || fallback
}

/**
 * Tworzy bezpieczny identyfikator / nazwę folderu (slug) z czytelnej nazwy użytkownika.
 * Przykład: "Karczma: Pod Złotą Różą (Część 1)?" -> "karczma_pod_zlota_roza_czesc_1"
 */
export function slugifyEntityName(name: string, fallback: string = 'element'): string {
    if (!name || typeof name !== 'string') return fallback

    const withoutDiacritics = removeDiacritics(name.trim().toLowerCase())
    let slug = withoutDiacritics.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

    if (RESERVED_WINDOWS_NAMES.test(slug)) {
        slug = `${slug}_elem`
    }

    return slug || fallback
}

/**
 * Generuje unikalną nazwę pliku/katalogu unikając kolizji z istniejącymi ścieżkami.
 * W przypadku kolizji dodaje sufiks numeryczny: _1, _2, itd., z limitem MAX_SLUG_ATTEMPTS.
 */
export function generateUniqueSlug(
    baseSlug: string,
    existingSlugsOrChecker: string[] | ((candidate: string) => boolean)
): string {
    const isCollision =
        typeof existingSlugsOrChecker === 'function'
            ? existingSlugsOrChecker
            : (candidate: string): boolean => existingSlugsOrChecker.includes(candidate)

    if (!isCollision(baseSlug)) {
        return baseSlug
    }

    let counter = 1
    let candidate = `${baseSlug}_${counter}`
    while (isCollision(candidate) && counter < MAX_SLUG_ATTEMPTS) {
        counter++
        candidate = `${baseSlug}_${counter}`
    }

    if (counter >= MAX_SLUG_ATTEMPTS && isCollision(candidate)) {
        return `${baseSlug}_${Date.now()}`
    }

    return candidate
}
