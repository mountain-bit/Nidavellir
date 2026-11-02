/* eslint-disable no-control-regex */
const FORBIDDEN_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/g
const RESERVED_WINDOWS_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

const DIACRITICS_MAP = Object.freeze({
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
})

const DIACRITICS_REGEX = new RegExp(`[${Object.keys(DIACRITICS_MAP).join('')}]`, 'g')

const MAX_SLUG_ATTEMPTS = 1000

const CATEGORY_SINGULAR_MAP = Object.freeze({
    paragraphs: 'Paragraph',
    paragraph: 'Paragraph',
    npc: 'NPC',
    characters: 'NPC',
    character: 'NPC',
    locations: 'Location',
    location: 'Location',
    items: 'Item',
    item: 'Item',
    templates: 'Template',
    template: 'Template',
    playercharacter: 'PlayerCharacter',
    characterclasses: 'CharacterClass',
    characterclass: 'CharacterClass',
    rules: 'Rule',
    rule: 'Rule',
})

function removeDiacritics(str) {
    if (!str || typeof str !== 'string') return ''
    return str.replace(DIACRITICS_REGEX, char => DIACRITICS_MAP[char] || char)
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

function formatDescriptionFileName(category, entityName) {
    const normalizedKey = (category || '').trim().toLowerCase()
    const cat =
        CATEGORY_SINGULAR_MAP[normalizedKey] ||
        (category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Entity')
    const rawClean = sanitizeFileName(entityName, 'element')
    const cleanName = removeDiacritics(rawClean)
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
    return `Description_${cat}_${cleanName || 'element'}.md`
}

module.exports = {
    FORBIDDEN_CHARS_REGEX,
    RESERVED_WINDOWS_NAMES,
    DIACRITICS_MAP,
    MAX_SLUG_ATTEMPTS,
    CATEGORY_SINGULAR_MAP,
    removeDiacritics,
    sanitizeFileName,
    slugifyEntityName,
    generateUniqueSlug,
    formatDescriptionFileName,
}
