/* eslint-disable no-control-regex */
const FORBIDDEN_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

const DIACRITICS_MAP = {
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

const MAX_SLUG_ATTEMPTS = 1000

function removeDiacritics(str) {
    if (!str || typeof str !== 'string') return ''
    return str
        .split('')
        .map(char => DIACRITICS_MAP[char] || char)
        .join('')
}

function sanitizeFileName(name, fallback = 'element') {
    if (!name || typeof name !== 'string') return fallback

    let sanitized = name
        .replace(FORBIDDEN_CHARS_REGEX, '_')
        .replace(/[. ]+$/, '')
        .trim()

    if (RESERVED_WINDOWS_NAMES.test(sanitized)) {
        sanitized = `${sanitized}_file`
    }

    return sanitized || fallback
}

function slugifyEntityName(name, fallback = 'element') {
    if (!name || typeof name !== 'string') return fallback

    const withoutDiacritics = removeDiacritics(name.trim().toLowerCase())
    let slug = withoutDiacritics.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

    if (RESERVED_WINDOWS_NAMES.test(slug)) {
        slug = `${slug}_elem`
    }

    return slug || fallback
}

function generateUniqueSlug(baseSlug, existingSlugsOrChecker) {
    const isCollision =
        typeof existingSlugsOrChecker === 'function'
            ? existingSlugsOrChecker
            : candidate => existingSlugsOrChecker.includes(candidate)

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

module.exports = {
    DIACRITICS_MAP,
    MAX_SLUG_ATTEMPTS,
    removeDiacritics,
    sanitizeFileName,
    slugifyEntityName,
    generateUniqueSlug,
}
